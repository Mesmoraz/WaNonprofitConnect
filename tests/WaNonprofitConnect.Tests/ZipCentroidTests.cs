using System.IO.Compression;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

public sealed class ZipCentroidTests : IDisposable
{
    // The real file's shape: tab-delimited, header by name, and a long run of spaces after the last column.
    internal const string Fixture =
        "GEOID\tALAND\tAWATER\tALAND_SQMI\tAWATER_SQMI\tINTPTLAT\tINTPTLONG                                                                                                               \n" +
        "00601\t166847909\t799292\t64.42\t0.309\t18.180555\t-66.749961                                                                                                               \n" +
        "97999\t1\t0\t0\t0\t45.0\t-122.0\n" +
        "98101\t2033457\t1143627\t0.785\t0.442\t47.610786\t-122.334422                                                                                                               \n" +
        "98118\t25371052\t1876404\t9.796\t0.724\t47.541330\t-122.268160\n" +
        "98402\t3383017\t469011\t1.306\t0.181\t47.254010\t-122.441300\n" +
        "99201\t8745123\t402110\t3.377\t0.155\t47.662880\t-117.435470\n" +
        "99403\t1\t0\t0\t0\t46.4\t-117.1\n" +
        "99500\t1\t0\t0\t0\t61.2\t-149.9\n" +
        "\n" +
        "98999\tbad\t0\t0\t0\tnot-a-number\t-122.0\n";

