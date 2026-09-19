namespace WaNonprofitConnect.Data.Codes;

/// <summary>
/// Human-readable labels for the coded fields in the IRS EO BMF extract.
/// Source: IRS "Exempt Organizations Business Master File Extract" information sheet (eo-info.pdf).
/// Unknown codes fall back to the raw value so nothing is silently hidden.
/// </summary>
public static class BmfCodes
{
    public const string Subsection501c3 = "03";

    public static readonly IReadOnlyDictionary<string, string> Subsection = new Dictionary<string, string>
    {
        ["01"] = "501(c)(1) Government instrumentality",
        ["02"] = "501(c)(2) Title-holding corporation",
        ["03"] = "501(c)(3) Charitable, religious, educational, scientific",
        ["04"] = "501(c)(4) Civic league / social welfare",
        ["05"] = "501(c)(5) Labor, agricultural, horticultural",
        ["06"] = "501(c)(6) Business league / chamber of commerce",
        ["07"] = "501(c)(7) Social & recreational club",
        ["08"] = "501(c)(8) Fraternal beneficiary society",
        ["09"] = "501(c)(9) Voluntary employees' beneficiary association",
        ["10"] = "501(c)(10) Domestic fraternal society",
        ["11"] = "501(c)(11) Teachers' retirement fund",
        ["12"] = "501(c)(12) Benevolent life insurance / mutual utility",
        ["13"] = "501(c)(13) Cemetery company",
        ["14"] = "501(c)(14) Credit union",
        ["15"] = "501(c)(15) Mutual insurance company",
        ["16"] = "501(c)(16) Crop-financing corporation",
        ["17"] = "501(c)(17) Supplemental unemployment benefit trust",
        ["18"] = "501(c)(18) Employee-funded pension trust",
        ["19"] = "501(c)(19) Veterans' organization",
        ["20"] = "501(c)(20) Group legal services plan",
        ["21"] = "501(c)(21) Black lung benefit trust",
        ["22"] = "501(c)(22) Multiemployer pension plan",
        ["23"] = "501(c)(23) Veterans' association (pre-1880)",
        ["24"] = "501(c)(24) ERISA 4049 trust",
        ["25"] = "501(c)(25) Multi-parent title-holding corporation",
        ["26"] = "501(c)(26) State-sponsored high-risk health coverage",
        ["27"] = "501(c)(27) State-sponsored workers' compensation reinsurance",
        ["29"] = "501(c)(29) Qualified nonprofit health insurance issuer",
        ["40"] = "501(d) Religious or apostolic association",
        ["50"] = "527 Political organization",
        ["60"] = "4947(a)(2) Split-interest trust",
        ["70"] = "4947(a)(1) Non-exempt charitable trust",
        ["71"] = "501(e) Cooperative hospital service organization",
        ["80"] = "Farmers' cooperative",
        ["81"] = "529 Qualified tuition program",
        ["82"] = "Other",
        ["91"] = "4947 non-exempt trust (IRS code 91)",
        ["92"] = "4947(a)(1) Non-exempt charitable trust (990-PF filer)",
        ["00"] = "No subsection on file",
    };

    public static readonly IReadOnlyDictionary<string, string> Foundation = new Dictionary<string, string>
    {
        ["00"] = "Not a 501(c)(3)",
        ["02"] = "Private operating foundation (exempt from 4940 tax)",
        ["03"] = "Private operating foundation",
        ["04"] = "Private non-operating foundation",
        ["09"] = "Suspense",
        ["10"] = "Church 170(b)(1)(A)(i)",
        ["11"] = "School 170(b)(1)(A)(ii)",
        ["12"] = "Hospital or medical research 170(b)(1)(A)(iii)",
        ["13"] = "Supports a college/university 170(b)(1)(A)(iv)",
        ["14"] = "Governmental unit 170(b)(1)(A)(v)",
        ["15"] = "Publicly supported charity 170(b)(1)(A)(vi)",
        ["16"] = "Publicly supported charity 509(a)(2)",
        ["17"] = "Supporting organization 509(a)(3)",
        ["18"] = "Public safety testing 509(a)(4)",
        ["21"] = "Supporting organization 509(a)(3) Type I",
        ["22"] = "Supporting organization 509(a)(3) Type II",
        ["23"] = "Supporting organization 509(a)(3) Type III functionally integrated",
        ["24"] = "Supporting organization 509(a)(3) Type III non-functionally integrated",
    };

    /// <summary>Foundation codes that indicate a private foundation (a grant-maker, not a typical need-poster).</summary>
    public static readonly IReadOnlySet<string> PrivateFoundationCodes = new HashSet<string> { "02", "03", "04" };

    public static readonly IReadOnlyDictionary<string, string> Deductibility = new Dictionary<string, string>
    {
        ["1"] = "Contributions are deductible",
        ["2"] = "Contributions are not deductible",
        ["4"] = "Contributions deductible by treaty (foreign org)",
    };

    public static readonly IReadOnlyDictionary<string, string> Status = new Dictionary<string, string>
    {
        ["01"] = "Unconditional exemption",
        ["02"] = "Conditional exemption",
        ["12"] = "Trust described in 4947(a)(2)",
        ["25"] = "Terminating private foundation status (507(b)(1)(B))",
    };

