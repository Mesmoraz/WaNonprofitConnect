using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Api.Contracts;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Api.Controllers;

[ApiController]
[Route("api/v1/orgs")]
[Produces("application/json")]
public sealed class OrganizationsController : ControllerBase
{
    private readonly AppDbContext _db;

    private readonly HelpbookService _helpbook;

    public OrganizationsController(AppDbContext db, HelpbookService helpbook)
    {
        _db = db;
        _helpbook = helpbook;
    }

    /// <summary>Find a Washington 501(c)(3) by name or EIN (for claiming, and the app's search). Returns the contract's OrgSummary[].</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OrgSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<OrgSummaryDto>> Find([FromQuery] string? q, [FromQuery] int limit = 20, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q)) return Array.Empty<OrgSummaryDto>();
        var request = new OrganizationSearchRequest { Q = q, State = "WA", Only501c3 = true, PageSize = Math.Clamp(limit, 1, 50) };
        var result = await OrganizationQueries.SearchAsync(_db, request, ct);
        var summaries = await _helpbook.OrgSummariesAsync(result.Items, ct);
        return result.Items.Select(o => summaries[o.Ein]).ToList();
    }

    /// <summary>Older paged search with every IRS filter. Defaults to 501(c)(3)s only; pass only501c3=false to include every subsection.</summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResponse<OrganizationSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<OrganizationSummaryDto>>> Search([FromQuery] OrganizationSearchRequest request, CancellationToken ct)
    {
        var result = await OrganizationQueries.SearchAsync(_db, request, ct);
        var totalPages = (int)Math.Ceiling(result.Total / (double)result.PageSize);
        return Ok(new PagedResponse<OrganizationSummaryDto>(
            result.Total, result.Page, result.PageSize, totalPages,
            result.Items.Select(OrganizationSummaryDto.From).ToList()));
    }

    /// <summary>Full record for one EIN (digits only or NN-NNNNNNN).</summary>
    [HttpGet("{ein}")]
    [ProducesResponseType(typeof(OrganizationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrganizationDetailDto>> Get(string ein, CancellationToken ct)
    {
        var normalized = BmfRowParser.NormalizeEin(ein);
        if (normalized is null || ein.Count(char.IsDigit) != 9)
            return BadRequest(new ProblemDetails { Title = "EIN must be 9 digits.", Status = 400 });

        var org = await _db.Organizations.AsNoTracking().FirstOrDefaultAsync(o => o.Ein == normalized, ct);
        return org is null ? NotFound() : Ok(OrganizationDetailDto.From(org));
    }
}
