using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// Pure scoring of a Need against an Offer. Kept free of I/O so the weights can be unit-tested and tuned.
/// Score is 0–~170; anything below <see cref="MinimumScore"/> is not worth surfacing.
/// </summary>
public static class MatchScorer
{
    public const int MinimumScore = 15;

    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "A", "AN", "AND", "ANY", "ARE", "AS", "AT", "BE", "BY", "FOR", "FROM", "HAVE", "HAS", "IN", "IS", "IT", "NEED",
        "NEEDS", "NEEDED", "OF", "ON", "OR", "OUR", "SOME", "SPARE", "SURPLUS", "EXTRA", "THE", "TO", "WE", "WITH",
        "LOOKING", "WANT", "WANTED", "OFFER", "OFFERING", "DONATE", "DONATION", "FREE", "PLEASE", "NEW", "USED", "GOOD",
    };

    /// <summary>Normalized, de-duplicated keyword set from title + description + tags.</summary>
    public static string BuildSearchText(string title, string? description, string? tags)
    {
        var raw = string.Join(' ', title, description ?? string.Empty, (tags ?? string.Empty).Replace(',', ' '));
        return string.Join(' ', Tokens(BmfRowParser.Normalize(raw)));
    }

    public static IReadOnlyList<string> Tokens(string normalizedText)
        => normalizedText.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 3 && !StopWords.Contains(t))
            .Select(Stem)
            .Distinct(StringComparer.Ordinal)
            .ToList();

    /// <summary>Very light stemming: LAPTOPS→LAPTOP, SHEETS→SHEET, BOXES→BOX. Good enough for matching, not linguistics.</summary>
    public static string Stem(string token)
    {
        if (token.Length > 4 && token.EndsWith("IES", StringComparison.Ordinal)) return token[..^3] + "Y";
        if (token.Length > 4 && token.EndsWith("ES", StringComparison.Ordinal) && (token.EndsWith("XES") || token.EndsWith("SES") || token.EndsWith("CHES") || token.EndsWith("SHES"))) return token[..^2];
        if (token.Length > 3 && token.EndsWith('S') && !token.EndsWith("SS", StringComparison.Ordinal)) return token[..^1];
        return token;
    }

    public static MatchScore Score(Listing need, Listing offer, DateTime? now = null)
    {
        if (need.Kind != ListingKind.Need || offer.Kind != ListingKind.Offer)
            throw new ArgumentException("Score expects a Need and an Offer, in that order.");

        var reasons = new List<string>();
        var score = 0;

        // Same kind of help is the primary signal (+50). The older category still earns the same 50 when kinds of
        // help differ or aren't set, but never for the catch-all Other (every alpha listing carries it). They never stack.
        if (need.Help != 0 && need.Help == offer.Help)
        {
            score += 50;
            reasons.Add($"same kind of help ({need.Help})");
        }
        else if (need.Category == offer.Category && need.Category != ListingCategory.Other)
        {
            score += 50;
            reasons.Add($"same category ({need.Category})");
        }

        var needTokens = Tokens(need.SearchText).ToHashSet(StringComparer.Ordinal);
        var shared = Tokens(offer.SearchText).Where(needTokens.Contains).ToList();
        if (shared.Count > 0)
        {
            // First keyword hit is worth more than a same-city bonus; extra hits add less.
            var kw = Math.Min(60, 25 + 10 * (shared.Count - 1));
            score += kw;
            reasons.Add($"shared keywords: {string.Join(", ", shared.Take(5).Select(s => s.ToLowerInvariant()))}");
        }

        if (need.City is not null && string.Equals(need.City, offer.City, StringComparison.OrdinalIgnoreCase))
        {
            score += 20;
            reasons.Add($"same city ({need.City})");
        }
        else if (need.Zip5 is { Length: 5 } nz && offer.Zip5 is { Length: 5 } oz && nz[..3] == oz[..3])
        {
            score += 10;
            reasons.Add("same area (zip prefix)");
        }

        switch (need.Urgency)
        {
            case Urgency.Critical: score += 10; reasons.Add("need is critical"); break;
            case Urgency.High: score += 5; reasons.Add("need is high urgency"); break;
        }

        if (need.Quantity is { } nq && offer.Quantity is { } oq && nq > 0)
        {
            if (oq >= nq) { score += 10; reasons.Add("offer covers full quantity"); }
            else if (oq > 0) { score += 5; reasons.Add($"offer covers {Math.Round(100 * oq / nq)}% of quantity"); }
        }

        var t = now ?? DateTime.UtcNow;
        if ((t - offer.CreatedAt).TotalDays <= 30) score += 5;

        return new MatchScore(score, reasons, shared.Count);
    }
}

/// <param name="Shared">How many words the two posts have in common (after stop words and plurals).</param>
public sealed record MatchScore(int Score, IReadOnlyList<string> Reasons, int Shared = 0)
{
    /// <summary>
    /// Worth showing a person as "could fit": a good enough score and at least one word in common. Same kind of help
    /// alone isn't enough; it paired canned vegetables with a laptop need (Taylor, Sep 24).
    /// </summary>
    public bool IsFit => Score >= MatchScorer.MinimumScore && Shared > 0;
}