    private readonly SqliteDbFixture _fx = new();
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "wanc-zip-" + Guid.NewGuid().ToString("N"));

    public ZipCentroidTests()
    {
        Directory.CreateDirectory(_dir);
        using var db = _fx.CreateContext();
        SeedOrgs(db);
    }

    public void Dispose()
    {
        _fx.Dispose();
        try { Directory.Delete(_dir, recursive: true); } catch (IOException) { }
    }

    [Theory]
    [InlineData("98000", true)]
    [InlineData("98101", true)]
    [InlineData("99499", true)]
    [InlineData("97999", false)]
    [InlineData("99500", false)]
    [InlineData("9810", false)]
    public void Washington_is_980xx_to_994xx(string zip, bool wa) => GazetteerParser.IsWashington(zip).Should().Be(wa);

    [Fact]
    public void Gazetteer_parse_keeps_WA_rows_and_trims_the_trailing_spaces()
    {
        var rows = GazetteerParser.Parse(new StringReader(Fixture)).ToList();

        rows.Select(r => r.Zip5).Should().Equal("98101", "98118", "98402", "99201", "99403");
        rows[0].Should().Be(new GazetteerRow("98101", 47.610786, -122.334422));
    }

    [Fact]
    public void Gazetteer_parse_finds_columns_by_name()
    {
        const string reordered = "INTPTLONG\tGEOID\tINTPTLAT\n-122.3\t98101\t47.6\n";
        GazetteerParser.Parse(new StringReader(reordered)).Should().Equal(new GazetteerRow("98101", 47.6, -122.3));

        var act = () => GazetteerParser.Parse(new StringReader("GEOID\tALAND\n98101\t1\n")).ToList();
        act.Should().Throw<InvalidDataException>().WithMessage("*INTPTLAT*");
    }

    [Trait("Story", "S-74")]
    [Fact]
    public async Task Importer_reads_the_census_zip_upserts_and_skips_an_identical_file()
    {
        var zip = Path.Combine(_dir, "2020_Gaz_zcta_national.zip");
        using (var archive = ZipFile.Open(zip, ZipArchiveMode.Create))
        {
            await using var w = new StreamWriter(archive.CreateEntry("2020_Gaz_zcta_national.txt").Open());
            await w.WriteAsync(Fixture);
        }

        using var db = _fx.CreateContext();
        var importer = new ZipCentroidImporter(db, new HttpClient(new NoNetwork()), NullLogger<ZipCentroidImporter>.Instance);
        var run = await importer.RunAsync(new ZipCentroidImportOptions { LocalFile = zip });

        run.Status.Should().Be(ImportStatus.Succeeded);
        run.Source.Should().Be(ImportSource.ZipGazetteer);
        run.RowsInserted.Should().Be(5);
        (await db.ZipCentroids.CountAsync()).Should().Be(5);

        (await importer.RunAsync(new ZipCentroidImportOptions { LocalFile = zip })).Status.Should().Be(ImportStatus.SkippedUnchanged);

        var txt = Path.Combine(_dir, "moved.txt");
        await File.WriteAllTextAsync(txt, Fixture.Replace("47.610786", "47.611000"));
        var again = await importer.RunAsync(new ZipCentroidImportOptions { LocalFile = txt });
        again.RowsUpdated.Should().Be(1);
        again.RowsUnchanged.Should().Be(4);
    }

    [Trait("Story", "S-74")]
    [Fact]
    public async Task Map_places_orgs_at_their_zip_and_draws_threads_and_suggestions()
    {
        using var db = _fx.CreateContext();
        db.ZipCentroids.AddRange(
            new ZipCentroid { Zip5 = "98101", Lat = 47.61, Lon = -122.33 },
            new ZipCentroid { Zip5 = "98402", Lat = 47.25, Lon = -122.44 },
            new ZipCentroid { Zip5 = "99201", Lat = 47.66, Lon = -117.43 });
        await db.SaveChangesAsync();

        var accounts = new AccountService(db);
        var person = await accounts.SignInAsync("d@example.org", "Dee");
        await accounts.ConfirmWithoutInviteAsync(person.Id, D); // a member with no posts yet

        var svc = new HelpbookService(db);
        var need = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Things, Title = "Laptops for intake" });
        var offer = await svc.CreateListingAsync(C, new CreateListingRequest { Kind = ListingKind.Offer, Help = KindOfHelp.Things, Title = "Refurbished laptops" });
        var need2 = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Time, Title = "Drivers" });
        var thread = await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = need2.Id, Message = "Saturdays work" }, "Casey");
        var declinedNeed = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Skills, Title = "Bookkeeping" });
        var declined = await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = declinedNeed.Id, Message = "CPA here" }, "Casey");
        await svc.DeclineAsync(declined.Id, A);

        var map = await svc.MapAsync();

        map.Members.Select(m => m.Ein).Should().BeEquivalentTo(new[] { A, B, C, D });
        var alpha = map.Members.Single(m => m.Ein == A);
        alpha.Lat.Should().Be(47.61);
        alpha.Lon.Should().Be(-122.33);
        map.Members.Single(m => m.Ein == C).Lat.Should().BeNull(); // 98118 has no centroid in this test
        map.Members.Single(m => m.Ein == D).IsMember.Should().BeTrue();
        map.Members.Single(m => m.Ein == A).IsMember.Should().BeFalse(); // posts came straight through the service

        map.Threads.Should().ContainSingle();
        map.Threads[0].Should().Be(new MapThreadDto(thread.Id, MatchStatus.Proposed, KindOfHelp.Time, B, A, "Drivers",
            need2.Id, thread.Offer.Id, thread.Offer.Title));

        var page = await svc.OrgPageAsync(A);
        page!.Org.Name.Should().Be("Alpha Food Bank");
        page.Listings.Select(l => l.Id).Should().Contain(need.Id);
        page.Listings.Should().OnlyContain(l => l.Org.Ein == A);
        page.Live.Should().Be(1);   // the drivers thread; the declined one doesn't count
        page.Golden.Should().Be(0);
        (await svc.OrgPageAsync("000000000")).Should().BeNull();

        map.Suggested.Should().Contain(new MapSuggestionDto(need.Id, offer.Id, C, A));
        map.Suggested.Should().NotContain(s => s.NeedId == need2.Id && s.OfferId == thread.Offer.Id); // already a thread

        // S-129: each pin's ring, from its open posts.
        map.Open.Should().Contain(new MapOpenDto(C, 0, 1));
        map.Open.Single(o => o.Ein == A).Should().Match<MapOpenDto>(o => o.Needs >= 1 && o.Offers == 0);
        map.Open.Should().NotContain(o => o.Ein == D);   // a member with nothing open has no ring

        var points = await svc.MapPointsAsync();
        points.Select(p => p.Ein).Should().Equal(A, B, D); // 501(c)(3)s with a centroid; NotC3 shares 98101 but is excluded
    }

    [Trait("Story", "S-131")]
    [Fact]
    public async Task Map_open_lists_every_open_post_with_its_place_newest_first()
    {
        using var db = _fx.CreateContext();
        db.ZipCentroids.Add(new ZipCentroid { Zip5 = "98101", Lat = 47.61, Lon = -122.33 });
        await db.SaveChangesAsync();
        var svc = new HelpbookService(db);
        var first = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Time, Title = "Drivers" });
        var second = await svc.CreateListingAsync(B, new CreateListingRequest { Kind = ListingKind.Offer, Help = KindOfHelp.Things, Title = "Crates" });

        var open = await svc.MapOpenAsync();

        open.Select(l => l.Id).Should().ContainInOrder(second.Id, first.Id);
        var drivers = open.Single(l => l.Id == first.Id);
        drivers.Kind.Should().Be(ListingKind.Need);
        drivers.Help.Should().Be(KindOfHelp.Time);
        drivers.Org.Ein.Should().Be(A);
        drivers.Org.Lat.Should().Be(47.61);   // A is in 98101
    }

    [Trait("Story", "S-130")]
    [Fact]
    public async Task Map_fits_pair_your_posts_with_others_best_first_and_leave_out_threads()
    {
        using var db = _fx.CreateContext();
        var svc = new HelpbookService(db);
        var need = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Things, Title = "Laptops for intake" });
        var offer = await svc.CreateListingAsync(C, new CreateListingRequest { Kind = ListingKind.Offer, Help = KindOfHelp.Things, Title = "Refurbished laptops" });
        var mine = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Offer, Help = KindOfHelp.Time, Title = "Saturday drivers" });
        var theirNeed = await svc.CreateListingAsync(B, new CreateListingRequest { Kind = ListingKind.Need, Help = KindOfHelp.Time, Title = "Drivers for deliveries" });
        var ownOffer = await svc.CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Offer, Help = KindOfHelp.Things, Title = "Our own laptops" });

        var forNeeds = await svc.MapFitsAsync(A, forNeeds: true);
        forNeeds.Should().Contain(f => f.Post.Id == offer.Id && f.MyId == need.Id && f.MyTitle == "Laptops for intake");
        forNeeds.Should().NotContain(f => f.Post.Id == ownOffer.Id);           // never your own posts
        forNeeds.Should().OnlyContain(f => f.Post.Kind == ListingKind.Offer);

        var forOffers = await svc.MapFitsAsync(A, forNeeds: false);
        forOffers.Should().Contain(f => f.Post.Id == theirNeed.Id && f.MyId == mine.Id);
        forOffers.Should().OnlyContain(f => f.Post.Kind == ListingKind.Need);

        // Once your offer is in a thread on their need, the pair isn't a "could fit" any more.
        await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = mine.Id, MyListingId = theirNeed.Id, Message = "Yes please" }, "Bo");
        (await svc.MapFitsAsync(A, forNeeds: false)).Should().NotContain(f => f.Post.Id == theirNeed.Id && f.MyId == mine.Id);

        (await svc.MapFitsAsync(D, forNeeds: true)).Should().BeEmpty();        // nothing open, nothing fits
    }

    [Trait("Story", "S-49")]
    [Fact]
    public async Task With_street_addresses_orgs_sit_there_and_unmatched_ones_leave_the_dots()
    {
        using var db = _fx.CreateContext();
        foreach (var (zip, lat, lon) in new[] { ("98101", 47.61, -122.33), ("98402", 47.25, -122.44) })
            if (!await db.ZipCentroids.AnyAsync(z => z.Zip5 == zip)) db.ZipCentroids.Add(new ZipCentroid { Zip5 = zip, Lat = lat, Lon = lon });
        await db.SaveChangesAsync();
        var file = Path.Combine(Path.GetTempPath(), $"geo-{Guid.NewGuid():N}.csv");
        await File.WriteAllTextAsync(file, $"ein,lat,lon\n{A},47.60123,-122.33456\n");
        try
        {
            OrgLocations.LoadFrom(file);
            var svc = new HelpbookService(db);
            var points = await svc.MapPointsAsync();
            points.Should().ContainSingle(p => p.Ein == A).Which.Should().Be((A, 47.60123, -122.33456));
            points.Should().NotContain(p => p.Ein == B); // no street match: no dot on its ZIP center

            var summaries = await svc.OrgSummariesAsync(db.Organizations.Where(o => o.Ein == A || o.Ein == B).ToList());
            summaries[A].Lat.Should().Be(47.60123);
            summaries[B].Lat.Should().Be(47.25); // cards and pins still fall back to the ZIP center
        }
        finally
        {
            OrgLocations.LoadFrom("none");
            File.Delete(file);
        }
    }

    [Trait("Story", "S-74")]
    [Fact]
    public async Task Map_points_endpoint_is_public_compact_and_cached_an_hour()
    {
        using var factory = new ApiFactory();
        factory.NewClient().Dispose();
        factory.Seed(db =>
        {
            SeedOrgs(db);
            db.ZipCentroids.Add(new ZipCentroid { Zip5 = "98101", Lat = 47.6107861, Lon = -122.3344222 });
            db.SaveChanges();
        });

        using var http = factory.NewClient();
        var resp = await http.GetAsync("/api/v1/map/points");
        resp.StatusCode.Should().Be(HttpStatusCode.OK);
        resp.Headers.CacheControl!.Public.Should().BeTrue();
        resp.Headers.CacheControl.MaxAge.Should().Be(TimeSpan.FromHours(1));
        (await resp.Content.ReadAsStringAsync()).Should().Be("[[\"000000001\",47.61079,-122.33442]]");

        (await http.GetAsync("/api/v1/map")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private sealed class NoNetwork : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
            => throw new InvalidOperationException("Tests never download.");
    }
}
