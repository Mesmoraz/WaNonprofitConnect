using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;
using WaNonprofitConnect.Data.Queries;
using WaNonprofitConnect.Cli;

// Usage:
//   wanc import bmf [--state WA|all] [--url <csv url>] [--file <local csv>] [--force]
//   wanc import schools [--url <feature layer url>] [--file <local snapshot.json>] [--force]
//   wanc import-zips [--url <gazetteer zip>] [--file <local .zip/.txt>] [--force]
//   wanc stats [--state WA]
//   wanc imports
//
// Kept deliberately tiny: a few commands, a handful of flags, no CLI framework.

var argv = new Args(args);
if (argv.Positional.Count == 0 || argv.Has("--help") || argv.Has("-h"))
{
    PrintUsage();
    ExchangeCommands.Usage();
    return 0;
}

// Exchange commands go over HTTP to the running API (like any client app would) and need no DB access here.
if (ExchangeCommands.Commands.Contains(argv.Positional[0].ToLowerInvariant()))
{
    var apiBase = argv.Value("--api") ?? Environment.GetEnvironmentVariable("WANC_API") ?? "http://localhost:5253";
    return await ExchangeCommands.RunAsync(argv, apiBase);
}

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.AddEnvironmentVariables("WANC_");
builder.Logging.SetMinimumLevel(LogLevel.Information);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http", LogLevel.Warning);

var connection = builder.Configuration.GetConnectionString("Default")
                 ?? builder.Configuration["CONNECTION"]
                 ?? DesignTimeDbContextFactory.DefaultDevConnection;
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connection));
builder.Services.AddHttpClient<BmfImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(10);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});
builder.Services.AddHttpClient<ZipCentroidImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(5);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});
builder.Services.AddHttpClient<SchoolsImporter>(c =>
{
    c.Timeout = TimeSpan.FromMinutes(2);
    c.DefaultRequestHeaders.UserAgent.ParseAdd("WaNonprofitConnect/0.1");
});

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
await db.Database.MigrateAsync();

var repoRoot = FindRepoRoot() ?? Directory.GetCurrentDirectory();

switch (argv.Positional[0].ToLowerInvariant())
{
    case "import" when argv.Positional.Count > 1 && argv.Positional[1].Equals("bmf", StringComparison.OrdinalIgnoreCase):
    {
        var importer = scope.ServiceProvider.GetRequiredService<BmfImporter>();
        var options = new BmfImportOptions
        {
            DataDirectory = Path.Combine(repoRoot, "data", "raw"),
            Force = argv.Has("--force"),
        };
        if (argv.Value("--state") is { } state) options.StateFilter = state.Equals("all", StringComparison.OrdinalIgnoreCase) ? null : state;
        if (argv.Value("--url") is { } url) options.Url = url;
        if (argv.Value("--file") is { } file) options.LocalFile = Path.GetFullPath(file);

        var run = await importer.RunAsync(options);
        PrintRun(run);
        return run.Status is ImportStatus.Succeeded or ImportStatus.SkippedUnchanged ? 0 : 1;
    }

    case "import" when argv.Positional.Count > 1 && argv.Positional[1].Equals("schools", StringComparison.OrdinalIgnoreCase):
    {
        var importer = scope.ServiceProvider.GetRequiredService<SchoolsImporter>();
        var options = new SchoolsImportOptions
        {
            DataDirectory = Path.Combine(repoRoot, "data", "raw"),
            Force = argv.Has("--force"),
        };
        if (argv.Value("--url") is { } url) options.Url = url;
        if (argv.Value("--file") is { } file) options.LocalFile = Path.GetFullPath(file);

        var run = await importer.RunAsync(options);
        PrintRun(run);
        if (run.Status is ImportStatus.Succeeded)
        {
            var districts = await db.SchoolDistricts.CountAsync(d => d.LastSeenImportRunId == run.Id);
            Console.WriteLine($"  districts seen this run: {districts}");
        }
        return run.Status is ImportStatus.Succeeded or ImportStatus.SkippedUnchanged ? 0 : 1;
    }

    case "import-zips":
    case "import" when argv.Positional.Count > 1 && argv.Positional[1].Equals("zips", StringComparison.OrdinalIgnoreCase):
    {
        var importer = scope.ServiceProvider.GetRequiredService<ZipCentroidImporter>();
        var options = new ZipCentroidImportOptions
        {
            DataDirectory = Path.Combine(repoRoot, "data", "raw"),
            Force = argv.Has("--force"),
        };
        if (argv.Value("--url") is { } url) options.Url = url;
        if (argv.Value("--file") is { } file) options.LocalFile = Path.GetFullPath(file);

        var run = await importer.RunAsync(options);
        PrintRun(run);
        Console.WriteLine($"  WA ZIP centroids in the table: {await db.ZipCentroids.CountAsync()}");
        return run.Status is ImportStatus.Succeeded or ImportStatus.SkippedUnchanged ? 0 : 1;
    }

    case "stats":
    {
        var state = argv.Value("--state") ?? "WA";
        var stats = await OrganizationQueries.GetStatsAsync(db, state.Equals("all", StringComparison.OrdinalIgnoreCase) ? null : state);
        PrintStats(stats, state);
        return 0;
    }

    case "imports":
    {
        var runs = await db.ImportRuns.AsNoTracking().OrderByDescending(r => r.StartedAt).Take(20).ToListAsync();
        foreach (var r in runs) PrintRun(r);
        if (runs.Count == 0) Console.WriteLine("No import runs yet.");
        return 0;
    }

    default:
        PrintUsage();
        return 2;
}

