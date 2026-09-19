using CsvHelper.Configuration.Attributes;

namespace WaNonprofitConnect.Data.Import;

/// <summary>
/// One raw line of the IRS EO BMF CSV (header-mapped). Everything is a string here;
/// <see cref="BmfRowParser"/> turns it into an <see cref="Entities.Organization"/>.
/// Header as of 2026-09: EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,CLASSIFICATION,
/// RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,
/// PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME
/// </summary>
public sealed class BmfRow
{
    [Name("EIN")] public string Ein { get; set; } = string.Empty;
    [Name("NAME")] public string Name { get; set; } = string.Empty;
    [Name("ICO")] public string? Ico { get; set; }
    [Name("STREET")] public string? Street { get; set; }
    [Name("CITY")] public string? City { get; set; }
    [Name("STATE")] public string? State { get; set; }
    [Name("ZIP")] public string? Zip { get; set; }
    [Name("GROUP")] public string? Group { get; set; }
    [Name("SUBSECTION")] public string? Subsection { get; set; }
    [Name("AFFILIATION")] public string? Affiliation { get; set; }
    [Name("CLASSIFICATION")] public string? Classification { get; set; }
    [Name("RULING")] public string? Ruling { get; set; }
    [Name("DEDUCTIBILITY")] public string? Deductibility { get; set; }
    [Name("FOUNDATION")] public string? Foundation { get; set; }
    [Name("ACTIVITY")] public string? Activity { get; set; }
    [Name("ORGANIZATION")] public string? Organization { get; set; }
    [Name("STATUS")] public string? Status { get; set; }
    [Name("TAX_PERIOD")] public string? TaxPeriod { get; set; }
    [Name("ASSET_CD")] public string? AssetCd { get; set; }
    [Name("INCOME_CD")] public string? IncomeCd { get; set; }
    [Name("FILING_REQ_CD")] public string? FilingReqCd { get; set; }
    [Name("PF_FILING_REQ_CD")] public string? PfFilingReqCd { get; set; }
    [Name("ACCT_PD")] public string? AcctPd { get; set; }
    [Name("ASSET_AMT")] public string? AssetAmt { get; set; }
    [Name("INCOME_AMT")] public string? IncomeAmt { get; set; }
    [Name("REVENUE_AMT")] public string? RevenueAmt { get; set; }
    [Name("NTEE_CD")] public string? NteeCd { get; set; }
    [Name("SORT_NAME")] public string? SortName { get; set; }
}
