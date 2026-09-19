using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Codes;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public sealed class StatsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StatsController(AppDbContext db) => _db = db;

    /// <summary>Aggregate counts over the loaded data. Answers "how much is out there?".</summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(OrganizationStats), StatusCodes.Status200OK)]
    public Task<OrganizationStats> Stats([FromQuery] string? state = "WA", CancellationToken ct = default)
        => OrganizationQueries.GetStatsAsync(_db, string.Equals(state, "all", StringComparison.OrdinalIgnoreCase) ? null : state, ct);

    /// <summary>NTEE major groups with their ProPublica category mapping.</summary>
    [HttpGet("ntee")]
    [ProducesResponseType(typeof(IReadOnlyList<NteeCategory>), StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<NteeCategory>> Ntee(CancellationToken ct)
        => await _db.NteeCategories.AsNoTracking().OrderBy(n => n.Code).ToListAsync(ct);

    /// <summary>All IRS code tables the API decodes, for building client-side filters.</summary>
    [HttpGet("codes")]
    public IActionResult Codes() => Ok(new
    {
        Subsection = BmfCodes.Subsection,
        Foundation = BmfCodes.Foundation,
        PrivateFoundationCodes = BmfCodes.PrivateFoundationCodes,
        Deductibility = BmfCodes.Deductibility,
        Status = BmfCodes.Status,
        FilingRequirement = BmfCodes.FilingRequirement,
        PfFilingRequirement = BmfCodes.PfFilingRequirement,
        Affiliation = BmfCodes.Affiliation,
        OrganizationType = BmfCodes.OrganizationType,
        AmountBand = BmfCodes.AmountBand,
        NteeMajorGroup = BmfCodes.NteeMajorGroup,
    });

    /// <summary>Recent data-import runs (provenance for everything served by this API).</summary>
    [HttpGet("imports")]
    [ProducesResponseType(typeof(IReadOnlyList<ImportRun>), StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<ImportRun>> Imports([FromQuery] int take = 20, CancellationToken ct = default)
        => await _db.ImportRuns.AsNoTracking()
            .OrderByDescending(r => r.StartedAt)
            .Take(Math.Clamp(take, 1, 100))
            .ToListAsync(ct);
}
