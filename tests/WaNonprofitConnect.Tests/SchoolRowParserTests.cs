using FluentAssertions;
using WaNonprofitConnect.Data.Codes;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Tests;

public class SchoolRowParserTests
{
    [Theory]
    [InlineData("6110 28th Ave NW, Seattle, WA 98107-5314", "6110 28th Ave NW", "SEATTLE", "98107-5314", "98107")]
    [InlineData("7204 27th Ave NE, Marysville, WA 98271-9162", "7204 27th Ave NE", "MARYSVILLE", "98271-9162", "98271")]
    [InlineData("1801 Bay Ave, Aberdeen, WA 98520", "1801 Bay Ave", "ABERDEEN", "98520", "98520")]
    [InlineData("PO Box 1, Suite 2, Yakima, WA 98901", "PO Box 1, Suite 2", "YAKIMA", "98901", "98901")]  // comma inside the street part
    [InlineData("100 Main St, Spokane, wa 99201", "100 Main St", "SPOKANE", "99201", "99201")]              // lowercase state
    [InlineData("100 Main St,Tacoma,WA,98402", "100 Main St", "TACOMA", "98402", "98402")]                  // no spaces, comma before zip
    [InlineData("  100 Main St, Olympia, WA 98501  ", "100 Main St", "OLYMPIA", "98501", "98501")]
    public void ParseAddress_splits_street_city_zip(string input, string street, string city, string zip, string zip5)
    {
        var a = SchoolRowParser.ParseAddress(input);
        a.Ok.Should().BeTrue();
        a.Street.Should().Be(street);
        a.City.Should().Be(city);
        a.Zip.Should().Be(zip);
        a.Zip5.Should().Be(zip5);
    }

    [Fact]
    public void ParseAddress_without_zip_still_yields_city()
    {
        var a = SchoolRowParser.ParseAddress("100 Main St, Walla Walla, WA");
        a.Ok.Should().BeTrue();
        a.City.Should().Be("WALLA WALLA");
        a.Zip.Should().BeNull();
        a.Zip5.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("100 Main St")]                       // no city / state
    [InlineData("100 Main St, Portland, OR 97201")]   // wrong state
    [InlineData("Seattle, WA 98101")]                 // no street segment
    public void ParseAddress_rejects_unparseable(string? input)
    {
        var a = SchoolRowParser.ParseAddress(input);
        a.Ok.Should().BeFalse();
        a.City.Should().BeNull();
        a.Zip5.Should().BeNull();
    }

    [Theory]
    [InlineData(48.061145, -122.199808, 48.061145, -122.199808)]
    [InlineData(48.0611451234, -122.1998089876, 48.061145, -122.199809)] // rounded to 6 places
    public void Coordinates_rounds(double lat, double lon, double expectedLat, double expectedLon)
        => SchoolRowParser.Coordinates(lat, lon).Should().Be((expectedLat, expectedLon));

    [Theory]
    [InlineData(null, -122.2)]
    [InlineData(48.0, null)]
    [InlineData(0.0, 0.0)]
    [InlineData(91.0, -122.2)]
    [InlineData(48.0, 181.0)]
    [InlineData(double.NaN, -122.2)]
    public void Coordinates_rejects_missing_or_impossible(double? lat, double? lon)
        => SchoolRowParser.Coordinates(lat, lon).Should().Be(((double?)null, (double?)null));

