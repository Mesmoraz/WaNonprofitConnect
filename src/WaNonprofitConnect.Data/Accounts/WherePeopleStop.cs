using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Accounts;

/// <summary>
/// Admin's "Where people stop" (S-148): each step from sign-in to golden thread. People for the first two steps,
/// organizations after. <c>Waiting</c> is people waiting for an admin to approve their claim. <c>Orgs</c> is the
/// organizations with a confirmed person, the base for "Organizations that posted".
/// </summary>
public sealed record WherePeopleStopDto(
    int SignedIn, int Confirmed, int Waiting, int Orgs, int Posted, int InThread, int Golden, Ratio CameBack);

/// <summary>
/// Counts the same people as "How it's going": someone who signed in with Google, isn't an admin, and isn't
/// "Test as this organization" or the development sign-in (that sign-in never has a Google account). Uses only what
/// the app already keeps; nothing new is recorded.
/// </summary>
public static class WherePeopleStop
{
    public const int CameBackDays = 7;

    public static async Task<WherePeopleStopDto> ComputeAsync(AppDbContext db, AccountOptions options, DateTime asOfUtc, CancellationToken ct = default)
    {
        var people = (await db.Accounts.AsNoTracking()
                .Where(a => a.GoogleSubject != null)
                .Select(a => new { a.Id, a.Email, a.LastSignInAt })
                .ToListAsync(ct))
            .Where(a => !options.IsAdmin(a.Email))
            .ToList();
        var ids = people.Select(p => p.Id).ToList();

        var memberships = await db.Memberships.AsNoTracking()
            .Where(m => ids.Contains(m.AccountId) && m.InviteCode != AccountService.AdminTestCode && m.InviteCode != AccountService.DevCode)
            .Select(m => new { m.AccountId, m.Ein, m.Status, At = m.DecidedAt ?? m.CreatedAt })
            .ToListAsync(ct);
        var confirmed = memberships.Where(m => m.Status == MembershipStatus.Confirmed).ToList();
        var confirmedPeople = confirmed.GroupBy(m => m.AccountId).ToDictionary(g => g.Key, g => g.Min(m => m.At));
        var waiting = memberships
            .Where(m => m.Status == MembershipStatus.Pending && !confirmedPeople.ContainsKey(m.AccountId))
            .Select(m => m.AccountId).Distinct().Count();

        var orgs = confirmed.Select(m => m.Ein).ToHashSet();
        var orgList = orgs.ToList();
        var posted = await db.Listings.AsNoTracking().Where(l => orgList.Contains(l.OrgEin)).Select(l => l.OrgEin).Distinct().CountAsync(ct);

        // Threads count as on "How it's going": both sides are these organizations, and an admin didn't start it.
        var threads = (await db.Matches.AsNoTracking()
                .Where(m => orgList.Contains(m.NeedListing!.OrgEin) && orgList.Contains(m.OfferListing!.OrgEin))
                .Select(m => new
                {
                    NeedEin = m.NeedListing!.OrgEin, OfferEin = m.OfferListing!.OrgEin, m.Status,
                    StartedBy = db.Accounts.Where(a => a.Id == m.StartedByAccountId).Select(a => a.Email).FirstOrDefault(),
                })
                .ToListAsync(ct))
            .Where(t => !options.IsAdmin(t.StartedBy))
            .ToList();
        var inThread = threads.SelectMany(t => new[] { t.NeedEin, t.OfferEin }).Distinct().Count();
        var golden = threads.Where(t => t.Status == MatchStatus.Completed).SelectMany(t => new[] { t.NeedEin, t.OfferEin }).Distinct().Count();

        // Came back: of people confirmed over a week ago, those who signed in during the last week.
        var since = asOfUtc.AddDays(-CameBackDays);
        var due = people.Where(p => confirmedPeople.TryGetValue(p.Id, out var joined) && joined <= since).ToList();
        var cameBack = due.Count(p => p.LastSignInAt >= since);

        return new WherePeopleStopDto(people.Count, confirmedPeople.Count, waiting, orgs.Count, posted, inThread, golden, new Ratio(cameBack, due.Count));
    }
}
