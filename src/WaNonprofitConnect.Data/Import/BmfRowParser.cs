using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using WaNonprofitConnect.Data.Codes;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Import;

/// <summary>Pure mapping from a raw <see cref="BmfRow"/> to <see cref="Organization"/> field values. No I/O.</summary>
public static partial class BmfRowParser
{
    [GeneratedRegex("[^A-Z0-9 ]")]
    private static partial Regex NonAlnum();

    [GeneratedRegex(" {2,}")]
    private static partial Regex MultiSpace();

    /// <summary>Copy every BMF-sourced field from <paramref name="row"/> onto <paramref name="org"/>. Returns true if any value changed.</summary>
    public static bool Apply(BmfRow row, Organization org)
    {
        var changed = false;

        changed |= Set(org.Name, Clean(row.Name) ?? string.Empty, v => org.Name = v);
        changed |= Set(org.NameNormalized, Normalize(org.Name), v => org.NameNormalized = v);
        changed |= Set(org.SortName, Clean(row.SortName), v => org.SortName = v);
        changed |= Set(org.InCareOf, Clean(row.Ico), v => org.InCareOf = v);
        changed |= Set(org.Street, Clean(row.Street), v => org.Street = v);
        changed |= Set(org.City, Clean(row.City), v => org.City = v);
        changed |= Set(org.State, Clean(row.State)?.ToUpperInvariant() ?? string.Empty, v => org.State = v);
        changed |= Set(org.Zip, Clean(row.Zip), v => org.Zip = v);
        changed |= Set(org.Zip5, Zip5(org.Zip), v => org.Zip5 = v);
        changed |= Set(org.GroupExemption, Clean(row.Group), v => org.GroupExemption = v);
        changed |= Set(org.Subsection, Clean(row.Subsection) ?? string.Empty, v => org.Subsection = v);
        changed |= Set(org.Affiliation, Clean(row.Affiliation), v => org.Affiliation = v);
        changed |= Set(org.Classification, Clean(row.Classification), v => org.Classification = v);
        changed |= Set(org.RulingDate, YearMonth(row.Ruling), v => org.RulingDate = v);
        changed |= Set(org.Deductibility, Clean(row.Deductibility), v => org.Deductibility = v);
        changed |= Set(org.FoundationCode, Clean(row.Foundation), v => org.FoundationCode = v);
        changed |= Set(org.Activity, Clean(row.Activity), v => org.Activity = v);
        changed |= Set(org.OrganizationCode, Clean(row.Organization), v => org.OrganizationCode = v);
        changed |= Set(org.Status, Clean(row.Status), v => org.Status = v);
        changed |= Set(org.TaxPeriod, YearMonth(row.TaxPeriod), v => org.TaxPeriod = v);
        changed |= Set(org.AssetCode, Clean(row.AssetCd), v => org.AssetCode = v);
        changed |= Set(org.IncomeCode, Clean(row.IncomeCd), v => org.IncomeCode = v);
        changed |= Set(org.FilingReqCode, Clean(row.FilingReqCd), v => org.FilingReqCode = v);
        changed |= Set(org.PfFilingReqCode, Clean(row.PfFilingReqCd), v => org.PfFilingReqCode = v);
        changed |= Set(org.AccountingPeriodMonth, Month(row.AcctPd), v => org.AccountingPeriodMonth = v);
        changed |= Set(org.AssetAmount, Amount(row.AssetAmt), v => org.AssetAmount = v);
        changed |= Set(org.IncomeAmount, Amount(row.IncomeAmt), v => org.IncomeAmount = v);
        changed |= Set(org.RevenueAmount, Amount(row.RevenueAmt), v => org.RevenueAmount = v);
        changed |= Set(org.NteeCode, Clean(row.NteeCd)?.ToUpperInvariant(), v => org.NteeCode = v);
        changed |= Set(org.NteeMajor, NteeMajor(org.NteeCode), v => org.NteeMajor = v);
        changed |= Set(org.Is501c3, org.Subsection == BmfCodes.Subsection501c3, v => org.Is501c3 = v);

        return changed;
    }

    /// <summary>EIN as it should be stored: exactly 9 digits, left-padded with zeros. Null if not usable.</summary>
    public static string? NormalizeEin(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var digits = new string(raw.Where(char.IsDigit).ToArray());
        if (digits.Length == 0 || digits.Length > 9) return null;
        return digits.PadLeft(9, '0');
    }

    /// <summary>Upper-case, strip punctuation, collapse whitespace. Used for LIKE search.</summary>
    public static string Normalize(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;
        var upper = name.ToUpperInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(upper.Length);
        foreach (var ch in upper)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark) sb.Append(ch);
        }
        var stripped = NonAlnum().Replace(sb.ToString(), " ");
        return MultiSpace().Replace(stripped, " ").Trim();
    }

    public static string? Clean(string? s)
    {
        if (s is null) return null;
        var t = s.Trim();
        return t.Length == 0 ? null : t;
    }

    /// <summary>"YYYYMM" → first day of that month. "000000" and junk → null.</summary>
    public static DateOnly? YearMonth(string? s)
    {
        var t = Clean(s);
        if (t is null || t.Length != 6 || !int.TryParse(t, out _)) return null;
        var y = int.Parse(t[..4], CultureInfo.InvariantCulture);
        var m = int.Parse(t[4..], CultureInfo.InvariantCulture);
        if (y < 1800 || m is < 1 or > 12) return null;
        return new DateOnly(y, m, 1);
    }

    public static int? Month(string? s)
    {
        var t = Clean(s);
        return t is not null && int.TryParse(t, out var m) && m is >= 1 and <= 12 ? m : null;
    }

    /// <summary>Whole-dollar amounts; the IRS file can carry a leading or trailing minus sign.</summary>
    public static decimal? Amount(string? s)
    {
        var t = Clean(s);
        if (t is null) return null;
        var negative = t.StartsWith('-') || t.EndsWith('-');
        var digits = t.Trim('-', '+', ' ');
        if (!decimal.TryParse(digits, NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out var v)) return null;
        return negative ? -v : v;
    }

    public static string? Zip5(string? zip)
    {
        var t = Clean(zip);
        if (t is null) return null;
        var digits = new string(t.TakeWhile(char.IsDigit).ToArray());
        return digits.Length >= 5 ? digits[..5] : null;
    }

    public static string? NteeMajor(string? ntee)
    {
        var t = Clean(ntee);
        if (t is null) return null;
        var c = char.ToUpperInvariant(t[0]);
        return c is >= 'A' and <= 'Z' ? c.ToString() : null;
    }

    private static bool Set<T>(T current, T next, Action<T> assign)
    {
        if (EqualityComparer<T>.Default.Equals(current, next)) return false;
        assign(next);
        return true;
    }
}
