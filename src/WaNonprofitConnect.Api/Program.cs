using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;
using WaNonprofitConnect.Api.Controllers;
using WaNonprofitConnect.Api.Realtime;
using WaNonprofitConnect.Api.Security;

var builder = WebApplication.CreateBuilder(args);

// --- Data ---------------------------------------------------------------
var connection = builder.Configuration.GetConnectionString("Default")
                 ?? DesignTimeDbContextFactory.DefaultDevConnection;
// The Azure database is serverless and pauses after an idle hour; waking takes about a minute (error 40613).
// Retry instead of failing the request, and see the startup loop below for migrations.
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connection,
    sql => sql.EnableRetryOnFailure(maxRetryCount: 6, maxRetryDelay: TimeSpan.FromSeconds(20), errorNumbersToAdd: null)));
builder.Services.AddHttpClient<BmfImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(10);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});
builder.Services.AddHttpClient<ZipCentroidImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(5);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});
// A fresh database (Azure) loads the ZIP centroids and the IRS list itself. Off in Development and tests.
if (builder.Configuration.GetValue("Data:LoadOnStartup", builder.Environment.IsProduction()))
    builder.Services.AddHostedService<WaNonprofitConnect.Api.Data.StartupDataLoader>();
builder.Services.AddHttpClient<SchoolsImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(2);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<ExchangeService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<HelpbookService>();
builder.Services.AddScoped<IHelpbookNotifier, SignalRHelpbookNotifier>();
builder.Services.AddScoped<IExchangeNotifier, SignalRExchangeNotifier>();
builder.Services.AddScoped<ExchangeExceptionFilter>();
builder.Services.AddSignalR().AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// --- Identity -------------------------------------------------------------
builder.Services.AddHelpbookAuth(builder.Configuration, builder.Environment);

// --- API surface ----------------------------------------------------------
// JSON, camelCase, enums as strings, nulls written as null (the app's contract types use `T | null`).
builder.Services.AddControllers(o => o.Filters.Add<ExchangeExceptionFilter>())
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(o =>
{
    o.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "WaNonprofitConnect API",
        Version = "v1",
        Description = "Public data on Washington State tax-exempt organizations, sourced from the IRS Exempt Organizations Business Master File.",
    });
});

builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

// An unexpected server error answers with a problem document carrying a reference (the trace id), and the log line
// carries the same one, so "it said error 00-7f3a..." can be found in the logs.
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx =>
{
    var trace = System.Diagnostics.Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier;
    ctx.ProblemDetails.Extensions["traceId"] = trace;
    if (ctx.Exception is not null) ctx.ProblemDetails.Title = "That didn’t work. Try again."; // a crash, not a deliberate 503
});

// Public endpoints get a per-IP fixed window; tune per environment via config.
var permitPerMinute = builder.Configuration.GetValue("RateLimit:PermitPerMinute", 120);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("public", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitPerMinute,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
        }));
});

// Same origin in the alpha, so CORS is only for a dev server on another port (Vite proxies, so usually unused).
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (allowedOrigins.Length > 0) p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
}));

var app = builder.Build();

// The alpha runs one instance, so it migrates on startup in every environment.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (db.Database.IsSqlServer())
    {
        // A paused database answers "not currently available" until it wakes. Wait up to ~3 minutes rather than
        // crash the container, which is what took the site down three times on Sep 24.
        for (var attempt = 1; ; attempt++)
        {
            try { await db.Database.MigrateAsync(); break; }
            catch (Exception e) when (attempt < 12 && IsDatabaseUnreachable(e))
            {
                app.Logger.LogWarning("Database not ready (attempt {Attempt}): {Message}", attempt, e.Message);
                await Task.Delay(TimeSpan.FromSeconds(15));
            }
        }
    }
    else await db.Database.EnsureCreatedAsync(); // tests run on SQLite, which can't apply SQL Server migrations
}

// Unhandled exceptions: logged (by the handler) with the trace id, answered as a problem document, never a bare 500.
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "WaNonprofitConnect v1"));
}

app.UseHttpsRedirection();
// The built app (app/ -> npm run build) is served from wwwroot next to the published binaries (Azure deploy);
// in local dev it's the project's wwwroot. With neither, the API still runs without the app.
var staticRoot = new[] { Path.Combine(AppContext.BaseDirectory, "wwwroot"), app.Environment.WebRootPath }
    .FirstOrDefault(p => !string.IsNullOrEmpty(p) && Directory.Exists(p));
StaticFileOptions? staticFiles = null;
if (staticRoot is not null)
{
    var staticFileProvider = new PhysicalFileProvider(staticRoot);
    staticFiles = new StaticFileOptions { FileProvider = staticFileProvider };
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = staticFileProvider });
    app.UseStaticFiles(staticFiles);
}
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers().RequireRateLimiting("public");
app.MapHub<ExchangeHub>("/hubs/exchange");
// Unknown paths fall back to the app's index.html so client routes work, except /api and /hubs, which 404 as usual.
// nonfile: paths that look like files (/assets/x.js) are left to the static files, never answered with index.html.
if (staticFiles is not null)
    app.MapFallbackToFile("{*path:nonfile:regex(^(?!api/|api$|hubs/|hubs$|swagger).*$)}", "index.html", staticFiles);

app.Run();

public partial class Program
{
    /// <summary>
    /// A waking database fails in several shapes: a SqlException (40613), a SqlException wrapping a reset socket,
    /// or EF's retry-limit error wrapping either. Look through the whole chain, not just the innermost error.
    /// </summary>
    static bool IsDatabaseUnreachable(Exception e)
    {
        for (Exception? x = e; x is not null; x = x.InnerException)
            if (x is Microsoft.Data.SqlClient.SqlException or System.IO.IOException or System.Net.Sockets.SocketException) return true;
        return false;
    }
}
