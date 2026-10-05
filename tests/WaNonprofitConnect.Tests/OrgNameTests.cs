using FluentAssertions;
using WaNonprofitConnect.Data;

namespace WaNonprofitConnect.Tests;

/// <summary>S-98: organization names read in normal case, keeping acronyms. Examples are real names from the WA IRS list,
/// except the apostrophe and mixed-case ones (the IRS list has neither).</summary>
[Trait("Story", "S-98")]
public sealed class OrgNameTests
{
    [Theory]
    [InlineData("BALLARD FOOD BANK", "Ballard Food Bank")]
    [InlineData("SOUTHEAST SEATTLE TOOL LIBRARY", "Southeast Seattle Tool Library")]
    [InlineData("HOPELINK", "Hopelink")]
    [InlineData("SECOND HARVEST INLAND NORTHWEST", "Second Harvest Inland Northwest")]
    public void Each_word_is_title_case(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("COMPUTERS 4 PEOPLE IN NEED", "Computers 4 People in Need")]
    [InlineData("TACOMA-PIERCE HABITAT FOR HUMANITY", "Tacoma-Pierce Habitat for Humanity")]
    [InlineData("YOUTH WITH A MISSION PORT ORCHARD", "Youth with a Mission Port Orchard")]
    [InlineData("KNIGHTS OF COLUMBUS", "Knights of Columbus")]
    [InlineData("FLOOD THE SOUND FELLOWSHIP", "Flood the Sound Fellowship")]
    [InlineData("CASA DE DIOS PUERTA DEL CIELO IGLESIA APOSTOLICA MISIONERA", "Casa de Dios Puerta del Cielo Iglesia Apostolica Misionera")]
    public void Small_words_are_lower_case_in_the_middle(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("THE TACOMA BOXING CLUB INCORPORATED", "The Tacoma Boxing Club Incorporated")]
    [InlineData("A HIGHER CALLING PNW", "A Higher Calling PNW")]
    [InlineData("TOGETHER WITH US", "Together with Us")]
    [InlineData("PHI SIGMA KAPPA - CHI DEUTERON", "Phi Sigma Kappa - Chi Deuteron")]
    [InlineData("PAGE BY PAGE - MOMBASA", "Page by Page - Mombasa")]
    public void Small_words_are_capitalized_first_last_and_after_a_dash(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("YWCA OF OLYMPIA", "YWCA of Olympia")]
    [InlineData("SEATTLE SPECIAL ED PTSA", "Seattle Special Ed PTSA")]
    [InlineData("BARBARA MCCLINTOCK PTO", "Barbara McClintock PTO")]
    [InlineData("OPTIMIST CLUB OF VANCOUVER WA FOUNDATION", "Optimist Club of Vancouver WA Foundation")]
    [InlineData("PNW BIPOC FARMLAND TRUST", "PNW BIPOC Farmland Trust")]
    [InlineData("SPOKANE AIDS NETWORK", "Spokane AIDS Network")]
    [InlineData("YWAM PUBLISHING A MINISTRY OF YOUTH WITH A MISSION", "YWAM Publishing a Ministry of Youth with a Mission")]
    [InlineData("SOMETHING DEEPER MINISTRIES SDM-USA", "Something Deeper Ministries SDM-USA")]
    [InlineData("FRIENDS OF KEXP", "Friends of KEXP")]
    [InlineData("AI AND FAITH", "AI and Faith")]
    public void Listed_acronyms_stay_capitals(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("992 VFW AUXILIARY TO GRANT FARMER POST", "992 VFW Auxiliary to Grant Farmer Post")]
    [InlineData("AUBURN FMC", "Auburn FMC")]
    [InlineData("WARBORN MC", "Warborn MC")]
    [InlineData("SECURE FUTURE DYNAMICS NP PS", "Secure Future Dynamics NP PS")]
    public void Short_words_with_no_vowel_stay_capitals(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("MT ADAMS RESOURCE STEWARDS", "Mt Adams Resource Stewards")]
    [InlineData("CHRISTIAN LIFE ASSEMBLY ST JOHN", "Christian Life Assembly St John")]
    [InlineData("INLAND NORTHWEST SHEET METAL LABOR MGT COOP TRUST", "Inland Northwest Sheet Metal Labor Mgt Coop Trust")]
    [InlineData("MOUNT RAINIER CHR CTR OF THE ASSEMBLIES OF GOD", "Mount Rainier Chr Ctr of the Assemblies of God")]
    public void Short_forms_of_words_read_as_words(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("NORTHWEST HARVEST E M M", "Northwest Harvest E M M")]
    [InlineData("HARRY S TRUMAN P T A", "Harry S Truman P T A")]
    [InlineData("BARBARA A STONE FOUNDATION FOR BAGLEY PERFORMING ARTS", "Barbara A Stone Foundation for Bagley Performing Arts")]
    [InlineData("ARGONAUT II HISTORIC BOAT FOUNDATION", "Argonaut II Historic Boat Foundation")]
    [InlineData("YVFWC HEALTHCARE FACILITIES DEVELOPMENT III", "Yvfwc Healthcare Facilities Development III")]
    public void Single_letters_and_roman_numerals_stay_capitals(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("US NAVAL ACADEMY PARENTS CLUB OF WASHINGTON", "US Naval Academy Parents Club of Washington")]
    [InlineData("VETERANS OF FOREIGN WARS OF THE US DEPARTMENT OF WASHINGTON", "Veterans of Foreign Wars of the US Department of Washington")]
    [InlineData("US-JAPAN GATEWAY FOUNDATION", "US-Japan Gateway Foundation")]
    [InlineData("HELP US SERVE OTHERS A NONPROFIT CORPORATION", "Help Us Serve Others a Nonprofit Corporation")]
    [InlineData("BARKS R US RESCUE", "Barks R Us Rescue")]
    [InlineData("THE AGES OF US", "The Ages of Us")]
    public void Us_is_the_country_unless_it_is_the_pronoun(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("GRAYS HARBOR COUNTY CASA", "Grays Harbor County CASA")]
    [InlineData("FAMILY LAW CASA OF KING COUNTY", "Family Law CASA of King County")]
    [InlineData("CHELAN-DOUGLAS COUNTY CASA-GAL PROGRAM", "Chelan-Douglas County CASA-GAL Program")]
    [InlineData("CASA LATINA", "Casa Latina")]
    public void Casa_is_the_court_program_only_beside_county_law_or_of(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("TRI-CITIES FOOD CO-OP", "Tri-Cities Food Co-op")]
    [InlineData("WHITE SALMON VALLEY K-8 PARENT-TEACHER ORGANIZATION", "White Salmon Valley K-8 Parent-Teacher Organization")]
    [InlineData("WOMENS COUNCIL OF REALTORS-LOWER PUGET SOUND", "Womens Council of Realtors-Lower Puget Sound")]
    public void Each_part_of_a_hyphen_is_cased(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("ED MCCAFFREY - GORDY NEILSON MEMORIAL GOLF TOURNAMENT", "Ed McCaffrey - Gordy Neilson Memorial Golf Tournament")]
    [InlineData("BERNIER MCCAW FOUNDATION", "Bernier McCaw Foundation")]
    [InlineData("O'BRIEN FAMILY FOUNDATION", "O'Brien Family Foundation")]
    [InlineData("SEATTLE CHILDREN'S HOSPITAL FOUNDATION", "Seattle Children's Hospital Foundation")]
    [InlineData("MACHINE SHOP ARTS", "Machine Shop Arts")]
    public void Mc_names_and_apostrophes(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("POTTER S HOUSE", "Potter's House")]
    [InlineData("SEATTLE PEOPLE S FUND", "Seattle People's Fund")]
    [InlineData("NEWAUKUM VALLEY GOLF MEN S CLUB", "Newaukum Valley Golf Men's Club")]
    [InlineData("FRED H AND MARY S DORE CHARITABLE FFOUNDATION", "Fred H and Mary S Dore Charitable Ffoundation")]
    [InlineData("PAUL S PARISER FOUNDATION INC", "Paul S Pariser Foundation Inc")]
    public void A_lone_s_is_a_lost_apostrophe_only_beside_a_word_that_owns_or_is_owned(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("1ST TONGAN AMERICAN COMMUNITY OF WASHINGTON", "1st Tongan American Community of Washington")]
    [InlineData("3RD BN 161ST INFANTRY DARK RIFLE AS SOCIATION", "3rd BN 161st Infantry Dark Rifle As Sociation")]
    [InlineData("MANTRA4CHANGE US", "Mantra4Change US")]
    [InlineData("SEHOME PTSA 8-3-100", "Sehome PTSA 8-3-100")]
    public void Numbers_and_ordinals(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("THE@SAM & ANNE THOEN FOUNDATION", "The Sam & Anne Thoen Foundation")]
    [InlineData("KITSAP TREES & SHORELINE ASSOCIATION", "Kitsap Trees & Shoreline Association")]
    [InlineData("PB&J SUPPORT SERVICES", "PB&J Support Services")]
    [InlineData("FOOD BANK, INC.", "Food Bank, Inc.")]
    public void Symbols_and_punctuation(string raw, string shown) => OrgName.Display(raw).Should().Be(shown);

    [Theory]
    [InlineData("Seattle Public Schools")]
    [InlineData("FareStart")]
    [InlineData("")]
    public void Names_already_in_mixed_case_come_back_unchanged(string raw) => OrgName.Display(raw).Should().Be(raw);
}
