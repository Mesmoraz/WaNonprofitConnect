using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// The org-to-org exchange: post Needs/Offers, find matches, connect, and message.
/// Every mutating call takes the acting org's EIN. The API resolves it from the signed-in person's confirmed membership
/// (<see cref="Accounts.AccountService"/>); the rules about who may do what to a listing or thread live here.
/// </summary>
public sealed class ExchangeService
{
    private const int MaxCandidates = 500;

    // Column limits (AppDbContext). An overlong value is a 500 on SQL Server, so check or trim before saving.
    public const int MaxTitle = 200;
    public const int MaxQuantity = 1_000_000;
    public const int MaxDescription = 4000;
    public const int MaxUnit = 40;
    public const int MaxTags = 500;
    public const int MaxSearchText = 2000;
    public const int MaxMessage = 4000;
    public const int MaxExpiresInDays = 365;

    private readonly AppDbContext _db;
    private readonly IExchangeNotifier _notifier;

    public ExchangeService(AppDbContext db, IExchangeNotifier? notifier = null)
    {
        _db = db;
        _notifier = notifier ?? NullExchangeNotifier.Instance;
    }

    // ---- Listings ----------------------------------------------------------

    public async Task<ListingDto> CreateListingAsync(string actingEin, CreateListingRequest req, CancellationToken ct = default)
    {
        var org = await RequireOrgAsync(actingEin, ct);
        if (!Enum.IsDefined(req.Kind)) throw ExchangeException.Invalid("Pick need or offer.");
        if (!Enum.IsDefined(req.Category)) throw ExchangeException.Invalid("Pick a kind of help.");
        var f = Fields(req.Kind, req.Help, req.Title, req.Description, req.Quantity, req.Unit, req.Urgency, req.Cadence);
        var tags = TruncateAtBoundary(BmfRowParser.Clean(req.Tags), MaxTags, ',');

        var now = DateTime.UtcNow;
        if (f.Urgency == Urgency.Critical && await UrgentCap.LeftAsync(_db, org.Ein, now, ct) <= 0)
            throw ExchangeException.Conflict(UrgentCap.Message);

        var listing = new Listing
        {
            Kind = req.Kind,
            OrgEin = org.Ein,
            Org = org,
            Help = f.Help,
            Cadence = f.Cadence,
            Category = req.Category,
            Title = f.Title,
            Description = f.Description,
            Quantity = req.Quantity,
            Unit = f.Unit,
            Urgency = f.Urgency,
            UrgentSince = f.Urgency == Urgency.Critical ? now : null,
            Status = ListingStatus.Open,
            Tags = tags,
            SearchText = MatchScorer.BuildSearchText(f.Title, f.Description, tags),
            City = org.City,
            Zip5 = org.Zip5,
            CreatedAt = now,
            UpdatedAt = now,
            // A huge number would overflow DateTime (a 500). A post lives a year at most.
            ExpiresAt = req.ExpiresInDays is { } d ? now.AddDays(Math.Clamp(d, 1, MaxExpiresInDays)) : null,
        };
        _db.Listings.Add(listing);
        await _db.SaveChangesAsync(ct);

        var dto = ListingDto.From(listing);
        await _notifier.ListingCreatedAsync(dto, ct);
        return dto;
    }

