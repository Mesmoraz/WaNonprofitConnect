using System.Runtime.CompilerServices;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Tests;

internal static class TestSetup
{
    /// <summary>Tests use made-up EINs, so they start with no street addresses (the real file ships next to the API).</summary>
    [ModuleInitializer]
    internal static void NoStreetAddresses() => OrgLocations.LoadFrom("none");
}
