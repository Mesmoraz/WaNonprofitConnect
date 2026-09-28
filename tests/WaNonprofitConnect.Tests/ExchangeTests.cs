using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Tests;

public class MatchScorerTests
{
    [Theory]
    [InlineData("LAPTOPS", "LAPTOP")]
    [InlineData("SHEETS", "SHEET")]
    [InlineData("BOXES", "BOX")]
    [InlineData("SUPPLIES", "SUPPLY")]
    [InlineData("GLASS", "GLASS")]
    [InlineData("BUS", "BUS")]
    public void Stem_strips_common_plurals(string input, string expected) => MatchScorer.Stem(input).Should().Be(expected);

    [Fact]
    public void BuildSearchText_drops_stopwords_and_dedupes()
    {
        var text = MatchScorer.BuildSearchText("We need 40 sheets of plywood", "Plywood for ramps, please", "plywood,lumber");
        text.Split(' ').Should().BeEquivalentTo(new[] { "SHEET", "PLYWOOD", "RAMP", "LUMBER" });
    }

    [Fact]
    public void Score_rewards_category_keywords_location_urgency_and_quantity()
    {
        var need = Listing(ListingKind.Need, ListingCategory.Materials, "Plywood for ramps", "plywood,ramps", "SEATTLE", "98101", 25, Urgency.High);
        var offer = Listing(ListingKind.Offer, ListingCategory.Materials, "40 sheets plywood", "plywood,lumber", "SEATTLE", "98118", 40, Urgency.Normal);

        var s = MatchScorer.Score(need, offer, DateTime.UtcNow);

        // 50 category + 25 one keyword + 20 city + 5 high + 10 full qty + 5 recent
        s.Score.Should().Be(115);
        s.Reasons.Should().Contain(r => r.StartsWith("same category"));
        s.Reasons.Should().Contain(r => r.Contains("plywood"));
        s.Reasons.Should().Contain("same city (SEATTLE)");
        s.Reasons.Should().Contain("offer covers full quantity");
    }

    [Fact]
    public void Score_is_low_when_nothing_lines_up()
    {
        var need = Listing(ListingKind.Need, ListingCategory.Food, "Canned vegetables", null, "SPOKANE", "99201", 100, Urgency.Normal);
        var offer = Listing(ListingKind.Offer, ListingCategory.Technology, "Laptops", null, "SEATTLE", "98101", 5, Urgency.Normal);

        MatchScorer.Score(need, offer, DateTime.UtcNow).Score.Should().BeLessThan(MatchScorer.MinimumScore);
    }

    [Fact]
    public void Score_uses_zip_prefix_when_cities_differ_and_partial_quantity()
    {
        var need = Listing(ListingKind.Need, ListingCategory.Furniture, "Desks", null, "TUKWILA", "98188", 10, Urgency.Critical);
        var offer = Listing(ListingKind.Offer, ListingCategory.Furniture, "Desks", null, "SEATTLE", "98101", 4, Urgency.Normal);

        var s = MatchScorer.Score(need, offer, DateTime.UtcNow);
        s.Reasons.Should().Contain("same area (zip prefix)");
        s.Reasons.Should().Contain("need is critical");
        s.Reasons.Should().Contain(r => r.Contains("40% of quantity"));
    }

