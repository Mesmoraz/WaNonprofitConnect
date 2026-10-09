using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

public sealed class AccountServiceTests : IDisposable
{
    private const string AdminEmail = "taylor@example.org";
    private readonly SqliteDbFixture _fx = new();

    public AccountServiceTests()
    {
        using var db = _fx.CreateContext();
        SeedOrgs(db);
    }

    public void Dispose() => _fx.Dispose();

    private AccountService Svc(Data.AppDbContext db) => new(db, new AccountOptions { AdminEmails = new[] { AdminEmail } });

    [Fact]
    public async Task Invite_redeem_confirms_membership_for_the_invites_org()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var invite = await svc.CreateInviteAsync(A, uses: 1, AdminEmail);
        invite.Code.Should().HaveLength(AccountService.InviteLength).And.MatchRegex("^[" + AccountService.InviteAlphabet + "]+$");
        invite.OrgName.Should().Be("Alpha Food Bank");

        var person = await svc.SignInAsync("  Sam@Example.org ", "Sam");
        person.Email.Should().Be("sam@example.org");

        // People type codes with dashes and lower case from a text message.
        var code = invite.Code.ToLowerInvariant().Insert(4, "-");
        var me = await svc.RedeemInviteAsync(person.Id, code);

        me.Membership.Should().Be(new MeMembershipDto(A, "Alpha Food Bank", "confirmed", 2));
        (await svc.RequireActingEinAsync(person.Id)).Should().Be(A);
        (await db.Invites.AsNoTracking().SingleAsync()).Used.Should().Be(1);

