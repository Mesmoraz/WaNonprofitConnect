using System.Text.Json.Serialization;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Data.Exchange;

// The alpha contract (docs/ALPHA.md, "The contract"). Names and shapes here are what the app's typed client expects.
// Internally a thread is still a Match; on the wire it is a thread.

public sealed record OrgSummaryDto(string Ein, string Name, string? City, string? Zip5, string? Ntee, double? Lat, double? Lon, bool IsMember);

/// <summary>
/// A need or an offer. <see cref="Why"/> is one short line in plain words ("Urgent", "This week", "Seen least", "New").
/// <see cref="Fits"/> and <see cref="MyThreadId"/> are only sent by GET /listings/{id}.
/// </summary>
public sealed record ListingViewDto(
    int Id,
    ListingKind Kind,
    KindOfHelp Help,
    string Title,
    string? Description,
    decimal? Quantity,
    string? Unit,
    Urgency Urgency,
    Cadence Cadence,
    string Status,
    OrgSummaryDto Org,
    DateTime CreatedAt,
    int Views,
    string Why,
    DateTime? EditedAt = null)
{
    /// <summary>Your open posts of the opposite kind that pair with this one, best first. On your own post: other organizations' posts that could fit.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<ListingViewDto>? Fits { get; init; }

    /// <summary>Your open thread on this post, if you have one ("Open your thread"). Null otherwise.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? MyThreadId { get; init; }

    /// <summary>On your own post, from GET /listings/{id}: how many threads on it are still going ("1 thread is open on this"). Null otherwise.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? OpenThreads { get; init; }
}

public sealed record ThreadDto(
    int Id,
    MatchStatus Status,
    ListingViewDto Need,
    ListingViewDto Offer,
    string StartedByEin,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    DateTime? CompletedAt,
    DateTime? LastMessageAt,
    int Unread)
{
    /// <summary>Only sent by GET /threads/{id}, oldest first.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<ThreadMessageDto>? Messages { get; init; }
}

public sealed record ThreadMessageDto(int Id, int ThreadId, string SenderEin, string SenderName, string Body, DateTime SentAt);

/// <summary>A thread on the map. Title and Help come from the need; NeedId/OfferId/OfferTitle let a tapped thread show both posts.</summary>
public sealed record MapThreadDto(int Id, MatchStatus Status, KindOfHelp Help, string FromEin, string ToEin, string Title,
    int NeedId = 0, int OfferId = 0, string? OfferTitle = null);

/// <summary>
/// One organization's page: who it is, its open needs and offers (newest first), and how many golden threads it has.
/// About, Website and AskFor are what it says about itself (S-99); AskFor is a first name, never an email.
/// </summary>
public sealed record OrgPageDto(OrgSummaryDto Org, IReadOnlyList<ListingViewDto> Listings, int Golden, int Live,
    string? About = null, string? Website = null, string? AskFor = null);

public sealed record MapSuggestionDto(int NeedId, int OfferId, string FromEin, string ToEin);

/// <summary>
/// One fit for your organization (S-130): another organization's open post, and which of yours it fits best.
/// For needs, Post is an offer that could fit one of your needs; for offers, a need you could help with.
/// </summary>
public sealed record MapFitDto(int MyId, string MyTitle, ListingViewDto Post);

/// <summary>How many open needs and offers an organization has: its pin's ring on the map (S-129).</summary>
public sealed record MapOpenDto(string Ein, int Needs, int Offers);

public sealed record MapDataDto(IReadOnlyList<OrgSummaryDto> Members, IReadOnlyList<MapThreadDto> Threads, IReadOnlyList<MapSuggestionDto> Suggested,
    IReadOnlyList<MapOpenDto> Open);

public sealed class BoardQuery
{
    public KindOfHelp? Help { get; set; }
    public ListingKind? Kind { get; set; }
    public string? Q { get; set; }
}

public sealed class StartThreadRequest
{
    public int ListingId { get; set; }
    /// <summary>Your own open need or offer to pair with it. Leave empty and one is made for you.</summary>
    public int? MyListingId { get; set; }
    public string? Message { get; set; }
}

/// <summary>Real-time events for the app. The API sends them over SignalR; tests record them.</summary>
public interface IHelpbookNotifier
{
    /// <summary>To everyone signed in.</summary>
    Task ListingAddedAsync(ListingViewDto listing, CancellationToken ct = default);
    /// <summary>To one organization's group; <paramref name="thread"/> carries that side's unread count.</summary>
    Task ThreadChangedAsync(string ein, ThreadDto thread, CancellationToken ct = default);
    /// <summary>To both organizations in the thread.</summary>
    Task MessageAddedAsync(IReadOnlyCollection<string> eins, ThreadMessageDto message, CancellationToken ct = default);
}

public sealed class NullHelpbookNotifier : IHelpbookNotifier
{
    public static readonly NullHelpbookNotifier Instance = new();
    public Task ListingAddedAsync(ListingViewDto listing, CancellationToken ct = default) => Task.CompletedTask;
    public Task ThreadChangedAsync(string ein, ThreadDto thread, CancellationToken ct = default) => Task.CompletedTask;
    public Task MessageAddedAsync(IReadOnlyCollection<string> eins, ThreadMessageDto message, CancellationToken ct = default) => Task.CompletedTask;
}
