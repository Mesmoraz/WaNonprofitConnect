namespace WaNonprofitConnect.Data.Entities;

public enum ImportSource
{
    Bmf = 1,
    Pub78 = 2,
    Revocation = 3,
    EPostcard = 4,
    /// <summary>OSPI Washington State Public Schools feature service (schools + derived districts).</summary>
    Schools = 5,
}

public enum ImportStatus
{
    Running = 1,
    Succeeded = 2,
    Failed = 3,
    SkippedUnchanged = 4,
}

/// <summary>Audit record for each data ingest.</summary>
public class ImportRun
{
    public int Id { get; set; }
    public ImportSource Source { get; set; }
    public ImportStatus Status { get; set; }
    /// <summary>State filter applied (e.g. "WA"), or null for all.</summary>
    public string? StateFilter { get; set; }
    public string? SourceUrl { get; set; }
    public string? LocalFilePath { get; set; }
    public string? FileSha256 { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int RowsRead { get; set; }
    public int RowsInserted { get; set; }
    public int RowsUpdated { get; set; }
    public int RowsUnchanged { get; set; }
    public int RowsSkipped { get; set; }
    public string? Errors { get; set; }
}
