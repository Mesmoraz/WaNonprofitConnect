using System.Text.Json;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// The outlines you can tap on the map (S-144): every Washington city and town, census place, and Seattle district and
/// neighborhood, from <c>data/geo/wa-places.geojson</c> (scripts/fetch-places.js). Read once; the same file the app draws.
/// </summary>
public static class Places
{
    public sealed record Place(string Id, string Name, string Kind, double West, double South, double East, double North, double[][][][] Polygons)
    {
        /// <summary>Is this point inside? Even-odd over each polygon's rings, so holes stay out.</summary>
        public bool Contains(double lat, double lon)
        {
            if (lon < West || lon > East || lat < South || lat > North) return false;
            foreach (var polygon in Polygons)
            {
                var inside = false;
                foreach (var ring in polygon)
                    for (int i = 0, j = ring.Length - 1; i < ring.Length; j = i++)
                    {
                        double xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
                        if ((yi > lat) != (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
                    }
                if (inside) return true;
            }
            return false;
        }
    }

    private static string _path = Path.Combine(AppContext.BaseDirectory, "geo", "wa-places.geojson");
    private static IReadOnlyDictionary<string, Place>? _table;
    private static byte[]? _file;

    private static IReadOnlyDictionary<string, Place> Table => _table ??= Read(_path);

    public static int Count => Table.Count;

    public static Place? Find(string id) => Table.GetValueOrDefault(id);

    /// <summary>The file as it is on disk, for <c>GET /api/v1/places</c>. Empty when there is no file.</summary>
    public static byte[] File => _file ??= System.IO.File.Exists(_path) ? System.IO.File.ReadAllBytes(_path) : [];

    /// <summary>Use this file instead (tests). A path that doesn't exist means no places at all.</summary>
    public static void LoadFrom(string path)
    {
        _path = path;
        _table = null;
        _file = null;
    }

    private static IReadOnlyDictionary<string, Place> Read(string path)
    {
        var map = new Dictionary<string, Place>(StringComparer.Ordinal);
        if (!System.IO.File.Exists(path)) return map;
        using var doc = JsonDocument.Parse(System.IO.File.ReadAllBytes(path));
        foreach (var f in doc.RootElement.GetProperty("features").EnumerateArray())
        {
            var p = f.GetProperty("properties");
            var g = f.GetProperty("geometry");
            var coords = g.GetProperty("coordinates");
            var polygons = g.GetProperty("type").GetString() == "Polygon"
                ? [ReadPolygon(coords)]
                : coords.EnumerateArray().Select(ReadPolygon).ToArray();
            var b = p.GetProperty("bbox").EnumerateArray().Select(v => v.GetDouble()).ToArray();
            var id = p.GetProperty("id").GetString()!;
            map[id] = new Place(id, p.GetProperty("name").GetString()!, p.GetProperty("kind").GetString()!, b[0], b[1], b[2], b[3], polygons);
        }
        return map;
    }

    private static double[][][] ReadPolygon(JsonElement polygon) =>
        polygon.EnumerateArray().Select(ring => ring.EnumerateArray().Select(pt => new[] { pt[0].GetDouble(), pt[1].GetDouble() }).ToArray()).ToArray();
}
