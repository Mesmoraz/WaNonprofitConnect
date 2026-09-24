using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

public sealed partial class HelpbookService
{
    public const int MaxSuggested = 40;

    /// <summary>
    /// What the map draws: member pins (orgs with a confirmed person or an open post, plus anyone in a thread),
    /// threads that are live or golden (not declined or cancelled), and up to 40 suggested threads: the best fit for each open need.
    /// </summary>
    public async Task<MapDataDto> MapAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var threads = await _db.Matches.AsNoTracking()
            .Where(m => m.Status != MatchStatus.Declined && m.Status != MatchStatus.Cancelled)
            .Select(m => new
            {
                m.Id, m.Status, NeedHelp = m.NeedListing!.Help, NeedTitle = m.NeedListing.Title,
                m.NeedListingId, m.OfferListingId, OfferTitle = m.OfferListing!.Title,
                FromEin = m.OfferListing!.OrgEin, ToEin = m.NeedListing.OrgEin,
            })
            .ToListAsync(ct);

        var open = await OpenListings(now).OrderByDescending(l => l.CreatedAt).Take(MaxCandidates * 2).ToListAsync(ct);
        var memberEins = await _db.Memberships.AsNoTracking().Where(m => m.Status == MembershipStatus.Confirmed).Select(m => m.Ein).Distinct().ToListAsync(ct);
        var eins = memberEins.Concat(open.Select(l => l.OrgEin)).Concat(threads.SelectMany(t => new[] { t.FromEin, t.ToEin })).ToHashSet();
        var orgs = await _db.Organizations.AsNoTracking().Where(o => eins.Contains(o.Ein)).ToListAsync(ct);
        var summaries = await OrgSummariesAsync(orgs, ct);

        var paired = (await _db.Matches.AsNoTracking().Select(m => new { m.NeedListingId, m.OfferListingId }).ToListAsync(ct))
            .Select(p => (p.NeedListingId, p.OfferListingId)).ToHashSet();
        var offers = open.Where(l => l.Kind == ListingKind.Offer).ToList();
        var suggested = new List<(Listing Need, Listing Offer, int Score)>();
        foreach (var need in open.Where(l => l.Kind == ListingKind.Need))
        {
            var best = offers
                .Where(o => o.OrgEin != need.OrgEin && !paired.Contains((need.Id, o.Id)))
                .Select(o => (Offer: o, Score: MatchScorer.Score(need, o, now).Score))
                .Where(x => x.Score >= MatchScorer.MinimumScore)
                .OrderByDescending(x => x.Score).ThenByDescending(x => x.Offer.CreatedAt)
                .FirstOrDefault();
            if (best.Offer is not null) suggested.Add((need, best.Offer, best.Score));
        }

        return new MapDataDto(
            orgs.OrderBy(o => o.Name).Select(o => summaries[o.Ein]).ToList(),
            threads.Select(t => new MapThreadDto(t.Id, t.Status, t.NeedHelp == 0 ? KindOfHelp.Things : t.NeedHelp, t.FromEin, t.ToEin, t.NeedTitle,
                t.NeedListingId, t.OfferListingId, t.OfferTitle)).ToList(),
            suggested.OrderByDescending(s => s.Score).ThenByDescending(s => s.Need.CreatedAt).Take(MaxSuggested)
                .Select(s => new MapSuggestionDto(s.Need.Id, s.Offer.Id, s.Offer.OrgEin, s.Need.OrgEin)).ToList());
    }

    /// <summary>Every Washington 501(c)(3) that has a ZIP centroid, as (ein, lat, lon). Projects only those columns: ~35k rows.</summary>
    /// <summary>An organization's page (tapping it on the map): its card, open posts, and thread counts. Null for an unknown EIN.</summary>
    public async Task<OrgPageDto?> OrgPageAsync(string ein, CancellationToken ct = default)
    {
        var org = await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Ein == ein, ct);
        if (org is null) return null;
        var now = DateTime.UtcNow;
        var listings = await OpenListings(now).Where(l => l.OrgEin == ein).OrderByDescending(l => l.CreatedAt).Take(50).ToListAsync(ct);
        var summaries = await OrgSummariesAsync(new[] { org }, ct);
        var statuses = await _db.Matches.AsNoTracking()
            .Where(m => m.NeedListing!.OrgEin == ein || m.OfferListing!.OrgEin == ein)
            .Select(m => m.Status).ToListAsync(ct);
        return new OrgPageDto(summaries[ein], listings.Select(l => View(l, summaries, now)).ToList(),
            statuses.Count(s => s == MatchStatus.Completed),
            statuses.Count(s => s is MatchStatus.Proposed or MatchStatus.Accepted));
    }

    public async Task<IReadOnlyList<(string Ein, double Lat, double Lon)>> MapPointsAsync(CancellationToken ct = default)
    {
        // Street address when the geocoder matched it. Without the file (tests, a fresh clone), the ZIP's center.
        // With it, unmatched ones (mostly PO boxes) are left off: a ZIP center piles 100+ dots on one spot.
        var orgs = await _db.Organizations.AsNoTracking()
            .Where(o => o.State == "WA" && o.Is501c3)
            .OrderBy(o => o.Ein)
            .Select(o => new { o.Ein, o.Zip5 })
            .ToListAsync(ct);
        var centroids = await _db.ZipCentroids.AsNoTracking().ToDictionaryAsync(z => z.Zip5, z => (z.Lat, z.Lon), ct);
        var points = new List<(string, double, double)>(orgs.Count);
        foreach (var o in orgs)
        {
            if (OrgLocations.TryGet(o.Ein, out var at)) points.Add((o.Ein, at.Lat, at.Lon));
            else if (OrgLocations.Count == 0 && o.Zip5 is not null && centroids.TryGetValue(o.Zip5, out var c)) points.Add((o.Ein, c.Lat, c.Lon));
        }
        return points;
    }

    private async Task<IReadOnlyDictionary<string, (double Lat, double Lon)>> CentroidsAsync(IEnumerable<string?> zips, CancellationToken ct)
    {
        var wanted = zips.Where(z => z is { Length: 5 }).Select(z => z!).Distinct().ToList();
        if (wanted.Count == 0) return new Dictionary<string, (double Lat, double Lon)>();
        return await _db.ZipCentroids.AsNoTracking()
            .Where(z => wanted.Contains(z.Zip5))
            .ToDictionaryAsync(z => z.Zip5, z => (z.Lat, z.Lon), ct);
    }
}