    [Fact]
    public void Score_rejects_wrong_order()
    {
        var a = Listing(ListingKind.Offer, ListingCategory.Other, "x", null, null, null, null, Urgency.Normal);
        var b = Listing(ListingKind.Need, ListingCategory.Other, "x", null, null, null, null, Urgency.Normal);
        var act = () => MatchScorer.Score(a, b);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void A_fit_needs_a_word_in_common_not_just_the_same_kind_of_help()
    {
        Listing Post(ListingKind kind, string title)
        {
            var l = Listing(kind, ListingCategory.Other, title, null, "SEATTLE", "98107", null, Urgency.High);
            l.Help = KindOfHelp.Things;
            return l;
        }
        var need = Post(ListingKind.Need, "12 laptops");

        var laptops = MatchScorer.Score(need, Post(ListingKind.Offer, "15 refurbished laptops (Win 11, 8 GB)"));
        laptops.IsFit.Should().BeTrue();
        laptops.Shared.Should().Be(1);

        var cans = MatchScorer.Score(need, Post(ListingKind.Offer, "6 pallets of canned vegetables"));
        cans.Score.Should().BeGreaterThanOrEqualTo(MatchScorer.MinimumScore); // same kind of help and city alone score high...
        cans.IsFit.Should().BeFalse();                                        // ...but it isn't a fit
    }

    internal static Listing Listing(ListingKind kind, ListingCategory cat, string title, string? tags, string? city, string? zip, decimal? qty, Urgency urgency) => new()
    {
        Kind = kind, Category = cat, Title = title, Tags = tags, City = city, Zip5 = zip, Quantity = qty, Urgency = urgency,
        SearchText = MatchScorer.BuildSearchText(title, null, tags), CreatedAt = DateTime.UtcNow, Status = ListingStatus.Open,
    };
}

public sealed class ExchangeServiceTests : IDisposable
{
    private const string A = "000000001"; // Seattle 501c3
    private const string B = "000000002"; // Tacoma 501c3
    private const string C = "000000003"; // Seattle 501c3 (third party)
    private const string NotC3 = "000000009";

    private readonly SqliteDbFixture _fx = new();
    private readonly RecordingNotifier _events = new();

    public ExchangeServiceTests()
    {
        using var db = _fx.CreateContext();
        var run = new ImportRun { Source = ImportSource.Bmf, Status = ImportStatus.Succeeded, StartedAt = DateTime.UtcNow };
        db.ImportRuns.Add(run);
        db.SaveChanges();
        db.Organizations.AddRange(
            Org(run, A, "ALPHA FOOD BANK", "SEATTLE", "98101", "03"),
            Org(run, B, "BETA HABITAT", "TACOMA", "98402", "03"),
            Org(run, C, "GAMMA TOOL LIBRARY", "SEATTLE", "98118", "03"),
            Org(run, NotC3, "DELTA CHAMBER OF COMMERCE", "SEATTLE", "98101", "06"));
        db.SaveChanges();
    }

    public void Dispose() => _fx.Dispose();

    private ExchangeService Svc(AppDbContextHolder h) => new(h.Db, _events);

    [Fact]
    public async Task Create_snapshots_org_location_and_builds_search_text()
    {
        using var h = new AppDbContextHolder(_fx);
        var l = await Svc(h).CreateListingAsync(A, new CreateListingRequest
        {
            Kind = ListingKind.Need, Category = ListingCategory.Materials, Title = "  Plywood for ramps ", Tags = "plywood", Quantity = 25, Unit = "sheets", ExpiresInDays = 30,
        });

        l.Title.Should().Be("Plywood for ramps");
        l.Org.Name.Should().Be("ALPHA FOOD BANK");
        l.City.Should().Be("SEATTLE");
        l.Zip5.Should().Be("98101");
        l.Status.Should().Be(ListingStatus.Open);
        l.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddDays(30), TimeSpan.FromMinutes(1));
        _events.Types.Should().Equal("listing.created");
    }

