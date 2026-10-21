using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Data.Exchange;

/// <summary>
/// The alpha's board, needs and offers, and threads, in the contract's shapes (docs/ALPHA.md).
/// State changes go through <see cref="ExchangeService"/>, which owns the rules; this adds fair ranking,
/// "I can help" in one tap, unread counts, the map, and the app's real-time events.
/// </summary>
public sealed partial class HelpbookService
{
    public const int MaxBoard = 200;
    private const int MaxCandidates = 500;
    private const int MaxFits = 10;

    private readonly AppDbContext _db;
    private readonly ExchangeService _exchange;
    private readonly IHelpbookNotifier _notifier;

    public HelpbookService(AppDbContext db, IHelpbookNotifier? notifier = null)
    {
        _db = db;
        _exchange = new ExchangeService(db); // its own (legacy) events stay quiet; this service sends the app's
        _notifier = notifier ?? NullHelpbookNotifier.Instance;
    }

    // ---- board and listings ---------------------------------------------------------

    /// <summary>
    /// Open needs and offers, fairly ranked. Counts a view for each listing in the top 12 that isn't the viewer's own,
    /// and only when the viewer is a confirmed member (<paramref name="viewerEin"/> set): anyone else signed in can
    /// look, but can't move the "Seen least" ranking (S-114).
    /// </summary>
    public async Task<IReadOnlyList<ListingViewDto>> BoardAsync(string? viewerEin, BoardQuery query, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var q = OpenListings(now);
        if (query.Help is { } help) q = q.Where(l => l.Help == help);
        if (query.Kind is { } kind) q = q.Where(l => l.Kind == kind);
        if (BmfRowParser.Clean(query.Q) is { } text)
        {
            foreach (var term in MatchScorer.Tokens(BmfRowParser.Normalize(text)))
            {
                var pattern = $"%{term}%";
                q = q.Where(l => EF.Functions.Like(l.SearchText, pattern));
            }
        }

        var rows = await q.OrderByDescending(l => l.CreatedAt).Take(MaxCandidates).ToListAsync(ct);
        var ranked = BoardRanking.Rank(rows).Take(MaxBoard).ToList();

        var seen = viewerEin is null ? new List<int>()
            : ranked.Take(BoardRanking.CountedPositions).Where(l => l.OrgEin != viewerEin).Select(l => l.Id).ToList();
        if (seen.Count > 0)
            await _db.Listings.Where(l => seen.Contains(l.Id)).ExecuteUpdateAsync(s => s.SetProperty(l => l.Views, l => l.Views + 1), ct);

        var orgs = await OrgSummariesAsync(ranked.Select(l => l.Org!), ct);
        return ranked.Select(l => View(l, orgs, now)).ToList();
    }

    /// <summary>One need or offer, with <c>fits</c>: the viewer's own posts that pair with it (or, on their own post, others' that could).</summary>
    public async Task<ListingViewDto?> GetListingAsync(int id, string? viewerEin, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var listing = await _db.Listings.AsNoTracking().Include(l => l.Org).FirstOrDefaultAsync(l => l.Id == id, ct);
        if (listing is null) return null;

        var fits = new List<(Listing Listing, int Score)>();
        int? myThreadId = null;
        if (viewerEin is not null)
        {
            var opposite = listing.Kind == ListingKind.Need ? ListingKind.Offer : ListingKind.Need;
            var candidates = OpenListings(now).Where(l => l.Kind == opposite);
            candidates = listing.OrgEin == viewerEin
                ? candidates.Where(l => l.OrgEin != viewerEin)
                : candidates.Where(l => l.OrgEin == viewerEin);
            foreach (var c in await candidates.OrderByDescending(l => l.CreatedAt).Take(MaxCandidates).ToListAsync(ct))
            {
                var (need, offer) = listing.Kind == ListingKind.Need ? (listing, c) : (c, listing);
                var m = MatchScorer.Score(need, offer, now);
                if (m.IsFit) fits.Add((c, m.Score));
            }

            if (listing.OrgEin != viewerEin)
            {
                myThreadId = await _db.Matches.AsNoTracking()
                    .Where(m => (m.NeedListingId == id && m.OfferListing!.OrgEin == viewerEin) || (m.OfferListingId == id && m.NeedListing!.OrgEin == viewerEin))
                    .Where(m => m.Status != MatchStatus.Declined && m.Status != MatchStatus.Cancelled)
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => (int?)m.Id)
                    .FirstOrDefaultAsync(ct);
            }
        }

