using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

public class BoardRankingTests
{
    private static readonly DateTime Now = new(2026, 9, 23, 12, 0, 0, DateTimeKind.Utc);
    private static int _id;

    private static Listing L(string ein, Urgency urgency, int views, int daysOld) => new()
    {
        Id = ++_id, OrgEin = ein, Kind = ListingKind.Need, Help = KindOfHelp.Things, Title = $"{ein}-{urgency}-{views}-{daysOld}",
        Urgency = urgency, Views = views, CreatedAt = Now.AddDays(-daysOld), Status = ListingStatus.Open,
    };

    [Trait("Story", "S-71"), Trait("Story", "S-45")]
    [Fact]
    public void Urgent_first_then_fewest_views_then_newest()
    {
        var normalOld = L(A, Urgency.Normal, 0, 20);
        var normalNew = L(B, Urgency.Low, 0, 1);         // Low and Normal share a band
        var normalSeen = L(C, Urgency.Normal, 9, 0);
        var high = L(D, Urgency.High, 50, 30);
        var critical = L(A, Urgency.Critical, 99, 40);

        var ranked = BoardRanking.Rank(new[] { normalOld, normalSeen, high, normalNew, critical });

        ranked.Should().Equal(critical, high, normalNew, normalOld, normalSeen);
        ranked.Select(l => BoardRanking.Why(l, Now)).Should().Equal("Urgent", "This week", "New", "Seen least", "New");
    }

    [Fact]
    public void No_org_gets_more_than_2_of_the_top_6_while_others_wait()
    {
        // A posts five urgent needs; B, C, D post ordinary ones.
        var a = Enumerable.Range(0, 5).Select(i => L(A, Urgency.Critical, i, 1)).ToList();
        var b = L(B, Urgency.Normal, 0, 1);
        var c = L(C, Urgency.Normal, 1, 1);
        var d1 = L(D, Urgency.Normal, 2, 1);
        var d2 = L(D, Urgency.Normal, 3, 1);
        var d3 = L(D, Urgency.Normal, 4, 1);

        var ranked = BoardRanking.Rank(a.Concat(new[] { b, c, d1, d2, d3 }));

        ranked.Take(6).Should().Equal(a[0], a[1], b, c, d1, d2);
        ranked.Take(6).GroupBy(l => l.OrgEin).Should().OnlyContain(g => g.Count() <= 2);
        // The skipped ones keep their order right after the top 6.
        ranked.Skip(6).Should().Equal(a[2], a[3], a[4], d3);
    }
}

public sealed class HelpbookServiceTests : IDisposable
{
    private readonly SqliteDbFixture _fx = new();
    private readonly Recorder _events = new();

    public HelpbookServiceTests()
    {
        using var db = _fx.CreateContext();
        SeedOrgs(db);
    }

    public void Dispose() => _fx.Dispose();

    private HelpbookService Svc(AppDbContext db) => new(db, _events);

    [Trait("Story", "S-71"), Trait("Story", "S-45")]
    [Fact]
    public async Task Board_ranks_fairly_and_counts_a_view_for_others_only()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var mine = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Mine"));
        var urgent = await svc.CreateListingAsync(B, Post(ListingKind.Need, "Urgent drivers", KindOfHelp.Time, Urgency.Critical));
        var offer = await svc.CreateListingAsync(C, Post(ListingKind.Offer, "Laptops", KindOfHelp.Things));
        _events.Listings.Should().HaveCount(3);

        var board = await svc.BoardAsync(A, new BoardQuery());
        board[0].Id.Should().Be(urgent.Id);
        board[0].Why.Should().Be("Urgent");
        board[0].Org.Name.Should().Be("Beta Habitat");
        board[0].Help.Should().Be(KindOfHelp.Time);

        var views = await db.Listings.AsNoTracking().ToDictionaryAsync(l => l.Id, l => l.Views);
        views[urgent.Id].Should().Be(1);
        views[offer.Id].Should().Be(1);
        views[mine.Id].Should().Be(0); // your own posts don't count as seen

