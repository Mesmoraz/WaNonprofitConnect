using System.Text.Json.Serialization;

namespace WaNonprofitConnect.Data.Import;

/// <summary>
/// One feature's <c>attributes</c> object from OSPI's ArcGIS feature service (the outFields the importer asks for).
/// Property names match the service's field names exactly so the same type reads a live page and the local snapshot.
/// <see cref="SchoolRowParser"/> turns it into a <see cref="Entities.School"/>.
/// </summary>
public sealed class SchoolRow
{
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int? SchoolCode { get; set; }
    public string? School { get; set; }
    public string? PhysicalAddress { get; set; }
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public int? LEACode { get; set; }
    public string? LEAName { get; set; }
    public string? SchoolCategory { get; set; }
    public string? GradeCategory { get; set; }
    public string? LowestGrade { get; set; }
    public string? HighestGrade { get; set; }
    public string? County { get; set; }
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double? BldgLatitude { get; set; }
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double? BldgLongitude { get; set; }
}

/// <summary>
/// One district, derived from the school rows that share an LEA code (OSPI's school feed has no district table).
/// Built by <see cref="SchoolRowParser.BuildDistricts"/>; applied to <see cref="Entities.SchoolDistrict"/> by <see cref="SchoolRowParser.Apply(DistrictRow, Entities.SchoolDistrict)"/>.
/// </summary>
public sealed record DistrictRow(
    int LeaCode,
    string Name,
    string? County,
    string? City,
    string? Zip5,
    double? Latitude,
    double? Longitude,
    int SchoolCount);

/// <summary>ArcGIS <c>/query?f=json</c> envelope, trimmed to what the importer reads. Also the shape of the local snapshot file.</summary>
public sealed class ArcGisQueryResponse
{
    [JsonPropertyName("features")]
    public List<ArcGisFeature> Features { get; set; } = new();
    /// <summary>True when the server capped the page; absent/false on the last page.</summary>
    [JsonPropertyName("exceededTransferLimit")]
    public bool? ExceededTransferLimit { get; set; }
    [JsonPropertyName("error")]
    public ArcGisError? Error { get; set; }
}

public sealed class ArcGisFeature
{
    [JsonPropertyName("attributes")]
    public SchoolRow Attributes { get; set; } = new();
}

public sealed class ArcGisError
{
    [JsonPropertyName("code")]
    public int? Code { get; set; }
    [JsonPropertyName("message")]
    public string? Message { get; set; }
    [JsonPropertyName("details")]
    public List<string>? Details { get; set; }
}