    [Fact]
    public async Task Only_501c3s_can_post()
    {
        using var h = new AppDbContextHolder(_fx);
        var act = () => Svc(h).CreateListingAsync(NotC3, Need("x"));
        (await act.Should().ThrowAsync<ExchangeException>()).Which.StatusCode.Should().Be(403);

        var unknown = () => Svc(h).CreateListingAsync("123456789", Need("x"));
        (await unknown.Should().ThrowAsync<ExchangeException>()).Which.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Suggestions_are_opposite_kind_other_org_open_and_ranked()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood for ramps", ListingCategory.Materials, "plywood"));
        var good = await svc.CreateListingAsync(B, Offer("40 sheets plywood", ListingCategory.Materials, "plywood"));
        var meh = await svc.CreateListingAsync(C, Offer("Assorted lumber", ListingCategory.Materials, "lumber"));
        await svc.CreateListingAsync(A, Offer("Plywood from same org", ListingCategory.Materials, "plywood")); // same org — excluded
        await svc.CreateListingAsync(C, Need("Plywood too", ListingCategory.Materials, "plywood"));          // same kind — excluded
        var closed = await svc.CreateListingAsync(B, Offer("Closed plywood", ListingCategory.Materials, "plywood"));
        await svc.CloseListingAsync(closed.Id, B);
        await svc.CreateListingAsync(B, Offer("Laptops", ListingCategory.Technology, "laptops"));             // no overlap — below threshold

        var s = await svc.SuggestMatchesAsync(need.Id);

        s.Select(x => x.Listing.Id).Should().Equal(good.Id, meh.Id);
        s[0].Score.Should().BeGreaterThan(s[1].Score);
        s[0].Reasons.Should().Contain(r => r.Contains("plywood"));
    }

    [Fact]
    public async Task Full_lifecycle_propose_accept_message_complete()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood", ListingCategory.Materials, "plywood"));
        var offer = await svc.CreateListingAsync(B, Offer("Plywood", ListingCategory.Materials, "plywood"));

        var m = await svc.ProposeMatchAsync(A, new ProposeMatchRequest { NeedListingId = need.Id, OfferListingId = offer.Id, Note = "hi" });
        m.Status.Should().Be(MatchStatus.Proposed);
        m.ProposedBy.Ein.Should().Be(A);
        m.Score.Should().BeGreaterThan(50);

        m = await svc.RespondAsync(m.Id, B, accept: true);
        m.Status.Should().Be(MatchStatus.Accepted);
        (await svc.GetListingAsync(need.Id))!.Status.Should().Be(ListingStatus.Matched);
        (await svc.GetListingAsync(offer.Id))!.Status.Should().Be(ListingStatus.Matched);

        await svc.SendMessageAsync(m.Id, B, new SendMessageRequest { Body = "Thursday?" });
        await svc.SendMessageAsync(m.Id, A, new SendMessageRequest { Body = "Yes." });
        var thread = await svc.GetMatchAsync(m.Id, A);
        thread.Messages.Select(x => x.Sender.Name + ": " + x.Body).Should().Equal("BETA HABITAT: Thursday?", "ALPHA FOOD BANK: Yes.");

        m = await svc.CompleteAsync(m.Id, A);
        m.Status.Should().Be(MatchStatus.Completed);
        (await svc.GetListingAsync(need.Id))!.Status.Should().Be(ListingStatus.Fulfilled);
        (await svc.GetListingAsync(offer.Id))!.Status.Should().Be(ListingStatus.Fulfilled);

