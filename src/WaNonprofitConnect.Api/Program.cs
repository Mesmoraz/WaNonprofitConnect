using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;
using WaNonprofitConnect.Api.Controllers;
using WaNonprofitConnect.Api.Realtime;

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
builder.Services.AddScoped<ExchangeService>();
builder.Services.AddScoped<IExchangeNotifier, SignalRExchangeNotifier>();
builder.Services.AddScoped<ExchangeExceptionFilter>();
builder.Services.AddSignalR().AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// --- API surface ----------------------------------------------------------
// Stateless JSON over HTTPS with a published OpenAPI document: every client
// (web, .NET MAUI, React Native, Flutter, desktop) talks to the same contract.
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
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

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (allowedOrigins.Length > 0) p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
}));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    app.UseSwagger();
    app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "WaNonprofitConnect v1"));
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers().RequireRateLimiting("public");
app.MapHub<ExchangeHub>("/hubs/exchange");

app.Run();

public partial class Program { }
