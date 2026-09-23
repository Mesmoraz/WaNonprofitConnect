using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using WaNonprofitConnect.Api.Security;
using WaNonprofitConnect.Data.Accounts;
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

/// <summary>
/// Base for signed-in endpoints. The acting organization is the caller's confirmed membership
/// (the X-Org-Ein header is gone); without one, acting calls return 403.
/// </summary>
public abstract class AppControllerBase : ControllerBase
{
    protected Guid AccountId => User.RequireAccountId();

    protected Task<string> ActingEinAsync(CancellationToken ct)
        => HttpContext.RequestServices.GetRequiredService<AccountService>().RequireActingEinAsync(AccountId, ct);

    /// <summary>For reads: the caller's confirmed EIN, or null (still signed in, just not confirmed yet).</summary>
    protected Task<string?> FindActingEinAsync(CancellationToken ct)
        => HttpContext.RequestServices.GetRequiredService<AccountService>().FindActingEinAsync(AccountId, ct);
}

/// <summary>The board and single needs or offers, in the alpha contract's shapes.</summary>
[ApiController]
[Route("api/v1")]
[Produces("application/json")]
[Authorize]
public sealed class ListingsController : AppControllerBase
{
    private readonly HelpbookService _helpbook;
    private readonly ExchangeService _exchange;

    public ListingsController(HelpbookService helpbook, ExchangeService exchange)
    {
        _helpbook = helpbook;
        _exchange = exchange;
    }

    /// <summary>Open needs and offers, fairly ranked: urgent first, then least seen, then newest; at most 2 per organization in the top 6.</summary>
    [HttpGet("board")]
    public async Task<IReadOnlyList<ListingViewDto>> Board([FromQuery] BoardQuery query, CancellationToken ct)
        => await _helpbook.BoardAsync(await FindActingEinAsync(ct), query, ct);

    /// <summary>Older paged search over listings (CLI and scripts). The app uses /board.</summary>
    [HttpGet("listings")]
    public Task<PagedResult<ListingDto>> Search([FromQuery] ListingSearchRequest request, CancellationToken ct)
        => _exchange.SearchListingsAsync(request, ct);

