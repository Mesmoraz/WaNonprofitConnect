using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Tests;

public sealed class BmfImporterTests : IDisposable
{
    private const string Header =
        "EIN,NAME,ICO,STREET,CITY,STATE,ZIP,GROUP,SUBSECTION,AFFILIATION,CLASSIFICATION,RULING,DEDUCTIBILITY,FOUNDATION,ACTIVITY,ORGANIZATION,STATUS,TAX_PERIOD,ASSET_CD,INCOME_CD,FILING_REQ_CD,PF_FILING_REQ_CD,ACCT_PD,ASSET_AMT,INCOME_AMT,REVENUE_AMT,NTEE_CD,SORT_NAME";

    private static readonly string[] Rows =
    {
        "010555614,OKANOGAN REGIONAL HUMANE,% TINA GERMANO-DELAP,398 OMAK RIVER ROAD,OMAK,WA,98841-0000,0000,03,3,4000,200202,1,15,000000000,1,01,202512,5,4,01,0,12,658857,281666,281666,D20,",
        "010566082,OROMO CULTURAL CENTER,% ADAM TAHIR,8819 RENTON AVE S,SEATTLE,WA,98118-4918,0000,03,3,1200,200612,1,15,000000000,1,01,202412,0,0,02,0,12,0,0,0,A23,",
        "\"010600001\",\"FOOD BANK, INC.\",,1 MAIN ST,SEATTLE,WA,98101,0000,03,3,1000,201501,1,16,000000000,1,01,202412,4,4,01,0,12,120000,300000,300000,K31,",
        "010700002,PORTLAND CIVIC LEAGUE,,2 OAK ST,PORTLAND,OR,97201,0000,04,3,1000,201501,2,00,000000000,1,01,202412,0,0,02,0,12,0,0,0,S20,",
        "notanein,BROKEN ROW,,,,WA,,0000,03,3,1000,201501,1,15,000000000,1,01,202412,0,0,02,0,12,0,0,0,,",
    };

    private readonly SqliteDbFixture _fx = new();
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "wanc-tests", Guid.NewGuid().ToString("N"));

    public BmfImporterTests() => Directory.CreateDirectory(_dir);

    public void Dispose()
    {
        _fx.Dispose();
        try { Directory.Delete(_dir, recursive: true); } catch { /* best effort */ }
    }

    [Fact]
    public async Task First_import_inserts_matching_state_rows_and_skips_bad_eins()
    {
        var file = WriteCsv("a.csv", Rows);

        var run = await RunAsync(file);

        run.Status.Should().Be(ImportStatus.Succeeded);
        run.RowsRead.Should().Be(5);
        run.RowsInserted.Should().Be(3);
        run.RowsSkipped.Should().Be(2, "one OR row filtered by state, one unusable EIN");
        run.Errors.Should().Contain("notanein");

        await using var db = _fx.CreateContext();
        var orgs = await db.Organizations.OrderBy(o => o.Ein).ToListAsync();
        orgs.Should().HaveCount(3);
        orgs.Select(o => o.Ein).Should().Equal("010555614", "010566082", "010600001");
        orgs[2].Name.Should().Be("FOOD BANK, INC.");
        orgs[2].NameNormalized.Should().Be("FOOD BANK INC");
        orgs.Should().OnlyContain(o => o.FirstSeenImportRunId == run.Id && o.LastSeenImportRunId == run.Id);
    }

    [Fact]
    public async Task Identical_file_is_skipped_unless_forced()
    {
        var file = WriteCsv("a.csv", Rows);
        await RunAsync(file);

        var second = await RunAsync(file);
        second.Status.Should().Be(ImportStatus.SkippedUnchanged);
        second.RowsRead.Should().Be(0);

        var forced = await RunAsync(file, force: true);
        forced.Status.Should().Be(ImportStatus.Succeeded);
        forced.RowsInserted.Should().Be(0);
        forced.RowsUnchanged.Should().Be(3);

        await using var db = _fx.CreateContext();
        var org = await db.Organizations.SingleAsync(o => o.Ein == "010555614");
        org.FirstSeenImportRunId.Should().NotBe(forced.Id);
        org.LastSeenImportRunId.Should().Be(forced.Id);
    }

    [Fact]
    public async Task Changed_row_is_updated_and_counted()
    {
        await RunAsync(WriteCsv("a.csv", Rows));

        var changed = Rows.ToArray();
        changed[0] = changed[0].Replace("658857,281666,281666", "700000,300000,300000");
        var run = await RunAsync(WriteCsv("b.csv", changed));

        run.Status.Should().Be(ImportStatus.Succeeded);
        run.RowsInserted.Should().Be(0);
        run.RowsUpdated.Should().Be(1);
        run.RowsUnchanged.Should().Be(2);

        await using var db = _fx.CreateContext();
        var org = await db.Organizations.SingleAsync(o => o.Ein == "010555614");
        org.AssetAmount.Should().Be(700000m);
        org.RevenueAmount.Should().Be(300000m);
        org.UpdatedAt.Should().BeAfter(org.CreatedAt);
    }

    [Fact]
    public async Task Null_state_filter_imports_every_row()
    {
        var run = await RunAsync(WriteCsv("a.csv", Rows), state: null);
        run.RowsInserted.Should().Be(4);
        run.RowsSkipped.Should().Be(1);
    }

    private string WriteCsv(string name, IEnumerable<string> rows)
    {
        var path = Path.Combine(_dir, name);
        File.WriteAllLines(path, new[] { Header }.Concat(rows));
        return path;
    }

    private async Task<ImportRun> RunAsync(string file, bool force = false, string? state = "WA")
    {
        await using var db = _fx.CreateContext();
        var importer = new BmfImporter(db, new HttpClient(), NullLogger<BmfImporter>.Instance);
        return await importer.RunAsync(new BmfImportOptions
        {
            LocalFile = file,
            StateFilter = state,
            Force = force,
            BatchSize = 2, // exercise multi-batch path
        });
    }
}
