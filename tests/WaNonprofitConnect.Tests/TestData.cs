using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Tests;

/// <summary>Shared seed rows for the alpha tests (accounts, board, threads, map).</summary>
internal static class TestData
{
    public const string A = "000000001"; // Seattle 501c3
    public const string B = "000000002"; // Tacoma 501c3
    public const string C = "000000003"; // Seattle 501c3
    public const string D = "000000004"; // Spokane 501c3
    public const string NotC3 = "000000009";

    public static void SeedOrgs(AppDbContext db)
    {
        var run = new ImportRun { Source = ImportSource.Bmf, Status = ImportStatus.Succeeded, StartedAt = DateTime.UtcNow };
        db.ImportRuns.Add(run);
        db.SaveChanges();
        db.Organizations.AddRange(
            Org(run, A, "ALPHA FOOD BANK", "SEATTLE", "98101", "03"),
            Org(run, B, "BETA HABITAT", "TACOMA", "98402", "03"),
            Org(run, C, "GAMMA TOOL LIBRARY", "SEATTLE", "98118", "03"),
            Org(run, D, "DELTA REFURB", "SPOKANE", "99201", "03"),
            Org(run, NotC3, "EPSILON CHAMBER OF COMMERCE", "SEATTLE", "98101", "06"));
        db.SaveChanges();
    }

    public static Organization Org(ImportRun run, string ein, string name, string city, string zip, string sub) => new()
    {
        Ein = ein, Name = name, NameNormalized = BmfRowParser.Normalize(name), City = city, State = "WA", Zip = zip, Zip5 = zip,
        Subsection = sub, Is501c3 = sub == "03", FirstSeenImportRun = run, LastSeenImportRun = run, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
    };
}
