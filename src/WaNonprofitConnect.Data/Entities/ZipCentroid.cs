namespace WaNonprofitConnect.Data.Entities;

/// <summary>
/// The internal point of a ZIP Code Tabulation Area (Census Bureau 2020 gazetteer). Every organization is placed at its
/// ZIP's centroid on the map until street-level geocoding (Beta).
/// </summary>
public class ZipCentroid
{
    public string Zip5 { get; set; } = string.Empty;
    public double Lat { get; set; }
    public double Lon { get; set; }
    public int LastSeenImportRunId { get; set; }
}
