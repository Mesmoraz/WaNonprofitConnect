using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Api.Controllers;

/// <summary>Maps <see cref="ExchangeException"/> to RFC 7807 ProblemDetails with the domain's status code.</summary>
public sealed class ExchangeExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not ExchangeException ex) return;
        context.Result = new ObjectResult(new ProblemDetails { Status = ex.StatusCode, Title = ex.Message }) { StatusCode = ex.StatusCode };
        context.ExceptionHandled = true;
    }
}

public abstract class ExchangeControllerBase : ControllerBase
{
    /// <summary>Header name used to act on behalf of an organization until real identity exists.</summary>
    public const string OrgHeader = "X-Org-Ein";

    protected string ActingEin =>
        Request.Headers.TryGetValue(OrgHeader, out var v) && !string.IsNullOrWhiteSpace(v)
            ? v.ToString()
            : throw new ExchangeException(401, $"Set the {OrgHeader} header to the EIN of the organization you are acting for.");
}

[ApiController]
[Route("api/v1/listings")]
[Produces("application/json")]
[ServiceFilter(typeof(ExchangeExceptionFilter))]
public sealed class ListingsController : ExchangeControllerBase
{
    private readonly ExchangeService _exchange;
    public ListingsController(ExchangeService exchange) => _exchange = exchange;

    /// <summary>Browse needs and offers. Defaults to Open listings, most urgent and newest first.</summary>
    [HttpGet]
    public Task<PagedResult<ListingDto>> Search([FromQuery] ListingSearchRequest request, CancellationToken ct)
        => _exchange.SearchListingsAsync(request, ct);

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ListingDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ListingDto>> Get(int id, CancellationToken ct)
        => await _exchange.GetListingAsync(id, ct) is { } l ? Ok(l) : NotFound();

    /// <summary>Post a Need ("we need 40 sheets of plywood") or an Offer ("we have 12 spare laptops"). Requires X-Org-Ein.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ListingDto), 201)]
    public async Task<ActionResult<ListingDto>> Create([FromBody] CreateListingRequest request, CancellationToken ct)
    {
        var dto = await _exchange.CreateListingAsync(ActingEin, request, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    /// <summary>Best counterpart listings for this one (Offers for a Need, Needs for an Offer), with scores and reasons.</summary>
    [HttpGet("{id:int}/matches")]
    public Task<IReadOnlyList<MatchSuggestionDto>> Suggest(int id, [FromQuery] int take = 10, CancellationToken ct = default)
        => _exchange.SuggestMatchesAsync(id, take, ct);

    [HttpPost("{id:int}/close")]
    public Task<ListingDto> Close(int id, CancellationToken ct) => _exchange.CloseListingAsync(id, ActingEin, ct);
}

[ApiController]
[Route("api/v1/matches")]
[Produces("application/json")]
[ServiceFilter(typeof(ExchangeExceptionFilter))]
public sealed class MatchesController : ExchangeControllerBase
{
    private readonly ExchangeService _exchange;
    public MatchesController(ExchangeService exchange) => _exchange = exchange;

    /// <summary>The acting org's inbox: every match it is a party to, with messages.</summary>
    [HttpGet]
    public Task<IReadOnlyList<MatchDto>> Inbox(CancellationToken ct) => _exchange.ListMatchesForOrgAsync(ActingEin, ct);

    [HttpGet("{id:int}")]
    public Task<MatchDto> Get(int id, CancellationToken ct) => _exchange.GetMatchAsync(id, ActingEin, ct);

    /// <summary>Connect a Need with an Offer. The acting org must own one of the two listings; the other org then accepts or declines.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(MatchDto), 201)]
    public async Task<ActionResult<MatchDto>> Propose([FromBody] ProposeMatchRequest request, CancellationToken ct)
    {
        var dto = await _exchange.ProposeMatchAsync(ActingEin, request, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPost("{id:int}/accept")]
    public Task<MatchDto> Accept(int id, CancellationToken ct) => _exchange.RespondAsync(id, ActingEin, accept: true, ct);

    [HttpPost("{id:int}/decline")]
    public Task<MatchDto> Decline(int id, CancellationToken ct) => _exchange.RespondAsync(id, ActingEin, accept: false, ct);

    /// <summary>Mark the hand-off as done; both listings become Fulfilled.</summary>
    [HttpPost("{id:int}/complete")]
    public Task<MatchDto> Complete(int id, CancellationToken ct) => _exchange.CompleteAsync(id, ActingEin, ct);

    [HttpPost("{id:int}/cancel")]
    public Task<MatchDto> Cancel(int id, CancellationToken ct) => _exchange.CancelAsync(id, ActingEin, ct);

    [HttpPost("{id:int}/messages")]
    [ProducesResponseType(typeof(MessageDto), 201)]
    public async Task<ActionResult<MessageDto>> SendMessage(int id, [FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var dto = await _exchange.SendMessageAsync(id, ActingEin, request, ct);
        return StatusCode(201, dto);
    }
}
