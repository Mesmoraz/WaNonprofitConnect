namespace WaNonprofitConnect.Data.Codes;

/// <summary>
/// Decoding for OSPI's school feed. The one thing screens need from it is the shared org shape's
/// <c>sub</c> label for a school, derived from OSPI's GradeCategory (docs/TAXONOMY.md, "A school or district").
/// Values seen in the feed as of 2026-09: Elementary School, Middle School, Jr High, High School, K-12, PK-12, PK Only, Other.
/// </summary>
public static class OspiCodes
{
    public const string SubDistrict = "District";
    public const string SubOther = "Other";

    /// <summary>OSPI GradeCategory → app "sub" label. Anything not listed (incl. "PK Only", "Other", null) → <see cref="SubOther"/>.</summary>
    public static readonly IReadOnlyDictionary<string, string> SubByGradeCategory = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["High School"] = "High school",
        ["Middle School"] = "Middle school",
        ["Jr High"] = "Middle school",
        ["Elementary School"] = "Elementary school",
        ["K-12"] = "K-12",
        ["PK-12"] = "K-12",
    };

    /// <summary>Display order for the sub labels, matching the prototype's seed file.</summary>
    public static readonly IReadOnlyList<string> SubOrder = new[] { "High school", "Middle school", "Elementary school", "K-12", SubOther };

    public static string SubLabel(string? gradeCategory)
        => gradeCategory is not null && SubByGradeCategory.TryGetValue(gradeCategory.Trim(), out var v) ? v : SubOther;
}