static void PrintUsage()
{
    Console.WriteLine("""
        WaNonprofitConnect CLI

          import bmf [--state WA|all] [--url <csv>] [--file <local.csv>] [--force]
              Download the IRS EO BMF extract (default: eo_wa.csv) and upsert organizations.
          import schools [--url <feature layer>] [--file <local.json>] [--force]
              Page through OSPI's Washington State Public Schools feature service and upsert schools + districts.
          import-zips [--url <zip>] [--file <local .zip or .txt>] [--force]
              Load Washington ZIP centroids (Census 2020 ZCTA gazetteer) for the map.
          stats [--state WA|all]
              Print counts: total, 501(c)(3), by NTEE, foundation type, filing requirement, cities.
          imports
              List recent import runs.

        Connection string: ConnectionStrings__Default or WANC_CONNECTION env var
        (default: LocalDB WaNonprofitConnect_Dev). Migrations are applied automatically.
        """);
}

static void PrintRun(ImportRun r)
{
    Console.WriteLine($"Import #{r.Id} {r.Source} [{r.Status}] state={r.StateFilter ?? "all"} started={r.StartedAt:u} finished={r.FinishedAt:u}");
    Console.WriteLine($"  file={r.LocalFilePath}");
    Console.WriteLine($"  sha256={r.FileSha256}");
    Console.WriteLine($"  read={r.RowsRead} inserted={r.RowsInserted} updated={r.RowsUpdated} unchanged={r.RowsUnchanged} skipped={r.RowsSkipped}");
    if (!string.IsNullOrEmpty(r.Errors)) Console.WriteLine($"  notes: {r.Errors.Split('\n')[0]}");
}

static void PrintStats(OrganizationStats s, string state)
{
    Console.WriteLine($"=== {state.ToUpperInvariant()} exempt organizations (IRS EO BMF) ===");
    Console.WriteLine($"Total exempt orgs:            {s.Total,8:N0}");
    Console.WriteLine($"501(c)(3):                    {s.Count501c3,8:N0}  ({Pct(s.Count501c3, s.Total)})");
    Console.WriteLine($"  public charities / other:   {s.Count501c3PublicCharities,8:N0}");
    Console.WriteLine($"  private foundations:        {s.Count501c3PrivateFoundations,8:N0}");
    Console.WriteLine($"  with NTEE code:             {s.CountWithNtee,8:N0}  ({Pct(s.CountWithNtee, s.Count501c3)})");
    Console.WriteLine($"  with non-zero revenue:      {s.CountWithRevenue,8:N0}  ({Pct(s.CountWithRevenue, s.Count501c3)})");

    Section("By subsection (all orgs)", s.BySubsection);
    Section("501(c)(3) by NTEE major group", s.ByNteeMajor);
    Section("501(c)(3) by foundation type", s.ByFoundation);
    Section("501(c)(3) by filing requirement", s.ByFilingRequirement);
    Section("501(c)(3) by income band (INCOME_CD)", s.ByIncomeBand);
    Section("501(c)(3) top cities", s.TopCities);
    Section("501(c)(3) by ruling decade", s.ByRulingDecade);
}

static void Section(string title, IReadOnlyList<CountBucket> rows)
{
    Console.WriteLine();
    Console.WriteLine($"--- {title} ---");
    foreach (var b in rows) Console.WriteLine(b.Key == b.Label ? $"  {b.Count,7:N0}  {b.Label}" : $"  {b.Count,7:N0}  {b.Key,-4} {b.Label}");
}

static string Pct(int part, int whole) => whole == 0 ? "n/a" : $"{100.0 * part / whole:F1}%";

static string? FindRepoRoot()
{
    var dir = new DirectoryInfo(AppContext.BaseDirectory);
    while (dir is not null)
    {
        if (File.Exists(Path.Combine(dir.FullName, "WaNonprofitConnect.sln"))) return dir.FullName;
        dir = dir.Parent;
    }
    return null;
}

namespace WaNonprofitConnect.Cli
{
/// <summary>Minimal argv reader: positionals, --flag, --key value, --key=value.</summary>
public sealed class Args
{
    public List<string> Positional { get; } = new();
    private readonly Dictionary<string, string?> _options = new(StringComparer.OrdinalIgnoreCase);

    public Args(string[] argv)
    {
        for (var i = 0; i < argv.Length; i++)
        {
            var a = argv[i];
            if (a.StartsWith("--", StringComparison.Ordinal))
            {
                var eq = a.IndexOf('=');
                if (eq > 0) { _options[a[..eq]] = a[(eq + 1)..]; continue; }
                var next = i + 1 < argv.Length && !argv[i + 1].StartsWith("--", StringComparison.Ordinal) ? argv[++i] : null;
                _options[a] = next;
            }
            else if (a is "-h") _options[a] = null;
            else Positional.Add(a);
        }
    }

    public bool Has(string name) => _options.ContainsKey(name);
    public string? Value(string name) => _options.TryGetValue(name, out var v) ? v : null;
    public string Require(string name) => Value(name) ?? throw new ArgumentException($"{name} is required");
    public string? Sub(int index) => index < Positional.Count ? Positional[index].ToLowerInvariant() : null;
    public int IntArg(int index) => index < Positional.Count && int.TryParse(Positional[index], out var v) ? v : throw new ArgumentException($"argument {index} must be a number");
    public int? Int(string name) => Value(name) is { } s ? int.Parse(s) : null;
    public decimal? Decimal(string name) => Value(name) is { } s ? decimal.Parse(s, System.Globalization.CultureInfo.InvariantCulture) : null;
    public T? Enum<T>(string name) where T : struct, System.Enum
        => Value(name) is { } s ? (System.Enum.TryParse<T>(s, ignoreCase: true, out var e) ? e : throw new ArgumentException($"{name}: unknown value '{s}' (valid: {string.Join(", ", System.Enum.GetNames<T>())})")) : null;
}
}
