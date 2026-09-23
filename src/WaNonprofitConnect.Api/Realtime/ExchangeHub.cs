using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WaNonprofitConnect.Api.Security;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Api.Realtime;

/// <summary>
/// Real-time feed. Cookie-authenticated: on connect the caller joins their confirmed organization's group
/// (<c>org-{ein}</c>); nobody can join another org's group. Everyone signed in gets <c>listingAdded</c>;
/// <c>threadChanged</c> and <c>messageAdded</c> go only to the two organizations in the thread.
/// The older <c>exchange</c> envelope events (used by the CLI watcher and the /matches routes) go to the same groups.
/// </summary>
[Authorize]
public sealed class ExchangeHub : Hub
{
    public const string EventName = "exchange";
    public static string OrgGroup(string ein) => $"org-{ein}";

    private readonly AccountService _accounts;
    public ExchangeHub(AccountService accounts) => _accounts = accounts;

    public override async Task OnConnectedAsync()
    {
        if (Context.User?.AccountId() is { } accountId && await _accounts.FindActingEinAsync(accountId) is { } ein)
            await Groups.AddToGroupAsync(Context.ConnectionId, OrgGroup(ein));
        await base.OnConnectedAsync();
    }
}

public sealed class SignalRExchangeNotifier : IExchangeNotifier
{
    private readonly IHubContext<ExchangeHub> _hub;
    private readonly ILogger<SignalRExchangeNotifier> _logger;

    public SignalRExchangeNotifier(IHubContext<ExchangeHub> hub, ILogger<SignalRExchangeNotifier> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public Task ListingCreatedAsync(ListingDto listing, CancellationToken ct = default)
        => Send(_hub.Clients.All, new ExchangeEvent("listing.created", DateTime.UtcNow, listing), ct);

    public async Task MatchChangedAsync(MatchDto match, string change, CancellationToken ct = default)
    {
        // Match details are private to the two parties. The public board only learns that the listings changed status.
        var evt = new ExchangeEvent($"match.{change}", DateTime.UtcNow, match);
        await Send(_hub.Clients.Groups(ExchangeHub.OrgGroup(match.Need.Org.Ein), ExchangeHub.OrgGroup(match.Offer.Org.Ein)), evt, ct);
        if (change is "accepted" or "completed" or "cancelled")
        {
            await Send(_hub.Clients.All, new ExchangeEvent("listing.updated", DateTime.UtcNow, match.Need), ct);
            await Send(_hub.Clients.All, new ExchangeEvent("listing.updated", DateTime.UtcNow, match.Offer), ct);
        }
    }

    public Task MessageSentAsync(MatchDto match, MessageDto message, CancellationToken ct = default)
    {
        // Messages are private to the two parties — never broadcast to All.
        var evt = new ExchangeEvent("message.sent", DateTime.UtcNow, new { message, matchId = match.Id, need = match.Need.Title, offer = match.Offer.Title });
        return Send(_hub.Clients.Groups(ExchangeHub.OrgGroup(match.Need.Org.Ein), ExchangeHub.OrgGroup(match.Offer.Org.Ein)), evt, ct);
    }

    private async Task Send(IClientProxy target, ExchangeEvent evt, CancellationToken ct)
    {
        try { await target.SendAsync(ExchangeHub.EventName, evt, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "SignalR send failed for {Type}", evt.Type); }
    }
}

/// <summary>The app's events: <c>listingAdded(Listing)</c> to everyone, <c>threadChanged(Thread)</c> and <c>messageAdded(Message)</c> to the two orgs.</summary>
public sealed class SignalRHelpbookNotifier : IHelpbookNotifier
{
    private readonly IHubContext<ExchangeHub> _hub;
    private readonly ILogger<SignalRHelpbookNotifier> _logger;

    public SignalRHelpbookNotifier(IHubContext<ExchangeHub> hub, ILogger<SignalRHelpbookNotifier> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public Task ListingAddedAsync(ListingViewDto listing, CancellationToken ct = default)
        => Send(_hub.Clients.All, "listingAdded", listing, ct);

    public Task ThreadChangedAsync(string ein, ThreadDto thread, CancellationToken ct = default)
        => Send(_hub.Clients.Group(ExchangeHub.OrgGroup(ein)), "threadChanged", thread, ct);

    public Task MessageAddedAsync(IReadOnlyCollection<string> eins, ThreadMessageDto message, CancellationToken ct = default)
        => Send(_hub.Clients.Groups(eins.Distinct().Select(ExchangeHub.OrgGroup).ToList()), "messageAdded", message, ct);

    private async Task Send(IClientProxy target, string method, object payload, CancellationToken ct)
    {
        try { await target.SendAsync(method, payload, ct); }
        catch (Exception ex) { _logger.LogWarning(ex, "SignalR send failed for {Method}", method); }
    }
}
