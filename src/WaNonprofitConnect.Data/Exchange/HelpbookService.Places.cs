using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

public sealed partial class HelpbookService
{
    public const int MaxPlaceOrgs = 50;

    /// <summary>
    /// Every organization inside a place (S-144): each Washington 501(c)(3) whose dot is inside the outline, plus any organization
    /// with a pin whose pin is. Decided by the same point the map draws, so the list and the map agree.
    /// </summary>
    public async Task<IReadOnlyList<string>> PlaceEinsAsync(Places.Place place, CancellationToken ct = default)
    {
        var inside = (await MapPointsAsync(ct)).Where(p => place.Contains(p.Lat, p.Lon)).Select(p => p.Ein).ToHashSet();
        var joined = (await JoinedEinsAsync(ct)).Where(e => !inside.Contains(e)).ToList();
        if (joined.Count > 0)
        {
            var orgs = await _db.Organizations.AsNoTracking().Where(o => joined.Contains(o.Ein)).ToListAsync(ct);
            foreach (var s in (await OrgSummariesAsync(orgs, ct)).Values)
                if (s.Lat is { } lat && s.Lon is { } lon && place.Contains(lat, lon)) inside.Add(s.Ein);
        }
        return inside.Order(StringComparer.Ordinal).ToList();
    }

    /// <summary>A page of the organizations in <paramref name="eins"/> (from <see cref="PlaceEinsAsync"/>): joined first, then A to Z.</summary>
    public async Task<PlaceOrgsDto> PlaceOrgsAsync(Places.Place place, IReadOnlyCollection<string> eins, int skip, int take, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, MaxPlaceOrgs);
        skip = Math.Max(0, skip);
        var now = DateTime.UtcNow;
        var all = eins.ToList();
        var counts = (await OpenListings(now).Where(l => all.Contains(l.OrgEin)).GroupBy(l => new { l.OrgEin, l.Kind })
                .Select(g => new { g.Key.OrgEin, g.Key.Kind, N = g.Count() }).ToListAsync(ct))
            .GroupBy(x => x.OrgEin)
            .ToDictionary(g => g.Key, g => (Needs: g.Where(x => x.Kind == ListingKind.Need).Sum(x => x.N), Offers: g.Where(x => x.Kind == ListingKind.Offer).Sum(x => x.N)));
        var members = (await _db.Memberships.AsNoTracking().Where(m => m.Status == MembershipStatus.Confirmed && all.Contains(m.Ein))
            .Select(m => m.Ein).Distinct().ToListAsync(ct)).ToHashSet();
        var names = await _db.Organizations.AsNoTracking().Where(o => all.Contains(o.Ein)).Select(o => new { o.Ein, o.Name }).ToListAsync(ct);

        var ordered = names
            .Select(o => (o.Ein, Name: OrgName.Display(o.Name), Joined: members.Contains(o.Ein) || counts.ContainsKey(o.Ein),
                Open: counts.TryGetValue(o.Ein, out var c) ? c : (Needs: 0, Offers: 0)))
            .OrderByDescending(o => o.Joined)
            .ThenByDescending(o => o.Open.Needs + o.Open.Offers)
            .ThenBy(o => o.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(o => o.Ein, StringComparer.Ordinal)
            .ToList();
        var page = ordered.Skip(skip).Take(take).ToList();
        var pageEins = page.Select(o => o.Ein).ToList();
        var orgs = await _db.Organizations.AsNoTracking().Where(o => pageEins.Contains(o.Ein)).ToListAsync(ct);
        var summaries = await OrgSummariesAsync(orgs, ct);
        return new PlaceOrgsDto(place.Id, place.Name, ordered.Count, ordered.Count(o => o.Joined),
            page.Select(o => new PlaceOrgDto(summaries[o.Ein], o.Open.Needs, o.Open.Offers)).ToList());
    }

    /// <summary>Organizations with a pin: a confirmed person, or an open post.</summary>
    private async Task<IReadOnlyList<string>> JoinedEinsAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var members = await _db.Memberships.AsNoTracking().Where(m => m.Status == MembershipStatus.Confirmed).Select(m => m.Ein).Distinct().ToListAsync(ct);
        var posting = await OpenListings(now).Select(l => l.OrgEin).Distinct().ToListAsync(ct);
        return members.Concat(posting).Distinct().ToList();
    }
}
