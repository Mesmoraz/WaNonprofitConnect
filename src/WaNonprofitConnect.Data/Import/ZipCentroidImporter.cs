using System.Globalization;
using System.IO.Compression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Import;

public sealed record GazetteerRow(string Zip5, double Lat, double Lon);

/// <summary>
/// Reads the Census Bureau ZCTA national gazetteer: tab-delimited, a header row
/// (GEOID, ALAND, AWATER, ALAND_SQMI, AWATER_SQMI, INTPTLAT, INTPTLONG), and trailing spaces on the last column.
/// Columns are found by header name, so the order can change between vintages.
/// </summary>
public static class GazetteerParser
{
    /// <summary>Washington ZIPs are 980xx to 994xx.</summary>
    public static bool IsWashington(string zip5)
        => zip5.Length == 5 && int.TryParse(zip5, NumberStyles.None, CultureInfo.InvariantCulture, out var z) && z is >= 98000 and <= 99499;

    public static IEnumerable<GazetteerRow> Parse(TextReader reader, Func<string, bool>? keep = null)
    {
        keep ??= IsWashington;
        var header = reader.ReadLine() ?? throw new InvalidDataException("The gazetteer file is empty.");
        var columns = header.Split('\t').Select(c => c.Trim().TrimStart('﻿')).ToList();
        int Col(string name) => columns.FindIndex(c => c.Equals(name, StringComparison.OrdinalIgnoreCase)) is var i and >= 0
            ? i : throw new InvalidDataException($"The gazetteer header has no {name} column.");
        var geoid = Col("GEOID");
        var lat = Col("INTPTLAT");
        var lon = Col("INTPTLONG");
        var needed = Math.Max(geoid, Math.Max(lat, lon));

        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if (line.Length == 0) continue;
            var f = line.Split('\t');
            if (f.Length <= needed) continue;
            var zip = f[geoid].Trim();
            if (zip.Length != 5 || !keep(zip)) continue;
            if (!double.TryParse(f[lat].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var la)) continue;
            if (!double.TryParse(f[lon].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var lo)) continue;
            yield return new GazetteerRow(zip, la, lo);
        }
    }
}

public sealed class ZipCentroidImportOptions
{
    public string Url { get; set; } = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_Gaz_zcta_national.zip";
    public string DataDirectory { get; set; } = "data/raw";
    /// <summary>Use this local .zip or .txt instead of downloading.</summary>
    public string? LocalFile { get; set; }
    public bool Force { get; set; }
}

/// <summary>Loads Washington ZIP centroids into <see cref="ZipCentroid"/>, recording an <see cref="ImportRun"/> like the other importers.</summary>
public sealed class ZipCentroidImporter
{
    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly ILogger<ZipCentroidImporter> _logger;

    public ZipCentroidImporter(AppDbContext db, HttpClient http, ILogger<ZipCentroidImporter> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    public async Task<ImportRun> RunAsync(ZipCentroidImportOptions options, CancellationToken ct = default)
    {
        var filePath = options.LocalFile ?? await DownloadAsync(options, ct);
        var sha = await BmfImporter.HashFileAsync(filePath, ct);
        var run = new ImportRun
        {
            Source = ImportSource.ZipGazetteer,
            Status = ImportStatus.Running,
            StateFilter = "WA",
            SourceUrl = options.LocalFile is null ? options.Url : null,
            LocalFilePath = Path.GetFullPath(filePath),
            FileSha256 = sha,
            StartedAt = DateTime.UtcNow,
        };

        if (!options.Force)
        {
            var previous = await _db.ImportRuns
                .Where(r => r.Source == ImportSource.ZipGazetteer && r.Status == ImportStatus.Succeeded && r.FileSha256 == sha)
                .OrderByDescending(r => r.StartedAt).FirstOrDefaultAsync(ct);
            if (previous is not null)
            {
                run.Status = ImportStatus.SkippedUnchanged;
                run.FinishedAt = DateTime.UtcNow;
                run.Errors = $"File identical to import run #{previous.Id} on {previous.StartedAt:u}. Use --force to re-import.";
                _db.ImportRuns.Add(run);
                await _db.SaveChangesAsync(ct);
                return run;
            }
        }

        _db.ImportRuns.Add(run);
        await _db.SaveChangesAsync(ct);
        try
        {
            List<GazetteerRow> rows;
            using (var reader = OpenText(filePath)) rows = GazetteerParser.Parse(reader).DistinctBy(r => r.Zip5).ToList();
            run.RowsRead = rows.Count;

            var existing = await _db.ZipCentroids.ToDictionaryAsync(z => z.Zip5, ct);
            foreach (var row in rows)
            {
                if (existing.TryGetValue(row.Zip5, out var z))
                {
                    if (z.Lat == row.Lat && z.Lon == row.Lon) run.RowsUnchanged++;
                    else { z.Lat = row.Lat; z.Lon = row.Lon; run.RowsUpdated++; }
                    z.LastSeenImportRunId = run.Id;
                }
                else
                {
                    _db.ZipCentroids.Add(new ZipCentroid { Zip5 = row.Zip5, Lat = row.Lat, Lon = row.Lon, LastSeenImportRunId = run.Id });
                    run.RowsInserted++;
                }
            }
            run.Status = ImportStatus.Succeeded;
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ZIP centroid import failed");
            run.Status = ImportStatus.Failed;
            run.Errors = ex.ToString();
            _db.ChangeTracker.Clear();
            _db.ImportRuns.Update(run);
        }
        finally
        {
            run.FinishedAt = DateTime.UtcNow;
            if (run.Status == ImportStatus.Failed) _db.ImportRuns.Update(run);
            await _db.SaveChangesAsync(CancellationToken.None);
        }

        _logger.LogInformation("ZIP centroid import #{Id} {Status}: {Read} WA ZIPs, inserted={Inserted} updated={Updated}",
            run.Id, run.Status, run.RowsRead, run.RowsInserted, run.RowsUpdated);
        return run;
    }

    /// <summary>A .zip (the Census download) is opened at its first .txt entry; anything else is read as the text file itself.</summary>
    private static TextReader OpenText(string path)
    {
        if (!path.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) return new StreamReader(path);
        var archive = ZipFile.OpenRead(path);
        var entry = archive.Entries.FirstOrDefault(e => e.FullName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
                    ?? throw new InvalidDataException("The zip has no .txt gazetteer inside.");
        return new ArchiveReader(archive, entry.Open());
    }

    private sealed class ArchiveReader : StreamReader
    {
        private readonly ZipArchive _archive;
        public ArchiveReader(ZipArchive archive, Stream s) : base(s) => _archive = archive;
        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) _archive.Dispose();
        }
    }

    private async Task<string> DownloadAsync(ZipCentroidImportOptions options, CancellationToken ct)
    {
        Directory.CreateDirectory(options.DataDirectory);
        var target = Path.Combine(options.DataDirectory, Path.GetFileName(new Uri(options.Url).AbsolutePath));
        _logger.LogInformation("Downloading {Url} → {Target}", options.Url, target);
        using var response = await _http.GetAsync(options.Url, HttpCompletionOption.ResponseHeadersRead, ct);
        response.EnsureSuccessStatusCode();
        await using var source = await response.Content.ReadAsStreamAsync(ct);
        await using var dest = File.Create(target);
        await source.CopyToAsync(dest, ct);
        return target;
    }
}
