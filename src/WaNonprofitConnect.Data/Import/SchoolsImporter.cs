using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Import;

public sealed class SchoolsImportOptions
{
    /// <summary>OSPI "Washington State Public Schools" feature layer. The importer appends <c>/query?...</c> itself.</summary>
    public string Url { get; set; } = "https://services9.arcgis.com/fWunDXKkvCx1CM4b/arcgis/rest/services/Washington_State_Public_Schools/FeatureServer/0";
    /// <summary>Where downloaded snapshots are kept.</summary>
    public string DataDirectory { get; set; } = "data/raw";
    /// <summary>Use this local snapshot (an ArcGIS query response, or a file this importer wrote) instead of downloading.</summary>
    public string? LocalFile { get; set; }
    /// <summary>Import even if the snapshot hash matches the last successful run.</summary>
    public bool Force { get; set; }
    /// <summary>Rows per ArcGIS page. The service caps at 2000; paging stops on the first short page.</summary>
    public int PageSize { get; set; } = 2000;
    public int BatchSize { get; set; } = 2000;
}

/// <summary>
/// Pages through OSPI's public ArcGIS feature service (or reads a saved snapshot), writes a normalized snapshot to
/// <see cref="SchoolsImportOptions.DataDirectory"/>, and upserts <see cref="School"/> rows keyed by OSPI school code plus
/// one <see cref="SchoolDistrict"/> per LEA code derived from those rows. Every run is recorded as an <see cref="ImportRun"/>
/// with <see cref="ImportSource.Schools"/>; identical snapshots are skipped unless forced. Same shape as <see cref="BmfImporter"/>.
/// </summary>
public sealed class SchoolsImporter
{
    public const string OutFields = "SchoolCode,School,PhysicalAddress,LEACode,LEAName,SchoolCategory,GradeCategory,LowestGrade,HighestGrade,County,BldgLatitude,BldgLongitude";

    private const int MaxErrorsRecorded = 50;
    /// <summary>Hard stop for the paging loop in case the service never returns a short page.</summary>
    private const int MaxRowsFetched = 200_000;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = null, // keep OSPI's field names (SchoolCode, LEACode, ...) verbatim in the snapshot
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly ILogger<SchoolsImporter> _logger;

