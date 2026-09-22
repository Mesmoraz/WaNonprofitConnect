namespace WaNonprofitConnect.Data.Entities;

/// <summary>
/// One row per OSPI school code. Fields mirror OSPI's "Washington State Public Schools" ArcGIS feature service.
/// Raw OSPI values (category, grade category, grades) are stored as-is; decode them with <see cref="Codes.OspiCodes"/>.
/// Maps to the shared org shape as { id: "OSPI-{SchoolCode}", name, city, zip: Zip5, type: "school", sub, lat, lon }.
/// </summary>
public class School
{
    /// <summary>OSPI school (building) code. Primary key; assigned by OSPI, never generated here.</summary>
    public int SchoolCode { get; set; }

    public string Name { get; set; } = string.Empty;
    /// <summary>Upper-cased, punctuation-stripped name used for LIKE search (same rule as <see cref="Organization.NameNormalized"/>).</summary>
    public string NameNormalized { get; set; } = string.Empty;

    /// <summary>Full address exactly as OSPI publishes it, e.g. "6110 28th Ave NW, Seattle, WA 98107-5314".</summary>
    public string? PhysicalAddress { get; set; }
    /// <summary>Street part of <see cref="PhysicalAddress"/> (everything before the city).</summary>
    public string? Street { get; set; }
    /// <summary>Upper-cased city parsed from <see cref="PhysicalAddress"/>.</summary>
    public string? City { get; set; }
    /// <summary>ZIP as published (5 or ZIP+4).</summary>
    public string? Zip { get; set; }
    /// <summary>First 5 digits of Zip, for grouping.</summary>
    public string? Zip5 { get; set; }

    /// <summary>OSPI LEA (district) code. Foreign key to <see cref="SchoolDistrict"/>.</summary>
    public int LeaCode { get; set; }
    /// <summary>District name as it appears on the school row (denormalized from OSPI).</summary>
    public string LeaName { get; set; } = string.Empty;

    /// <summary>OSPI SchoolCategory, comma-separated, e.g. "Public School,Regular School".</summary>
    public string? SchoolCategory { get; set; }
    /// <summary>OSPI GradeCategory, e.g. "Elementary School", "High School", "K-12", "PK Only", "Other".</summary>
    public string? GradeCategory { get; set; }
    /// <summary>"PK", "K", or "1".."12".</summary>
    public string? LowestGrade { get; set; }
    public string? HighestGrade { get; set; }
    public string? County { get; set; }

    /// <summary>Building coordinates (WGS84). Null when OSPI has none.</summary>
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public int FirstSeenImportRunId { get; set; }
    public int LastSeenImportRunId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public SchoolDistrict? District { get; set; }
    public ImportRun? FirstSeenImportRun { get; set; }
    public ImportRun? LastSeenImportRun { get; set; }
}

/// <summary>
/// One row per OSPI LEA code, derived from the school rows in the same import (OSPI's school feed has no
/// separate district table). City/ZIP are the most common among the district's schools; lat/lon is their mean.
/// Maps to the shared org shape as { id: "LEA-{LeaCode}", name, city, zip: Zip5, type: "school", sub: "District", lat, lon }.
/// </summary>
public class SchoolDistrict
{
    /// <summary>OSPI LEA code. Primary key; assigned by OSPI, never generated here.</summary>
    public int LeaCode { get; set; }

    public string Name { get; set; } = string.Empty;
    public string NameNormalized { get; set; } = string.Empty;
    public string? County { get; set; }
    public string? City { get; set; }
    public string? Zip5 { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    /// <summary>Number of schools in the feed for this LEA as of the last import.</summary>
    public int SchoolCount { get; set; }

    public int FirstSeenImportRunId { get; set; }
    public int LastSeenImportRunId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<School> Schools { get; set; } = new List<School>();
    public ImportRun? FirstSeenImportRun { get; set; }
    public ImportRun? LastSeenImportRun { get; set; }
}
