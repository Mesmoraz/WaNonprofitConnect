using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Accounts;

/// <summary>Some of how many: "4 of 12".</summary>
public sealed record Ratio(int Got, int Of);

/// <summary>
/// The six alpha measures (docs/PLAN.md, section 6) for Admin's "How it's going" (S-100). <c>Month</c> is the current
/// month's English name, Pacific time. <c>FirstAnswerMedianMinutes</c> is null when no thread has been answered yet.
/// </summary>
public sealed record AlphaNumbersDto(
    int Posts, int Started, int Accepted, int Golden,
    int GoldenThisMonth, string Month,
    Ratio ThreadWithin14Days, int? FirstAnswerMedianMinutes, Ratio BecameGolden, Ratio BothInFirstWeek, Ratio GivenAndReceived);

/// <summary>
/// Counts real organizations only: those with a confirmed person who isn't "Test as this organization" or the
/// development sign-in. A thread counts when both sides are real and an admin didn't start it (Taylor, Oct 27).
/// Young posts, organizations and threads wait until they've had their chance (the brief's questions 1 and 3).
/// </summary>
public static class AlphaNumbers
{
    public const int ThreadWithinDays = 14, FirstWeekDays = 7, OpenCountsAfterDays = 30;

    public static async Task<AlphaNumbersDto> ComputeAsync(AppDbContext db, AccountOptions options, DateTime asOfUtc, CancellationToken ct = default)
    {
        // When each real organization joined: its first real person's confirmation.
        var joined = (await db.Memberships.AsNoTracking()
                .Where(m => m.Status == MembershipStatus.Confirmed && m.InviteCode != AccountService.AdminTestCode && m.InviteCode != AccountService.DevCode)
                .Select(m => new { m.Ein, At = m.DecidedAt ?? m.CreatedAt })
                .ToListAsync(ct))
            .GroupBy(m => m.Ein).ToDictionary(g => g.Key, g => g.Min(m => m.At));
        var real = joined.Keys.ToList();

        var posts = await db.Listings.AsNoTracking()
            .Where(l => real.Contains(l.OrgEin))
            .Select(l => new { l.Id, l.Kind, l.OrgEin, l.CreatedAt })
            .ToListAsync(ct);

        var threads = (await db.Matches.AsNoTracking()
                .Where(m => real.Contains(m.NeedListing!.OrgEin) && real.Contains(m.OfferListing!.OrgEin))
                .Select(m => new
                {
                    m.NeedListingId, m.OfferListingId, NeedEin = m.NeedListing!.OrgEin, OfferEin = m.OfferListing!.OrgEin,
                    m.ProposedByEin, m.Status, m.CreatedAt, m.RespondedAt, m.CompletedAt,
                    StartedBy = db.Accounts.Where(a => a.Id == m.StartedByAccountId).Select(a => a.Email).FirstOrDefault(),
                    FirstReply = m.Messages.Where(x => x.SenderEin != m.ProposedByEin).Min(x => (DateTime?)x.SentAt),
                })
                .ToListAsync(ct))
            .Where(t => !options.IsAdmin(t.StartedBy))
            .ToList();

        // Posts: those 14 days old, or younger with a thread already. Got one: a thread within 14 days of posting.
        var firstThreadByPost = threads
            .SelectMany(t => new[] { (Post: t.NeedListingId, t.CreatedAt), (Post: t.OfferListingId, t.CreatedAt) })
            .GroupBy(x => x.Post).ToDictionary(g => g.Key, g => g.Min(x => x.CreatedAt));
        var postsDue = posts.Where(p => firstThreadByPost.ContainsKey(p.Id) || p.CreatedAt <= asOfUtc.AddDays(-ThreadWithinDays)).ToList();
        var withThread = postsDue.Count(p => firstThreadByPost.TryGetValue(p.Id, out var at) && at <= p.CreatedAt.AddDays(ThreadWithinDays));

        // First answer: the other organization's yes or first message, whichever came first.
        var waits = threads
            .Select(t =>
            {
                DateTime? yes = t.Status is MatchStatus.Accepted or MatchStatus.Completed ? t.RespondedAt : null;
                var answer = new[] { yes, t.FirstReply }.Where(d => d is not null).Min();
                return answer is { } at ? (at - t.CreatedAt).TotalMinutes : (double?)null;
            })
            .OfType<double>().Order().ToList();

        // Became golden, out of threads that are over: done, declined, cancelled, or still open after 30 days.
        var settled = threads.Count(t => t.Status is MatchStatus.Completed or MatchStatus.Declined or MatchStatus.Cancelled
                                         || t.CreatedAt <= asOfUtc.AddDays(-OpenCountsAfterDays));
        var golden = threads.Where(t => t.Status == MatchStatus.Completed).ToList();

        // A need and an offer in the first week, out of organizations whose first week is over or that already posted both.
        var postsByOrg = posts.ToLookup(p => p.OrgEin);
        bool BothBy(string ein, DateTime by) =>
            postsByOrg[ein].Any(p => p.Kind == ListingKind.Need && p.CreatedAt <= by) && postsByOrg[ein].Any(p => p.Kind == ListingKind.Offer && p.CreatedAt <= by);
        var orgsDue = joined.Where(j => j.Value <= asOfUtc.AddDays(-FirstWeekDays) || BothBy(j.Key, asOfUtc)).ToList();
        var bothInWeek = orgsDue.Count(j => BothBy(j.Key, j.Value.AddDays(FirstWeekDays)));

        // Given and received: the offer side of one golden thread and the need side of another.
        var gave = golden.Select(t => t.OfferEin).ToHashSet();
        var both = golden.Select(t => t.NeedEin).Distinct().Count(gave.Contains);

        var pacific = Pacific();
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(asOfUtc, DateTimeKind.Utc), pacific);
        var thisMonth = golden.Count(t => t.CompletedAt is { } done
            && TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(done, DateTimeKind.Utc), pacific) is var local
            && local.Year == nowLocal.Year && local.Month == nowLocal.Month);

        return new AlphaNumbersDto(
            posts.Count, threads.Count, threads.Count(t => t.Status is MatchStatus.Accepted or MatchStatus.Completed), golden.Count,
            thisMonth, nowLocal.ToString("MMMM", System.Globalization.CultureInfo.InvariantCulture),
            new Ratio(withThread, postsDue.Count), Median(waits), new Ratio(golden.Count, settled),
            new Ratio(bothInWeek, orgsDue.Count), new Ratio(both, joined.Count));
    }

    /// <summary>The middle wait, rounded to the minute: half answered faster, half slower.</summary>
    private static int? Median(List<double> sorted)
    {
        if (sorted.Count == 0) return null;
        var mid = sorted.Count / 2;
        return (int)Math.Round(sorted.Count % 2 == 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
    }

    private static TimeZoneInfo Pacific()
        => TimeZoneInfo.TryFindSystemTimeZoneById("America/Los_Angeles", out var tz) ? tz : TimeZoneInfo.FindSystemTimeZoneById("Pacific Standard Time");
}
