using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// Urgent (Critical) stays rare so it keeps meaning "we can't operate without it":
/// an organization may post at most 2 urgent needs in any rolling 30 days. Closed or done ones still count.
/// </summary>
public static class UrgentCap
{
    public const int Limit = 2;
    public const int WindowDays = 30;
    public const string Message = "Urgent is 2 a month. Pick This week instead.";

    public static async Task<int> LeftAsync(AppDbContext db, string ein, DateTime now, CancellationToken ct = default)
    {
        var since = now.AddDays(-WindowDays);
        var used = await db.Listings.CountAsync(l => l.OrgEin == ein && l.Kind == ListingKind.Need
                                                     && l.Urgency == Urgency.Critical && l.CreatedAt > since, ct);
        return Math.Max(0, Limit - used);
    }
}