        (await svc.BoardAsync(null, new BoardQuery { Help = KindOfHelp.Things, Kind = ListingKind.Offer })).Select(l => l.Id).Should().Equal(offer.Id);
        (await svc.BoardAsync(null, new BoardQuery { Q = "drivers" })).Select(l => l.Id).Should().Equal(urgent.Id);
    }

    [Fact]
    public async Task Starting_a_thread_without_a_listing_makes_the_opposite_one()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var need = await svc.CreateListingAsync(A, Post(ListingKind.Need, "12 laptops for client intake", KindOfHelp.Things, quantity: 12, unit: "laptops"));

        var thread = await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = "We have 15 refurbished ones. Thursday?" }, "Casey");

        thread.Status.Should().Be(MatchStatus.Proposed);
        thread.StartedByEin.Should().Be(B);
        thread.Need.Id.Should().Be(need.Id);
        thread.Offer.Kind.Should().Be(ListingKind.Offer);
        thread.Offer.Org.Ein.Should().Be(B);
        thread.Offer.Help.Should().Be(KindOfHelp.Things);
        thread.Offer.Title.Should().Be("12 laptops for client intake");
        thread.Offer.Description.Should().Be("We have 15 refurbished ones. Thursday?");
        thread.Offer.Quantity.Should().Be(12);
        thread.Unread.Should().Be(0);
        thread.LastMessageAt.Should().NotBeNull();

        var full = await svc.GetThreadAsync(thread.Id, A);
        full.Messages!.Should().ContainSingle().Which.Should().Match<ThreadMessageDto>(m => m.SenderName == "Casey" && m.SenderEin == B);

        // The other side sees it unread until they open it.
        _events.ThreadChanges.Should().Contain(x => x.Ein == A && x.Thread.Unread == 1);
        (await svc.ListThreadsAsync(A)).Single().Unread.Should().Be(0); // A just opened it above
        _events.Listings.Select(l => l.Kind).Should().Equal(ListingKind.Need, ListingKind.Offer);
        _events.Messages.Should().ContainSingle();

        // The need now shows B's thread; B's own offer fits it.
        var seenByB = await svc.GetListingAsync(need.Id, B);
        seenByB!.MyThreadId.Should().Be(thread.Id);
        seenByB.Fits!.Select(f => f.Id).Should().Contain(thread.Offer.Id);

        // No message and no listing of your own is not a thread.
        var need2 = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Chairs"));
        await Throws(() => svc.StartThreadAsync(B, new StartThreadRequest { ListingId = need2.Id }, null), 400);
        await Throws(() => svc.StartThreadAsync(A, new StartThreadRequest { ListingId = need2.Id, Message = "me" }, null), 400);
    }

    [Fact]
    public async Task Starting_a_thread_with_your_own_listing_pairs_them()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var offer = await svc.CreateListingAsync(C, Post(ListingKind.Offer, "Saturday drivers", KindOfHelp.Time));
        var myNeed = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Drivers for deliveries", KindOfHelp.Time));
        var myOffer = await svc.CreateListingAsync(A, Post(ListingKind.Offer, "Pallets", KindOfHelp.Things));
        var before = await db.Listings.CountAsync();

        await Throws(() => svc.StartThreadAsync(A, new StartThreadRequest { ListingId = offer.Id, MyListingId = myOffer.Id, Message = "x" }, null), 400);
        var thread = await svc.StartThreadAsync(A, new StartThreadRequest { ListingId = offer.Id, MyListingId = myNeed.Id, Message = "We need you" }, "Sam");

        thread.Need.Id.Should().Be(myNeed.Id);
        thread.Offer.Id.Should().Be(offer.Id);
        (await db.Listings.CountAsync()).Should().Be(before);
    }

    [Fact]
    public async Task Only_the_side_that_did_not_start_it_can_accept_and_either_side_completes()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var need = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Plywood"));
        var thread = await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = "We have 40 sheets" }, "Casey");

        await Throws(() => svc.AcceptAsync(thread.Id, B), 403);    // the starter can't accept
        await Throws(() => svc.DeclineAsync(thread.Id, B), 403);
        await Throws(() => svc.AcceptAsync(thread.Id, C), 403);    // an outsider can't either
        await Throws(() => svc.GetThreadAsync(thread.Id, C), 403);
        await Throws(() => svc.CompleteAsync(thread.Id, A), 409);  // not accepted yet

        var accepted = await svc.AcceptAsync(thread.Id, A);
        accepted.Status.Should().Be(MatchStatus.Accepted);
        accepted.RespondedAt.Should().NotBeNull();

        await svc.SendMessageAsync(thread.Id, A, "Thursday at 10?", "Robin");
        (await svc.ListThreadsAsync(B)).Single().Unread.Should().Be(1);

        var done = await svc.CompleteAsync(thread.Id, B);
        done.Status.Should().Be(MatchStatus.Completed);
        done.CompletedAt.Should().NotBeNull();
        done.Need.Status.Should().Be("Fulfilled");
        done.Offer.Status.Should().Be("Fulfilled");
        (await svc.BoardAsync(null, new BoardQuery())).Should().NotContain(l => l.Id == need.Id);
        _events.ThreadChanges.Where(x => x.Thread.Status == MatchStatus.Completed).Select(x => x.Ein).Should().BeEquivalentTo(new[] { A, B });
    }

    [Trait("Story", "S-71"), Trait("Story", "S-44")]
    [Fact]
    public async Task Urgent_is_capped_at_2_needs_a_rolling_month()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var accounts = new AccountService(db);
        var person = await accounts.SignInAsync("robin@example.org", "Robin");
        await accounts.ConfirmWithoutInviteAsync(person.Id, A);
        (await accounts.GetMeAsync(person.Id))!.Membership!.UrgentLeft.Should().Be(2);

        await svc.CreateListingAsync(A, Post(ListingKind.Need, "Cooler died", urgency: Urgency.Critical));
        (await accounts.GetMeAsync(person.Id))!.Membership!.UrgentLeft.Should().Be(1);
        var second = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Van died", urgency: Urgency.Critical));
        await svc.CloseListingAsync(second.Id, A); // closing doesn't give it back
        (await accounts.GetMeAsync(person.Id))!.Membership!.UrgentLeft.Should().Be(0);

        var act = () => svc.CreateListingAsync(A, Post(ListingKind.Need, "Roof leak", urgency: Urgency.Critical));
        var ex = (await act.Should().ThrowAsync<ExchangeException>()).Which;
        ex.StatusCode.Should().Be(409);
        ex.Message.Should().Be("Urgent is 2 a month. Pick This week instead.");

        (await svc.CreateListingAsync(A, Post(ListingKind.Need, "Roof leak", urgency: Urgency.High))).Urgency.Should().Be(Urgency.High);
        (await svc.CreateListingAsync(B, Post(ListingKind.Need, "Other org", urgency: Urgency.Critical))).Urgency.Should().Be(Urgency.Critical);

        // Older than 30 days no longer counts.
        await db.Listings.Where(l => l.OrgEin == A && l.Urgency == Urgency.Critical)
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.CreatedAt, DateTime.UtcNow.AddDays(-31)));
        (await accounts.GetMeAsync(person.Id))!.Membership!.UrgentLeft.Should().Be(2);

        // Urgency is for needs only; an offer is posted as ordinary.
        (await svc.CreateListingAsync(A, Post(ListingKind.Offer, "Spare cooler", urgency: Urgency.Critical))).Urgency.Should().Be(Urgency.Normal);
    }

    [Fact]
    public async Task Starting_again_on_the_same_post_reuses_your_live_thread()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var need = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Plywood"));
        var (first, created) = await svc.StartOrReuseThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = "We have 40 sheets" }, "Casey");
        created.Should().BeTrue();
        var listings = await db.Listings.CountAsync();

        var (again, createdAgain) = await svc.StartOrReuseThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = "Also 10 more" }, "Casey");
        createdAgain.Should().BeFalse();
        again.Id.Should().Be(first.Id);
        again.Messages!.Select(m => m.Body).Should().Equal("We have 40 sheets", "Also 10 more"); // the message isn't lost
        (await db.Listings.CountAsync()).Should().Be(listings);                                  // no duplicate offer
        (await db.Matches.CountAsync()).Should().Be(1);

        // Still the same thread once accepted, though the need is off the board.
        await svc.AcceptAsync(first.Id, A);
        (await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = "Thursday?" }, "Casey")).Id.Should().Be(first.Id);

        // Once it's cancelled, a new tap on an open post makes a new thread.
        await svc.CancelAsync(first.Id, B);
        var (fresh, createdFresh) = await svc.StartOrReuseThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = "Try again?" }, "Casey");
        createdFresh.Should().BeTrue();
        fresh.Id.Should().NotBe(first.Id);
    }

    [Fact]
    public async Task A_first_message_at_the_limit_fits_the_new_posts_details()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var need = await svc.CreateListingAsync(A, Post(ListingKind.Need, "Plywood"));
        var message = new string('m', ExchangeService.MaxMessage);

        var thread = await svc.StartThreadAsync(B, new StartThreadRequest { ListingId = need.Id, Message = message }, "Casey");
        thread.Offer.Description.Should().HaveLength(ExchangeService.MaxDescription);

        var ex = (await svc.Invoking(s => s.StartThreadAsync(C, new StartThreadRequest { ListingId = need.Id, Message = message + "m" }, null))
            .Should().ThrowAsync<ExchangeException>()).Which;
        ex.StatusCode.Should().Be(400);
        ex.Message.Should().Be("Keep your message under 4,000 characters.");
    }

    [Fact]
    public async Task Posting_needs_a_kind_of_help()
    {
        using var db = _fx.CreateContext();
        await Throws(() => Svc(db).CreateListingAsync(A, new CreateListingRequest { Kind = ListingKind.Need, Title = "x" }), 400);
    }

    private static CreateListingRequest Post(ListingKind kind, string title, KindOfHelp help = KindOfHelp.Things, Urgency urgency = Urgency.Normal,
        decimal? quantity = null, string? unit = null)
        => new() { Kind = kind, Help = help, Title = title, Urgency = urgency, Cadence = Cadence.OneTime, Quantity = quantity, Unit = unit };

    private static async Task Throws(Func<Task> act, int status)
        => (await act.Should().ThrowAsync<ExchangeException>()).Which.StatusCode.Should().Be(status);

    private sealed class Recorder : IHelpbookNotifier
    {
        public List<ListingViewDto> Listings { get; } = new();
        public List<(string Ein, ThreadDto Thread)> ThreadChanges { get; } = new();
        public List<ThreadMessageDto> Messages { get; } = new();
        public Task ListingAddedAsync(ListingViewDto listing, CancellationToken ct = default) { Listings.Add(listing); return Task.CompletedTask; }
        public Task ThreadChangedAsync(string ein, ThreadDto thread, CancellationToken ct = default) { ThreadChanges.Add((ein, thread)); return Task.CompletedTask; }
        public Task MessageAddedAsync(IReadOnlyCollection<string> eins, ThreadMessageDto message, CancellationToken ct = default) { Messages.Add(message); return Task.CompletedTask; }
    }
}
