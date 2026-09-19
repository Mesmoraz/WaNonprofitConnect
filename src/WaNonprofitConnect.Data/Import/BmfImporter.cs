using System.Globalization;
using System.Security.Cryptography;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Import;

public sealed class BmfImportOptions
{
    /// <summary>Default WA extract. Region/other-state files use the same schema.</summary>
    public string Url { get; set; } = "https://www.irs.gov/pub/irs-soi/eo_wa.csv";
    /// <summary>Where downloaded snapshots are kept.</summary>
    public string DataDirectory { get; set; } = "data/raw";
    /// <summary>Only import rows whose STATE matches. Null imports every row in the file.</summary>
    public string? StateFilter { get; set; } = "WA";
    /// <summary>Use this local CSV instead of downloading.</summary>
    public string? LocalFile { get; set; }
    /// <summary>Import even if the file hash matches the last successful run.</summary>
    public bool Force { get; set; }
    public int BatchSize { get; set; } = 2000;
}

/// <summary>
/// Downloads (or reads) an IRS EO BMF CSV and upserts <see cref="Organization"/> rows keyed by EIN.
/// Every run is recorded as an <see cref="ImportRun"/>; identical files are skipped unless forced.
/// Works in batches so the same code path can handle the ~2M-row national files later.
/// </summary>
public sealed class BmfImporter
{
    private const int MaxErrorsRecorded = 50;

    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly ILogger<BmfImporter> _logger;

    public BmfImporter(AppDbContext db, HttpClient http, ILogger<BmfImporter> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    public async Task<ImportRun> RunAsync(BmfImportOptions options, CancellationToken ct = default)
    {
        var filePath = options.LocalFile ?? await DownloadAsync(options, ct);
        var sha = await HashFileAsync(filePath, ct);

        var run = new ImportRun
        {
            Source = ImportSource.Bmf,
            Status = ImportStatus.Running,
            StateFilter = options.StateFilter?.ToUpperInvariant(),
            SourceUrl = options.LocalFile is null ? options.Url : null,
            LocalFilePath = Path.GetFullPath(filePath),
            FileSha256 = sha,
            StartedAt = DateTime.UtcNow,
        };

        if (!options.Force)
        {
            var previous = await _db.ImportRuns
                .Where(r => r.Source == ImportSource.Bmf && r.Status == ImportStatus.Succeeded
                            && r.FileSha256 == sha && r.StateFilter == run.StateFilter)
                .OrderByDescending(r => r.StartedAt)
                .FirstOrDefaultAsync(ct);
            if (previous is not null)
            {
                run.Status = ImportStatus.SkippedUnchanged;
                run.FinishedAt = DateTime.UtcNow;
                run.Errors = $"File identical to import run #{previous.Id} on {previous.StartedAt:u}. Use --force to re-import.";
                _db.ImportRuns.Add(run);
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("BMF import skipped: {Reason}", run.Errors);
                return run;
            }
        }

        _db.ImportRuns.Add(run);
        await _db.SaveChangesAsync(ct);

        var errors = new List<string>();
        try
        {
            await ImportRowsAsync(filePath, run, options, errors, ct);
            run.Status = ImportStatus.Succeeded;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BMF import failed");
            run.Status = ImportStatus.Failed;
            errors.Insert(0, ex.ToString());
        }
        finally
        {
            run.FinishedAt = DateTime.UtcNow;
            run.Errors = errors.Count == 0 ? null : string.Join(Environment.NewLine, errors.Take(MaxErrorsRecorded));
            _db.ChangeTracker.Clear(); // drop any half-applied batch; only the run record is saved here
            _db.ImportRuns.Update(run);
            await _db.SaveChangesAsync(CancellationToken.None);
        }

        _logger.LogInformation(
            "BMF import #{Id} {Status}: read={Read} inserted={Inserted} updated={Updated} unchanged={Unchanged} skipped={Skipped}",
            run.Id, run.Status, run.RowsRead, run.RowsInserted, run.RowsUpdated, run.RowsUnchanged, run.RowsSkipped);
        return run;
    }

    private async Task ImportRowsAsync(string filePath, ImportRun run, BmfImportOptions options, List<string> errors, CancellationToken ct)
    {
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            TrimOptions = TrimOptions.Trim,
            MissingFieldFound = null,
            BadDataFound = null,
            HeaderValidated = null,
        };

        using var reader = new StreamReader(filePath);
        using var csv = new CsvReader(reader, config);

        var batch = new List<BmfRow>(options.BatchSize);
        var stateFilter = run.StateFilter;

        await foreach (var row in csv.GetRecordsAsync<BmfRow>(ct))
        {
            run.RowsRead++;
            if (stateFilter is not null && !string.Equals(row.State?.Trim(), stateFilter, StringComparison.OrdinalIgnoreCase))
            {
                run.RowsSkipped++;
                continue;
            }

            batch.Add(row);
            if (batch.Count >= options.BatchSize)
            {
                await UpsertBatchAsync(batch, run, errors, ct);
                batch.Clear();
            }
        }

        if (batch.Count > 0) await UpsertBatchAsync(batch, run, errors, ct);
    }

