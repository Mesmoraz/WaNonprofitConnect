using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// Fair ranking for the board, kept pure so it can be tested and explained:
/// urgent first (Critical, then High, then the rest), then whoever has been seen least, then newest.
/// No organization gets more than 2 of the top 6 while others are waiting. Placement can't be bought.
/// </summary>
public static class BoardRanking
{
    public const int TopSlots = 6;
    public const int MaxPerOrgInTop = 2;
    /// <summary>Listings in these first positions count a view each time another organization loads the board.</summary>
    public const int CountedPositions = 12;
    /// <summary>Younger than this, and not urgent, a card says "New".</summary>
    public const int NewDays = 7;

    public static int Band(Urgency u) => u switch { Urgency.Critical => 0, Urgency.High => 1, _ => 2 };

    public static IReadOnlyList<Listing> Rank(IEnumerable<Listing> listings)
    {
        var sorted = listings
            .OrderBy(l => Band(l.Urgency))
            .ThenBy(l => l.Views)
            .ThenByDescending(l => l.CreatedAt)
            .ThenByDescending(l => l.Id)
            .ToList();

        // Fill the top 6, skipping an org's third and later listing. Skipped ones keep their order right after.
        var top = new List<Listing>(TopSlots);
        var perOrg = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var l in sorted)
        {
            if (top.Count == TopSlots) break;
            var n = perOrg.GetValueOrDefault(l.OrgEin);
            if (n >= MaxPerOrgInTop) continue;
            perOrg[l.OrgEin] = n + 1;
            top.Add(l);
        }

        var inTop = top.Select(l => l.Id).ToHashSet();
        return top.Concat(sorted.Where(l => !inTop.Contains(l.Id))).ToList();
    }

    /// <summary>One line in plain words for the card (docs/VOICE.md): why it's where it is.</summary>
    public static string Why(Listing l, DateTime now) => l.Urgency switch
    {
        Urgency.Critical => "Urgent",
        Urgency.High => "This week",
        _ when (now - l.CreatedAt).TotalDays <= NewDays => "New",
        _ => "Seen least",
    };
}
