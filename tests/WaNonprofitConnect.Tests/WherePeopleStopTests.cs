using FluentAssertions;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

/// <summary>Admin's "Where people stop" (S-148): each step from sign-in to golden thread.</summary>
public sealed class WherePeopleStopTests : IDisposable
{
    private const string AdminEmail = "taylor@example.org";
    private static readonly DateTime Now = new(2026, 10, 27, 19, 0, 0, DateTimeKind.Utc);
    private readonly SqliteDbFixture _fx = new();

    public WherePeopleStopTests()
    {
        using var db = _fx.CreateContext();
        SeedOrgs(db);
    }

    public void Dispose() => _fx.Dispose();

    private static AccountService Svc(AppDbContext db) => new(db, new AccountOptions { AdminEmails = new[] { AdminEmail } });

    /// <summary>Someone who signed in with Google; no Google account is the development sign-in.</summary>
    private static Account Person(AppDbContext db, string email, DateTime? lastSignIn = null, bool google = true)
    {
        var account = new Account
        {
            Id = Guid.NewGuid(), Email = email, Name = email.Split('@')[0], CreatedAt = Now.AddDays(-30),
            GoogleSubject = google ? $"g-{email}" : null, LastSignInAt = lastSignIn,
        };
        db.Accounts.Add(account);
        return account;
    }

    private static void Member(AppDbContext db, Account who, string ein, DateTime joined, MembershipStatus status = MembershipStatus.Confirmed,
                               MembershipVia via = MembershipVia.Invite, string? code = "INVITE01")
        => db.Memberships.Add(new Membership
        {
            Account = who, Ein = ein, Status = status, Via = via, InviteCode = code, CreatedAt = joined,
            DecidedAt = status == MembershipStatus.Pending ? null : joined,
        });

    private static Listing Post(AppDbContext db, ListingKind kind, string ein)
    {
        var post = new Listing { Kind = kind, OrgEin = ein, Help = KindOfHelp.Things, Title = $"{kind} from {ein}", CreatedAt = Now.AddDays(-10), UpdatedAt = Now.AddDays(-10) };
        db.Listings.Add(post);
        return post;
    }

    private static void Thread(AppDbContext db, Listing need, Listing offer, MatchStatus status, Guid? startedBy = null)
        => db.Matches.Add(new Match
        {
            NeedListing = need, OfferListing = offer, ProposedByEin = offer.OrgEin, Status = status, CreatedAt = Now.AddDays(-5),
            CompletedAt = status == MatchStatus.Completed ? Now.AddDays(-1) : null, StartedByAccountId = startedBy,
        });

    [Fact]
    public async Task Empty_database_counts_nothing()
    {
        using var db = _fx.CreateContext();

        var s = await Svc(db).WherePeopleStopAsync(Now);

        s.Should().Be(new WherePeopleStopDto(0, 0, 0, 0, 0, 0, 0, new Ratio(0, 0)));
    }

    [Fact]
    public async Task Counts_each_step_from_sign_in_to_golden_thread()
    {
        using var db = _fx.CreateContext();
        var sam = Person(db, "sam@example.org", lastSignIn: Now.AddDays(-1));      // A, joined 20 days ago, came back
        var kim = Person(db, "kim@example.org", lastSignIn: Now.AddDays(-12));     // B, joined 20 days ago, hasn't
        var lee = Person(db, "lee@example.org", lastSignIn: Now.AddDays(-2));      // C, joined 3 days ago: too new for "came back"
        var ari = Person(db, "ari@example.org");                                   // D, waiting for an admin
        Person(db, "pat@example.org");                                             // signed in, nothing else
        Member(db, sam, A, Now.AddDays(-20));
        Member(db, kim, B, Now.AddDays(-20));
        Member(db, lee, C, Now.AddDays(-3));
        Member(db, ari, D, Now.AddDays(-1), MembershipStatus.Pending, MembershipVia.Claim, code: null);

        // A and B posted and have a golden thread; C posted, no thread.
        var aNeed = Post(db, ListingKind.Need, A);
        var bOffer = Post(db, ListingKind.Offer, B);
        Post(db, ListingKind.Need, C);
        await db.SaveChangesAsync();
        Thread(db, aNeed, bOffer, MatchStatus.Completed);
        await db.SaveChangesAsync();

        var s = await Svc(db).WherePeopleStopAsync(Now);

        s.SignedIn.Should().Be(5);
        s.Confirmed.Should().Be(3);
        s.Waiting.Should().Be(1);          // ari: waiting for you, not stopped
        s.Orgs.Should().Be(3);
        s.Posted.Should().Be(3);
        s.InThread.Should().Be(2);
        s.Golden.Should().Be(2);
        s.CameBack.Should().Be(new Ratio(1, 2));   // sam yes, kim no; lee joined this week
    }

    [Fact]
    public async Task Admins_test_sign_ins_and_admin_started_threads_are_left_out()
    {
        using var db = _fx.CreateContext();
        var taylor = Person(db, AdminEmail);
        var dev = Person(db, "e2e-robin@example.org", google: false);              // the development sign-in
        var tester = Person(db, "kim@example.org");
        var sam = Person(db, "sam@example.org");
        var ari = Person(db, "ari@example.org");
        Member(db, taylor, A, Now.AddDays(-20));
        Member(db, dev, B, Now.AddDays(-20), code: AccountService.DevCode);
        Member(db, tester, C, Now.AddDays(-20), code: AccountService.AdminTestCode);
        Member(db, sam, A, Now.AddDays(-20));
        Member(db, ari, D, Now.AddDays(-20));

        var aNeed = Post(db, ListingKind.Need, A);
        var dOffer = Post(db, ListingKind.Offer, D);
        await db.SaveChangesAsync();
        Thread(db, aNeed, dOffer, MatchStatus.Completed, startedBy: taylor.Id);     // an admin's test thread
        await db.SaveChangesAsync();

        var s = await Svc(db).WherePeopleStopAsync(Now);

        s.SignedIn.Should().Be(3);         // kim, sam and ari; not Taylor, not the development sign-in
        s.Confirmed.Should().Be(2);        // sam and ari; kim is only "Test as this organization"
        s.Orgs.Should().Be(2);             // A and D
        s.Posted.Should().Be(2);
        s.InThread.Should().Be(0);
        s.Golden.Should().Be(0);
    }
}
