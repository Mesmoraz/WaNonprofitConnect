using FluentAssertions;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

/// <summary>Admin's "How it's going" (S-100): the six alpha measures, real organizations only.</summary>
public sealed class AlphaNumbersTests : IDisposable
{
    private const string AdminEmail = "taylor@example.org";
    private static readonly DateTime Now = new(2026, 10, 27, 19, 0, 0, DateTimeKind.Utc);   // noon, Oct 27, Pacific
    private readonly SqliteDbFixture _fx = new();

    public AlphaNumbersTests()
    {
        using var db = _fx.CreateContext();
        SeedOrgs(db);
    }

    public void Dispose() => _fx.Dispose();

    private static AccountService Svc(AppDbContext db) => new(db, new AccountOptions { AdminEmails = new[] { AdminEmail } });

    private static Account Person(AppDbContext db, string email, string ein, DateTime joined, string? code = "INVITE01")
    {
        var account = new Account { Id = Guid.NewGuid(), Email = email, Name = email.Split('@')[0], CreatedAt = joined };
        db.Accounts.Add(account);
        db.Memberships.Add(new Membership
        {
            Account = account, Ein = ein, Status = MembershipStatus.Confirmed, Via = MembershipVia.Invite, InviteCode = code,
            CreatedAt = joined, DecidedAt = joined,
        });
        return account;
    }

    private static Listing Post(AppDbContext db, ListingKind kind, string ein, DateTime at)
    {
        var post = new Listing { Kind = kind, OrgEin = ein, Help = KindOfHelp.Things, Title = $"{kind} from {ein}", CreatedAt = at, UpdatedAt = at };
        db.Listings.Add(post);
        return post;
    }

    private static Match Thread(AppDbContext db, Listing need, Listing offer, string by, MatchStatus status, DateTime at,
                                DateTime? responded = null, DateTime? completed = null, Guid? startedBy = null)
    {
        var thread = new Match
        {
            NeedListing = need, OfferListing = offer, ProposedByEin = by, Status = status, CreatedAt = at,
            RespondedAt = responded, CompletedAt = completed, StartedByAccountId = startedBy,
        };
        db.Matches.Add(thread);
        return thread;
    }

    [Fact]
    public async Task Empty_database_gives_none_yet()
    {
        using var db = _fx.CreateContext();

        var n = await Svc(db).AlphaNumbersAsync(Now);

        n.Should().Be(new AlphaNumbersDto(0, 0, 0, 0, 0, "October",
            new Ratio(0, 0), null, new Ratio(0, 0), new Ratio(0, 0), new Ratio(0, 0)));
    }

    [Fact]
    public async Task Counts_each_of_the_six_measures()
    {
        using var db = _fx.CreateContext();
        Person(db, "sam@example.org", A, Now.AddDays(-20));
        Person(db, "kim@example.org", B, Now.AddDays(-20));
        Person(db, "lee@example.org", C, Now.AddDays(-3));     // joined 3 days ago, nothing posted: not counted in row 5 yet

        // A posts a need and an offer in its first week; B only an offer.
        var aNeed = Post(db, ListingKind.Need, A, Now.AddDays(-19));
        var aOffer = Post(db, ListingKind.Offer, A, Now.AddDays(-18));
        var bOffer = Post(db, ListingKind.Offer, B, Now.AddDays(-19));
        var bNeed = Post(db, ListingKind.Need, B, Now.AddDays(-10));    // B's need came after its first week
        var cNeed = Post(db, ListingKind.Need, C, Now.AddDays(-1));     // young, no thread: not counted in row 2 yet
        await db.SaveChangesAsync();

        // B gives to A: golden, answered in 2 hours with a yes.
        Thread(db, aNeed, bOffer, A, MatchStatus.Completed, Now.AddDays(-17), responded: Now.AddDays(-17).AddHours(2), completed: Now.AddDays(-12));
        // A gives to B: golden this month, answered in 4 hours.
        Thread(db, bNeed, aOffer, B, MatchStatus.Completed, Now.AddDays(-9), responded: Now.AddDays(-9).AddHours(4), completed: Now.AddDays(-2));
        await db.SaveChangesAsync();

        var n = await Svc(db).AlphaNumbersAsync(Now);

        n.Posts.Should().Be(5);
        n.Started.Should().Be(2);
        n.Accepted.Should().Be(2);
        n.Golden.Should().Be(2);
        n.GoldenThisMonth.Should().Be(2);
        n.ThreadWithin14Days.Should().Be(new Ratio(4, 4));        // cNeed is too young to count
        n.FirstAnswerMedianMinutes.Should().Be(180);              // 2 and 4 hours: the middle is 3
        n.BecameGolden.Should().Be(new Ratio(2, 2));
        n.BothInFirstWeek.Should().Be(new Ratio(1, 2));           // A yes, B no; C's week isn't over
        n.GivenAndReceived.Should().Be(new Ratio(2, 3));          // A and B both gave and received; C hasn't
    }

