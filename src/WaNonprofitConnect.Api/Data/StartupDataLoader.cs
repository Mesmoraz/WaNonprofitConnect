using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Api.Data;

/// <summary>
/// Fills an empty database with public data: Census ZIP centroids, then the IRS list of Washington
/// tax-exempt organizations. Runs once at startup, only when a table is empty, so a fresh Azure database
/// loads itself through the app's own identity. On by default in Production; <c>Data:LoadOnStartup</c> overrides.
/// </summary>
public sealed class StartupDataLoader(IServiceScopeFactory scopes, ILogger<StartupDataLoader> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);   // let the app answer its warm-up first
        var dir = Path.Combine(Path.GetTempPath(), "helpbook-data");
        Directory.CreateDirectory(dir);
        try
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (!await db.ZipCentroids.AnyAsync(stoppingToken))
            {
                logger.LogInformation("No ZIP centroids: loading the Census gazetteer.");
                var run = await scope.ServiceProvider.GetRequiredService<ZipCentroidImporter>()
                    .RunAsync(new ZipCentroidImportOptions { DataDirectory = dir }, stoppingToken);
                logger.LogInformation("ZIP centroids: {Status}, {Rows} rows.", run.Status, run.RowsInserted);
            }
            if (!await db.Organizations.AnyAsync(stoppingToken))
            {
                logger.LogInformation("No organizations: loading the IRS list for WA.");
                var run = await scope.ServiceProvider.GetRequiredService<BmfImporter>()
                    .RunAsync(new BmfImportOptions { DataDirectory = dir, StateFilter = "WA" }, stoppingToken);
                logger.LogInformation("Organizations: {Status}, {Rows} rows.", run.Status, run.RowsInserted);
            }
        }
        catch (OperationCanceledException) { }
        catch (Exception e) { logger.LogError(e, "Loading public data at startup failed."); }
    }
}
