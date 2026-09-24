namespace WaNonprofitConnect.Data.Exchange;

/// <summary>"Who they serve" (S-88, approved Sep 24). The same 12 names, in the same order, as app/src/lib/serve.ts.</summary>
public static class ServeGroups
{
    public static readonly IReadOnlyList<string> All = new[]
    {
        "Children and youth", "Education", "Food", "Housing", "Health", "Families", "The elderly", "Veterans",
        "Communities facing barriers", "Environment", "Animals", "Arts and culture",
    };

    /// <summary>Known names only, in the canonical order, without duplicates.</summary>
    public static IReadOnlyList<string> Clean(IEnumerable<string>? groups)
    {
        var set = (groups ?? Array.Empty<string>()).ToHashSet(StringComparer.Ordinal);
        return All.Where(set.Contains).ToList();
    }
}

/// <summary>An organization's saved filters. Serve is null when it has never saved (the app starts from the cause code).</summary>
public sealed record FiltersDto(IReadOnlyList<string>? Serve);

public sealed class SaveFiltersRequest
{
    public List<string> Serve { get; set; } = new();
}