        int? openThreads = listing.OrgEin == viewerEin
            ? await LiveThreads(id).CountAsync(ct)
            : null;

        var best = fits.OrderByDescending(f => f.Score).ThenByDescending(f => f.Listing.CreatedAt).Take(MaxFits).Select(f => f.Listing).ToList();
        var orgs = await OrgSummariesAsync(best.Select(l => l.Org!).Append(listing.Org!), ct);
        return View(listing, orgs, now) with
        {
            Fits = best.Select(l => View(l, orgs, now)).ToList(),
            MyThreadId = myThreadId,
            OpenThreads = openThreads,
        };
    }

    public async Task<ListingViewDto> CreateListingAsync(string actingEin, CreateListingRequest req, CancellationToken ct = default)
    {
        if (!Enum.IsDefined(req.Help)) throw ExchangeException.Invalid("Pick a kind of help.");
        var created = await _exchange.CreateListingAsync(actingEin, req, ct);
        var view = await LoadViewAsync(created.Id, ct);
        await _notifier.ListingAddedAsync(view, ct);
        return view;
    }

    /// <summary>Edit your post (S-97). Both sides of each live thread on it hear, so they see the change.</summary>
    public async Task<ListingViewDto> UpdateListingAsync(int id, string actingEin, UpdateListingRequest req, CancellationToken ct = default)
    {
        await _exchange.UpdateListingAsync(id, actingEin, req, ct);
        foreach (var threadId in await LiveThreads(id).Select(m => m.Id).ToListAsync(ct))
            await ChangedAsync(threadId, actingEin, ct);
        return await LoadViewAsync(id, ct);
    }

    /// <summary>
    /// Close your post. Its live threads close with it (S-104, Taylor, Oct 4: "a post was closed" reads as a closed
    /// thread), and cancelling puts the other organization's post back on the board if this thread held it.
    /// </summary>
    public async Task CloseListingAsync(int id, string actingEin, CancellationToken ct = default)
    {
        await _exchange.CloseListingAsync(id, actingEin, ct);
        var live = await LiveThreads(id).Select(m => m.Id).ToListAsync(ct);
        foreach (var threadId in live)
        {
            await _exchange.CancelAsync(threadId, actingEin, ct);
            await ChangedAsync(threadId, actingEin, ct);
        }
    }

    // ---- threads ---------------------------------------------------------------------

    /// <summary>Your organization's threads, newest activity first.</summary>
    public async Task<IReadOnlyList<ThreadDto>> ListThreadsAsync(string actingEin, CancellationToken ct = default)
    {
        var matches = await Threads().AsNoTracking()
            .Where(m => m.NeedListing!.OrgEin == actingEin || m.OfferListing!.OrgEin == actingEin)
            .ToListAsync(ct);
        var orgs = await OrgSummariesAsync(matches.SelectMany(m => new[] { m.NeedListing!.Org!, m.OfferListing!.Org! }), ct);
        var now = DateTime.UtcNow;
        return matches.Select(m => ToThread(m, orgs, actingEin, now)).OrderByDescending(LastActivity).ThenByDescending(t => t.Id).ToList();
    }

    /// <summary>One thread with its messages. Opening it marks it read for your side.</summary>
    public async Task<ThreadDto> GetThreadAsync(int id, string actingEin, CancellationToken ct = default)
    {
        var m = await Threads().FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw ExchangeException.NotFound(ExchangeService.ThreadGone);
        RequireParty(m, actingEin);
        MarkRead(m, actingEin, DateTime.UtcNow);
        await _db.SaveChangesAsync(ct);
        var orgs = await OrgSummariesAsync(new[] { m.NeedListing!.Org!, m.OfferListing!.Org! }, ct);
        return ToThread(m, orgs, actingEin, DateTime.UtcNow, withMessages: true);
    }

    /// <summary>
    /// "I can help" / "I need this". Without <see cref="StartThreadRequest.MyListingId"/>, makes the matching need or offer
    /// for you (same kind of help, your message as its details), then the thread, then the first message.
    /// </summary>
    public async Task<ThreadDto> StartThreadAsync(string actingEin, StartThreadRequest req, string? senderName, CancellationToken ct = default)
        => (await StartOrReuseThreadAsync(actingEin, req, senderName, ct)).Thread;

    /// <summary>
    /// Like <see cref="StartThreadAsync"/>, but says whether a thread was made. Without <see cref="StartThreadRequest.MyListingId"/>,
    /// if you already have a live (Proposed or Accepted) thread on that post, your message goes there and you get that thread back
    /// (<c>Created</c> false) instead of a second thread and a duplicate post.
    /// </summary>
    public async Task<(ThreadDto Thread, bool Created)> StartOrReuseThreadAsync(string actingEin, StartThreadRequest req, string? senderName, CancellationToken ct = default)
    {
        var message = BmfRowParser.Clean(req.Message);
        if (message is { Length: > ExchangeService.MaxMessage }) throw ExchangeException.Invalid(ExchangeService.MessageTooLong);
        var target = await _db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == req.ListingId, ct)
                     ?? throw ExchangeException.NotFound(ExchangeService.PostGone);
        if (target.OrgEin == actingEin) throw ExchangeException.Invalid("That's your own post.");

        if (req.MyListingId is null)
        {
            // A second tap on "I can help" (or a retry) lands in the thread you already have. Checked before "open",
            // because an accepted thread has already taken the post off the board.
            var existing = await _db.Matches.AsNoTracking()
                .Where(m => (m.NeedListingId == target.Id && m.OfferListing!.OrgEin == actingEin) || (m.OfferListingId == target.Id && m.NeedListing!.OrgEin == actingEin))
                .Where(m => m.Status == MatchStatus.Proposed || m.Status == MatchStatus.Accepted)
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => (int?)m.Id)
                .FirstOrDefaultAsync(ct);
            if (existing is { } threadId)
            {
                if (message is not null) return (await ReuseWithMessageAsync(threadId, actingEin, message, senderName, ct), false);
                return (await GetThreadAsync(threadId, actingEin, ct), false);
            }
        }

        if (target.Status != ListingStatus.Open) throw ExchangeException.Conflict(ExchangeService.NotOpen);

        ListingViewDto? createdListing = null;
        // Through the execution strategy: the database retries on a transient failure (a paused serverless
        // database waking up), and retries can't wrap a transaction opened by hand.
        var matchId = await _db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            createdListing = null;
            _db.ChangeTracker.Clear();
            int myListingId;
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            if (req.MyListingId is { } mine)
            {
                var own = await _db.Listings.AsNoTracking().FirstOrDefaultAsync(l => l.Id == mine, ct)
                          ?? throw ExchangeException.NotFound(ExchangeService.PostGone);
                if (own.OrgEin != actingEin) throw ExchangeException.Forbidden("Pick one of your own posts.");
                if (own.Kind == target.Kind) throw ExchangeException.Invalid("Pair a need with an offer. Pick one of your offers for a need, or one of your needs for an offer.");
                myListingId = own.Id;
            }
            else
            {
                if (message is null) throw ExchangeException.Invalid("Write a message first.");
                var made = await _exchange.CreateListingAsync(actingEin, new CreateListingRequest
                {
                    Kind = target.Kind == ListingKind.Need ? ListingKind.Offer : ListingKind.Need,
                    Help = target.Help == 0 ? KindOfHelp.Things : target.Help,
                    Category = target.Category,
                    Cadence = target.Cadence,
                    Title = target.Title,
                    // The message limit and the details limit are both 4,000 today; cut anyway so a change to one can't make this a 400.
                    Description = message.Length > ExchangeService.MaxDescription ? message[..ExchangeService.MaxDescription] : message,
                    Quantity = target.Quantity,
                    Unit = target.Unit,
                    Urgency = Urgency.Normal,
                }, ct);
                myListingId = made.Id;
                createdListing = await LoadViewAsync(made.Id, ct);
            }

            var (needId, offerId) = target.Kind == ListingKind.Need ? (target.Id, myListingId) : (myListingId, target.Id);
            var match = await _exchange.ProposeMatchAsync(actingEin, new ProposeMatchRequest { NeedListingId = needId, OfferListingId = offerId }, ct);
            if (message is not null)
                await _exchange.SendMessageAsync(match.Id, actingEin, new SendMessageRequest { Body = message }, ct, senderName);

            var tracked = await _db.Matches.Include(m => m.NeedListing).Include(m => m.OfferListing).FirstAsync(m => m.Id == match.Id, ct);
            MarkRead(tracked, actingEin, DateTime.UtcNow);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return match.Id;
        });

        if (createdListing is not null) await _notifier.ListingAddedAsync(createdListing, ct);
        var thread = await ChangedAsync(matchId, actingEin, ct);
        if (message is not null && thread.LastMessageAt is not null)
        {
            var first = await _db.Messages.AsNoTracking().Where(x => x.MatchId == matchId).OrderBy(x => x.SentAt).FirstAsync(ct);
            await _notifier.MessageAddedAsync(new[] { thread.Need.Org.Ein, thread.Offer.Org.Ein }, ToMessage(first, thread), ct);
        }
        return (thread, true);
    }

    private async Task<ThreadDto> ReuseWithMessageAsync(int threadId, string actingEin, string message, string? senderName, CancellationToken ct)
    {
        await SendMessageAsync(threadId, actingEin, message, senderName, ct);
        _db.ChangeTracker.Clear();
        return await GetThreadAsync(threadId, actingEin, ct);
    }

    public async Task<ThreadMessageDto> SendMessageAsync(int threadId, string actingEin, string? body, string? senderName, CancellationToken ct = default)
    {
        var sent = await _exchange.SendMessageAsync(threadId, actingEin, new SendMessageRequest { Body = body ?? string.Empty }, ct, senderName);
        var m = await _db.Matches.Include(x => x.NeedListing).Include(x => x.OfferListing).FirstAsync(x => x.Id == threadId, ct);
        MarkRead(m, actingEin, sent.SentAt);
        await _db.SaveChangesAsync(ct);

        var thread = await ChangedAsync(threadId, actingEin, ct);
        var msg = await _db.Messages.AsNoTracking().FirstAsync(x => x.Id == sent.Id, ct);
        var dto = ToMessage(msg, thread);
        await _notifier.MessageAddedAsync(new[] { thread.Need.Org.Ein, thread.Offer.Org.Ein }, dto, ct);
        return dto;
    }

    /// <summary>Only the side that didn't start the thread can accept or decline it.</summary>
    public async Task<ThreadDto> AcceptAsync(int id, string actingEin, CancellationToken ct = default)
    {
        await _exchange.RespondAsync(id, actingEin, accept: true, ct);
        return await ChangedAsync(id, actingEin, ct);
    }

    public async Task<ThreadDto> DeclineAsync(int id, string actingEin, CancellationToken ct = default)
    {
        await _exchange.RespondAsync(id, actingEin, accept: false, ct);
        return await ChangedAsync(id, actingEin, ct);
    }

    /// <summary>Either side, once accepted. Makes it golden: status Completed, both posts done.</summary>
    public async Task<ThreadDto> CompleteAsync(int id, string actingEin, CancellationToken ct = default)
    {
        await _exchange.CompleteAsync(id, actingEin, ct);
        return await ChangedAsync(id, actingEin, ct);
    }

    public async Task<ThreadDto> CancelAsync(int id, string actingEin, CancellationToken ct = default)
    {
        await _exchange.CancelAsync(id, actingEin, ct);
        return await ChangedAsync(id, actingEin, ct);
    }

    // ---- helpers ---------------------------------------------------------------------

    private IQueryable<Listing> OpenListings(DateTime now)
        => _db.Listings.AsNoTracking().Include(l => l.Org)
            .Where(l => l.Status == ListingStatus.Open && (l.ExpiresAt == null || l.ExpiresAt > now));

    /// <summary>Threads on this post still going: waiting for a yes, or accepted.</summary>
    private IQueryable<Match> LiveThreads(int listingId)
        => _db.Matches.AsNoTracking()
            .Where(m => (m.NeedListingId == listingId || m.OfferListingId == listingId) && (m.Status == MatchStatus.Proposed || m.Status == MatchStatus.Accepted));

    private IQueryable<Match> Threads()
        => _db.Matches
            .Include(m => m.NeedListing!).ThenInclude(l => l.Org)
            .Include(m => m.OfferListing!).ThenInclude(l => l.Org)
            .Include(m => m.Messages);

    private async Task<ListingViewDto> LoadViewAsync(int id, CancellationToken ct)
    {
        var l = await _db.Listings.AsNoTracking().Include(x => x.Org).FirstAsync(x => x.Id == id, ct);
        var orgs = await OrgSummariesAsync(new[] { l.Org! }, ct);
        return View(l, orgs, DateTime.UtcNow);
    }

    /// <summary>Reload the thread, tell both organizations (each with its own unread count), return the caller's view.</summary>
    private async Task<ThreadDto> ChangedAsync(int id, string actingEin, CancellationToken ct)
    {
        var m = await Threads().AsNoTracking().FirstAsync(x => x.Id == id, ct);
        var orgs = await OrgSummariesAsync(new[] { m.NeedListing!.Org!, m.OfferListing!.Org! }, ct);
        var now = DateTime.UtcNow;
        foreach (var ein in new[] { m.NeedListing.OrgEin, m.OfferListing.OrgEin })
            await _notifier.ThreadChangedAsync(ein, ToThread(m, orgs, ein, now), ct);
        return ToThread(m, orgs, actingEin, now);
    }

    /// <summary>Contract org cards: IRS basics, where it is (street address, else ZIP center), and whether anyone from it has joined.</summary>
    public async Task<Dictionary<string, OrgSummaryDto>> OrgSummariesAsync(IEnumerable<Organization> orgs, CancellationToken ct = default)
    {
        var list = orgs.Where(o => o is not null).DistinctBy(o => o.Ein).ToList();
        var eins = list.Select(o => o.Ein).ToList();
        var members = (await _db.Memberships.AsNoTracking()
            .Where(m => m.Status == MembershipStatus.Confirmed && eins.Contains(m.Ein))
            .Select(m => m.Ein).Distinct().ToListAsync(ct)).ToHashSet();
        var centroids = await CentroidsAsync(list.Select(o => o.Zip5), ct);
        return list.ToDictionary(o => o.Ein, o => Summary(o, members.Contains(o.Ein), centroids));
    }

    internal static OrgSummaryDto Summary(Organization o, bool isMember, IReadOnlyDictionary<string, (double Lat, double Lon)> centroids)
    {
        var at = OrgLocations.TryGet(o.Ein, out var street) ? street
            : o.Zip5 is not null && centroids.TryGetValue(o.Zip5, out var c) ? c : ((double, double)?)null;
        return new OrgSummaryDto(o.Ein, OrgName.Display(o.Name), o.City, o.Zip5, o.NteeCode, at?.Item1, at?.Item2, isMember);
    }

    private static ListingViewDto View(Listing l, IReadOnlyDictionary<string, OrgSummaryDto> orgs, DateTime now) => new(
        l.Id, l.Kind, l.Help, l.Title, l.Description, l.Quantity, l.Unit, l.Urgency, l.Cadence, l.Status.ToString(),
        orgs.TryGetValue(l.OrgEin, out var org) ? org : new OrgSummaryDto(l.OrgEin, l.OrgEin, null, null, null, null, null, false),
        l.CreatedAt, l.Views, BoardRanking.Why(l, now), l.EditedAt);

    private static ThreadDto ToThread(Match m, IReadOnlyDictionary<string, OrgSummaryDto> orgs, string viewerEin, DateTime now, bool withMessages = false)
    {
        var readAt = m.NeedListing!.OrgEin == viewerEin ? m.NeedSideReadAt : m.OfferSideReadAt;
        var unread = m.Messages.Count(x => x.SenderEin != viewerEin && (readAt is null || x.SentAt > readAt));
        var last = m.Messages.Count == 0 ? (DateTime?)null : m.Messages.Max(x => x.SentAt);
        var dto = new ThreadDto(m.Id, m.Status, View(m.NeedListing, orgs, now), View(m.OfferListing!, orgs, now), m.ProposedByEin,
            m.CreatedAt, m.RespondedAt, m.CompletedAt, last, unread);
        return withMessages ? dto with { Messages = m.Messages.OrderBy(x => x.SentAt).ThenBy(x => x.Id).Select(x => ToMessage(x, dto)).ToList() } : dto;
    }

    private static ThreadMessageDto ToMessage(Message x, ThreadDto thread)
    {
        var org = x.SenderEin == thread.Need.Org.Ein ? thread.Need.Org : thread.Offer.Org;
        return new ThreadMessageDto(x.Id, x.MatchId, x.SenderEin, x.SenderName ?? org.Name, x.Body, x.SentAt);
    }

    private static DateTime LastActivity(ThreadDto t)
        => new[] { t.CreatedAt, t.RespondedAt ?? DateTime.MinValue, t.CompletedAt ?? DateTime.MinValue, t.LastMessageAt ?? DateTime.MinValue }.Max();

    private static void MarkRead(Match m, string ein, DateTime at)
    {
        if (m.NeedListing!.OrgEin == ein) m.NeedSideReadAt = at;
        else if (m.OfferListing!.OrgEin == ein) m.OfferSideReadAt = at;
    }

    private static void RequireParty(Match m, string ein)
    {
        if (m.NeedListing!.OrgEin != ein && m.OfferListing!.OrgEin != ein)
            throw ExchangeException.Forbidden("Only the two organizations in this thread can see it.");
    }
}
