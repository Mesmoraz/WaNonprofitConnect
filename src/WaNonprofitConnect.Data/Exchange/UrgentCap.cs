using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// Urgent (Critical) stays rare so it keeps meaning "we can't operate without it":
/// an organization may make at most 2 needs urgent in any rolling 30 days, by posting or by editing (S-97).
/// Each counts from when it became urgent. Closed or done ones still count, and so do ones edited back down.
/// </summary>
public static class UrgentCap
{
    public const int Limit = 2;
    public const int WindowDays = 30;
    public const string Message = "Urgent is 2 a month. Pick This week instead.";

    public static async Task<int> LeftAsync(AppDbContext db, string ein, DateTime now, CancellationToken ct = default, int? except = null)
        => Math.Max(0, Limit - (await UsedSinceAsync(db, ein, now, except, ct)).Count);

    /// <summary>With none left: when one comes back (the oldest use that would let you post leaves the 30 days). Null while any are left.</summary>
    public static async Task<DateTime?> AgainOnAsync(AppDbContext db, string ein, DateTime now, CancellationToken ct = default)
    {
        var used = await UsedSinceAsync(db, ein, now, null, ct);
        if (used.Count < Limit) return null;
        return used.OrderBy(d => d).ElementAt(used.Count - Limit).AddDays(WindowDays);
    }

    /// <summary>When each counted need became urgent. Rows from before UrgentSince existed count from when they were posted.</summary>
    private static async Task<List<DateTime>> UsedSinceAsync(AppDbContext db, string ein, DateTime now, int? except, CancellationToken ct)
    {
        var since = now.AddDays(-WindowDays);
        return await db.Listings
            .Where(l => l.OrgEin == ein && l.Kind == ListingKind.Need && l.Id != except)
            .Select(l => l.UrgentSince ?? (l.Urgency == Urgency.Critical ? l.CreatedAt : (DateTime?)null))
            .Where(d => d != null && d > since)
            .Select(d => d!.Value)
            .ToListAsync(ct);
    }
}