    /// <summary>
    /// Change your own post (S-97): everything but whether it's a need or an offer. Not once it's closed or done.
    /// The same rules as posting. Making a need urgent counts toward the cap; one that was already urgent keeps its place.
    /// </summary>
    public async Task<ListingDto> UpdateListingAsync(int id, string actingEin, UpdateListingRequest req, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var l = await _db.Listings.Include(x => x.Org).FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw ExchangeException.NotFound(PostGone);
        if (l.OrgEin != ein) throw ExchangeException.Forbidden("Only the organization that posted this can change it.");
        if (l.Status is not (ListingStatus.Open or ListingStatus.Matched)) throw ExchangeException.Conflict(NotOpen);
        var f = Fields(l.Kind, req.Help, req.Title, req.Description, req.Quantity, req.Unit, req.Urgency, req.Cadence);

        var now = DateTime.UtcNow;
        if (f.Urgency == Urgency.Critical && l.Urgency != Urgency.Critical)
        {
            // Back to urgent within the 30 days is the same use; otherwise it's a new one.
            var counted = (l.UrgentSince ?? DateTime.MinValue) > now.AddDays(-UrgentCap.WindowDays);
            if (!counted)
            {
                if (await UrgentCap.LeftAsync(_db, ein, now, ct, except: l.Id) <= 0) throw ExchangeException.Conflict(UrgentCap.Message);
                l.UrgentSince = now;
            }
        }

        l.Help = f.Help;
        l.Title = f.Title;
        l.Description = f.Description;
        l.Quantity = req.Quantity;
        l.Unit = f.Unit;
        l.Urgency = f.Urgency;
        l.Cadence = f.Cadence;
        l.SearchText = MatchScorer.BuildSearchText(f.Title, f.Description, l.Tags);
        l.EditedAt = now;
        l.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);
        return ListingDto.From(l);
    }

    private sealed record ListingFields(KindOfHelp Help, string Title, string? Description, string? Unit, Urgency Urgency, Cadence Cadence);

    /// <summary>The rules a post's own fields follow, when it's posted and when it's edited.</summary>
    private static ListingFields Fields(ListingKind kind, KindOfHelp help, string? title, string? description, decimal? quantity, string? unit, Urgency urgency, Cadence cadence)
    {
        title = title?.Trim();
        if (string.IsNullOrWhiteSpace(title)) throw ExchangeException.Invalid("Say what it is.");
        if (title.Length > MaxTitle) throw ExchangeException.Invalid("Keep it under 200 characters.");
        description = BmfRowParser.Clean(description);
        if (description is { Length: > MaxDescription }) throw ExchangeException.Invalid("Keep the details under 4,000 characters.");
        unit = BmfRowParser.Clean(unit);
        if (unit is { Length: > MaxUnit }) throw ExchangeException.Invalid("Keep the unit under 40 characters.");
        if (quantity is < 1 or > MaxQuantity) throw ExchangeException.Invalid("Pick a number from 1 to 1,000,000.");
        help = help == 0 ? KindOfHelp.Things : help;
        if (!Enum.IsDefined(help)) throw ExchangeException.Invalid("Pick a kind of help.");
        cadence = Enum.IsDefined(cadence) ? cadence : Cadence.OneTime;
        // "How soon" is for needs only; an offer never jumps the board.
        urgency = kind == ListingKind.Offer || !Enum.IsDefined(urgency) ? Urgency.Normal : urgency;
        return new ListingFields(help, title, description, unit, urgency, cadence);
    }

    public async Task<ListingDto?> GetListingAsync(int id, CancellationToken ct = default)
    {
        var l = await _db.Listings.AsNoTracking().Include(x => x.Org).FirstOrDefaultAsync(x => x.Id == id, ct);
        return l is null ? null : ListingDto.From(l);
    }

    public async Task<PagedResult<ListingDto>> SearchListingsAsync(ListingSearchRequest req, CancellationToken ct = default)
    {
        var q = _db.Listings.AsNoTracking().Include(l => l.Org).AsQueryable();
        if (req.Kind is { } kind) q = q.Where(l => l.Kind == kind);
        if (req.Category is { } cat) q = q.Where(l => l.Category == cat);
        if (req.Status is { } status) q = q.Where(l => l.Status == status);
        var city = BmfRowParser.Clean(req.City)?.ToUpperInvariant();
        if (city is not null) q = q.Where(l => l.City == city);
        var ein = BmfRowParser.NormalizeEin(req.OrgEin);
        if (ein is not null) q = q.Where(l => l.OrgEin == ein);
        if (BmfRowParser.Clean(req.Q) is { } text)
        {
            foreach (var term in MatchScorer.Tokens(BmfRowParser.Normalize(text)))
            {
                var pattern = $"%{term}%";
                q = q.Where(l => EF.Functions.Like(l.SearchText, pattern));
            }
        }

        var page = Math.Max(1, req.Page);
        var pageSize = Math.Clamp(req.PageSize, 1, 200);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(l => l.Urgency).ThenByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<ListingDto>(total, page, pageSize, items.Select(ListingDto.From).ToList());
    }

    public async Task<ListingDto> CloseListingAsync(int id, string actingEin, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var l = await _db.Listings.Include(x => x.Org).FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw ExchangeException.NotFound(PostGone);
        if (l.OrgEin != ein) throw ExchangeException.Forbidden("Only the organization that posted this can close it.");
        if (l.Status is ListingStatus.Fulfilled or ListingStatus.Closed) return ListingDto.From(l);
        l.Status = ListingStatus.Closed;
        l.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ListingDto.From(l);
    }

    // ---- Matching ----------------------------------------------------------

    /// <summary>Suggest counterpart listings (Offers for a Need, Needs for an Offer), best first.</summary>
    public async Task<IReadOnlyList<MatchSuggestionDto>> SuggestMatchesAsync(int listingId, int take = 10, CancellationToken ct = default)
    {
        var source = await _db.Listings.AsNoTracking().Include(l => l.Org).FirstOrDefaultAsync(l => l.Id == listingId, ct)
                     ?? throw ExchangeException.NotFound(PostGone);
        var wantKind = source.Kind == ListingKind.Need ? ListingKind.Offer : ListingKind.Need;
        var now = DateTime.UtcNow;
        var tokens = MatchScorer.Tokens(source.SearchText);

        // Pull a bounded candidate set from the DB (same category OR any keyword hit), then score in memory.
        var q = _db.Listings.AsNoTracking().Include(l => l.Org)
            .Where(l => l.Kind == wantKind && l.Status == ListingStatus.Open && l.OrgEin != source.OrgEin
                        && (l.ExpiresAt == null || l.ExpiresAt > now));
        if (tokens.Count > 0)
        {
            var patterns = tokens.Take(8).Select(t => $"%{t}%").ToList();
            q = q.Where(l => l.Category == source.Category || patterns.Any(p => EF.Functions.Like(l.SearchText, p)));
        }
        else
        {
            q = q.Where(l => l.Category == source.Category);
        }
        var candidates = await q.OrderByDescending(l => l.CreatedAt).Take(MaxCandidates).ToListAsync(ct);

        return candidates
            .Select(c =>
            {
                var (need, offer) = source.Kind == ListingKind.Need ? (source, c) : (c, source);
                var s = MatchScorer.Score(need, offer, now);
                return new MatchSuggestionDto(ListingDto.From(c), s.Score, s.Reasons);
            })
            .Where(s => s.Score >= MatchScorer.MinimumScore)
            .OrderByDescending(s => s.Score).ThenByDescending(s => s.Listing.CreatedAt)
            .Take(Math.Clamp(take, 1, 50))
            .ToList();
    }

    public async Task<MatchDto> ProposeMatchAsync(string actingEin, ProposeMatchRequest req, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var need = await _db.Listings.Include(l => l.Org).FirstOrDefaultAsync(l => l.Id == req.NeedListingId, ct)
                   ?? throw ExchangeException.NotFound(PostGone);
        var offer = await _db.Listings.Include(l => l.Org).FirstOrDefaultAsync(l => l.Id == req.OfferListingId, ct)
                    ?? throw ExchangeException.NotFound(PostGone);

        if (need.Kind != ListingKind.Need) throw ExchangeException.Invalid("Pick a need to pair with this offer.");
        if (offer.Kind != ListingKind.Offer) throw ExchangeException.Invalid("Pick an offer to pair with this need.");
        if (need.OrgEin == offer.OrgEin) throw ExchangeException.Invalid("That's your own post.");
        if (ein != need.OrgEin && ein != offer.OrgEin) throw ExchangeException.Forbidden("Only the two organizations can start this thread.");
        if (need.Status != ListingStatus.Open || offer.Status != ListingStatus.Open) throw ExchangeException.Conflict(NotOpen);
        if (await _db.Matches.AnyAsync(m => m.NeedListingId == need.Id && m.OfferListingId == offer.Id, ct))
            throw ExchangeException.Conflict("You already have a thread for these.");

        var match = new Match
        {
            NeedListing = need,
            OfferListing = offer,
            ProposedByEin = ein,
            Status = MatchStatus.Proposed,
            Note = BmfRowParser.Clean(req.Note),
            Score = MatchScorer.Score(need, offer).Score,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Matches.Add(match);
        await _db.SaveChangesAsync(ct);

        var dto = MatchDto.From(match, ein == need.OrgEin ? need.Org : offer.Org);
        await _notifier.MatchChangedAsync(dto, "proposed", ct);
        return dto;
    }

    public async Task<MatchDto> RespondAsync(int matchId, string actingEin, bool accept, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var match = await LoadMatchAsync(matchId, ct);
        RequireParty(match, ein);
        if (match.ProposedByEin == ein) throw ExchangeException.Forbidden("The other organization answers this one.");
        if (match.Status != MatchStatus.Proposed) throw ExchangeException.Conflict(MovedOn);
        // Accepting takes both posts off the board, so both must still be on it (not closed, done, or held by another thread).
        if (accept && (match.NeedListing!.Status != ListingStatus.Open || match.OfferListing!.Status != ListingStatus.Open))
            throw ExchangeException.Conflict(NotOpen);

        var now = DateTime.UtcNow;
        match.Status = accept ? MatchStatus.Accepted : MatchStatus.Declined;
        match.RespondedAt = now;
        if (accept)
        {
            match.NeedListing!.Status = ListingStatus.Matched;
            match.OfferListing!.Status = ListingStatus.Matched;
            match.NeedListing.UpdatedAt = match.OfferListing.UpdatedAt = now;
        }
        await _db.SaveChangesAsync(ct);

        var dto = MatchDto.From(match, null, await OrgMapAsync(match, ct));
        await _notifier.MatchChangedAsync(dto, accept ? "accepted" : "declined", ct);
        return dto;
    }

    public async Task<MatchDto> CompleteAsync(int matchId, string actingEin, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var match = await LoadMatchAsync(matchId, ct);
        RequireParty(match, ein);
        if (match.Status != MatchStatus.Accepted) throw ExchangeException.Conflict("Accept it first, then mark it done.");

        var now = DateTime.UtcNow;
        match.Status = MatchStatus.Completed;
        match.CompletedAt = now;
        match.NeedListing!.Status = ListingStatus.Fulfilled;
        match.OfferListing!.Status = ListingStatus.Fulfilled;
        match.NeedListing.UpdatedAt = match.OfferListing.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        var dto = MatchDto.From(match, null, await OrgMapAsync(match, ct));
        await _notifier.MatchChangedAsync(dto, "completed", ct);
        return dto;
    }

    public async Task<MatchDto> CancelAsync(int matchId, string actingEin, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var match = await LoadMatchAsync(matchId, ct);
        RequireParty(match, ein);
        if (match.Status is MatchStatus.Completed or MatchStatus.Cancelled or MatchStatus.Declined)
            throw ExchangeException.Conflict(MovedOn);

        var now = DateTime.UtcNow;
        var wasAccepted = match.Status == MatchStatus.Accepted;
        match.Status = MatchStatus.Cancelled;
        match.RespondedAt ??= now;
        if (wasAccepted)
        {
            // Put each post back on the board so it can pair elsewhere, but only one this thread took off:
            // never a closed, done or expired one, and not one another accepted thread still holds.
            foreach (var l in new[] { match.NeedListing!, match.OfferListing! })
            {
                if (l.Status != ListingStatus.Matched) continue;
                var held = await _db.Matches.AnyAsync(m => m.Id != match.Id && m.Status == MatchStatus.Accepted
                                                           && (m.NeedListingId == l.Id || m.OfferListingId == l.Id), ct);
                if (held) continue;
                l.Status = ListingStatus.Open;
                l.UpdatedAt = now;
            }
        }
        await _db.SaveChangesAsync(ct);

        var dto = MatchDto.From(match, null, await OrgMapAsync(match, ct));
        await _notifier.MatchChangedAsync(dto, "cancelled", ct);
        return dto;
    }

    public async Task<MatchDto> GetMatchAsync(int matchId, string actingEin, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var match = await LoadMatchAsync(matchId, ct, track: false);
        RequireParty(match, ein);
        return MatchDto.From(match, null, await OrgMapAsync(match, ct));
    }

    /// <summary>Every match the org is a party to — its inbox.</summary>
    public async Task<IReadOnlyList<MatchDto>> ListMatchesForOrgAsync(string actingEin, CancellationToken ct = default)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var matches = await _db.Matches.AsNoTracking()
            .Include(m => m.NeedListing!).ThenInclude(l => l.Org)
            .Include(m => m.OfferListing!).ThenInclude(l => l.Org)
            .Include(m => m.Messages)
            .Where(m => m.NeedListing!.OrgEin == ein || m.OfferListing!.OrgEin == ein)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);
        var result = new List<MatchDto>(matches.Count);
        foreach (var m in matches) result.Add(MatchDto.From(m, null, await OrgMapAsync(m, ct)));
        return result;
    }

    // ---- Messaging ---------------------------------------------------------

    public async Task<MessageDto> SendMessageAsync(int matchId, string actingEin, SendMessageRequest req, CancellationToken ct = default, string? senderName = null)
    {
        var ein = await RequireEinAsync(actingEin, ct);
        var body = BmfRowParser.Clean(req.Body) ?? throw ExchangeException.Invalid("Write a message first.");
        if (body.Length > MaxMessage) throw ExchangeException.Invalid(MessageTooLong);
        var match = await LoadMatchAsync(matchId, ct);
        RequireParty(match, ein);
        if (match.Status is MatchStatus.Declined or MatchStatus.Cancelled)
            throw ExchangeException.Conflict("This thread is closed. Start a new one to keep talking.");

        var msg = new Message { Match = match, SenderEin = ein, SenderName = BmfRowParser.Clean(senderName), Body = body, SentAt = DateTime.UtcNow };
        _db.Messages.Add(msg);
        await _db.SaveChangesAsync(ct);

        var orgs = await OrgMapAsync(match, ct);
        var dto = new MessageDto(msg.Id, match.Id, ListingDto.OrgRef(ein, orgs.GetValueOrDefault(ein)), msg.Body, msg.SentAt);
        await _notifier.MessageSentAsync(MatchDto.From(match, null, orgs), dto, ct);
        return dto;
    }

    // ---- helpers -----------------------------------------------------------

    internal const string PostGone = "That post is gone.";
    internal const string ThreadGone = "That thread is gone.";
    internal const string NotOpen = "That post isn't open any more.";
    internal const string MovedOn = "This thread has already moved on.";
    internal const string MessageTooLong = "Keep your message under 4,000 characters.";

    /// <summary>Cut to <paramref name="max"/> at the last separator (or space) that fits, so no word is cut in half.</summary>
    public static string? TruncateAtBoundary(string? s, int max, char separator = ' ')
    {
        if (s is null || s.Length <= max) return s;
        var cut = s.LastIndexOf(separator, max);
        if (cut <= 0 && separator != ' ') cut = s.LastIndexOf(' ', max);
        return (cut > 0 ? s[..cut] : s[..max]).TrimEnd(' ', separator);
    }

    private async Task<Organization> RequireOrgAsync(string actingEin, CancellationToken ct)
    {
        var ein = BmfRowParser.NormalizeEin(actingEin) ?? throw ExchangeException.Forbidden("X-Org-Ein header must be a 9-digit EIN.");
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Ein == ein, ct)
                  ?? throw ExchangeException.Forbidden("We can't find that organization.");
        if (!org.Is501c3) throw ExchangeException.Forbidden("For now, only 501(c)(3) organizations can join.");
        return org;
    }

    private async Task<string> RequireEinAsync(string actingEin, CancellationToken ct) => (await RequireOrgAsync(actingEin, ct)).Ein;

    private async Task<Match> LoadMatchAsync(int id, CancellationToken ct, bool track = true)
    {
        var q = _db.Matches
            .Include(m => m.NeedListing!).ThenInclude(l => l.Org)
            .Include(m => m.OfferListing!).ThenInclude(l => l.Org)
            .Include(m => m.Messages)
            .AsQueryable();
        if (!track) q = q.AsNoTracking();
        return await q.FirstOrDefaultAsync(m => m.Id == id, ct) ?? throw ExchangeException.NotFound(ThreadGone);
    }

    private static void RequireParty(Match m, string ein)
    {
        if (m.NeedListing!.OrgEin != ein && m.OfferListing!.OrgEin != ein)
            throw ExchangeException.Forbidden("Only the two organizations in this thread can see it.");
    }

    private async Task<IReadOnlyDictionary<string, Organization>> OrgMapAsync(Match m, CancellationToken ct)
    {
        var eins = new HashSet<string> { m.NeedListing!.OrgEin, m.OfferListing!.OrgEin, m.ProposedByEin };
        foreach (var msg in m.Messages) eins.Add(msg.SenderEin);
        var map = new Dictionary<string, Organization>();
        if (m.NeedListing.Org is not null) map[m.NeedListing.OrgEin] = m.NeedListing.Org;
        if (m.OfferListing.Org is not null) map[m.OfferListing.OrgEin] = m.OfferListing.Org;
        var missing = eins.Where(e => !map.ContainsKey(e)).ToList();
        if (missing.Count > 0)
        {
            foreach (var o in await _db.Organizations.AsNoTracking().Where(o => missing.Contains(o.Ein)).ToListAsync(ct)) map[o.Ein] = o;
        }
        return map;
    }
}
