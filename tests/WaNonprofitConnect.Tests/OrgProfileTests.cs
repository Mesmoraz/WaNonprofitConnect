using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

/// <summary>Your organization: about you (S-99). What an organization says about itself, and what others see on its page.</summary>
[Trait("Story", "S-99")]
public sealed class OrgProfileTests : IDisposable
{
    private readonly SqliteDbFixture _fx = new();

    public OrgProfileTests()
    {
        using var db = _fx.CreateContext();
        SeedOrgs(db);
    }

    public void Dispose() => _fx.Dispose();

    private static AccountService Accounts(AppDbContext db) => new(db, new AccountOptions());

    private static async Task<Guid> ConfirmedAsync(AppDbContext db, string email, string name, string ein)
    {
        var a = await Accounts(db).SignInAsync(email, name);
        await Accounts(db).ConfirmWithoutInviteAsync(a.Id, ein);
        return a.Id;
    }

    [Fact]
    public async Task Save_trims_about_and_adds_https_to_a_bare_website()
    {
        using var db = _fx.CreateContext();
        var casey = await ConfirmedAsync(db, "casey@example.org", "Casey Jones", A);
        var svc = new OrgProfileService(db);

        var mine = await svc.SaveAsync(casey, new SaveOrgProfileRequest("  We run a food bank. ", "ballardfoodbank.org", casey));

        mine.About.Should().Be("We run a food bank.");
        mine.Website.Should().Be("https://ballardfoodbank.org");
        mine.ContactAccountId.Should().Be(casey);
        mine.Org.Ein.Should().Be(A);
        mine.People.Should().ContainSingle().Which.Should().Be(new OrgPersonDto(casey, "Casey Jones", "casey@example.org", true));

        // Empty clears; the page then leaves the lines out.
        var cleared = await svc.SaveAsync(casey, new SaveOrgProfileRequest("   ", "", null));
        cleared.About.Should().BeNull();
        cleared.Website.Should().BeNull();
        cleared.ContactAccountId.Should().BeNull();
        (await svc.GetMineAsync(casey)).About.Should().BeNull();
    }

    [Fact]
    public async Task Website_that_is_not_http_is_refused()
    {
        using var db = _fx.CreateContext();
        var casey = await ConfirmedAsync(db, "casey@example.org", "Casey Jones", A);
        var svc = new OrgProfileService(db);

        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(null, "javascript:alert(1)", null)), 400);
        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(null, "ftp://example.org", null)), 400);
        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(null, "not a website", null)), 400);
        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(new string('a', 141), null, null)), 400);
        (await svc.SaveAsync(casey, new SaveOrgProfileRequest(null, "http://example.org/about", null))).Website.Should().Be("http://example.org/about");
    }

    [Fact]
    public async Task Who_to_ask_must_be_confirmed_here()
    {
        using var db = _fx.CreateContext();
        var casey = await ConfirmedAsync(db, "casey@example.org", "Casey Jones", A);
        var elsewhere = await ConfirmedAsync(db, "bo@example.org", "Bo", B);
        var pending = (await Accounts(db).SignInAsync("pat@example.org", "Pat")).Id;
        await Accounts(db).ClaimAsync(pending, A);
        var svc = new OrgProfileService(db);

        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(null, null, pending)), 400);
        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(null, null, elsewhere)), 400);
        await Throws(() => svc.SaveAsync(casey, new SaveOrgProfileRequest(null, null, Guid.NewGuid())), 400);
    }

    [Fact]
    public async Task Pending_member_cannot_read_or_save()
    {
        using var db = _fx.CreateContext();
        var pat = (await Accounts(db).SignInAsync("pat@example.org", "Pat")).Id;
        var svc = new OrgProfileService(db);
        await Throws(() => svc.GetMineAsync(pat), 403);   // no organization at all

        await Accounts(db).ClaimAsync(pat, A);
        await Throws(() => svc.GetMineAsync(pat), 403);
        await Throws(() => svc.SaveAsync(pat, new SaveOrgProfileRequest("Hi", null, null)), 403);
    }

    [Fact]
    public async Task Org_page_shows_first_name_never_email()
    {
        using var db = _fx.CreateContext();
        var casey = await ConfirmedAsync(db, "casey@example.org", "Casey Jones", A);
        await new OrgProfileService(db).SaveAsync(casey, new SaveOrgProfileRequest("We run a food bank.", "alpha.org", casey));

        var page = await new HelpbookService(db).OrgPageAsync(A);
        page!.About.Should().Be("We run a food bank.");
        page.Website.Should().Be("https://alpha.org");
        page.AskFor.Should().Be("Casey");
        JsonSerializer.Serialize(page).Should().NotContain("@").And.NotContain("Jones");

        // An organization that hasn't said anything shows nothing new.
        var other = await new HelpbookService(db).OrgPageAsync(B);
        other!.About.Should().BeNull();
        other.Website.Should().BeNull();
        other.AskFor.Should().BeNull();
    }

    [Fact]
    public async Task Who_to_ask_clears_when_that_person_leaves()
    {
        using var db = _fx.CreateContext();
        var casey = await ConfirmedAsync(db, "casey@example.org", "Casey Jones", A);
        var sam = await ConfirmedAsync(db, "sam@example.org", "Sam Lee", A);
        await new OrgProfileService(db).SaveAsync(casey, new SaveOrgProfileRequest(null, null, sam));

        db.Accounts.Remove(await db.Accounts.SingleAsync(a => a.Id == sam));
        await db.SaveChangesAsync();

        using var fresh = _fx.CreateContext();
        (await new OrgProfileService(fresh).GetMineAsync(casey)).ContactAccountId.Should().BeNull();
        (await new HelpbookService(fresh).OrgPageAsync(A))!.AskFor.Should().BeNull();
    }

    [Fact]
    public async Task Import_does_not_touch_the_profile()
    {
        const string ein = "010600001";
        var dir = Path.Combine(Path.GetTempPath(), "wanc-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        var file = Path.Combine(dir, "bmf.csv");
        File.WriteAllLines(file, new[]
        {
            "EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME",
            "010600001,FOOD BANK INC,,1 MAIN ST,SEATTLE,WA,98101,0000,03,3,1000,201501,1,16,000000000,1,01,202412,4,4,01,0,12,120000,300000,300000,K31,",
        });
        try
        {
            await ImportAsync(file);
            using (var db = _fx.CreateContext())
            {
                var casey = await ConfirmedAsync(db, "casey@example.org", "Casey Jones", ein);
                await new OrgProfileService(db).SaveAsync(casey, new SaveOrgProfileRequest("We run a food bank.", "foodbank.org", casey));
            }

            await ImportAsync(file, force: true);

            using var check = _fx.CreateContext();
            var p = await check.OrgProfiles.AsNoTracking().SingleAsync(x => x.Ein == ein);
            p.About.Should().Be("We run a food bank.");
            p.Website.Should().Be("https://foodbank.org");
            p.ContactAccountId.Should().NotBeNull();
        }
        finally
        {
            try { Directory.Delete(dir, recursive: true); } catch { /* best effort */ }
        }
    }

    private async Task ImportAsync(string file, bool force = false)
    {
        await using var db = _fx.CreateContext();
        await new BmfImporter(db, new HttpClient(), NullLogger<BmfImporter>.Instance)
            .RunAsync(new BmfImportOptions { LocalFile = file, StateFilter = "WA", Force = force });
    }

    private static async Task Throws(Func<Task> act, int status)
        => (await act.Should().ThrowAsync<ExchangeException>()).Which.StatusCode.Should().Be(status);
}