    [Fact]
    public async Task Young_posts_without_a_thread_are_not_counted_yet()
    {
        using var db = _fx.CreateContext();
        Person(db, "sam@example.org", A, Now.AddDays(-30));
        Person(db, "kim@example.org", B, Now.AddDays(-30));
        Post(db, ListingKind.Need, A, Now.AddDays(-13));                       // 13 days, no thread: wait
        Post(db, ListingKind.Need, A, Now.AddDays(-15));                       // 15 days, no thread: counted, didn't get one
        var late = Post(db, ListingKind.Need, A, Now.AddDays(-25));            // a thread, but on day 20
        var young = Post(db, ListingKind.Need, A, Now.AddDays(-2));            // 2 days, already has one: counted
        var offer = Post(db, ListingKind.Offer, B, Now.AddDays(-25));
        var offer2 = Post(db, ListingKind.Offer, B, Now.AddDays(-25));
        await db.SaveChangesAsync();
        Thread(db, late, offer, B, MatchStatus.Proposed, Now.AddDays(-5));
        Thread(db, young, offer2, B, MatchStatus.Proposed, Now.AddDays(-1));
        await db.SaveChangesAsync();

        var n = await Svc(db).AlphaNumbersAsync(Now);

        // Counted: the 15-day one, late, young, and both offers. Only young got its thread within 14 days.
        n.ThreadWithin14Days.Should().Be(new Ratio(1, 5));
        n.BecameGolden.Should().Be(new Ratio(0, 0));               // both threads are under 30 days and still going
    }

    [Fact]
    public async Task Declined_cancelled_and_month_old_threads_count_as_not_golden()
    {
        using var db = _fx.CreateContext();
        Person(db, "sam@example.org", A, Now.AddDays(-60));
        Person(db, "kim@example.org", B, Now.AddDays(-60));
        Listing N() => Post(db, ListingKind.Need, A, Now.AddDays(-50));
        Listing O() => Post(db, ListingKind.Offer, B, Now.AddDays(-50));
        Thread(db, N(), O(), A, MatchStatus.Completed, Now.AddDays(-40), completed: Now.AddDays(-35));
        Thread(db, N(), O(), A, MatchStatus.Declined, Now.AddDays(-5));
        Thread(db, N(), O(), A, MatchStatus.Cancelled, Now.AddDays(-5));
        Thread(db, N(), O(), A, MatchStatus.Accepted, Now.AddDays(-31));       // open a month: counts
        Thread(db, N(), O(), A, MatchStatus.Proposed, Now.AddDays(-29));       // not yet
        await db.SaveChangesAsync();

        var n = await Svc(db).AlphaNumbersAsync(Now);

        n.BecameGolden.Should().Be(new Ratio(1, 4));
        n.Accepted.Should().Be(2);
        n.GoldenThisMonth.Should().Be(0);                                      // done in September
    }

    [Fact]
    public async Task Month_is_counted_in_Pacific_time()
    {
        using var db = _fx.CreateContext();
        Person(db, "sam@example.org", A, Now.AddDays(-30));
        Person(db, "kim@example.org", B, Now.AddDays(-30));
        var need = Post(db, ListingKind.Need, A, Now.AddDays(-20));
        var offer = Post(db, ListingKind.Offer, B, Now.AddDays(-20));
        await db.SaveChangesAsync();
        // 04:00 UTC on Nov 1 is 9 pm on Oct 31 in Seattle.
        Thread(db, need, offer, A, MatchStatus.Completed, Now.AddDays(-10), completed: new DateTime(2026, 11, 1, 4, 0, 0, DateTimeKind.Utc));
        await db.SaveChangesAsync();

        var oct31 = await Svc(db).AlphaNumbersAsync(new DateTime(2026, 11, 1, 6, 0, 0, DateTimeKind.Utc));
        oct31.Month.Should().Be("October");
        oct31.GoldenThisMonth.Should().Be(1);

        var nov1 = await Svc(db).AlphaNumbersAsync(new DateTime(2026, 11, 1, 8, 0, 0, DateTimeKind.Utc));
        nov1.Month.Should().Be("November");
        nov1.GoldenThisMonth.Should().Be(0);
    }