    public static readonly IReadOnlyDictionary<string, string> FilingRequirement = new Dictionary<string, string>
    {
        ["00"] = "Not required to file (other)",
        ["01"] = "Form 990 / 990-EZ required",
        ["02"] = "Form 990-N (e-Postcard) — gross receipts under $50k",
        ["03"] = "Group return",
        ["04"] = "Form 990-BL",
        ["06"] = "Not required to file (church)",
        ["07"] = "Not required to file (501(c)(1) government)",
        ["13"] = "Not required to file (religious organization)",
        ["14"] = "Not required to file (state instrumentality)",
    };

    public static readonly IReadOnlyDictionary<string, string> PfFilingRequirement = new Dictionary<string, string>
    {
        ["0"] = "No 990-PF required",
        ["1"] = "Form 990-PF required",
    };

    public static readonly IReadOnlyDictionary<string, string> Affiliation = new Dictionary<string, string>
    {
        ["1"] = "Central — no group exemption",
        ["2"] = "Intermediate — no group exemption",
        ["3"] = "Independent",
        ["6"] = "Central — group exemption (parent not a church)",
        ["7"] = "Intermediate — group exemption",
        ["8"] = "Central — group exemption (parent is a church)",
        ["9"] = "Subordinate in a group exemption",
    };

    public static readonly IReadOnlyDictionary<string, string> OrganizationType = new Dictionary<string, string>
    {
        ["1"] = "Corporation",
        ["2"] = "Trust",
        ["3"] = "Cooperative",
        ["4"] = "Partnership",
        ["5"] = "Association",
    };

    /// <summary>Shared by ASSET_CD and INCOME_CD.</summary>
    public static readonly IReadOnlyDictionary<string, string> AmountBand = new Dictionary<string, string>
    {
        ["0"] = "$0",
        ["1"] = "$1 – $9,999",
        ["2"] = "$10,000 – $24,999",
        ["3"] = "$25,000 – $99,999",
        ["4"] = "$100,000 – $499,999",
        ["5"] = "$500,000 – $999,999",
        ["6"] = "$1M – $4.99M",
        ["7"] = "$5M – $9.99M",
        ["8"] = "$10M – $49.99M",
        ["9"] = "$50M+",
    };

    public static readonly IReadOnlyDictionary<string, string> NteeMajorGroup = new Dictionary<string, string>
    {
        ["A"] = "Arts, Culture & Humanities",
        ["B"] = "Education",
        ["C"] = "Environment",
        ["D"] = "Animal-Related",
        ["E"] = "Health Care",
        ["F"] = "Mental Health & Crisis Intervention",
        ["G"] = "Voluntary Health Associations & Medical Disciplines",
        ["H"] = "Medical Research",
        ["I"] = "Crime & Legal-Related",
        ["J"] = "Employment",
        ["K"] = "Food, Agriculture & Nutrition",
        ["L"] = "Housing & Shelter",
        ["M"] = "Public Safety, Disaster Preparedness & Relief",
        ["N"] = "Recreation & Sports",
        ["O"] = "Youth Development",
        ["P"] = "Human Services",
        ["Q"] = "International, Foreign Affairs & National Security",
        ["R"] = "Civil Rights, Social Action & Advocacy",
        ["S"] = "Community Improvement & Capacity Building",
        ["T"] = "Philanthropy, Voluntarism & Grantmaking Foundations",
        ["U"] = "Science & Technology",
        ["V"] = "Social Science",
        ["W"] = "Public & Societal Benefit",
        ["X"] = "Religion-Related",
        ["Y"] = "Mutual & Membership Benefit",
        ["Z"] = "Unknown",
    };

    /// <summary>ProPublica Nonprofit Explorer's 10 buckets, keyed by NTEE major letter.</summary>
    public static readonly IReadOnlyDictionary<string, (int Id, string Name)> ProPublicaCategory = new Dictionary<string, (int, string)>
    {
        ["A"] = (1, "Arts, Culture & Humanities"),
        ["B"] = (2, "Education"),
        ["C"] = (3, "Environment and Animals"),
        ["D"] = (3, "Environment and Animals"),
        ["E"] = (4, "Health"),
        ["F"] = (4, "Health"),
        ["G"] = (4, "Health"),
        ["H"] = (4, "Health"),
        ["I"] = (5, "Human Services"),
        ["J"] = (5, "Human Services"),
        ["K"] = (5, "Human Services"),
        ["L"] = (5, "Human Services"),
        ["M"] = (5, "Human Services"),
        ["N"] = (5, "Human Services"),
        ["O"] = (5, "Human Services"),
        ["P"] = (5, "Human Services"),
        ["Q"] = (6, "International, Foreign Affairs"),
        ["R"] = (7, "Public, Societal Benefit"),
        ["S"] = (7, "Public, Societal Benefit"),
        ["T"] = (7, "Public, Societal Benefit"),
        ["U"] = (7, "Public, Societal Benefit"),
        ["V"] = (7, "Public, Societal Benefit"),
        ["W"] = (7, "Public, Societal Benefit"),
        ["X"] = (8, "Religion Related"),
        ["Y"] = (9, "Mutual/Membership Benefit"),
        ["Z"] = (10, "Unknown, Unclassified"),
    };

    public static string Label(IReadOnlyDictionary<string, string> table, string? code)
        => string.IsNullOrWhiteSpace(code) ? "(none)" : table.TryGetValue(code, out var v) ? v : $"Unknown code {code}";
}