    private async Task UpsertBatchAsync(List<BmfRow> batch, ImportRun run, List<string> errors, CancellationToken ct)
    {
        // De-dupe within the batch (the IRS file occasionally repeats an EIN); last row wins.
        var byEin = new Dictionary<string, BmfRow>(batch.Count);
        foreach (var row in batch)
        {
            var ein = BmfRowParser.NormalizeEin(row.Ein);
            if (ein is null)
            {
                run.RowsSkipped++;
                if (errors.Count < MaxErrorsRecorded) errors.Add($"Row {run.RowsRead}: unusable EIN '{row.Ein}' ({row.Name})");
                continue;
            }
            byEin[ein] = row;
        }

        var eins = byEin.Keys.ToList();
        var existing = await _db.Organizations.Where(o => eins.Contains(o.Ein)).ToDictionaryAsync(o => o.Ein, ct);
        var now = DateTime.UtcNow;

        foreach (var (ein, row) in byEin)
        {
            if (existing.TryGetValue(ein, out var org))
            {
                var changed = BmfRowParser.Apply(row, org);
                org.LastSeenImportRunId = run.Id;
                if (changed)
                {
                    org.UpdatedAt = now;
                    run.RowsUpdated++;
                }
                else
                {
                    run.RowsUnchanged++;
                }
            }
            else
            {
                org = new Organization
                {
                    Ein = ein,
                    FirstSeenImportRunId = run.Id,
                    LastSeenImportRunId = run.Id,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                BmfRowParser.Apply(row, org);
                _db.Organizations.Add(org);
                run.RowsInserted++;
            }
        }

        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        _logger.LogDebug("BMF batch committed: read so far {Read}", run.RowsRead);
    }

    private async Task<string> DownloadAsync(BmfImportOptions options, CancellationToken ct)
    {
        Directory.CreateDirectory(options.DataDirectory);
        var fileName = Path.GetFileNameWithoutExtension(new Uri(options.Url).AbsolutePath);
        var target = Path.Combine(options.DataDirectory, $"{fileName}_{DateTime.UtcNow:yyyyMMdd}.csv");

        _logger.LogInformation("Downloading {Url} → {Target}", options.Url, target);
        using var response = await _http.GetAsync(options.Url, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();
        await using var source = await response.Content.ReadAsStreamAsync(ct);
        await using var dest = File.Create(target);
        await source.CopyToAsync(dest, ct);
        return target;
    }

    public static async Task<string> HashFileAsync(string path, CancellationToken ct)
    {
        await using var stream = File.OpenRead(path);
        var hash = await SHA256.HashDataAsync(stream, ct);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
