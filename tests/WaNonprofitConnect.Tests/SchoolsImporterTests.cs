using System.Net;
using System.Text.Json;
using System.Web;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Tests;

public sealed class SchoolsImporterTests : IDisposable
{
    private static readonly SchoolRow[] Rows =
    {
        Row(1656, "10th Street School", "7204 27th Ave NE, Marysville, WA 98271-9162", 31025, "Marysville School District", "Middle School", "6", "8", "Snohomish", 48.061145, -122.199808),
        Row(4500, "A G West Black Hills High School", "7741 Littlerock Rd SW, Tumwater, WA 98512-7427", 34033, "Tumwater School District", "High School", "9", "12", "Thurston", 46.977878, -122.947689),
        Row(2834, "A J West Elementary School", "1801 Bay Ave, Aberdeen, WA 98520-5510", 14005, "Aberdeen School District", "Elementary School", "PK", "5", "Grays Harbor", 46.975, -123.815),
        Row(2835, "Aberdeen High School", "410 N G St, Aberdeen, WA 98520", 14005, "Aberdeen School District", "High School", "9", "12", "Grays Harbor", 46.985, -123.805),
        Row(null, "Broken Row", "1 Nowhere St, Olympia, WA 98501", 34033, "Tumwater School District", "Other", "K", "5", "Thurston", 47.0, -122.9),
    };