        (await svc.ListMatchesForOrgAsync(B)).Should().ContainSingle(x => x.Id == m.Id);
        (await svc.ListMatchesForOrgAsync(C)).Should().BeEmpty();
        _events.Types.Should().ContainInOrder("match.proposed", "match.accepted", "message.sent", "message.sent", "match.completed");
    }

    [Fact]
    public async Task Rules_third_party_proposer_self_accept_double_match_and_same_org()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood", ListingCategory.Materials, "plywood"));
        var offer = await svc.CreateListingAsync(B, Offer("Plywood", ListingCategory.Materials, "plywood"));
        var offerA = await svc.CreateListingAsync(A, Offer("Plywood", ListingCategory.Materials, "plywood"));

        await Throws(() => svc.ProposeMatchAsync(C, Pair(need.Id, offer.Id)), 403);          // outsider can't propose
        await Throws(() => svc.ProposeMatchAsync(A, Pair(need.Id, offerA.Id)), 400);         // same org both sides
        await Throws(() => svc.ProposeMatchAsync(A, Pair(offer.Id, need.Id)), 400);          // need/offer swapped

        var m = await svc.ProposeMatchAsync(A, Pair(need.Id, offer.Id));
        await Throws(() => svc.ProposeMatchAsync(B, Pair(need.Id, offer.Id)), 409);          // duplicate pair
        await Throws(() => svc.RespondAsync(m.Id, A, true), 403);                            // proposer can't self-accept
        await Throws(() => svc.RespondAsync(m.Id, C, true), 403);                            // outsider can't accept
        await Throws(() => svc.GetMatchAsync(m.Id, C), 403);                                 // outsider can't read
        await Throws(() => svc.CompleteAsync(m.Id, B), 409);                                 // not accepted yet
        await Throws(() => svc.SendMessageAsync(m.Id, C, new SendMessageRequest { Body = "hi" }), 403);

        await svc.RespondAsync(m.Id, B, accept: true);
        var offer2 = await svc.CreateListingAsync(C, Offer("More plywood", ListingCategory.Materials, "plywood"));
        await Throws(() => svc.ProposeMatchAsync(C, Pair(need.Id, offer2.Id)), 409);         // need already Matched
    }

    [Fact]
    public async Task Decline_leaves_listings_open_and_cancel_after_accept_reopens_them()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood", ListingCategory.Materials, "plywood"));
        var offer = await svc.CreateListingAsync(B, Offer("Plywood", ListingCategory.Materials, "plywood"));

        var m = await svc.ProposeMatchAsync(A, Pair(need.Id, offer.Id));
        m = await svc.RespondAsync(m.Id, B, accept: false);
        m.Status.Should().Be(MatchStatus.Declined);
        (await svc.GetListingAsync(need.Id))!.Status.Should().Be(ListingStatus.Open);
        await Throws(() => svc.SendMessageAsync(m.Id, A, new SendMessageRequest { Body = "?" }), 409);

        var offer2 = await svc.CreateListingAsync(C, Offer("Plywood", ListingCategory.Materials, "plywood"));
        var m2 = await svc.ProposeMatchAsync(C, Pair(need.Id, offer2.Id));
        await svc.RespondAsync(m2.Id, A, accept: true);
        (await svc.GetListingAsync(need.Id))!.Status.Should().Be(ListingStatus.Matched);
        await svc.CancelAsync(m2.Id, C);
        (await svc.GetListingAsync(need.Id))!.Status.Should().Be(ListingStatus.Open);
        (await svc.GetListingAsync(offer2.Id))!.Status.Should().Be(ListingStatus.Open);
    }

    [Fact]
    public async Task Search_filters_and_orders_by_urgency_then_recency()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var low = await svc.CreateListingAsync(A, Need("Chairs", ListingCategory.Furniture, "chairs", Urgency.Low));
        var crit = await svc.CreateListingAsync(B, Need("Laptops for intake", ListingCategory.Technology, "laptops", Urgency.Critical));
        await svc.CreateListingAsync(C, Offer("Laptops", ListingCategory.Technology, "laptops"));

        var needs = await svc.SearchListingsAsync(new ListingSearchRequest { Kind = ListingKind.Need });
        needs.Items.Select(x => x.Id).Should().Equal(crit.Id, low.Id);

        var laptops = await svc.SearchListingsAsync(new ListingSearchRequest { Q = "laptop" });
        laptops.Total.Should().Be(2);

        var seattle = await svc.SearchListingsAsync(new ListingSearchRequest { City = "seattle" });
        seattle.Items.Select(x => x.Org.Ein).Should().OnlyContain(e => e == A || e == C);
    }

    [Fact]
    public async Task Times_come_back_from_the_database_as_utc_and_serialize_with_a_z()
    {
        using (var h = new AppDbContextHolder(_fx))
            await Svc(h).CreateListingAsync(A, Need("Plywood"));

        using var fresh = new AppDbContextHolder(_fx);
        var l = await fresh.Db.Listings.AsNoTracking().Include(x => x.Org).SingleAsync();
        l.CreatedAt.Kind.Should().Be(DateTimeKind.Utc);
        System.Text.Json.JsonSerializer.Serialize(l.CreatedAt).Should().EndWith("Z\"");
        System.Text.Json.JsonSerializer.Serialize(ListingDto.From(l)).Should().MatchRegex("\"CreatedAt\":\"[^\"]+Z\"");
    }

    [Fact]
    public async Task Details_unit_tags_and_search_text_fit_their_columns()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);

        var ex = await Invalid(() => svc.CreateListingAsync(A, With(Need("Plywood"), r => r.Description = new string('x', 4001))));
        ex.Message.Should().Be("Keep the details under 4,000 characters.");
        ex = await Invalid(() => svc.CreateListingAsync(A, With(Need("Plywood"), r => r.Unit = new string('u', 41))));
        ex.Message.Should().Be("Keep the unit under 40 characters.");

        // 500 distinct 7-letter words: 4,000 characters of details, twice what search text can hold.
        var words = Enumerable.Range(0, 520).Select(i => "WD" + ToLetters(i)).ToList();
        var tags = string.Join(",", Enumerable.Range(0, 100).Select(i => "tag" + ToLetters(i).ToLowerInvariant())); // 100 x 8 chars
        var made = await svc.CreateListingAsync(A, With(Need("Plywood"), r => { r.Description = string.Join(' ', words)[..3999] + "Y"; r.Unit = new string('u', 40); r.Tags = tags; }));

        var row = await h.Db.Listings.AsNoTracking().SingleAsync(x => x.Id == made.Id);
        row.Description!.Length.Should().Be(4000);
        row.Tags!.Length.Should().BeLessThanOrEqualTo(ExchangeService.MaxTags);
        row.Tags.Split(',').Should().OnlyContain(t => t.Length == 8 && t.StartsWith("tag")); // cut between tags, not inside one
        row.SearchText.Length.Should().BeLessThanOrEqualTo(ExchangeService.MaxSearchText);
        row.SearchText.Should().StartWith("PLYWOOD ");                                           // the title survives the cut
        var known = words.Append("PLYWOOD").ToHashSet();
        row.SearchText.Split(' ').Should().OnlyContain(t => known.Contains(t));                  // cut at a word
    }

    [Fact]
    public async Task Expiry_is_clamped_to_a_day_through_a_year()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        (await svc.CreateListingAsync(A, With(Need("a"), r => r.ExpiresInDays = int.MaxValue))).ExpiresAt
            .Should().BeCloseTo(DateTime.UtcNow.AddDays(365), TimeSpan.FromMinutes(1));
        (await svc.CreateListingAsync(A, With(Need("b"), r => r.ExpiresInDays = 0))).ExpiresAt
            .Should().BeCloseTo(DateTime.UtcNow.AddDays(1), TimeSpan.FromMinutes(1));
        (await svc.CreateListingAsync(A, Need("c"))).ExpiresAt.Should().BeNull();
    }

    [Fact]
    public async Task Accepting_needs_both_posts_still_open()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood", ListingCategory.Materials, "plywood"));
        var offerB = await svc.CreateListingAsync(B, Offer("Plywood", ListingCategory.Materials, "plywood"));
        var offerC = await svc.CreateListingAsync(C, Offer("Plywood", ListingCategory.Materials, "plywood"));
        var m1 = await svc.ProposeMatchAsync(B, Pair(need.Id, offerB.Id));
        var m2 = await svc.ProposeMatchAsync(C, Pair(need.Id, offerC.Id));

        await svc.RespondAsync(m1.Id, A, accept: true);
        var ex = await Conflict(() => svc.RespondAsync(m2.Id, A, accept: true)); // the need is taken now
        ex.Message.Should().Be("That post isn't open any more.");
        (await svc.GetMatchAsync(m2.Id, A)).Status.Should().Be(MatchStatus.Proposed);
        (await svc.RespondAsync(m2.Id, A, accept: false)).Status.Should().Be(MatchStatus.Declined); // declining still works

        // A closed offer can't be accepted either.
        var need2 = await svc.CreateListingAsync(A, Need("Chairs", ListingCategory.Furniture, "chairs"));
        var offer2 = await svc.CreateListingAsync(B, Offer("Chairs", ListingCategory.Furniture, "chairs"));
        var m3 = await svc.ProposeMatchAsync(A, Pair(need2.Id, offer2.Id));
        await svc.CloseListingAsync(offer2.Id, B);
        await Conflict(() => svc.RespondAsync(m3.Id, B, accept: true));
    }

    [Fact]
    public async Task Cancel_reopens_only_posts_this_thread_took_off_the_board()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood", ListingCategory.Materials, "plywood"));
        var offer = await svc.CreateListingAsync(B, Offer("Plywood", ListingCategory.Materials, "plywood"));
        var m = await svc.ProposeMatchAsync(A, Pair(need.Id, offer.Id));
        await svc.RespondAsync(m.Id, B, accept: true);

        await svc.CloseListingAsync(need.Id, A);  // A closes its need while the thread is live
        await svc.CancelAsync(m.Id, B);
        (await svc.GetListingAsync(need.Id))!.Status.Should().Be(ListingStatus.Closed);
        (await svc.GetListingAsync(offer.Id))!.Status.Should().Be(ListingStatus.Open);

        // Expired stays expired; a post another accepted thread holds stays taken.
        var need2 = await svc.CreateListingAsync(A, Need("Chairs", ListingCategory.Furniture, "chairs"));
        var offer2 = await svc.CreateListingAsync(B, Offer("Chairs", ListingCategory.Furniture, "chairs"));
        var offer3 = await svc.CreateListingAsync(C, Offer("Chairs", ListingCategory.Furniture, "chairs"));
        var m2 = await svc.ProposeMatchAsync(A, Pair(need2.Id, offer2.Id));
        var m3 = await svc.ProposeMatchAsync(A, Pair(need2.Id, offer3.Id));
        await svc.RespondAsync(m2.Id, B, accept: true);
        await h.Db.Matches.Where(x => x.Id == m3.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, MatchStatus.Accepted)); // older data
        await h.Db.Listings.Where(x => x.Id == offer2.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, ListingStatus.Expired));
        h.Db.ChangeTracker.Clear();

        await svc.CancelAsync(m2.Id, A);
        (await svc.GetListingAsync(need2.Id))!.Status.Should().Be(ListingStatus.Matched);
        (await svc.GetListingAsync(offer2.Id))!.Status.Should().Be(ListingStatus.Expired);
    }

    [Fact]
    public async Task Problem_titles_are_plain_sentences()
    {
        using var h = new AppDbContextHolder(_fx);
        var svc = Svc(h);
        var need = await svc.CreateListingAsync(A, Need("Plywood", ListingCategory.Materials, "plywood"));
        var offer = await svc.CreateListingAsync(B, Offer("Plywood", ListingCategory.Materials, "plywood"));
        var offerA = await svc.CreateListingAsync(A, Offer("Plywood", ListingCategory.Materials, "plywood"));

        (await Invalid(() => svc.CreateListingAsync(A, Need(" ")))).Message.Should().Be("Say what it is.");
        (await Invalid(() => svc.CreateListingAsync(A, Need(new string('t', 201))))).Message.Should().Be("Keep it under 200 characters.");
        (await Invalid(() => svc.ProposeMatchAsync(A, Pair(need.Id, offerA.Id)))).Message.Should().Be("That's your own post.");
        (await Invalid(() => svc.ProposeMatchAsync(A, Pair(offer.Id, need.Id)))).Message.Should().Be("Pick a need to pair with this offer.");
        (await Assert.ThrowsAsync<ExchangeException>(() => svc.CloseListingAsync(need.Id, B))).Message.Should().Be("Only the organization that posted this can close it.");
        (await Assert.ThrowsAsync<ExchangeException>(() => svc.CloseListingAsync(99999, A))).Message.Should().Be("That post is gone.");
        (await Assert.ThrowsAsync<ExchangeException>(() => svc.GetMatchAsync(99999, A))).Message.Should().Be("That thread is gone.");
        (await Assert.ThrowsAsync<ExchangeException>(() => svc.CreateListingAsync(NotC3, Need("x")))).Message.Should().Be("For now, only 501(c)(3) organizations can join.");

        var m = await svc.ProposeMatchAsync(A, Pair(need.Id, offer.Id));
        (await Conflict(() => svc.ProposeMatchAsync(B, Pair(need.Id, offer.Id)))).Message.Should().Be("You already have a thread for these.");
        await svc.RespondAsync(m.Id, B, accept: false);
        (await Conflict(() => svc.RespondAsync(m.Id, B, accept: true))).Message.Should().Be("This thread has already moved on.");
    }

    // ---- helpers ----

    private static CreateListingRequest With(CreateListingRequest r, Action<CreateListingRequest> set) { set(r); return r; }

    private static string ToLetters(int i) => new(new[] { (char)('A' + i / 676 % 26), (char)('A' + i / 26 % 26), (char)('A' + i % 26), 'Q', 'Z' });

    private static async Task<ExchangeException> Invalid(Func<Task> act)
    {
        var ex = (await act.Should().ThrowAsync<ExchangeException>()).Which;
        ex.StatusCode.Should().Be(400);
        return ex;
    }

    private static async Task<ExchangeException> Conflict(Func<Task> act)
    {
        var ex = (await act.Should().ThrowAsync<ExchangeException>()).Which;
        ex.StatusCode.Should().Be(409);
        return ex;
    }

    private static CreateListingRequest Need(string title, ListingCategory cat = ListingCategory.Other, string? tags = null, Urgency urgency = Urgency.Normal)
        => new() { Kind = ListingKind.Need, Category = cat, Title = title, Tags = tags, Quantity = 10, Urgency = urgency };

    private static CreateListingRequest Offer(string title, ListingCategory cat = ListingCategory.Other, string? tags = null)
        => new() { Kind = ListingKind.Offer, Category = cat, Title = title, Tags = tags, Quantity = 20 };

    private static ProposeMatchRequest Pair(int need, int offer) => new() { NeedListingId = need, OfferListingId = offer };

    private static async Task Throws(Func<Task> act, int status)
        => (await act.Should().ThrowAsync<ExchangeException>()).Which.StatusCode.Should().Be(status);

    private static Organization Org(ImportRun run, string ein, string name, string city, string zip, string sub) => new()
    {
        Ein = ein, Name = name, NameNormalized = BmfRowParser.Normalize(name), City = city, State = "WA", Zip = zip, Zip5 = zip,
        Subsection = sub, Is501c3 = sub == "03", FirstSeenImportRun = run, LastSeenImportRun = run, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
    };

    private sealed class RecordingNotifier : IExchangeNotifier
    {
        public List<string> Types { get; } = new();
        public Task ListingCreatedAsync(ListingDto listing, CancellationToken ct = default) { Types.Add("listing.created"); return Task.CompletedTask; }
        public Task MatchChangedAsync(MatchDto match, string change, CancellationToken ct = default) { Types.Add("match." + change); return Task.CompletedTask; }
        public Task MessageSentAsync(MatchDto match, MessageDto message, CancellationToken ct = default) { Types.Add("message.sent"); return Task.CompletedTask; }
    }

    /// <summary>One tracked context per test body, disposed at the end.</summary>
    private sealed class AppDbContextHolder : IDisposable
    {
        public Data.AppDbContext Db { get; }
        public AppDbContextHolder(SqliteDbFixture fx) => Db = fx.CreateContext();
        public void Dispose() => Db.Dispose();
    }
}