    /// <summary>One need or offer, with <c>fits</c> (your posts that pair with it) and <c>myThreadId</c> when you already have a thread on it.</summary>
    [HttpGet("listings/{id:int}")]
    [ProducesResponseType(typeof(ListingViewDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ListingViewDto>> Get(int id, CancellationToken ct)
        => await _helpbook.GetListingAsync(id, await FindActingEinAsync(ct), ct) is { } l ? Ok(l) : NotFound();

    /// <summary>Post a need or an offer for your organization.</summary>
    [HttpPost("listings")]
    [ProducesResponseType(typeof(ListingViewDto), 201)]
    public async Task<ActionResult<ListingViewDto>> Create([FromBody] CreateListingRequest request, CancellationToken ct)
    {
        var dto = await _helpbook.CreateListingAsync(await ActingEinAsync(ct), request, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    /// <summary>Older scored suggestions for a listing (CLI demo).</summary>
    [HttpGet("listings/{id:int}/matches")]
    public Task<IReadOnlyList<MatchSuggestionDto>> Suggest(int id, [FromQuery] int take = 10, CancellationToken ct = default)
        => _exchange.SuggestMatchesAsync(id, take, ct);

    [HttpPost("listings/{id:int}/close")]
    public async Task<IActionResult> Close(int id, CancellationToken ct)
    {
        await _helpbook.CloseListingAsync(id, await ActingEinAsync(ct), ct);
        return NoContent();
    }
}

/// <summary>Threads: a need and an offer put together, with messages. A done thread is a golden thread.</summary>
[ApiController]
[Route("api/v1/threads")]
[Produces("application/json")]
[Authorize]
public sealed class ThreadsController : AppControllerBase
{
    private readonly HelpbookService _helpbook;
    public ThreadsController(HelpbookService helpbook) => _helpbook = helpbook;

    /// <summary>Your organization's threads, newest activity first.</summary>
    [HttpGet]
    public async Task<IReadOnlyList<ThreadDto>> Inbox(CancellationToken ct) => await _helpbook.ListThreadsAsync(await ActingEinAsync(ct), ct);

    /// <summary>One thread with its messages. Marks it read for your side.</summary>
    [HttpGet("{id:int}")]
    public async Task<ThreadDto> Get(int id, CancellationToken ct) => await _helpbook.GetThreadAsync(id, await ActingEinAsync(ct), ct);

    /// <summary>"I can help" / "I need this". With no myListingId, the matching need or offer is made for you.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ThreadDto), 201)]
    public async Task<ActionResult<ThreadDto>> Start([FromBody] StartThreadRequest request, CancellationToken ct)
    {
        var dto = await _helpbook.StartThreadAsync(await ActingEinAsync(ct), request, SenderName, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPost("{id:int}/messages")]
    [ProducesResponseType(typeof(ThreadMessageDto), 201)]
    public async Task<ActionResult<ThreadMessageDto>> SendMessage(int id, [FromBody] SendMessageRequest request, CancellationToken ct)
        => StatusCode(201, await _helpbook.SendMessageAsync(id, await ActingEinAsync(ct), request.Body, SenderName, ct));

    [HttpPost("{id:int}/accept")]
    public async Task<ThreadDto> Accept(int id, CancellationToken ct) => await _helpbook.AcceptAsync(id, await ActingEinAsync(ct), ct);

    [HttpPost("{id:int}/decline")]
    public async Task<ThreadDto> Decline(int id, CancellationToken ct) => await _helpbook.DeclineAsync(id, await ActingEinAsync(ct), ct);

    [HttpPost("{id:int}/complete")]
    public async Task<ThreadDto> Complete(int id, CancellationToken ct) => await _helpbook.CompleteAsync(id, await ActingEinAsync(ct), ct);

    [HttpPost("{id:int}/cancel")]
    public async Task<ThreadDto> Cancel(int id, CancellationToken ct) => await _helpbook.CancelAsync(id, await ActingEinAsync(ct), ct);

    private string? SenderName => User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
}

[ApiController]
[Route("api/v1/matches")]
[Produces("application/json")]
[Authorize]
public sealed class MatchesController : AppControllerBase
{
    private readonly ExchangeService _exchange;
    public MatchesController(ExchangeService exchange) => _exchange = exchange;

    /// <summary>Older match routes, kept for the CLI demo and watcher. The app uses /threads (same records).</summary>
    [HttpGet]
    public async Task<IReadOnlyList<MatchDto>> Inbox(CancellationToken ct) => await _exchange.ListMatchesForOrgAsync(await ActingEinAsync(ct), ct);

    [HttpGet("{id:int}")]
    public async Task<MatchDto> Get(int id, CancellationToken ct) => await _exchange.GetMatchAsync(id, await ActingEinAsync(ct), ct);

    /// <summary>Connect a Need with an Offer. The acting org must own one of the two listings; the other org then accepts or declines.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(MatchDto), 201)]
    public async Task<ActionResult<MatchDto>> Propose([FromBody] ProposeMatchRequest request, CancellationToken ct)
    {
        var dto = await _exchange.ProposeMatchAsync(await ActingEinAsync(ct), request, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPost("{id:int}/accept")]
    public async Task<MatchDto> Accept(int id, CancellationToken ct) => await _exchange.RespondAsync(id, await ActingEinAsync(ct), accept: true, ct);

    [HttpPost("{id:int}/decline")]
    public async Task<MatchDto> Decline(int id, CancellationToken ct) => await _exchange.RespondAsync(id, await ActingEinAsync(ct), accept: false, ct);

    /// <summary>Mark the hand-off as done; both listings become Fulfilled.</summary>
    [HttpPost("{id:int}/complete")]
    public async Task<MatchDto> Complete(int id, CancellationToken ct) => await _exchange.CompleteAsync(id, await ActingEinAsync(ct), ct);

    [HttpPost("{id:int}/cancel")]
    public async Task<MatchDto> Cancel(int id, CancellationToken ct) => await _exchange.CancelAsync(id, await ActingEinAsync(ct), ct);

    [HttpPost("{id:int}/messages")]
    [ProducesResponseType(typeof(MessageDto), 201)]
    public async Task<ActionResult<MessageDto>> SendMessage(int id, [FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var dto = await _exchange.SendMessageAsync(id, await ActingEinAsync(ct), request, ct);
        return StatusCode(201, dto);
    }
}
