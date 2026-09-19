using FluentAssertions;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Tests;

public class BmfRowParserTests
{
    [Theory]
    [InlineData("010555614", "010555614")]
    [InlineData("10555614", "010555614")]      // leading zero lost by a spreadsheet
    [InlineData("01-0555614", "010555614")]    // formatted
    [InlineData(" 010555614 ", "010555614")]
    [InlineData("", null)]
    [InlineData("abc", null)]
    [InlineData("1234567890", null)]           // too long
    public void NormalizeEin_pads_and_strips(string input, string? expected)
        => BmfRowParser.NormalizeEin(input).Should().Be(expected);

    [Theory]
    [InlineData("Okanogan Regional Humane", "OKANOGAN REGIONAL HUMANE")]
    [InlineData("St. Vincent's  Food-Bank, Inc.", "ST VINCENT S FOOD BANK INC")]
    [InlineData("Café Résumé", "CAFE RESUME")]
    [InlineData("   ", "")]
    public void Normalize_uppercases_and_strips_punctuation(string input, string expected)
        => BmfRowParser.Normalize(input).Should().Be(expected);

    [Theory]
    [InlineData("200202", 2002, 2)]
    [InlineData("202512", 2025, 12)]
    public void YearMonth_parses_yyyymm(string input, int year, int month)
        => BmfRowParser.YearMonth(input).Should().Be(new DateOnly(year, month, 1));

    [Theory]
    [InlineData("000000")]
    [InlineData("")]
    [InlineData("202513")]
    [InlineData("2025")]
    public void YearMonth_rejects_junk(string input)
        => BmfRowParser.YearMonth(input).Should().BeNull();

    [Theory]
    [InlineData("658857", "658857")]
    [InlineData("0", "0")]
    [InlineData("-1234", "-1234")]
    [InlineData("1234-", "-1234")]
    [InlineData("", null)]
    [InlineData("n/a", null)]
    public void Amount_handles_signs_and_blanks(string input, string? expected)
        => BmfRowParser.Amount(input).Should().Be(expected is null ? null : decimal.Parse(expected));

    [Theory]
    [InlineData("98841-0000", "98841")]
    [InlineData("98118", "98118")]
    [InlineData("9811", null)]
    [InlineData(null, null)]
    public void Zip5_takes_leading_five_digits(string? input, string? expected)
        => BmfRowParser.Zip5(input).Should().Be(expected);

    [Fact]
    public void Apply_maps_every_field_and_derives_computed_columns()
    {
        var row = new BmfRow
        {
            Ein = "010555614", Name = "OKANOGAN REGIONAL HUMANE", Ico = "% TINA GERMANO-DELAP",
            Street = "398 OMAK RIVER ROAD", City = "OMAK", State = "wa", Zip = "98841-0000", Group = "0000",
            Subsection = "03", Affiliation = "3", Classification = "4000", Ruling = "200202", Deductibility = "1",
            Foundation = "15", Activity = "000000000", Organization = "1", Status = "01", TaxPeriod = "202512",
            AssetCd = "5", IncomeCd = "4", FilingReqCd = "01", PfFilingReqCd = "0", AcctPd = "12",
            AssetAmt = "658857", IncomeAmt = "281666", RevenueAmt = "281666", NteeCd = "d20", SortName = "",
        };
        var org = new Organization { Ein = "010555614" };

        var changed = BmfRowParser.Apply(row, org);

        changed.Should().BeTrue();
        org.Name.Should().Be("OKANOGAN REGIONAL HUMANE");
        org.NameNormalized.Should().Be("OKANOGAN REGIONAL HUMANE");
        org.InCareOf.Should().Be("% TINA GERMANO-DELAP");
        org.State.Should().Be("WA");
        org.Zip5.Should().Be("98841");
        org.Subsection.Should().Be("03");
        org.Is501c3.Should().BeTrue();
        org.RulingDate.Should().Be(new DateOnly(2002, 2, 1));
        org.TaxPeriod.Should().Be(new DateOnly(2025, 12, 1));
        org.FoundationCode.Should().Be("15");
        org.AccountingPeriodMonth.Should().Be(12);
        org.AssetAmount.Should().Be(658857m);
        org.RevenueAmount.Should().Be(281666m);
        org.NteeCode.Should().Be("D20");
        org.NteeMajor.Should().Be("D");
        org.SortName.Should().BeNull();
    }

    [Fact]
    public void Apply_is_idempotent_and_reports_no_change_on_second_pass()
    {
        var row = new BmfRow { Ein = "1", Name = "X", State = "WA", Subsection = "04", NteeCd = "" };
        var org = new Organization { Ein = "000000001" };

        BmfRowParser.Apply(row, org).Should().BeTrue();
        BmfRowParser.Apply(row, org).Should().BeFalse();
        org.Is501c3.Should().BeFalse();
        org.NteeCode.Should().BeNull();
        org.NteeMajor.Should().BeNull();
    }
}
