using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

public sealed partial class HelpbookService
{
    public const int MaxSuggested = 40;
    public const int MaxMapFits = 12;

    /// <summary>
    /// Every open need and offer, each with its organization and place (S-131): the map counts what's in view, lists it, and
    /// filters it by kind of help. Open posts are on the board for everyone signed in, so these are too. Newest first, up to 500.
    /// </summary>
    public async Task<IReadOnlyList<ListingViewDto>> MapOpenAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var open = await OpenListings(now).OrderByDescending(l => l.CreatedAt).Take(MaxCandidates).ToListAsync(ct);
        var orgs = await OrgSummariesAsync(open.Select(l => l.Org!).DistinctBy(o => o.Ein), ct);
        return open.Select(l => View(l, orgs, now)).ToList();
    }

    /// <summary>
    /// What fits your organization, for the map's toggles (S-130): with <paramref name="forNeeds"/>, other organizations' open
    /// offers that fit one of your open needs; otherwise their open needs that one of your offers fits. Each post once, paired
    /// with the post of yours it fits best; posts already in a thread together are left out. Best fit first, up to 12.
    /// </summary>
    public async Task<IReadOnlyList<MapFitDto>> MapFitsAsync(string ein, bool forNeeds, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var mineKind = forNeeds ? ListingKind.Need : ListingKind.Offer;
        var theirKind = forNeeds ? ListingKind.Offer : ListingKind.Need;
        var mine = await OpenListings(now).Where(l => l.OrgEin == ein && l.Kind == mineKind).ToListAsync(ct);
        if (mine.Count == 0) return [];
        var theirs = await OpenListings(now).Where(l => l.OrgEin != ein && l.Kind == theirKind)
            .OrderByDescending(l => l.CreatedAt).Take(MaxCandidates).ToListAsync(ct);
        var mineIds = mine.Select(l => l.Id).ToList();
        var paired = (await _db.Matches.AsNoTracking()
                .Where(m => mineIds.Contains(m.NeedListingId) || mineIds.Contains(m.OfferListingId))
                .Select(m => new { m.NeedListingId, m.OfferListingId }).ToListAsync(ct))
            .Select(p => (p.NeedListingId, p.OfferListingId)).ToHashSet();

        var fits = new List<(Listing Mine, Listing Theirs, int Score)>();
        foreach (var t in theirs)
        {
            var best = mine
                .Select(m => (Mine: m, Need: forNeeds ? m : t, Offer: forNeeds ? t : m))
                .Where(x => !paired.Contains((x.Need.Id, x.Offer.Id)))
                .Select(x => (x.Mine, Match: MatchScorer.Score(x.Need, x.Offer, now)))
                .Where(x => x.Match.IsFit)
                .OrderByDescending(x => x.Match.Score)
                .FirstOrDefault();
            if (best.Mine is not null) fits.Add((best.Mine, t, best.Match.Score));
        }
        var top = fits.OrderByDescending(f => f.Score).ThenByDescending(f => f.Theirs.CreatedAt).Take(MaxMapFits).ToList();
        var orgs = await OrgSummariesAsync(top.Select(f => f.Theirs.Org!), ct);
        return top.Select(f => new MapFitDto(f.Mine.Id, f.Mine.Title, View(f.Theirs, orgs, now))).ToList();
    }

    /// <summary>
    /// What the map draws: member pins (orgs with a confirmed person or an open post, plus anyone in a thread),
    /// threads that are live or golden (not declined or cancelled), up to 40 suggested threads (the best fit for each open need),
    /// and every organization's count of open needs and offers (S-129). Open posts are on the board for everyone, so the counts are too.
    /// Someone not confirmed yet (<paramref name="confirmed"/> false) gets the pins only, no threads or suggestions: who is talking to whom, and
    /// about what, is for members (S-114). No screen before confirmation shows the map.
    /// </summary>
    public async Task<MapDataDto> MapAsync(bool confirmed = true, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var threads = await _db.Matches.AsNoTracking()
            .Where(m => confirmed && m.Status != MatchStatus.Declined && m.Status != MatchStatus.Cancelled)
            .Select(m => new
            {
                m.Id, m.Status, NeedHelp = m.NeedListing!.Help, NeedTitle = m.NeedListing.Title,
                m.NeedListingId, m.OfferListingId, OfferTitle = m.OfferListing!.Title,
                FromEin = m.OfferListing!.OrgEin, ToEin = m.NeedListing.OrgEin,
            })
            .ToListAsync(ct);

        var open = await OpenListings(now).OrderByDescending(l => l.CreatedAt).Take(MaxCandidates * 2).ToListAsync(ct);
        var openCounts = (await OpenListings(now).GroupBy(l => new { l.OrgEin, l.Kind })
                .Select(g => new { g.Key.OrgEin, g.Key.Kind, N = g.Count() }).ToListAsync(ct))
            .GroupBy(x => x.OrgEin)
            .Select(g => new MapOpenDto(g.Key, g.Where(x => x.Kind == ListingKind.Need).Sum(x => x.N), g.Where(x => x.Kind == ListingKind.Offer).Sum(x => x.N)))
            .OrderBy(o => o.Ein).ToList();
        var memberEins = await _db.Memberships.AsNoTracking().Where(m => m.Status == MembershipStatus.Confirmed).Select(m => m.Ein).Distinct().ToListAsync(ct);
        var eins = memberEins.Concat(openCounts.Select(o => o.Ein)).Concat(threads.SelectMany(t => new[] { t.FromEin, t.ToEin })).ToHashSet();
        var orgs = await _db.Organizations.AsNoTracking().Where(o => eins.Contains(o.Ein)).ToListAsync(ct);
        var summaries = await OrgSummariesAsync(orgs, ct);

        var paired = (await _db.Matches.AsNoTracking().Select(m => new { m.NeedListingId, m.OfferListingId }).ToListAsync(ct))
            .Select(p => (p.NeedListingId, p.OfferListingId)).ToHashSet();
        var offers = open.Where(l => l.Kind == ListingKind.Offer).ToList();
        var suggested = new List<(Listing Need, Listing Offer, int Score)>();
        foreach (var need in open.Where(l => confirmed && l.Kind == ListingKind.Need))
        {
            var best = offers
                .Where(o => o.OrgEin != need.OrgEin && !paired.Contains((need.Id, o.Id)))
                .Select(o => (Offer: o, Match: MatchScorer.Score(need, o, now)))
                .Where(x => x.Match.IsFit)
                .Select(x => (x.Offer, Score: x.Match.Score))
                .OrderByDescending(x => x.Score).ThenByDescending(x => x.Offer.CreatedAt)
                .FirstOrDefault();
            if (best.Offer is not null) suggested.Add((need, best.Offer, best.Score));
        }

        return new MapDataDto(
            orgs.OrderBy(o => o.Name).Select(o => summaries[o.Ein]).ToList(),
            threads.Select(t => new MapThreadDto(t.Id, t.Status, t.NeedHelp == 0 ? KindOfHelp.Things : t.NeedHelp, t.FromEin, t.ToEin, t.NeedTitle,
                t.NeedListingId, t.OfferListingId, t.OfferTitle)).ToList(),
            suggested.OrderByDescending(s => s.Score).ThenByDescending(s => s.Need.CreatedAt).Take(MaxSuggested)
                .Select(s => new MapSuggestionDto(s.Need.Id, s.Offer.Id, s.Offer.OrgEin, s.Need.OrgEin)).ToList(),
            openCounts);
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
        var profile = await _db.OrgProfiles.AsNoTracking().Where(p => p.Ein == ein)
            .Select(p => new
            {
                p.About, p.Website,
                // Only while that person is still confirmed here: "Test as this organization" moves a membership.
                Contact = p.Contact != null && p.Contact.Membership != null && p.Contact.Membership.Ein == ein
                          && p.Contact.Membership.Status == MembershipStatus.Confirmed ? p.Contact.Name : null,
            })
            .FirstOrDefaultAsync(ct);
        return new OrgPageDto(summaries[ein], listings.Select(l => View(l, summaries, now)).ToList(),
            statuses.Count(s => s == MatchStatus.Completed),
            statuses.Count(s => s is MatchStatus.Proposed or MatchStatus.Accepted),
            profile?.About, profile?.Website, Accounts.OrgProfileService.FirstName(profile?.Contact));
    }

    /// <summary>An organization's saved filters, or Serve = null when it has none yet.</summary>
    public async Task<FiltersDto> GetFiltersAsync(string ein, CancellationToken ct = default)
    {
        var p = await _db.OrgPreferences.AsNoTracking().FirstOrDefaultAsync(x => x.Ein == ein, ct);
        return new FiltersDto(p is null ? null : ServeGroups.Clean(p.Serve.Split(',', StringSplitOptions.RemoveEmptyEntries)));
    }

    /// <summary>Save an organization's "Who they serve" picks. Unknown names are dropped; an empty list means "show everything".</summary>
    public async Task<FiltersDto> SaveFiltersAsync(string ein, IEnumerable<string>? serve, string byEmail, CancellationToken ct = default)
    {
        if (!await _db.Organizations.AnyAsync(o => o.Ein == ein, ct)) throw ExchangeException.NotFound("We can't find that organization.");
        var clean = ServeGroups.Clean(serve);
        var p = await _db.OrgPreferences.FirstOrDefaultAsync(x => x.Ein == ein, ct);
        if (p is null) { p = new OrgPreference { Ein = ein }; _db.OrgPreferences.Add(p); }
        p.Serve = string.Join(',', clean);
        p.UpdatedAt = DateTime.UtcNow;
        p.UpdatedBy = byEmail;
        await _db.SaveChangesAsync(ct);
        return new FiltersDto(clean);
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
