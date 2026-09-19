namespace WaNonprofitConnect.Data.Entities;

/// <summary>
/// One row per EIN. Fields mirror the IRS Exempt Organizations Business Master File (EO BMF) extract.
/// Raw IRS code values are stored as-is; decode them with <see cref="Codes.BmfCodes"/>.
/// </summary>
public class Organization
{
    /// <summary>9-digit EIN, zero-padded, no dash. Primary key.</summary>
    public string Ein { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    /// <summary>Upper-cased, punctuation-stripped name used for LIKE search.</summary>
    public string NameNormalized { get; set; } = string.Empty;
    public string? SortName { get; set; }
    /// <summary>"In care of" — usually a person's name. Treat as PII; do not expose publicly.</summary>
    public string? InCareOf { get; set; }

    public string? Street { get; set; }
    public string? City { get; set; }
    public string State { get; set; } = string.Empty;
    public string? Zip { get; set; }
    /// <summary>First 5 digits of Zip, for grouping.</summary>
    public string? Zip5 { get; set; }

    /// <summary>Group exemption number (0000 = none).</summary>
    public string? GroupExemption { get; set; }
    /// <summary>IRC 501(c) subsection, e.g. "03" for 501(c)(3).</summary>
    public string Subsection { get; set; } = string.Empty;
    public string? Affiliation { get; set; }
    public string? Classification { get; set; }
    /// <summary>Year/month the IRS issued the determination letter (from YYYYMM).</summary>
    public DateOnly? RulingDate { get; set; }
    public string? Deductibility { get; set; }
    public string? FoundationCode { get; set; }
    public string? Activity { get; set; }
    public string? OrganizationCode { get; set; }
    public string? Status { get; set; }
    /// <summary>Tax period of the latest return on file (from YYYYMM).</summary>
    public DateOnly? TaxPeriod { get; set; }
    public string? AssetCode { get; set; }
    public string? IncomeCode { get; set; }
    public string? FilingReqCode { get; set; }
    public string? PfFilingReqCode { get; set; }
    /// <summary>Accounting period end month (1–12).</summary>
    public int? AccountingPeriodMonth { get; set; }

    public decimal? AssetAmount { get; set; }
    public decimal? IncomeAmount { get; set; }
    public decimal? RevenueAmount { get; set; }

    /// <summary>Full NTEE code, e.g. "D20". Often blank or wrong in IRS data.</summary>
    public string? NteeCode { get; set; }
    /// <summary>First letter of NTEE code (major group A–Z).</summary>
    public string? NteeMajor { get; set; }

    public bool Is501c3 { get; set; }

    public int FirstSeenImportRunId { get; set; }
    public int LastSeenImportRunId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ImportRun? FirstSeenImportRun { get; set; }
    public ImportRun? LastSeenImportRun { get; set; }
}
