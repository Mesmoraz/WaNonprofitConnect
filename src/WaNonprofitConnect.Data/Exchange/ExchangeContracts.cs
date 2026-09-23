using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

// Request/response shapes shared by the API, the CLI, and any future client (MAUI can reference this assembly directly).

public sealed class CreateListingRequest
{
    public ListingKind Kind { get; set; }
    /// <summary>Required by the alpha app. Older clients that leave it unset get Things.</summary>
    public KindOfHelp Help { get; set; }
    public ListingCategory Category { get; set; } = ListingCategory.Other;
    public Cadence Cadence { get; set; } = Cadence.OneTime;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public Urgency Urgency { get; set; } = Urgency.Normal;
    public string? Tags { get; set; }
    /// <summary>Days until the listing auto-expires. Null = no expiry.</summary>
    public int? ExpiresInDays { get; set; }
}

public sealed class ListingSearchRequest
{
    public ListingKind? Kind { get; set; }
    public ListingCategory? Category { get; set; }
    public ListingStatus? Status { get; set; } = ListingStatus.Open;
    public string? City { get; set; }
    public string? OrgEin { get; set; }
    /// <summary>Keywords; every term must appear in the listing's search text.</summary>
    public string? Q { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public sealed class ProposeMatchRequest
{
    public int NeedListingId { get; set; }
    public int OfferListingId { get; set; }
    public string? Note { get; set; }
}

public sealed class SendMessageRequest
{
    public string Body { get; set; } = string.Empty;
}

public sealed record OrgRefDto(string Ein, string Name, string? City);

public sealed record ListingDto(
    int Id,
    ListingKind Kind,
    OrgRefDto Org,
    ListingCategory Category,
    string Title,
    string? Description,
    decimal? Quantity,
    string? Unit,
    Urgency Urgency,
    ListingStatus Status,
    string? Tags,
    string? City,
    string? Zip5,
    DateTime CreatedAt,
    DateTime? ExpiresAt)
{
    public static ListingDto From(Listing l) => new(
        l.Id, l.Kind, OrgRef(l.OrgEin, l.Org), l.Category, l.Title, l.Description, l.Quantity, l.Unit,
        l.Urgency, l.Status, l.Tags, l.City, l.Zip5, l.CreatedAt, l.ExpiresAt);

    internal static OrgRefDto OrgRef(string ein, Organization? org) => new(ein, org?.Name ?? ein, org?.City);
}

public sealed record MatchSuggestionDto(ListingDto Listing, int Score, IReadOnlyList<string> Reasons);

public sealed record MessageDto(int Id, int MatchId, OrgRefDto Sender, string Body, DateTime SentAt);

public sealed record MatchDto(
    int Id,
    ListingDto Need,
    ListingDto Offer,
    OrgRefDto ProposedBy,
    MatchStatus Status,
    string? Note,
    int? Score,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    DateTime? CompletedAt,
    IReadOnlyList<MessageDto> Messages)
{
    public static MatchDto From(Match m, Organization? proposer, IReadOnlyDictionary<string, Organization>? orgs = null)
    {
        var need = m.NeedListing ?? throw new InvalidOperationException("NeedListing not loaded");
        var offer = m.OfferListing ?? throw new InvalidOperationException("OfferListing not loaded");
        Organization? Lookup(string ein) => orgs is not null && orgs.TryGetValue(ein, out var o) ? o
            : ein == need.OrgEin ? need.Org : ein == offer.OrgEin ? offer.Org : null;

        return new MatchDto(
            m.Id, ListingDto.From(need), ListingDto.From(offer),
            ListingDto.OrgRef(m.ProposedByEin, proposer ?? Lookup(m.ProposedByEin)),
            m.Status, m.Note, m.Score, m.CreatedAt, m.RespondedAt, m.CompletedAt,
            m.Messages.OrderBy(x => x.SentAt).Select(x => new MessageDto(x.Id, x.MatchId, ListingDto.OrgRef(x.SenderEin, Lookup(x.SenderEin)), x.Body, x.SentAt)).ToList());
    }
}

/// <summary>Real-time event envelope pushed over SignalR (and returned by the CLI watcher).</summary>
public sealed record ExchangeEvent(string Type, DateTime At, object Payload);

/// <summary>Raised by <see cref="ExchangeService"/>; the API forwards these to SignalR. No-op by default.</summary>
public interface IExchangeNotifier
{
    Task ListingCreatedAsync(ListingDto listing, CancellationToken ct = default);
    Task MatchChangedAsync(MatchDto match, string change, CancellationToken ct = default);
    Task MessageSentAsync(MatchDto match, MessageDto message, CancellationToken ct = default);
}

public sealed class NullExchangeNotifier : IExchangeNotifier
{
    public static readonly NullExchangeNotifier Instance = new();
    public Task ListingCreatedAsync(ListingDto listing, CancellationToken ct = default) => Task.CompletedTask;
    public Task MatchChangedAsync(MatchDto match, string change, CancellationToken ct = default) => Task.CompletedTask;
    public Task MessageSentAsync(MatchDto match, MessageDto message, CancellationToken ct = default) => Task.CompletedTask;
}

/// <summary>Domain rule violation with the HTTP status the API should return.</summary>
public sealed class ExchangeException : Exception
{
    public int StatusCode { get; }
    public ExchangeException(int statusCode, string message) : base(message) => StatusCode = statusCode;

    public static ExchangeException NotFound(string what) => new(404, $"{what} not found.");
    public static ExchangeException Forbidden(string why) => new(403, why);
    public static ExchangeException Invalid(string why) => new(400, why);
    public static ExchangeException Conflict(string why) => new(409, why);
}
