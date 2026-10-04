using System.Text;
using System.Text.RegularExpressions;

namespace WaNonprofitConnect.Data;

/// <summary>
/// How an organization's name reads on screen (S-98). The IRS list is all capitals; the database keeps it that way
/// for matching and imports, and every API response that carries a name passes it through <see cref="Display"/>.
/// </summary>
/// <remarks>
/// The rules, in order:
/// <list type="number">
/// <item>A name that already has a lower-case letter is someone's own spelling and comes back unchanged.</item>
/// <item>"@" (the IRS uses it in place of a space in a few names) becomes a space.</item>
/// <item>Known acronyms stay capitals (<see cref="Acronyms"/>), as do roman numerals (II, III, IV) and single letters
/// ("Northwest Harvest E M M").</item>
/// <item>A word of 2 to 5 letters with no vowel (Y counts as one) is read as an acronym and stays capitals (NW, PNW, VFW,
/// LLC, BMX), except the short forms in <see cref="Abbreviations"/>, which read as words (St, Mt, Jr, Ctr, Ltd).</item>
/// <item>Small words (a, an, and, at, by, for, from, in, of, on, or, the, to, with, de, del, y) are lower case, except
/// first, last or right after a dash. "A" and "Y" stay capitals among initials ("Harry S Truman P T A") and as a middle
/// initial before a surname and Foundation, Trust, Fund and the like ("Barbara A Stone Foundation").</item>
/// <item>"US" is the country (capitals) unless it follows a word that makes it the pronoun (Help Us, Just Us, With Us,
/// Before Us, Lets Us, R Us, and "Of Us" at the end).</item>
/// <item>"CASA" is the court advocates program (capitals) next to County, Law, "of" or GAL; otherwise it is Spanish (Casa de Dios).</item>
/// <item>Every other word is title case, each part of a hyphen or slash too (Tacoma-Pierce), with these touches:
/// Mc names (McDonald), O'/D'/L' names (O'Brien), possessives (Children's), ordinals (1st, 2nd), digits followed by
/// letters keep their capitals (4H, 501C3), letters after digits start a new word (Mantra4Change), and short
/// ampersand codes stay capitals (B&amp;B, PB&amp;J).</item>
/// <item>A lone S that stands for a lost apostrophe joins the word before it (POTTER S HOUSE reads Potter's House);
/// see <c>IsLostApostrophe</c>.</item>
/// </list>
/// Not handled on purpose: "Mac" names (MACDONALD reads Macdonald, so MACHINE stays Machine).
/// </remarks>
public static class OrgName
{
    /// <summary>Acronyms that contain a vowel, so the no-vowel rule can't find them. Seen in the WA IRS list or common in WA.</summary>
    public static readonly IReadOnlySet<string> Acronyms = new HashSet<string>(StringComparer.Ordinal)
    {
        "AA", "AARP", "ACLU", "AFL", "AI", "AIDS", "AAU", "BIPOC", "BSA", "CIO", "CSSA", "CWU", "DAV", "DBA", "DECA", "EAA",
        "EHS", "EMS", "ESD", "ESL", "EWU", "FBO", "FFA", "GED", "HIV", "HOA", "IAFF", "IBEW", "ILWU", "JROTC", "KEXP",
        "KUOW", "LGBT", "LGBTQ", "LGBTQIA", "NAACP", "NAMI", "NASA", "NE", "NECA", "NOAA", "NPO", "PFLAG", "PTA", "PTO",
        "PTSA", "PTSO", "ROTC", "SDA", "SE", "SEIU", "SPCA", "SPU", "STEM", "UFCW", "USA", "USO", "USS", "UW",
        "VEBA", "WA", "WEA", "WSU", "WWU", "YMCA", "YWAM", "YWCA",
    };

    /// <summary>No-vowel short forms that read as words, not acronyms.</summary>
    public static readonly IReadOnlySet<string> Abbreviations = new HashSet<string>(StringComparer.Ordinal)
    {
        "BLDG", "BLDRS", "BLVD", "BNFT", "CH", "CHPT", "CHR", "CLB", "CNTY", "CTR", "CTRL", "DR", "FDN", "FLWSHP", "FND",
        "FNDN", "FRGRS", "FT", "HLPR", "HWY", "JR", "LTD", "MGMT", "MGT", "MT", "MTN", "PKWY", "SGT", "SR", "ST", "SVC",
        "SVCS", "TR", "TRST", "WM",
    };