    [Fact]
    public void Apply_maps_every_field_and_reports_changes()
    {
        var row = new SchoolRow
        {
            SchoolCode = 1656, School = " 10th Street School ", PhysicalAddress = "7204 27th Ave NE, Marysville, WA 98271-9162",
            LEACode = 31025, LEAName = "Marysville School District", SchoolCategory = "Public School,Regular School",
            GradeCategory = "Middle School", LowestGrade = "6", HighestGrade = "8", County = "Snohomish",
            BldgLatitude = 48.061145, BldgLongitude = -122.199808,
        };
        var school = new School { SchoolCode = 1656 };

        SchoolRowParser.Apply(row, school).Should().BeTrue();
        school.Name.Should().Be("10th Street School");
        school.NameNormalized.Should().Be("10TH STREET SCHOOL");
        school.PhysicalAddress.Should().Be("7204 27th Ave NE, Marysville, WA 98271-9162");
        school.Street.Should().Be("7204 27th Ave NE");
        school.City.Should().Be("MARYSVILLE");
        school.Zip.Should().Be("98271-9162");
        school.Zip5.Should().Be("98271");
        school.LeaCode.Should().Be(31025);
        school.LeaName.Should().Be("Marysville School District");
        school.SchoolCategory.Should().Be("Public School,Regular School");
        school.GradeCategory.Should().Be("Middle School");
        school.LowestGrade.Should().Be("6");
        school.HighestGrade.Should().Be("8");
        school.County.Should().Be("Snohomish");
        school.Latitude.Should().Be(48.061145);
        school.Longitude.Should().Be(-122.199808);

        SchoolRowParser.Apply(row, school).Should().BeFalse("nothing changed on a second apply");

        row.HighestGrade = "9";
        SchoolRowParser.Apply(row, school).Should().BeTrue();
        school.HighestGrade.Should().Be("9");
    }

    [Fact]
    public void BuildDistricts_groups_by_lea_and_averages_coordinates()
    {
        var rows = new[]
        {
            Row(1, 100, "Seattle Public Schools", "1 A St, Seattle, WA 98101", "King", 47.60, -122.30),
            Row(2, 100, "Seattle Public Schools", "2 B St, Seattle, WA 98103", "King", 47.70, -122.40),
            Row(3, 100, "Seattle Public Schools", "3 C St, Shoreline, WA 98101", "King", null, null),
            Row(4, 200, "Aberdeen School District", "1801 Bay Ave, Aberdeen, WA 98520", "Grays Harbor", 46.97, -123.81),
            Row(5, null, "No LEA", "1 X St, Nowhere, WA 98000", "King", 47.0, -122.0),
        };

        var districts = SchoolRowParser.BuildDistricts(rows);

        districts.Should().HaveCount(2);
        var seattle = districts.Single(d => d.LeaCode == 100);
        seattle.Name.Should().Be("Seattle Public Schools");
        seattle.County.Should().Be("King");
        seattle.City.Should().Be("SEATTLE");
        seattle.Zip5.Should().Be("98101");
        seattle.SchoolCount.Should().Be(3);
        seattle.Latitude.Should().BeApproximately(47.65, 1e-6, "mean of the two located schools");
        seattle.Longitude.Should().BeApproximately(-122.35, 1e-6);

        var aberdeen = districts.Single(d => d.LeaCode == 200);
        aberdeen.SchoolCount.Should().Be(1);
        aberdeen.Latitude.Should().Be(46.97);
    }

    [Fact]
    public void BuildDistricts_with_no_located_schools_has_null_coordinates()
    {
        var districts = SchoolRowParser.BuildDistricts(new[] { Row(1, 300, "Remote SD", "1 A St, Forks, WA 98331", "Clallam", null, null) });
        districts.Single().Latitude.Should().BeNull();
        districts.Single().Longitude.Should().BeNull();
    }

    [Theory]
    [InlineData("High School", "High school")]
    [InlineData("Middle School", "Middle school")]
    [InlineData("Jr High", "Middle school")]
    [InlineData("Elementary School", "Elementary school")]
    [InlineData("K-12", "K-12")]
    [InlineData("PK-12", "K-12")]
    [InlineData("PK Only", "Other")]
    [InlineData("Other", "Other")]
    [InlineData(null, "Other")]
    public void SubLabel_maps_grade_category(string? gradeCategory, string expected)
        => OspiCodes.SubLabel(gradeCategory).Should().Be(expected);

    private static SchoolRow Row(int code, int? lea, string leaName, string address, string county, double? lat, double? lon) => new()
    {
        SchoolCode = code, School = $"School {code}", PhysicalAddress = address, LEACode = lea, LEAName = leaName,
        County = county, BldgLatitude = lat, BldgLongitude = lon,
    };
}
