using Microsoft.AspNetCore.SignalR;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Api.Realtime;

/// <summary>
/// Real-time feed of exchange activity. Clients receive <c>exchange</c> events carrying an <see cref="ExchangeEvent"/>.
/// Everyone gets listing broadcasts; match/message events additionally go to the two orgs' groups.
/// (Prototype: no auth, so any client may join any org group. Identity phase will bind this to the login.)
/// </summary>
public sealed class ExchangeHub : Hub
{
    public const string EventName = "exchange";
    public static string OrgGroup(string ein) => $"org:{ein}";

    public async Task JoinOrg(string ein)
    {
        var normalized = BmfRowParser.NormalizeEin(ein) ?? throw new HubException("EIN must be 9 digits.");
        await Groups.AddToGroupAsync(Context.ConnectionId, OrgGroup(normalized));
    }

    public Task LeaveOrg(string ein)
    {
        var normalized = BmfRowParser.NormalizeEin(ein) ?? throw new HubException("EIN must be 9 digits.");
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, OrgGroup(normalized));
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
