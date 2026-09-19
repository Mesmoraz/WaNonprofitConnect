using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Codes;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Data.Queries;

public sealed class OrganizationSearchRequest
{
    /// <summary>Free text matched against the normalized name, or an exact EIN if it's 9 digits.</summary>
    public string? Q { get; set; }
    public string? State { get; set; }
    public string? City { get; set; }
    public string? Zip { get; set; }
    /// <summary>NTEE major letter (e.g. "K") or full code (e.g. "K31").</summary>
    public string? Ntee { get; set; }
    public string? Foundation { get; set; }
    public string? Subsection { get; set; }
    public bool Only501c3 { get; set; } = true;
    public bool ExcludePrivateFoundations { get; set; }
    public decimal? MinRevenue { get; set; }
    public decimal? MaxRevenue { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;

    public const int MaxPageSize = 200;
}

public sealed record PagedResult<T>(int Total, int Page, int PageSize, IReadOnlyList<T> Items);

public sealed record CountBucket(string Key, string Label, int Count);

public sealed record OrganizationStats(
    int Total,
    int Count501c3,
    int Count501c3PublicCharities,
    int Count501c3PrivateFoundations,
    int CountWithNtee,
    int CountWithRevenue,
    IReadOnlyList<CountBucket> BySubsection,
    IReadOnlyList<CountBucket> ByNteeMajor,
    IReadOnlyList<CountBucket> ByFoundation,
    IReadOnlyList<CountBucket> ByFilingRequirement,
    IReadOnlyList<CountBucket> ByIncomeBand,
    IReadOnlyList<CountBucket> TopCities,
    IReadOnlyList<CountBucket> ByRulingDecade);

/// <summary>Search + stats over <see cref="Organization"/>, shared by the API and the CLI.</summary>
public static class OrganizationQueries
{
    public static IQueryable<Organization> ApplyFilters(IQueryable<Organization> query, OrganizationSearchRequest req)
    {
        if (req.Only501c3) query = query.Where(o => o.Is501c3);
        if (req.ExcludePrivateFoundations)
        {
            var pf = BmfCodes.PrivateFoundationCodes.ToList();
            query = query.Where(o => o.FoundationCode == null || !pf.Contains(o.FoundationCode));
        }

        var state = BmfRowParser.Clean(req.State)?.ToUpperInvariant();
        if (state is not null) query = query.Where(o => o.State == state);

        var city = BmfRowParser.Clean(req.City)?.ToUpperInvariant();
        if (city is not null) query = query.Where(o => o.City == city);

        var zip = BmfRowParser.Zip5(req.Zip);
        if (zip is not null) query = query.Where(o => o.Zip5 == zip);

        var ntee = BmfRowParser.Clean(req.Ntee)?.ToUpperInvariant();
        if (ntee is not null)
        {
            query = ntee.Length == 1
                ? query.Where(o => o.NteeMajor == ntee)
                : query.Where(o => o.NteeCode == ntee);
        }

        var foundation = BmfRowParser.Clean(req.Foundation);
        if (foundation is not null) query = query.Where(o => o.FoundationCode == foundation);

        var subsection = BmfRowParser.Clean(req.Subsection);
        if (subsection is not null) query = query.Where(o => o.Subsection == subsection);

        if (req.MinRevenue is { } min) query = query.Where(o => o.RevenueAmount >= min);
        if (req.MaxRevenue is { } max) query = query.Where(o => o.RevenueAmount <= max);

        var q = BmfRowParser.Clean(req.Q);
        if (q is not null)
        {
            var ein = BmfRowParser.NormalizeEin(q);
            if (ein is not null && q.Count(char.IsDigit) == 9)
            {
                query = query.Where(o => o.Ein == ein);
            }
            else
            {
                // Every term must appear somewhere in the normalized name (AND semantics).
                foreach (var term in BmfRowParser.Normalize(q).Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    var pattern = $"%{term}%";
                    query = query.Where(o => EF.Functions.Like(o.NameNormalized, pattern));
                }
            }
        }

        return query;
    }

    public static async Task<PagedResult<Organization>> SearchAsync(AppDbContext db, OrganizationSearchRequest req, CancellationToken ct = default)
    {
        var page = Math.Max(1, req.Page);
        var pageSize = Math.Clamp(req.PageSize, 1, OrganizationSearchRequest.MaxPageSize);

        var query = ApplyFilters(db.Organizations.AsNoTracking(), req);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(o => o.Name).ThenBy(o => o.Ein)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<Organization>(total, page, pageSize, items);
    }

    public static async Task<OrganizationStats> GetStatsAsync(AppDbContext db, string? state = null, CancellationToken ct = default)
    {
        var all = db.Organizations.AsNoTracking();
        var st = BmfRowParser.Clean(state)?.ToUpperInvariant();
        if (st is not null) all = all.Where(o => o.State == st);
        var c3 = all.Where(o => o.Is501c3);
        var pf = BmfCodes.PrivateFoundationCodes.ToList();

        var total = await all.CountAsync(ct);
        var count501c3 = await c3.CountAsync(ct);
        var privateFoundations = await c3.CountAsync(o => o.FoundationCode != null && pf.Contains(o.FoundationCode), ct);
        var withNtee = await c3.CountAsync(o => o.NteeCode != null, ct);
        var withRevenue = await c3.CountAsync(o => o.RevenueAmount != null && o.RevenueAmount != 0, ct);

        var bySubsection = await GroupAsync(all, o => o.Subsection, BmfCodes.Subsection, ct);
        var byNtee = await GroupAsync(c3, o => o.NteeMajor, BmfCodes.NteeMajorGroup, ct);
        var byFoundation = await GroupAsync(c3, o => o.FoundationCode, BmfCodes.Foundation, ct);
        var byFiling = await GroupAsync(c3, o => o.FilingReqCode, BmfCodes.FilingRequirement, ct);
        var byIncomeBand = await GroupAsync(c3, o => o.IncomeCode, BmfCodes.AmountBand, ct);

        var topCities = (await c3.Where(o => o.City != null)
                .GroupBy(o => o.City!)
                .Select(g => new { Key = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count).ThenBy(x => x.Key)
                .Take(25)
                .ToListAsync(ct))
            .Select(x => new CountBucket(x.Key, x.Key, x.Count)).ToList();

        var byDecade = (await c3.Where(o => o.RulingDate != null)
                .GroupBy(o => o.RulingDate!.Value.Year / 10 * 10)
                .Select(g => new { Key = g.Key, Count = g.Count() })
                .OrderBy(x => x.Key)
                .ToListAsync(ct))
            .Select(x => new CountBucket(x.Key.ToString(), $"{x.Key}s", x.Count)).ToList();

        return new OrganizationStats(
            total, count501c3, count501c3 - privateFoundations, privateFoundations, withNtee, withRevenue,
            bySubsection, byNtee, byFoundation, byFiling, byIncomeBand, topCities, byDecade);
    }

    private static async Task<IReadOnlyList<CountBucket>> GroupAsync(
        IQueryable<Organization> query,
        System.Linq.Expressions.Expression<Func<Organization, string?>> keySelector,
        IReadOnlyDictionary<string, string> labels,
        CancellationToken ct)
    {
        var rows = await query.GroupBy(keySelector)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return rows
            .Select(r => new CountBucket(r.Key ?? "", BmfCodes.Label(labels, r.Key), r.Count))
            .OrderByDescending(b => b.Count).ThenBy(b => b.Key)
            .ToList();
    }
}