    private readonly SqliteDbFixture _fx = new();
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "wanc-tests", Guid.NewGuid().ToString("N"));

    public SchoolsImporterTests() => Directory.CreateDirectory(_dir);

    public void Dispose()
    {
        _fx.Dispose();
        try { Directory.Delete(_dir, recursive: true); } catch { /* best effort */ }
    }

    [Fact]
    public async Task First_import_pages_through_the_service_and_inserts_schools_and_districts()
    {
        var handler = new FakeArcGisHandler(Rows);

        var run = await RunAsync(handler, pageSize: 2);

        run.Status.Should().Be(ImportStatus.Succeeded);
        run.Source.Should().Be(ImportSource.Schools);
        run.RowsRead.Should().Be(5);
        run.RowsInserted.Should().Be(4);
        run.RowsSkipped.Should().Be(1, "one row has no SchoolCode");
        run.Errors.Should().Contain("Broken Row");
        run.LocalFilePath.Should().StartWith(_dir).And.EndWith(".json");
        run.FileSha256.Should().HaveLength(64);

        handler.Offsets.Should().Equal(new[] { 0, 2, 4 }, "5 rows at 2 per page: the third page is short and stops the loop");
        handler.Requests.Should().OnlyContain(u => u.Contains("outFields=" + SchoolsImporter.OutFields) && u.Contains("f=json"));

        await using var db = _fx.CreateContext();
        var schools = await db.Schools.OrderBy(s => s.SchoolCode).ToListAsync();
        schools.Select(s => s.SchoolCode).Should().Equal(1656, 2834, 2835, 4500);
        var marysville = schools.Single(s => s.SchoolCode == 1656);
        marysville.City.Should().Be("MARYSVILLE");
        marysville.Zip5.Should().Be("98271");
        marysville.LeaCode.Should().Be(31025);
        marysville.Latitude.Should().Be(48.061145);
        schools.Should().OnlyContain(s => s.FirstSeenImportRunId == run.Id && s.LastSeenImportRunId == run.Id);

        var districts = await db.SchoolDistricts.OrderBy(d => d.LeaCode).ToListAsync();
        districts.Select(d => d.LeaCode).Should().Equal(14005, 31025, 34033);
        var aberdeen = districts.Single(d => d.LeaCode == 14005);
        aberdeen.Name.Should().Be("Aberdeen School District");
        aberdeen.City.Should().Be("ABERDEEN");
        aberdeen.Zip5.Should().Be("98520");
        aberdeen.SchoolCount.Should().Be(2);
        aberdeen.Latitude.Should().BeApproximately(46.98, 1e-6);
        aberdeen.Longitude.Should().BeApproximately(-123.81, 1e-6);
        districts.Should().OnlyContain(d => d.FirstSeenImportRunId == run.Id && d.LastSeenImportRunId == run.Id);
    }

    [Fact]
    public async Task Full_last_page_is_followed_by_an_empty_page_then_stops()
    {
        var handler = new FakeArcGisHandler(Rows.Take(4).ToArray());

        var run = await RunAsync(handler, pageSize: 2);

        run.RowsInserted.Should().Be(4);
        handler.Offsets.Should().Equal(new[] { 0, 2, 4 }, "the service reports exceededTransferLimit on the full second page, so one more (empty) page is fetched");
    }

    [Fact]
    public async Task Identical_snapshot_is_skipped_unless_forced()
    {
        await RunAsync(new FakeArcGisHandler(Rows));

        var second = await RunAsync(new FakeArcGisHandler(Rows));
        second.Status.Should().Be(ImportStatus.SkippedUnchanged);
        second.RowsRead.Should().Be(0);

        var forced = await RunAsync(new FakeArcGisHandler(Rows), force: true);
        forced.Status.Should().Be(ImportStatus.Succeeded);
        forced.RowsInserted.Should().Be(0);
        forced.RowsUnchanged.Should().Be(4);

        await using var db = _fx.CreateContext();
        var school = await db.Schools.SingleAsync(s => s.SchoolCode == 1656);
        school.FirstSeenImportRunId.Should().NotBe(forced.Id);
        school.LastSeenImportRunId.Should().Be(forced.Id);
        var district = await db.SchoolDistricts.SingleAsync(d => d.LeaCode == 31025);
        district.LastSeenImportRunId.Should().Be(forced.Id);
    }

    [Fact]
    public async Task Changed_row_is_updated_and_counted()
    {
        await RunAsync(new FakeArcGisHandler(Rows));

        var changed = Rows.Select(Clone).ToArray();
        changed[0].PhysicalAddress = "9999 New Campus Rd, Everett, WA 98201-1234";
        changed[0].HighestGrade = "9";
        var run = await RunAsync(new FakeArcGisHandler(changed));

        run.Status.Should().Be(ImportStatus.Succeeded);
        run.RowsInserted.Should().Be(0);
        run.RowsUpdated.Should().Be(1);
        run.RowsUnchanged.Should().Be(3);

        await using var db = _fx.CreateContext();
        var school = await db.Schools.SingleAsync(s => s.SchoolCode == 1656);
        school.City.Should().Be("EVERETT");
        school.Zip5.Should().Be("98201");
        school.HighestGrade.Should().Be("9");
        school.UpdatedAt.Should().BeAfter(school.CreatedAt);

        var district = await db.SchoolDistricts.SingleAsync(d => d.LeaCode == 31025);
        district.City.Should().Be("EVERETT", "the district's city follows its schools");
    }

    [Fact]
    public async Task Duplicate_school_codes_in_the_feed_collapse_to_one_row_last_wins()
    {
        var rows = Rows.Take(2).Select(Clone).Concat(new[] { Clone(Rows[0]) }).ToArray();
        rows[2].School = "10th Street School (renamed)";

        var run = await RunAsync(new FakeArcGisHandler(rows));

        run.RowsRead.Should().Be(3);
        run.RowsInserted.Should().Be(2);
        await using var db = _fx.CreateContext();
        (await db.Schools.SingleAsync(s => s.SchoolCode == 1656)).Name.Should().Be("10th Street School (renamed)");
        (await db.SchoolDistricts.SingleAsync(d => d.LeaCode == 31025)).SchoolCount.Should().Be(1);
    }

    [Fact]
    public async Task Local_snapshot_file_imports_without_touching_the_network()
    {
        var file = Path.Combine(_dir, "snapshot.json");
        await File.WriteAllTextAsync(file, FakeArcGisHandler.Page(Rows, exceeded: false));
        var handler = new FakeArcGisHandler(Array.Empty<SchoolRow>());

        var run = await RunAsync(handler, localFile: file);

        run.Status.Should().Be(ImportStatus.Succeeded);
        run.RowsInserted.Should().Be(4);
        run.SourceUrl.Should().BeNull();
        run.LocalFilePath.Should().Be(Path.GetFullPath(file));
        handler.Requests.Should().BeEmpty();
    }

    [Fact]
    public async Task Service_error_fails_before_any_run_is_recorded()
    {
        var handler = new FakeArcGisHandler(Rows) { ErrorMessage = "Invalid query parameters." };

        var act = () => RunAsync(handler);

        await act.Should().ThrowAsync<HttpRequestException>().WithMessage("*Invalid query parameters*");
        await using var db = _fx.CreateContext();
        (await db.ImportRuns.CountAsync()).Should().Be(0);
        (await db.Schools.CountAsync()).Should().Be(0);
    }

    private async Task<ImportRun> RunAsync(FakeArcGisHandler handler, bool force = false, int pageSize = 2000, string? localFile = null)
    {
        await using var db = _fx.CreateContext();
        var importer = new SchoolsImporter(db, new HttpClient(handler), NullLogger<SchoolsImporter>.Instance);
        return await importer.RunAsync(new SchoolsImportOptions
        {
            Url = "https://example.test/arcgis/rest/services/Schools/FeatureServer/0",
            DataDirectory = _dir,
            LocalFile = localFile,
            Force = force,
            PageSize = pageSize,
            BatchSize = 2, // exercise multi-batch path
        });
    }

    private static SchoolRow Row(int? code, string name, string address, int lea, string leaName, string gradeCategory,
        string lowest, string highest, string county, double lat, double lon) => new()
    {
        SchoolCode = code, School = name, PhysicalAddress = address, LEACode = lea, LEAName = leaName,
        SchoolCategory = "Public School,Regular School", GradeCategory = gradeCategory, LowestGrade = lowest, HighestGrade = highest,
        County = county, BldgLatitude = lat, BldgLongitude = lon,
    };

    private static SchoolRow Clone(SchoolRow r) => new()
    {
        SchoolCode = r.SchoolCode, School = r.School, PhysicalAddress = r.PhysicalAddress, LEACode = r.LEACode, LEAName = r.LEAName,
        SchoolCategory = r.SchoolCategory, GradeCategory = r.GradeCategory, LowestGrade = r.LowestGrade, HighestGrade = r.HighestGrade,
        County = r.County, BldgLatitude = r.BldgLatitude, BldgLongitude = r.BldgLongitude,
    };

    /// <summary>Serves ArcGIS-shaped pages from an in-memory row list, honouring resultOffset / resultRecordCount.</summary>
    private sealed class FakeArcGisHandler : HttpMessageHandler
    {
        private readonly SchoolRow[] _rows;
        public List<string> Requests { get; } = new();
        public List<int> Offsets { get; } = new();
        public string? ErrorMessage { get; init; }

        public FakeArcGisHandler(SchoolRow[] rows) => _rows = rows;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var url = request.RequestUri!.ToString();
            Requests.Add(url);
            var qs = HttpUtility.ParseQueryString(request.RequestUri!.Query);
            var offset = int.Parse(qs["resultOffset"]!);
            var count = int.Parse(qs["resultRecordCount"]!);
            Offsets.Add(offset);

            string body;
            if (ErrorMessage is not null)
            {
                body = JsonSerializer.Serialize(new { error = new { code = 400, message = ErrorMessage, details = Array.Empty<string>() } });
            }
            else
            {
                var page = _rows.Skip(offset).Take(count).ToArray();
                // ArcGIS sets exceededTransferLimit whenever the page was capped at resultRecordCount.
                body = Page(page, exceeded: page.Length == count);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json"),
            });
        }

        public static string Page(SchoolRow[] rows, bool exceeded) => JsonSerializer.Serialize(new
        {
            objectIdFieldName = "OBJECTID",
            exceededTransferLimit = exceeded,
            features = rows.Select(r => new { attributes = r }).ToArray(),
        });
    }
}