    [Fact]
    public async Task First_answer_ignores_the_starters_own_messages()
    {
        using var db = _fx.CreateContext();
        Person(db, "sam@example.org", A, Now.AddDays(-30));
        Person(db, "kim@example.org", B, Now.AddDays(-30));
        var need = Post(db, ListingKind.Need, A, Now.AddDays(-20));
        var offer = Post(db, ListingKind.Offer, B, Now.AddDays(-20));
        var need2 = Post(db, ListingKind.Need, A, Now.AddDays(-20));
        var offer2 = Post(db, ListingKind.Offer, B, Now.AddDays(-20));
        await db.SaveChangesAsync();
        var start = Now.AddDays(-5);
        var talked = Thread(db, need, offer, A, MatchStatus.Proposed, start);
        talked.Messages.Add(new Message { SenderEin = A, Body = "Hello?", SentAt = start.AddMinutes(10) });   // the starter, again
        talked.Messages.Add(new Message { SenderEin = B, Body = "Yes!", SentAt = start.AddMinutes(40) });
        var silent = Thread(db, need2, offer2, A, MatchStatus.Proposed, start);
        silent.Messages.Add(new Message { SenderEin = A, Body = "Anyone?", SentAt = start.AddMinutes(5) });
        await db.SaveChangesAsync();

        var n = await Svc(db).AlphaNumbersAsync(Now);

        n.FirstAnswerMedianMinutes.Should().Be(40);   // only the answered one, timed to B's reply
    }

    [Fact]
    public async Task Test_organizations_and_threads_an_admin_started_are_left_out()
    {
        using var db = _fx.CreateContext();
        Person(db, "sam@example.org", A, Now.AddDays(-30));
        Person(db, "kim@example.org", B, Now.AddDays(-30));
        var admin = Person(db, AdminEmail, D, Now.AddDays(-30), code: AccountService.AdminTestCode);   // "Test as this organization"
        Person(db, "dev@example.org", C, Now.AddDays(-30), code: AccountService.DevCode);
        var need = Post(db, ListingKind.Need, A, Now.AddDays(-20));
        var offer = Post(db, ListingKind.Offer, B, Now.AddDays(-20));
        var testOffer = Post(db, ListingKind.Offer, D, Now.AddDays(-20));
        Post(db, ListingKind.Need, C, Now.AddDays(-20));
        await db.SaveChangesAsync();
        Thread(db, need, offer, A, MatchStatus.Completed, Now.AddDays(-10), completed: Now.AddDays(-5), startedBy: admin.Id);   // Taylor, testing as A
        Thread(db, need, testOffer, D, MatchStatus.Completed, Now.AddDays(-10), completed: Now.AddDays(-5));                    // with a test organization
        await db.SaveChangesAsync();

        var n = await Svc(db).AlphaNumbersAsync(Now);

        n.Posts.Should().Be(2);
        n.Started.Should().Be(0);
        n.Golden.Should().Be(0);
        n.GivenAndReceived.Should().Be(new Ratio(0, 2));
    }

    [Fact]
    public async Task Starting_a_thread_records_who_started_it()
    {
        using var db = _fx.CreateContext();
        var sam = Person(db, "sam@example.org", A, Now.AddDays(-30));
        Person(db, "kim@example.org", B, Now.AddDays(-30));
        var offer = Post(db, ListingKind.Offer, B, DateTime.UtcNow);
        await db.SaveChangesAsync();
        var helpbook = new Data.Exchange.HelpbookService(db);

        var (thread, _) = await helpbook.StartOrReuseThreadAsync(A, new Data.Exchange.StartThreadRequest { ListingId = offer.Id, Message = "We could use these" }, "sam", startedBy: sam.Id);

        db.Matches.Single(m => m.Id == thread.Id).StartedByAccountId.Should().Be(sam.Id);
    }
}