    private static readonly HashSet<string> Small = new(StringComparer.Ordinal)
    {
        "A", "AN", "AND", "AT", "BY", "FOR", "FROM", "IN", "OF", "ON", "OR", "THE", "TO", "WITH", "DE", "DEL", "Y",
    };

    /// <summary>Words after which "US" is the pronoun, not the country.</summary>
    private static readonly HashSet<string> BeforePronounUs = new(StringComparer.Ordinal)
    {
        "HELP", "JUST", "LET", "LETS", "WITH", "BEFORE", "ON", "NOT", "BEYOND", "LOVE", "R",
    };

    private static readonly HashSet<string> Possessors = new(StringComparer.Ordinal)
    {
        "CHILD", "CHILDREN", "FATHER", "FISHERMEN", "GOD", "MEN", "MOTHER", "NATURE", "PEOPLE", "WOMEN",
    };

    private static readonly HashSet<string> Owned = new(StringComparer.Ordinal)
    {
        "ARK", "ASSOCIATION", "CLOSET", "CLUB", "FIGHT", "FOUNDATION", "FUND", "HOPE", "HOUSE", "LEGACY", "MEMORIAL",
        "MINISTRIES", "MINISTRY", "MISSION", "PARADISE", "PITS", "PLACE", "PRAYER", "SONG", "WAY", "WORLD",
    };

    /// <summary>Words that follow a person's name in a memorial or family fund ("EDITH A MURBACH CHARITABLE ...").</summary>
    private static readonly HashSet<string> NamedFor = new(StringComparer.Ordinal)
    {
        "CHARITABLE", "ENDOWMENT", "ESTATE", "FAMILY", "FOUNDATION", "FUND", "IRRV", "MEMORIAL", "SCHOLARSHIP", "TR", "TRUST",
    };

    private static readonly Regex Roman = new("^(?=.{2,})X{0,3}(IX|IV|V?I{0,3})$", RegexOptions.CultureInvariant);
    private static readonly Regex Dotted = new(@"^([A-Z]\.)+[A-Z]?$", RegexOptions.CultureInvariant);

    /// <summary>The name as a person reads it. Null and blank come back as they are.</summary>
    public static string Display(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw;
        if (raw.Any(char.IsLower)) return raw;

        var words = raw.Replace('@', ' ').Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var cores = words.Select(w => Core(w).Core is { Length: > 0 } c ? c.ToUpperInvariant() : w).ToArray();
        var output = new List<string>(words.Length);
        for (var i = 0; i < words.Length; i++)
        {
            var (lead, core, trail) = Core(words[i]);
            if (core.Length == 0) { output.Add(words[i]); continue; }
            if (IsLostApostrophe(cores, i)) { output[^1] += "'s" + trail; continue; }
            var prev = i > 0 ? cores[i - 1] : null;
            var next = i < words.Length - 1 ? cores[i + 1] : null;
            var afterNext = i < words.Length - 2 ? cores[i + 2] : null;
            var opensPhrase = i == 0 || prev == "-" || words[i - 1].EndsWith(':');
            var isLast = i == words.Length - 1;
            output.Add(lead + Word(core, prev, next, afterNext, opensPhrase, isLast) + trail);
        }
        return string.Join(' ', output);
    }

    /// <summary>
    /// The IRS list turns an apostrophe into a space: "POTTER S HOUSE". A lone S reads as "'s" when the word before it
    /// is one that owns things (Children, God, Father) or the word after is a thing owned (House, Place, Hope). Otherwise
    /// it stays a middle initial: "MARY S DORE" reads Mary S Dore, not Mary's Dore.
    /// </summary>
    private static bool IsLostApostrophe(string[] cores, int i)
    {
        if (cores[i] != "S" || i == 0 || i == cores.Length - 1) return false;
        string prev = cores[i - 1], next = cores[i + 1];
        if (prev.Length < 2 || next.Length < 2 || Small.Contains(prev) || !prev.All(char.IsLetter)) return false;
        return Possessors.Contains(prev) || Owned.Contains(next);
    }

