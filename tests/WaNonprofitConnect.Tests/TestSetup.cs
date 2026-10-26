using System.Runtime.CompilerServices;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Tests;

internal static class TestSetup
{
    /// <summary>Tests use made-up EINs, so they start with no street addresses (the real file ships next to the API).</summary>
    [ModuleInitializer]
    internal static void NoStreetAddresses() => OrgLocations.LoadFrom("none");

    /// <summary>Tests tap two made-up places (PlacesTests.Fixture), never the real outlines.</summary>
    [ModuleInitializer]
    internal static void TestPlaces()
    {
        var file = Path.Combine(Path.GetTempPath(), $"places-{Guid.NewGuid():N}.geojson");
        File.WriteAllText(file, PlacesTests.Fixture);
        Places.LoadFrom(file);
    }
}
