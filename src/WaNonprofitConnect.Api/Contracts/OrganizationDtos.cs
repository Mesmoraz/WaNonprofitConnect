using WaNonprofitConnect.Data.Codes;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Api.Contracts;

/// <summary>Compact row for search results and lists.</summary>
public sealed record OrganizationSummaryDto(
    string Ein,
    string Name,
    string? City,
    string State,
    string? Zip5,
    string Subsection,
    bool Is501c3,
    string? FoundationCode,
    string FoundationLabel,
    string? NteeCode,
    string? NteeMajor,
    string? NteeMajorLabel,
    decimal? RevenueAmount,
    DateOnly? TaxPeriod)
{
    public static OrganizationSummaryDto From(Organization o) => new(
        o.Ein, o.Name, o.City, o.State, o.Zip5, o.Subsection, o.Is501c3,
        o.FoundationCode, BmfCodes.Label(BmfCodes.Foundation, o.FoundationCode),
        o.NteeCode, o.NteeMajor, o.NteeMajor is null ? null : BmfCodes.Label(BmfCodes.NteeMajorGroup, o.NteeMajor),
        o.RevenueAmount, o.TaxPeriod);
}

/// <summary>A raw IRS code plus its decoded label.</summary>
public sealed record CodedValue(string? Code, string Label);

/// <summary>Full public record for one organization. Deliberately omits InCareOf (PII) until org claiming exists.</summary>
public sealed record OrganizationDetailDto(
    string Ein,
    string EinFormatted,
    string Name,
    string? SortName,
    AddressDto Address,
    CodedValue Subsection,
    bool Is501c3,
    CodedValue Foundation,
    bool IsPrivateFoundation,
    CodedValue Deductibility,
    CodedValue Status,
    CodedValue FilingRequirement,
    CodedValue PfFilingRequirement,
    CodedValue Affiliation,
    CodedValue OrganizationType,
    string? GroupExemption,
    string? Classification,
    string? Activity,
    DateOnly? RulingDate,
    DateOnly? TaxPeriod,
    int? AccountingPeriodMonth,
    CodedValue AssetBand,
    CodedValue IncomeBand,
    decimal? AssetAmount,
    decimal? IncomeAmount,
    decimal? RevenueAmount,
    NteeDto? Ntee,
    ExternalLinksDto Links,
    DateTime UpdatedAt)
{
    public static OrganizationDetailDto From(Organization o)
    {
        NteeDto? ntee = null;
        if (o.NteeMajor is not null)
        {
            var pp = BmfCodes.ProPublicaCategory.TryGetValue(o.NteeMajor, out var p) ? p : (Id: 10, Name: "Unknown, Unclassified");
            ntee = new NteeDto(o.NteeCode, o.NteeMajor, BmfCodes.Label(BmfCodes.NteeMajorGroup, o.NteeMajor), pp.Id, pp.Name);
        }

        return new OrganizationDetailDto(
            o.Ein,
            $"{o.Ein[..2]}-{o.Ein[2..]}",
            o.Name,
            o.SortName,
            new AddressDto(o.Street, o.City, o.State, o.Zip),
            new CodedValue(o.Subsection, BmfCodes.Label(BmfCodes.Subsection, o.Subsection)),
            o.Is501c3,
            new CodedValue(o.FoundationCode, BmfCodes.Label(BmfCodes.Foundation, o.FoundationCode)),
            o.FoundationCode is not null && BmfCodes.PrivateFoundationCodes.Contains(o.FoundationCode),
            new CodedValue(o.Deductibility, BmfCodes.Label(BmfCodes.Deductibility, o.Deductibility)),
            new CodedValue(o.Status, BmfCodes.Label(BmfCodes.Status, o.Status)),
            new CodedValue(o.FilingReqCode, BmfCodes.Label(BmfCodes.FilingRequirement, o.FilingReqCode)),
            new CodedValue(o.PfFilingReqCode, BmfCodes.Label(BmfCodes.PfFilingRequirement, o.PfFilingReqCode)),
            new CodedValue(o.Affiliation, BmfCodes.Label(BmfCodes.Affiliation, o.Affiliation)),
            new CodedValue(o.OrganizationCode, BmfCodes.Label(BmfCodes.OrganizationType, o.OrganizationCode)),
            o.GroupExemption,
            o.Classification,
            o.Activity,
            o.RulingDate,
            o.TaxPeriod,
            o.AccountingPeriodMonth,
            new CodedValue(o.AssetCode, BmfCodes.Label(BmfCodes.AmountBand, o.AssetCode)),
            new CodedValue(o.IncomeCode, BmfCodes.Label(BmfCodes.AmountBand, o.IncomeCode)),
            o.AssetAmount,
            o.IncomeAmount,
            o.RevenueAmount,
            ntee,
            new ExternalLinksDto(
                $"https://projects.propublica.org/nonprofits/organizations/{o.Ein}",
                $"https://apps.irs.gov/app/eos/details/?ein={o.Ein}"),
            o.UpdatedAt);
    }
}

public sealed record AddressDto(string? Street, string? City, string State, string? Zip);

public sealed record NteeDto(string? Code, string Major, string MajorLabel, int ProPublicaCategoryId, string ProPublicaCategoryName);

public sealed record ExternalLinksDto(string ProPublica, string IrsTeos);

public sealed record PagedResponse<T>(int Total, int Page, int PageSize, int TotalPages, IReadOnlyList<T> Items);