    private static string Word(string core, string? prev, string? next, string? afterNext, bool opensPhrase, bool isLast)
    {
        if (Small.Contains(core) && !opensPhrase && !isLast)
        {
            if (core.Length > 1) return core.ToLowerInvariant();
            // "A" and "Y" are words ("Youth with a Mission"), unless they sit among initials ("P T A") or are a middle
            // initial before a surname and a word like Foundation ("Barbara A Stone Foundation").
            var nearSingleLetter = (prev?.Length == 1) || (next?.Length == 1);
            var middleInitial = prev is not null && !Small.Contains(prev) && afterNext is not null && NamedFor.Contains(afterNext);
            if (!nearSingleLetter && !middleInitial) return core.ToLowerInvariant();
        }
        if (core == "US")
        {
            var pronoun = prev is not null && (BeforePronounUs.Contains(prev) || (prev == "OF" && isLast));
            return pronoun ? "Us" : "US";
        }
        if (core == "CASA")
            return next == "OF" || prev is "COUNTY" or "LAW" ? "CASA" : "Casa";
        if (core == "CO-OP") return "Co-op";
        if (Dotted.IsMatch(core)) return core;

        if (core.Contains('&'))
        {
            var bits = core.Split('&');
            return bits.All(b => b.Length <= 3) ? core : string.Join('&', bits.Select(Part));
        }

        // Each part of a hyphen or slash compound is cased on its own (Tacoma-Pierce, US-Brazil, CASA-GAL).
        var parts = Regex.Split(core, "([-/])");
        if (parts.Length > 1)
        {
            var casa = parts.Contains("CASA");
            return string.Concat(parts.Select(p => p is "-" or "/" ? p
                : casa && p is "CASA" or "GAL" ? p
                : p == "US" ? "US"
                : Part(p)));
        }
        return Part(core);
    }

    /// <summary>One run of letters and digits, with any apostrophe.</summary>
    private static string Part(string p)
    {
        if (p.Length == 0) return p;
        if (Acronyms.Contains(p)) return p;
        if (Abbreviations.Contains(p)) return Title(p);
        if (Roman.IsMatch(p)) return p;

        if (p.Contains('\''))
        {
            var at = p.IndexOf('\'');
            var head = p[..at];
            var tail = p[(at + 1)..];
            // O'BRIEN, D'ANGELO: a one-letter head is a name prefix. CHILDREN'S: a possessive.
            return head.Length == 1 && tail.Length > 1
                ? head + "'" + Title(tail)
                : Part(head) + "'" + tail.ToLowerInvariant();
        }

        if (p.Any(char.IsDigit))
        {
            if (char.IsDigit(p[0]))
            {
                // 1ST -> 1st, 22ND -> 22nd; anything else that starts with a digit keeps its capitals (4H, 501C3).
                var suffix = string.Concat(p.SkipWhile(char.IsDigit));
                return suffix is "ST" or "ND" or "RD" or "TH" ? p.ToLowerInvariant() : p;
            }
            // MANTRA4CHANGE -> Mantra4Change, K9 -> K9
            var sb = new StringBuilder(p.Length);
            var start = true;
            foreach (var ch in p)
            {
                if (char.IsDigit(ch)) { sb.Append(ch); start = true; continue; }
                sb.Append(start ? char.ToUpperInvariant(ch) : char.ToLowerInvariant(ch));
                start = false;
            }
            return sb.ToString();
        }

        if (p.Length == 1) return p;
        if (p.Length <= 5 && !p.Any(IsVowel)) return p;
        if (p.Length >= 4 && p.StartsWith("MC", StringComparison.Ordinal)) return "Mc" + Title(p[2..]);
        return Title(p);
    }

    private static bool IsVowel(char c) => "AEIOUY".Contains(c);

    private static string Title(string s) => s.Length == 0 ? s : char.ToUpperInvariant(s[0]) + s[1..].ToLowerInvariant();

    /// <summary>Splits off punctuation around a word ("(SEATTLE)," -> "(", "SEATTLE", "),") so the rules see the word.</summary>
    private static (string Lead, string Core, string Trail) Core(string w)
    {
        var start = 0;
        while (start < w.Length && !char.IsLetterOrDigit(w[start])) start++;
        if (start == w.Length) return (w, string.Empty, string.Empty);
        var end = w.Length;
        while (end > start && !char.IsLetterOrDigit(w[end - 1])) end--;
        return (w[..start], w[start..end], w[end..]);
    }
}