    public SchoolsImporter(AppDbContext db, HttpClient http, ILogger<SchoolsImporter> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    public static string QueryUrl(string layerUrl, int offset, int pageSize)
        => $"{layerUrl.TrimEnd('/')}/query?where=1%3D1&outFields={OutFields}&returnGeometry=false&f=json&resultOffset={offset}&resultRecordCount={pageSize}";

    public async Task<ImportRun> RunAsync(SchoolsImportOptions options, CancellationToken ct = default)
    {
        var filePath = options.LocalFile ?? await DownloadAsync(options, ct);
        var sha = await BmfImporter.HashFileAsync(filePath, ct);

        var run = new ImportRun
        {
            Source = ImportSource.Schools,
            Status = ImportStatus.Running,
            StateFilter = "WA", // the feed is WA-only by construction
            SourceUrl = options.LocalFile is null ? options.Url : null,
            LocalFilePath = Path.GetFullPath(filePath),
            FileSha256 = sha,
            StartedAt = DateTime.UtcNow,
        };

        if (!options.Force)
        {
            var previous = await _db.ImportRuns
                .Where(r => r.Source == ImportSource.Schools && r.Status == ImportStatus.Succeeded && r.FileSha256 == sha)
                .OrderByDescending(r => r.StartedAt)
                .FirstOrDefaultAsync(ct);
            if (previous is not null)
            {
                run.Status = ImportStatus.SkippedUnchanged;
                run.FinishedAt = DateTime.UtcNow;
                run.Errors = $"Snapshot identical to import run #{previous.Id} on {previous.StartedAt:u}. Use --force to re-import.";
                _db.ImportRuns.Add(run);
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("Schools import skipped: {Reason}", run.Errors);
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
            _logger.LogError(ex, "Schools import failed");
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
            "Schools import #{Id} {Status}: read={Read} inserted={Inserted} updated={Updated} unchanged={Unchanged} skipped={Skipped}",
            run.Id, run.Status, run.RowsRead, run.RowsInserted, run.RowsUpdated, run.RowsUnchanged, run.RowsSkipped);
        return run;
    }

    private async Task ImportRowsAsync(string filePath, ImportRun run, SchoolsImportOptions options, List<string> errors, CancellationToken ct)
    {
        ArcGisQueryResponse snapshot;
        await using (var stream = File.OpenRead(filePath))
        {
            snapshot = await JsonSerializer.DeserializeAsync<ArcGisQueryResponse>(stream, JsonOptions, ct)
                       ?? throw new InvalidDataException($"{filePath} is not an ArcGIS query response.");
        }
        if (snapshot.Error is not null)
            throw new InvalidDataException($"{filePath} holds a service error: {snapshot.Error.Code} {snapshot.Error.Message}");

        // De-dupe by school code across the whole file (last row wins) so district counts are exact.
        var byCode = new Dictionary<int, SchoolRow>();
        foreach (var feature in snapshot.Features)
        {
            var row = feature.Attributes;
            run.RowsRead++;
            if (row.SchoolCode is not { } code || code <= 0 || row.LEACode is not { } lea || lea <= 0)
            {
                run.RowsSkipped++;
                if (errors.Count < MaxErrorsRecorded) errors.Add($"Row {run.RowsRead}: unusable SchoolCode '{row.SchoolCode}' / LEACode '{row.LEACode}' ({row.School})");
                continue;
            }
            if (errors.Count < MaxErrorsRecorded && !SchoolRowParser.ParseAddress(row.PhysicalAddress).Ok)
                errors.Add($"Row {run.RowsRead}: address did not parse '{row.PhysicalAddress}' ({code} {row.School})");
            byCode[code] = row;
        }

        await UpsertDistrictsAsync(SchoolRowParser.BuildDistricts(byCode.Values), run, ct);

        foreach (var batch in byCode.Values.Chunk(options.BatchSize))
        {
            await UpsertSchoolBatchAsync(batch, run, ct);
        }
    }

    private async Task UpsertDistrictsAsync(IReadOnlyList<DistrictRow> rows, ImportRun run, CancellationToken ct)
    {
        var codes = rows.Select(r => r.LeaCode).ToList();
        var existing = await _db.SchoolDistricts.Where(d => codes.Contains(d.LeaCode)).ToDictionaryAsync(d => d.LeaCode, ct);
        var now = DateTime.UtcNow;
        int inserted = 0, updated = 0;

        foreach (var row in rows)
        {
            if (existing.TryGetValue(row.LeaCode, out var district))
            {
                var changed = SchoolRowParser.Apply(row, district);
                district.LastSeenImportRunId = run.Id;
                if (changed)
                {
                    district.UpdatedAt = now;
                    updated++;
                }
            }
            else
            {
                district = new SchoolDistrict
                {
                    LeaCode = row.LeaCode,
                    FirstSeenImportRunId = run.Id,
                    LastSeenImportRunId = run.Id,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                SchoolRowParser.Apply(row, district);
                _db.SchoolDistricts.Add(district);
                inserted++;
            }
        }

        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        _logger.LogInformation("Districts committed: {Total} in feed, inserted={Inserted} updated={Updated}", rows.Count, inserted, updated);
    }

    private async Task UpsertSchoolBatchAsync(SchoolRow[] batch, ImportRun run, CancellationToken ct)
    {
        var codes = batch.Select(r => r.SchoolCode!.Value).ToList();
        var existing = await _db.Schools.Where(s => codes.Contains(s.SchoolCode)).ToDictionaryAsync(s => s.SchoolCode, ct);
        var now = DateTime.UtcNow;

        foreach (var row in batch)
        {
            var code = row.SchoolCode!.Value;
            if (existing.TryGetValue(code, out var school))
            {
                var changed = SchoolRowParser.Apply(row, school);
                school.LastSeenImportRunId = run.Id;
                if (changed)
                {
                    school.UpdatedAt = now;
                    run.RowsUpdated++;
                }
                else
                {
                    run.RowsUnchanged++;
                }
            }
            else
            {
                school = new School
                {
                    SchoolCode = code,
                    FirstSeenImportRunId = run.Id,
                    LastSeenImportRunId = run.Id,
                    CreatedAt = now,
                    UpdatedAt = now,
                };
                SchoolRowParser.Apply(row, school);
                _db.Schools.Add(school);
                run.RowsInserted++;
            }
        }

        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        _logger.LogDebug("Schools batch committed: {Count} rows", batch.Length);
    }

    /// <summary>Fetch every page, then write one normalized snapshot (features sorted by SchoolCode) so its hash is stable across runs.</summary>
    private async Task<string> DownloadAsync(SchoolsImportOptions options, CancellationToken ct)
    {
        Directory.CreateDirectory(options.DataDirectory);
        var target = Path.Combine(options.DataDirectory, $"ospi_schools_{DateTime.UtcNow:yyyyMMdd}.json");
        _logger.LogInformation("Downloading {Url} → {Target}", options.Url, target);

        var features = new List<ArcGisFeature>();
        for (var offset = 0; ; offset += options.PageSize)
        {
            var url = QueryUrl(options.Url, offset, options.PageSize);
            using var response = await _http.GetAsync(url, ct);
            response.EnsureSuccessStatusCode();
            var page = await response.Content.ReadFromJsonAsync<ArcGisQueryResponse>(JsonOptions, ct)
                       ?? throw new InvalidDataException($"Empty response from {url}");
            if (page.Error is not null)
                throw new HttpRequestException($"OSPI service error {page.Error.Code}: {page.Error.Message} (offset {offset})");

            features.AddRange(page.Features);
            _logger.LogInformation("  page @{Offset}: {Count} rows", offset, page.Features.Count);

            if (page.Features.Count < options.PageSize || page.ExceededTransferLimit != true) break;
            if (features.Count >= MaxRowsFetched) throw new InvalidOperationException($"More than {MaxRowsFetched} rows fetched; the service never returned a short page.");
        }

        var ordered = features.OrderBy(f => f.Attributes.SchoolCode ?? int.MaxValue).ThenBy(f => f.Attributes.School, StringComparer.Ordinal).ToList();
        await using var dest = File.Create(target);
        await JsonSerializer.SerializeAsync(dest, new ArcGisQueryResponse { Features = ordered }, JsonOptions, ct);
        return target;
    }
}
