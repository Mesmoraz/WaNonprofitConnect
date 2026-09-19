using FluentAssertions;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Tests;

public sealed class OrganizationQueriesTests : IDisposable
{
    private readonly SqliteDbFixture _fx = new();

    public OrganizationQueriesTests()
    {
        using var db = _fx.CreateContext();
        var run = new ImportRun { Source = ImportSource.Bmf, Status = ImportStatus.Succeeded, StartedAt = DateTime.UtcNow };
        db.ImportRuns.Add(run);
        db.SaveChanges();

        db.Organizations.AddRange(
            Org(run, "000000001", "Seattle Food Bank", "SEATTLE", "98101", "03", "15", "K31", 250_000),
            Org(run, "000000002", "Food Lifeline", "SEATTLE", "98108", "03", "16", "K31", 5_000_000),
            Org(run, "000000003", "Spokane Food Pantry", "SPOKANE", "99201", "03", "15", "K30", 40_000),
            Org(run, "000000004", "Gates Family Foundation", "SEATTLE", "98109", "03", "04", "T20", 9_000_000),
            Org(run, "000000005", "Seattle Chamber of Commerce", "SEATTLE", "98101", "06", "00", "S41", 1_000_000),
            Org(run, "000000006", "Unclassified Society", "TACOMA", "98402", "03", "15", null, null));
        db.SaveChanges();
    }

    public void Dispose() => _fx.Dispose();

    [Fact]
    public async Task Defaults_to_501c3_only()
    {
        await using var db = _fx.CreateContext();
        var r = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest());
        r.Total.Should().Be(5);
        r.Items.Should().OnlyContain(o => o.Is501c3);
    }

    [Fact]
    public async Task Free_text_requires_every_term()
    {
        await using var db = _fx.CreateContext();
        var r = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { Q = "food seattle" });
        r.Items.Select(o => o.Ein).Should().Equal("000000001");

        var punct = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { Q = "food-bank," });
        punct.Items.Select(o => o.Ein).Should().Equal("000000001");
    }

    [Fact]
    public async Task Nine_digit_query_is_an_ein_lookup()
    {
        await using var db = _fx.CreateContext();
        var r = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { Q = "00-0000003" });
        r.Items.Select(o => o.Name).Should().Equal("Spokane Food Pantry");
    }

    [Fact]
    public async Task Filters_compose()
    {
        await using var db = _fx.CreateContext();
        var r = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest
        {
            City = "seattle", Ntee = "K", MinRevenue = 1_000_000,
        });
        r.Items.Select(o => o.Ein).Should().Equal("000000002");

        var fullCode = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { Ntee = "k30" });
        fullCode.Items.Select(o => o.Ein).Should().Equal("000000003");

        var noPf = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { ExcludePrivateFoundations = true });
        noPf.Items.Select(o => o.Ein).Should().NotContain("000000004");
        noPf.Items.Select(o => o.Ein).Should().Contain("000000006", "null foundation code must not be excluded");

        var all = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { Only501c3 = false, Subsection = "06" });
        all.Items.Select(o => o.Ein).Should().Equal("000000005");
    }

    [Fact]
    public async Task Paging_is_clamped_and_ordered_by_name()
    {
        await using var db = _fx.CreateContext();
        var r = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { PageSize = 2, Page = 2 });
        r.Total.Should().Be(5);
        r.PageSize.Should().Be(2);
        r.Items.Select(o => o.Name).Should().Equal("Seattle Food Bank", "Spokane Food Pantry");

        var huge = await OrganizationQueries.SearchAsync(db, new OrganizationSearchRequest { PageSize = 10_000, Page = 0 });
        huge.PageSize.Should().Be(OrganizationSearchRequest.MaxPageSize);
        huge.Page.Should().Be(1);
    }

    [Fact]
    public async Task Stats_count_the_right_things()
    {
        await using var db = _fx.CreateContext();
        var s = await OrganizationQueries.GetStatsAsync(db, "WA");

        s.Total.Should().Be(6);
        s.Count501c3.Should().Be(5);
        s.Count501c3PrivateFoundations.Should().Be(1);
        s.Count501c3PublicCharities.Should().Be(4);
        s.CountWithNtee.Should().Be(4);
        s.CountWithRevenue.Should().Be(4);
        s.ByNteeMajor.Should().Contain(b => b.Key == "K" && b.Count == 3 && b.Label.StartsWith("Food"));
        s.ByNteeMajor.Should().Contain(b => b.Key == "" && b.Count == 1 && b.Label == "(none)");
        s.TopCities.First().Should().BeEquivalentTo(new CountBucket("SEATTLE", "SEATTLE", 3));
        s.BySubsection.Should().Contain(b => b.Key == "06" && b.Count == 1);
    }

    private static Organization Org(ImportRun run, string ein, string name, string city, string zip, string sub, string foundation, string? ntee, decimal? revenue)
    {
        var o = new Organization
        {
            Ein = ein, Name = name, NameNormalized = BmfRowParser.Normalize(name), City = city, State = "WA", Zip = zip, Zip5 = zip,
            Subsection = sub, Is501c3 = sub == "03", FoundationCode = foundation, NteeCode = ntee, NteeMajor = BmfRowParser.NteeMajor(ntee),
            RevenueAmount = revenue, RulingDate = new DateOnly(2010, 1, 1),
            FirstSeenImportRun = run, LastSeenImportRun = run, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };
        return o;
    }
}
