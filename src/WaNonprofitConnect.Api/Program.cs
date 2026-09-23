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
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connection));
builder.Services.AddHttpClient<BmfImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(10);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});
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
    if (db.Database.IsSqlServer()) await db.Database.MigrateAsync();
    else await db.Database.EnsureCreatedAsync(); // tests run on SQLite, which can't apply SQL Server migrations
}

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
if (staticFiles is not null)
    app.MapFallbackToFile("{*path:regex(^(?!api/|api$|hubs/|hubs$|swagger).*$)}", "index.html", staticFiles);

app.Run();

public partial class Program { }