        // Used up: a second person can't redeem a one-use code.
        var other = await svc.SignInAsync("pat@example.org", "Pat");
        await Throws(() => svc.RedeemInviteAsync(other.Id, invite.Code), 409);
        await Throws(() => svc.RedeemInviteAsync(other.Id, "ZZZZZZZZ"), 404);
    }

    [Fact]
    public async Task The_last_use_of_an_invite_goes_to_one_person_when_two_redeem_at_once()
    {
        string code;
        using (var setup = _fx.CreateContext()) code = (await Svc(setup).CreateInviteAsync(A, uses: 1, AdminEmail)).Code;

        using var db1 = _fx.CreateContext();
        using var db2 = _fx.CreateContext();
        var sam = await Svc(db1).SignInAsync("sam@example.org", "Sam");
        var pat = await Svc(db2).SignInAsync("pat@example.org", "Pat");

        // db1 read the invite (Used 0) just before db2 took the last use: a race, made deterministic.
        (await db1.Invites.SingleAsync(i => i.Code == code)).Used.Should().Be(0);
        await Svc(db2).RedeemInviteAsync(pat.Id, code);

        var ex = (await Svc(db1).Invoking(s => s.RedeemInviteAsync(sam.Id, code)).Should().ThrowAsync<ExchangeException>()).Which;
        ex.StatusCode.Should().Be(409);
        ex.Message.Should().Be("That code has been used. Ask for a new one.");
        (await db2.Invites.AsNoTracking().SingleAsync()).Used.Should().Be(1);
        (await db2.Memberships.AsNoTracking().CountAsync(m => m.Ein == A)).Should().Be(1);
    }

    [Fact]
    public async Task Claim_is_pending_until_an_admin_approves_it()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var person = await svc.SignInAsync("lee@example.org", "Lee");

        var me = await svc.ClaimAsync(person.Id, "00-0000002");
        me.Membership.Should().Be(new MeMembershipDto(B, "Beta Habitat", "pending", 2));
        await Throws(() => svc.RequireActingEinAsync(person.Id), 403);

        var claims = await svc.ListClaimsAsync();
        claims.Should().ContainSingle(c => c.Ein == B && c.Email == "lee@example.org" && c.Status == "pending");

        var decided = await svc.DecideClaimAsync(claims[0].Id, approve: true, AdminEmail);
        decided.Status.Should().Be("confirmed");
        (await svc.RequireActingEinAsync(person.Id)).Should().Be(B);
        (await svc.ListClaimsAsync()).Should().BeEmpty();
        await Throws(() => svc.DecideClaimAsync(claims[0].Id, approve: false, AdminEmail), 409);
    }

    [Fact]
    public async Task Rejected_claim_shows_no_membership_and_can_claim_again()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var person = await svc.SignInAsync("kim@example.org", "Kim");
        await svc.ClaimAsync(person.Id, C);
        var claim = (await svc.ListClaimsAsync()).Single();
        await svc.DecideClaimAsync(claim.Id, approve: false, AdminEmail);

        (await svc.GetMeAsync(person.Id))!.Membership.Should().BeNull();
        await Throws(() => svc.RequireActingEinAsync(person.Id), 403);
        (await svc.ClaimAsync(person.Id, D)).Membership!.Status.Should().Be("pending");
    }

    [Fact]
    public async Task Membership_rules_one_per_account_and_501c3_only()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var person = await svc.SignInAsync("ash@example.org", "Ash");
        await Throws(() => svc.RequireActingEinAsync(person.Id), 403);          // no membership at all
        await Throws(() => svc.ClaimAsync(person.Id, NotC3), 403);              // not a 501(c)(3)
        await Throws(() => svc.ClaimAsync(person.Id, "123"), 400);              // not an EIN
        await Throws(() => svc.ClaimAsync(person.Id, "123456789"), 404);        // unknown

        // A pending claim is replaced by an invite for a different org.
        await svc.ClaimAsync(person.Id, B);
        var invite = await svc.CreateInviteAsync(A, uses: 2, AdminEmail);
        (await svc.RedeemInviteAsync(person.Id, invite.Code)).Membership!.Ein.Should().Be(A);

        // Once confirmed, no second organization.
        await Throws(() => svc.ClaimAsync(person.Id, C), 409);
        var inviteC = await svc.CreateInviteAsync(C, uses: 1, AdminEmail);
        await Throws(() => svc.RedeemInviteAsync(person.Id, inviteC.Code), 409);

        await Throws(() => svc.RequireActingEinAsync(Guid.NewGuid()), 401);     // account gone
    }

    [Fact]
    public async Task Admin_comes_from_config_and_google_accounts_are_found_by_subject()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var admin = await svc.SignInAsync("TAYLOR@example.org", "Taylor", googleSubject: "g-1");
        (await svc.GetMeAsync(admin.Id))!.Account.IsAdmin.Should().BeTrue();

        var again = await svc.SignInAsync("taylor.new@example.org", "Taylor P", googleSubject: "g-1");
        again.Id.Should().Be(admin.Id);
        again.Email.Should().Be("taylor.new@example.org");
        (await svc.GetMeAsync(again.Id))!.Account.IsAdmin.Should().BeFalse();
    }

    [Fact]
    public async Task Waiting_on_someone_lists_threads_unanswered_for_2_days_or_quiet_for_7_with_the_people_to_nudge()
    {
        using var db = _fx.CreateContext();
        var svc = Svc(db);
        var now = new DateTime(2026, 10, 7, 12, 0, 0, DateTimeKind.Utc);
        foreach (var (email, name, ein) in new[] { ("sam@example.org", "Sam", A), ("kim@example.org", "Kim", B), ("lee@example.org", "Lee", C) })
        {
            var person = await svc.SignInAsync(email, name);
            await svc.RedeemInviteAsync(person.Id, (await svc.CreateInviteAsync(ein, uses: 1, AdminEmail)).Code);
        }
        var pending = await svc.SignInAsync("pat@example.org", "Pat");
        await svc.ClaimAsync(pending.Id, B);                                  // not confirmed: not someone to nudge

        Listing Post(ListingKind kind, string ein, string title) => new()
        { Kind = kind, OrgEin = ein, Help = KindOfHelp.Things, Title = title, CreatedAt = now.AddDays(-20), UpdatedAt = now.AddDays(-20) };
        Match Thread(string need, string offer, string by, MatchStatus status, int daysAgo) => new()
        {
            NeedListing = Post(ListingKind.Need, need, $"Need {daysAgo}"), OfferListing = Post(ListingKind.Offer, offer, "Offer"),
            ProposedByEin = by, Status = status, CreatedAt = now.AddDays(-daysAgo),
            RespondedAt = status == MatchStatus.Proposed ? null : now.AddDays(-daysAgo + 1),
        };
        var unanswered = Thread(A, B, A, MatchStatus.Proposed, 3);             // A asked B 3 days ago: waiting on B
        var fresh = Thread(A, C, A, MatchStatus.Proposed, 1);                  // only a day: not yet
        var silent = Thread(C, B, B, MatchStatus.Accepted, 10);                // accepted 9 days ago, no messages: both
        var quiet = Thread(B, A, A, MatchStatus.Accepted, 12);                 // last message from A 8 days ago: waiting on B
        quiet.Messages.Add(new Message { SenderEin = A, Body = "Thursday?", SentAt = now.AddDays(-8) });
        var talking = Thread(C, A, C, MatchStatus.Accepted, 12);               // a message 2 days ago: moving
        talking.Messages.Add(new Message { SenderEin = A, Body = "Sure", SentAt = now.AddDays(-2) });
        var done = Thread(A, C, C, MatchStatus.Completed, 30);
        db.Matches.AddRange(unanswered, fresh, silent, quiet, talking, done);
        await db.SaveChangesAsync();

        var waiting = await svc.ListWaitingAsync(now);

        waiting.Select(w => w.Id).Should().Equal(silent.Id, quiet.Id, unanswered.Id);   // longest waiting first
        var u = waiting.Single(w => w.Id == unanswered.Id);
        u.Should().Match<WaitingThreadDto>(w => w.Why == "unanswered" && w.Days == 3 && w.Title == "Need 3");
        u.WaitingOn.Should().Equal("Beta Habitat");
        u.People.Should().Equal(new WaitingPersonDto("Kim", "kim@example.org"));
        var q = waiting.Single(w => w.Id == quiet.Id);
        q.Should().Match<WaitingThreadDto>(w => w.Why == "quiet" && w.Since == now.AddDays(-8));
        q.People.Should().Equal(new WaitingPersonDto("Kim", "kim@example.org"));
        waiting.Single(w => w.Id == silent.Id).People.Select(p => p.Name).Should().BeEquivalentTo("Lee", "Kim");
    }

    private static async Task Throws(Func<Task> act, int status)
        => (await act.Should().ThrowAsync<ExchangeException>()).Which.StatusCode.Should().Be(status);
}
