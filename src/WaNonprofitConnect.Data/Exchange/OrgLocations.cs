using System.Globalization;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// Street-address positions for WA 501(c)(3)s, from the Census geocoder (scripts/geocode-orgs.js writes
/// data/geo/wa-orgs-geo.csv; the API ships it as geo/wa-orgs-geo.csv). Read once. An organization missing
/// from the file (PO box, no match) falls back to its ZIP's center.
/// </summary>
public static class OrgLocations
{
    private static IReadOnlyDictionary<string, (double Lat, double Lon)>? _table;

    private static IReadOnlyDictionary<string, (double Lat, double Lon)> Table
        => _table ??= Read(Path.Combine(AppContext.BaseDirectory, "geo", "wa-orgs-geo.csv"));

    public static int Count => Table.Count;

    public static bool TryGet(string ein, out (double Lat, double Lon) at) => Table.TryGetValue(ein, out at);

    /// <summary>Use this file instead (tests). A path that doesn't exist means no street addresses at all.</summary>
    public static void LoadFrom(string path) => _table = Read(path);

    private static IReadOnlyDictionary<string, (double Lat, double Lon)> Read(string path)
    {
        var map = new Dictionary<string, (double, double)>(StringComparer.Ordinal);
        if (!File.Exists(path)) return map;
        foreach (var line in File.ReadLines(path).Skip(1))
        {
            var c = line.Split(',');
            if (c.Length < 3) continue;
            if (double.TryParse(c[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var lat)
                && double.TryParse(c[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var lon))
                map[c[0]] = (lat, lon);
        }
        return map;
    }
}
