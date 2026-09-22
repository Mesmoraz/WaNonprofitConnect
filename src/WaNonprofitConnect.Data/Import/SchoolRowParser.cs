using System.Text.RegularExpressions;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Import;

/// <summary>City/ZIP pulled out of an OSPI PhysicalAddress. <see cref="Ok"/> is false when the string did not match "street, city, WA zip".</summary>
public sealed record ParsedAddress(string? Street, string? City, string? Zip, string? Zip5, bool Ok)
{
    public static readonly ParsedAddress None = new(null, null, null, null, false);
}

/// <summary>Pure mapping from a raw <see cref="SchoolRow"/> to <see cref="School"/> field values. No I/O.</summary>
public static partial class SchoolRowParser
{
    // "6110 28th Ave NW, Seattle, WA 98107-5314": street is everything before the last ", city, WA";
    // city is the comma-separated segment immediately before ", WA"; ZIP (5 or ZIP+4) follows "WA" if present.
    [GeneratedRegex(@"^(?<street>.*?),\s*(?<city>[^,]+?),\s*WA\b[\s,]*(?<zip>\d{5}(?:-\d{4})?)?", RegexOptions.IgnoreCase)]
    private static partial Regex Address();

    /// <summary>Copy every OSPI-sourced field from <paramref name="row"/> onto <paramref name="school"/>. Returns true if any value changed.</summary>
    public static bool Apply(SchoolRow row, School school)
    {
        var changed = false;
        var address = ParseAddress(row.PhysicalAddress);
        var (lat, lon) = Coordinates(row.BldgLatitude, row.BldgLongitude);

        changed |= Set(school.Name, BmfRowParser.Clean(row.School) ?? string.Empty, v => school.Name = v);
        changed |= Set(school.NameNormalized, BmfRowParser.Normalize(school.Name), v => school.NameNormalized = v);
        changed |= Set(school.PhysicalAddress, BmfRowParser.Clean(row.PhysicalAddress), v => school.PhysicalAddress = v);
        changed |= Set(school.Street, address.Street, v => school.Street = v);
        changed |= Set(school.City, address.City, v => school.City = v);
        changed |= Set(school.Zip, address.Zip, v => school.Zip = v);
        changed |= Set(school.Zip5, address.Zip5, v => school.Zip5 = v);
        changed |= Set(school.LeaCode, row.LEACode ?? 0, v => school.LeaCode = v);
        changed |= Set(school.LeaName, BmfRowParser.Clean(row.LEAName) ?? string.Empty, v => school.LeaName = v);
        changed |= Set(school.SchoolCategory, BmfRowParser.Clean(row.SchoolCategory), v => school.SchoolCategory = v);
        changed |= Set(school.GradeCategory, BmfRowParser.Clean(row.GradeCategory), v => school.GradeCategory = v);
        changed |= Set(school.LowestGrade, BmfRowParser.Clean(row.LowestGrade)?.ToUpperInvariant(), v => school.LowestGrade = v);
        changed |= Set(school.HighestGrade, BmfRowParser.Clean(row.HighestGrade)?.ToUpperInvariant(), v => school.HighestGrade = v);
        changed |= Set(school.County, BmfRowParser.Clean(row.County), v => school.County = v);
        changed |= Set(school.Latitude, lat, v => school.Latitude = v);
        changed |= Set(school.Longitude, lon, v => school.Longitude = v);

        return changed;
    }

    /// <summary>Copy the derived district values onto <paramref name="district"/>. Returns true if any value changed.</summary>
    public static bool Apply(DistrictRow row, SchoolDistrict district)
    {
        var changed = false;
        changed |= Set(district.Name, row.Name, v => district.Name = v);
        changed |= Set(district.NameNormalized, BmfRowParser.Normalize(row.Name), v => district.NameNormalized = v);
        changed |= Set(district.County, row.County, v => district.County = v);
        changed |= Set(district.City, row.City, v => district.City = v);
        changed |= Set(district.Zip5, row.Zip5, v => district.Zip5 = v);
        changed |= Set(district.Latitude, row.Latitude, v => district.Latitude = v);
        changed |= Set(district.Longitude, row.Longitude, v => district.Longitude = v);
        changed |= Set(district.SchoolCount, row.SchoolCount, v => district.SchoolCount = v);
        return changed;
    }

    /// <summary>
    /// One <see cref="DistrictRow"/> per LEA code. Name is the most common LEAName among its schools; county, city and ZIP
    /// likewise; lat/lon is the mean of the schools that have coordinates (null when none do). Rows without a usable
    /// LEA code are ignored. Same rule as the prototype's scripts/fetch-schools.js.
    /// </summary>
    public static IReadOnlyList<DistrictRow> BuildDistricts(IEnumerable<SchoolRow> rows)
    {
        var result = new List<DistrictRow>();
        foreach (var group in rows.Where(r => r.LEACode is > 0).GroupBy(r => r.LEACode!.Value).OrderBy(g => g.Key))
        {
            var addresses = group.Select(r => ParseAddress(r.PhysicalAddress)).ToList();
            var located = group.Select(r => Coordinates(r.BldgLatitude, r.BldgLongitude)).Where(c => c.Lat is not null).ToList();
            result.Add(new DistrictRow(
                group.Key,
                Mode(group.Select(r => BmfRowParser.Clean(r.LEAName))) ?? string.Empty,
                Mode(group.Select(r => BmfRowParser.Clean(r.County))),
                Mode(addresses.Select(a => a.City)),
                Mode(addresses.Select(a => a.Zip5)),
                located.Count == 0 ? null : Math.Round(located.Average(c => c.Lat!.Value), 6),
                located.Count == 0 ? null : Math.Round(located.Average(c => c.Lon!.Value), 6),
                group.Count()));
        }
        return result;
    }

    /// <summary>Most common non-null value; ties go to the value seen first.</summary>
    public static string? Mode(IEnumerable<string?> values)
        => values.Where(v => v is not null)
            .GroupBy(v => v!, StringComparer.Ordinal)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault();

    /// <summary>"6110 28th Ave NW, Seattle, WA 98107-5314" → street "6110 28th Ave NW", city "SEATTLE", zip "98107-5314", zip5 "98107".</summary>
    public static ParsedAddress ParseAddress(string? physicalAddress)
    {
        var s = BmfRowParser.Clean(physicalAddress);
        if (s is null) return ParsedAddress.None;

        var m = Address().Match(s);
        if (!m.Success) return ParsedAddress.None;

        var street = BmfRowParser.Clean(m.Groups["street"].Value);
        var city = BmfRowParser.Clean(m.Groups["city"].Value)?.ToUpperInvariant();
        var zip = m.Groups["zip"].Success ? m.Groups["zip"].Value : null;
        return new ParsedAddress(street, city, zip, BmfRowParser.Zip5(zip), Ok: true);
    }

    /// <summary>Both coordinates or neither. Rounded to 6 decimals (about 10 cm) so re-imports don't churn on float noise; 0,0 and out-of-range values → null.</summary>
    public static (double? Lat, double? Lon) Coordinates(double? latitude, double? longitude)
    {
        if (latitude is not { } lat || longitude is not { } lon) return (null, null);
        if (!double.IsFinite(lat) || !double.IsFinite(lon) || Math.Abs(lat) > 90 || Math.Abs(lon) > 180) return (null, null);
        if (lat == 0 && lon == 0) return (null, null);
        return (Math.Round(lat, 6), Math.Round(lon, 6));
    }

    private static bool Set<T>(T current, T next, Action<T> assign)
    {
        if (EqualityComparer<T>.Default.Equals(current, next)) return false;
        assign(next);
        return true;
    }
}
