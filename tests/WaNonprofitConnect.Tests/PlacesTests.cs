using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

/// <summary>Tap a place, see who's there (S-144): the outlines, who is inside one, and the two endpoints.</summary>
public sealed class PlacesTests : IDisposable
{
    /// <summary>
    /// Two made-up places, loaded once for every test (TestSetup): "Testville", a square over Seattle's 98101 and 98118 with a
    /// hole in its middle, and "Elsewhere", a second polygon far away. The real file ships next to the API.
    /// </summary>
    internal const string Fixture = """
        {"type":"FeatureCollection","features":[
          {"type":"Feature","id":"p-test","properties":{"id":"p-test","name":"Testville","kind":"city","bbox":[-122.45,47.5,-122.2,47.7]},
           "geometry":{"type":"Polygon","coordinates":[
             [[-122.45,47.5],[-122.2,47.5],[-122.2,47.7],[-122.45,47.7],[-122.45,47.5]],
             [[-122.36,47.57],[-122.34,47.57],[-122.34,47.59],[-122.36,47.59],[-122.36,47.57]]]}},
          {"type":"Feature","id":"sea-far","properties":{"id":"sea-far","name":"Far","kind":"neighborhood","bbox":[-118,46,-117,47]},
           "geometry":{"type":"MultiPolygon","coordinates":[[[[-118,46],[-117,46],[-117,47],[-118,47],[-118,46]]]]}}]}
        """;

    private readonly SqliteDbFixture _fx = new();

    public PlacesTests()
    {
        using var db = _fx.CreateContext();
        SeedOrgs(db);
        db.ZipCentroids.AddRange(
            new ZipCentroid { Zip5 = "98101", Lat = 47.61, Lon = -122.33 },
            new ZipCentroid { Zip5 = "98118", Lat = 47.54, Lon = -122.27 },
            new ZipCentroid { Zip5 = "98402", Lat = 47.25, Lon = -122.44 },
            new ZipCentroid { Zip5 = "99201", Lat = 47.66, Lon = -117.43 });
        db.SaveChanges();
    }

    public void Dispose() => _fx.Dispose();

    [Trait("Story", "S-144")]
    [Fact]
    public void A_point_is_inside_its_outline_but_not_its_hole()
    {
        var place = Places.Find("p-test")!;
        place.Name.Should().Be("Testville");
        place.Contains(47.61, -122.33).Should().BeTrue();
        place.Contains(47.58, -122.35).Should().BeFalse();   // the hole
        place.Contains(47.25, -122.44).Should().BeFalse();   // Tacoma
        Places.Find("sea-far")!.Contains(46.5, -117.5).Should().BeTrue();
        Places.Find("nowhere").Should().BeNull();
    }

    [Trait("Story", "S-144")]
    [Fact]
    public async Task Everyone_inside_a_place_joined_first_then_a_to_z()
    {
        using var db = _fx.CreateContext();
        var svc = new HelpbookService(db);
        await svc.CreateListingAsync(C, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Time, Title = "Drivers" });
        await svc.CreateListingAsync(C, new CreateListingRequest { Kind = ListingKind.Offer, Help = KindOfHelp.Things, Title = "Crates" });
        await svc.CreateListingAsync(B, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Time, Title = "Tacoma drivers" });
        var place = Places.Find("p-test")!;

        var eins = await svc.PlaceEinsAsync(place);
        eins.Should().BeEquivalentTo([A, C]);           // B is in Tacoma, D in Spokane; the chamber isn't a 501(c)(3)

        var page = await svc.PlaceOrgsAsync(place, eins, 0, 50);
        page.Name.Should().Be("Testville");
        page.Total.Should().Be(2);
        page.Joined.Should().Be(1);
        page.Orgs.Select(o => o.Org.Ein).Should().ContainInOrder(C, A);   // C has open posts, so it has joined
        page.Orgs[0].Needs.Should().Be(1);
        page.Orgs[0].Offers.Should().Be(1);
        page.Orgs[1].Org.Name.Should().Be("Alpha Food Bank");

        (await svc.PlaceOrgsAsync(place, eins, 1, 1)).Orgs.Should().ContainSingle(o => o.Org.Ein == A);
    }

    [Trait("Story", "S-144")]
    [Fact]
    public async Task Places_endpoints_are_public_and_the_outlines_come_gzipped()
    {
        using var factory = new ApiFactory();
        factory.NewClient().Dispose();
        factory.Seed(db =>
        {
            SeedOrgs(db);
            db.ZipCentroids.Add(new ZipCentroid { Zip5 = "98101", Lat = 47.61, Lon = -122.33 });
            db.SaveChanges();
        });
        using var http = factory.NewClient();

        var outlines = await http.GetAsync("/api/v1/places");
        outlines.StatusCode.Should().Be(HttpStatusCode.OK);
        outlines.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromDays(1));
        (await outlines.Content.ReadAsStringAsync()).Should().Contain("Testville");

        var gz = new HttpRequestMessage(HttpMethod.Get, "/api/v1/places");
        gz.Headers.AcceptEncoding.ParseAdd("gzip");
        (await http.SendAsync(gz)).Content.Headers.ContentEncoding.Should().Contain("gzip");

        var inside = await http.GetFromJsonAsync<PlaceOrgsDto>("/api/v1/places/p-test/orgs", ApiTests.Json);
        inside!.Total.Should().Be(1);
        inside.Orgs.Should().ContainSingle(o => o.Org.Ein == A);

        (await http.GetAsync("/api/v1/places/nowhere/orgs")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
