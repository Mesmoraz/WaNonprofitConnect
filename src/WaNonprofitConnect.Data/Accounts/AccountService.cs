using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Import;

namespace WaNonprofitConnect.Data.Accounts;

/// <summary>
/// Accounts, memberships, invite codes and claims. The API authenticates the person (cookie);
/// this decides which organization, if any, they may act for.
/// Errors are <see cref="ExchangeException"/>s with plain messages a person can read.
/// </summary>
public sealed class AccountService
{
    /// <summary>No 0/O, 1/I/L: easy to read aloud and to type from a phone.</summary>
    public const string InviteAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    public const int InviteLength = 8;
    public const int MaxInviteUses = 50;
    /// <summary>People per organization in the alpha (S-95), the first one included. Admin codes can still go past it.</summary>
    public const int PlacesPerOrg = 3;
    public const string PlacesTaken = "All 3 places are taken.";
    /// <summary>Memberships made by "Test as this organization" (ADMIN) or the development sign-in (DEV). They aren't people here.</summary>
    public const string AdminTestCode = "ADMIN", DevCode = "DEV";

    private readonly AppDbContext _db;
    private readonly AccountOptions _options;

    public AccountService(AppDbContext db, AccountOptions? options = null)
    {
        _db = db;
        _options = options ?? new AccountOptions();
    }

    public bool IsAdmin(string? email) => _options.IsAdmin(email);

    // ---- sign in -------------------------------------------------------------

    /// <summary>Approved by Taylor, Oct 7 (T-218): what a different Google identity with a known email is told.</summary>
    public const string OtherGoogleAccount = "That Google account isn’t the one this email signed up with. Use that one, or send feedback and we’ll sort it out.";

    /// <summary>
    /// Find or create the account. Google accounts are found by their subject first, then by email. An account already
    /// tied to one Google identity is never handed to another with the same email (security review L7): a recreated
    /// Workspace account, or a Google account made on someone else's address, is refused, and an admin sorts it out.
    /// </summary>
    public async Task<Account> SignInAsync(string email, string? name, string? googleSubject = null, CancellationToken ct = default)
    {
        var normalized = NormalizeEmail(email) ?? throw ExchangeException.Invalid("Enter an email address.");
        var displayName = BmfRowParser.Clean(name) ?? normalized.Split('@')[0];
        if (displayName.Length > 200) displayName = displayName[..200];

        Account? account = null;
        if (googleSubject is not null) account = await _db.Accounts.FirstOrDefaultAsync(a => a.GoogleSubject == googleSubject, ct);
        account ??= await _db.Accounts.FirstOrDefaultAsync(a => a.Email == normalized, ct);
        if (googleSubject is not null && account?.GoogleSubject is { } known && known != googleSubject)
            throw ExchangeException.Forbidden(OtherGoogleAccount);

        var now = DateTime.UtcNow;
        if (account is null)
        {
            account = new Account { Id = Guid.NewGuid(), Email = normalized, Name = displayName, GoogleSubject = googleSubject, CreatedAt = now };
            _db.Accounts.Add(account);
        }
        else
        {
            account.Email = normalized;
            account.Name = displayName;
            account.GoogleSubject ??= googleSubject;
        }
        account.LastSignInAt = now;
        await _db.SaveChangesAsync(ct);
        return account;
    }

    /// <summary>The account's current session number (see <see cref="Account.SessionVersion"/>), or null if the account is gone.</summary>
    public Task<int?> SessionVersionAsync(Guid accountId, CancellationToken ct = default)
        => _db.Accounts.AsNoTracking().Where(a => a.Id == accountId).Select(a => (int?)a.SessionVersion).FirstOrDefaultAsync(ct);

    /// <summary>Sign-out: every cookie made before now stops working.</summary>
    public Task EndSessionsAsync(Guid accountId, CancellationToken ct = default)
        => _db.Accounts.Where(a => a.Id == accountId).ExecuteUpdateAsync(s => s.SetProperty(a => a.SessionVersion, a => a.SessionVersion + 1), ct);

    /// <summary>Confirm the account for an EIN without an invite. Development sign-in, and admins switching organization to test.</summary>
    public async Task ConfirmWithoutInviteAsync(Guid accountId, string ein, CancellationToken ct = default, string code = DevCode)
    {
        var org = await RequireOrgAsync(ein, ct);
        await SetMembershipAsync(accountId, org.Ein, MembershipStatus.Confirmed, MembershipVia.Invite, code, ct);
    }

    public async Task<MeDto?> GetMeAsync(Guid accountId, CancellationToken ct = default)
    {
        var account = await _db.Accounts.AsNoTracking()
            .Include(a => a.Membership!).ThenInclude(m => m.Org)
            .FirstOrDefaultAsync(a => a.Id == accountId, ct);
        if (account is null) return null;

        var m = account.Membership;
        MeMembershipDto? membership = null;
        if (m is not null && m.Status != MembershipStatus.Rejected)
        {
            var now = DateTime.UtcNow;
            membership = new MeMembershipDto(m.Ein, m.Org is null ? m.Ein : OrgName.Display(m.Org.Name), m.Status == MembershipStatus.Confirmed ? "confirmed" : "pending",
                await UrgentCap.LeftAsync(_db, m.Ein, now, ct), await UrgentCap.AgainOnAsync(_db, m.Ein, now, ct));
        }
        return new MeDto(new MeAccountDto(account.Id, account.Email, account.Name, IsAdmin(account.Email)), membership);
    }

    /// <summary>The EIN this person acts for. 401 if the account is gone, 403 without a confirmed membership.</summary>
    public async Task<string> RequireActingEinAsync(Guid accountId, CancellationToken ct = default)
    {
        var row = await _db.Accounts.AsNoTracking()
            .Where(a => a.Id == accountId)
            .Select(a => new { a.Id, Ein = a.Membership == null ? null : a.Membership.Ein, Status = a.Membership == null ? (MembershipStatus?)null : a.Membership.Status })
            .FirstOrDefaultAsync(ct);
        if (row is null) throw new ExchangeException(401, "Sign in again.");
        return row.Status switch
        {
            MembershipStatus.Confirmed => row.Ein!,
            MembershipStatus.Pending => throw ExchangeException.Forbidden("Your organization isn't confirmed yet. We'll let you in when it is."),
            _ => throw ExchangeException.Forbidden("Join your organization first. Enter an invite code, or find your organization."),
        };
    }

    /// <summary>Like <see cref="RequireActingEinAsync"/>, but null instead of 403 (for reads that are richer with an org).</summary>
    public async Task<string?> FindActingEinAsync(Guid accountId, CancellationToken ct = default)
        => await _db.Memberships.AsNoTracking()
            .Where(m => m.AccountId == accountId && m.Status == MembershipStatus.Confirmed)
            .Select(m => m.Ein)
            .FirstOrDefaultAsync(ct);

    // ---- invites and claims -------------------------------------------------------

    public async Task<MeDto> RedeemInviteAsync(Guid accountId, string code, CancellationToken ct = default)
    {
        var normalized = NormalizeCode(code) ?? throw ExchangeException.Invalid("Enter your invite code.");
        var invite = await _db.Invites.Include(i => i.Org).FirstOrDefaultAsync(i => i.Code == normalized, ct)
                     ?? throw new ExchangeException(404, "We don't know that code. Check it and try again.");
        var current = await _db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.AccountId == accountId, ct);

        if (current is { Status: MembershipStatus.Confirmed })
        {
            if (current.Ein == invite.Ein) return (await GetMeAsync(accountId, ct))!;
            throw ExchangeException.Conflict("You're already confirmed for another organization.");
        }
        const string usedUp = "That code has been used. Ask for a new one.";
        if (invite.Used >= invite.Uses) throw ExchangeException.Conflict(usedUp);

        // Take a use in one conditional UPDATE, so two people redeeming the last use at once can't both get in.
        var taken = await _db.Invites.Where(i => i.Code == invite.Code && i.Used < i.Uses)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.Used, i => i.Used + 1), ct);
        if (taken == 0) throw ExchangeException.Conflict(usedUp);
        await SetMembershipAsync(accountId, invite.Ein, MembershipStatus.Confirmed, MembershipVia.Invite, invite.Code, ct);
        return (await GetMeAsync(accountId, ct))!;
    }

    public async Task<MeDto> ClaimAsync(Guid accountId, string ein, CancellationToken ct = default)
    {
        var org = await RequireOrgAsync(ein, ct);
        var current = await _db.Memberships.AsNoTracking().FirstOrDefaultAsync(m => m.AccountId == accountId, ct);
        if (current is { Status: MembershipStatus.Confirmed })
        {
            if (current.Ein == org.Ein) return (await GetMeAsync(accountId, ct))!;
            throw ExchangeException.Conflict("You're already confirmed for another organization.");
        }
        if (current is { Status: MembershipStatus.Pending } && current.Ein == org.Ein) return (await GetMeAsync(accountId, ct))!;

        await SetMembershipAsync(accountId, org.Ein, MembershipStatus.Pending, MembershipVia.Claim, null, ct);
        return (await GetMeAsync(accountId, ct))!;
    }

    // ---- admin ---------------------------------------------------------------

    public async Task<IReadOnlyList<ClaimDto>> ListClaimsAsync(bool pendingOnly = true, CancellationToken ct = default)
    {
        var q = _db.Memberships.AsNoTracking().Include(m => m.Account).Include(m => m.Org).Where(m => m.Via == MembershipVia.Claim);
        if (pendingOnly) q = q.Where(m => m.Status == MembershipStatus.Pending);
        var rows = await q.OrderBy(m => m.CreatedAt).ToListAsync(ct);
        return rows.Select(ToClaim).ToList();
    }

    /// <summary>Days a new thread waits for a yes before it shows under "Waiting on someone".</summary>
    public const int UnansweredDays = 2;
    /// <summary>Days an accepted thread can go without a message before it shows there.</summary>
    public const int QuietDays = 7;

    /// <summary>
    /// Threads stalled on someone, so an admin can nudge them by hand until email notices exist (Taylor, Oct 4):
    /// started and not answered for 2 days (waiting on the side that didn't start it), or accepted with no message
    /// for 7 days (waiting on whoever didn't write last, or both sides if no one has). Longest waiting first.
    /// </summary>
    /// <summary>Admin's "How it's going" (S-100): the six alpha measures, real organizations only.</summary>
    public Task<AlphaNumbersDto> AlphaNumbersAsync(DateTime? asOf = null, CancellationToken ct = default)
        => AlphaNumbers.ComputeAsync(_db, _options, asOf ?? DateTime.UtcNow, ct);

    public Task<WherePeopleStopDto> WherePeopleStopAsync(DateTime? asOf = null, CancellationToken ct = default)
        => WherePeopleStop.ComputeAsync(_db, _options, asOf ?? DateTime.UtcNow, ct);

    public async Task<IReadOnlyList<WaitingThreadDto>> ListWaitingAsync(DateTime? asOf = null, CancellationToken ct = default)
    {
        var now = asOf ?? DateTime.UtcNow;
        var unansweredBefore = now.AddDays(-UnansweredDays);
        var quietBefore = now.AddDays(-QuietDays);
        var rows = await _db.Matches.AsNoTracking()
            .Where(m => (m.Status == MatchStatus.Proposed && m.CreatedAt <= unansweredBefore) || m.Status == MatchStatus.Accepted)
            .Select(m => new
            {
                m.Id, m.Status, m.ProposedByEin, m.CreatedAt, m.RespondedAt,
                Title = m.NeedListing!.Title, NeedEin = m.NeedListing.OrgEin, OfferEin = m.OfferListing!.OrgEin,
                Last = m.Messages.OrderByDescending(x => x.SentAt).Select(x => new { x.SentAt, x.SenderEin }).FirstOrDefault(),
            })
            .ToListAsync(ct);

        var stalled = new List<(int Id, string Title, bool Quiet, DateTime Since, string[] On)>();
        foreach (var m in rows)
        {
            if (m.Status == MatchStatus.Proposed)
            {
                stalled.Add((m.Id, m.Title, false, m.CreatedAt, [m.ProposedByEin == m.NeedEin ? m.OfferEin : m.NeedEin]));
                continue;
            }
            var since = m.Last?.SentAt is { } sent && sent > (m.RespondedAt ?? m.CreatedAt) ? sent : m.RespondedAt ?? m.CreatedAt;
            if (since > quietBefore) continue;
            string[] on = m.Last is null ? [m.NeedEin, m.OfferEin] : [m.Last.SenderEin == m.NeedEin ? m.OfferEin : m.NeedEin];
            stalled.Add((m.Id, m.Title, true, since, on));
        }
        if (stalled.Count == 0) return [];

        var eins = stalled.SelectMany(t => t.On).Distinct().ToList();
        var orgs = await _db.Organizations.AsNoTracking().Where(o => eins.Contains(o.Ein)).ToDictionaryAsync(o => o.Ein, o => OrgName.Display(o.Name), ct);
        var people = (await _db.Memberships.AsNoTracking()
                .Where(x => eins.Contains(x.Ein) && x.Status == MembershipStatus.Confirmed)
                .Select(x => new { x.Ein, x.Account!.Name, x.Account.Email }).ToListAsync(ct))
            .ToLookup(x => x.Ein, x => new WaitingPersonDto(x.Name, x.Email));

        return stalled.OrderBy(t => t.Since).Select(t => new WaitingThreadDto(
            t.Id, t.Title, t.Quiet ? "quiet" : "unanswered", t.Since, (int)(now - t.Since).TotalDays,
            t.On.Select(e => orgs.GetValueOrDefault(e, e)).ToList(),
            t.On.SelectMany(e => people[e]).ToList())).ToList();
    }

    public async Task<ClaimDto> DecideClaimAsync(int membershipId, bool approve, string adminEmail, CancellationToken ct = default)
    {
        var m = await _db.Memberships.Include(x => x.Account).Include(x => x.Org).FirstOrDefaultAsync(x => x.Id == membershipId, ct)
                ?? throw ExchangeException.NotFound("That claim is gone.");
        if (m.Via != MembershipVia.Claim) throw ExchangeException.Invalid("That membership came from an invite, not a claim.");
        if (m.Status != MembershipStatus.Pending) throw ExchangeException.Conflict($"That claim is already {m.Status.ToString().ToLowerInvariant()}.");

        m.Status = approve ? MembershipStatus.Confirmed : MembershipStatus.Rejected;
        m.DecidedAt = DateTime.UtcNow;
        m.DecidedBy = NormalizeEmail(adminEmail);
        await _db.SaveChangesAsync(ct);
        return ToClaim(m);
    }

    public async Task<InviteDto> CreateInviteAsync(string ein, int uses, string adminEmail, CancellationToken ct = default)
    {
        var org = await RequireOrgAsync(ein, ct);
        if (uses < 1 || uses > MaxInviteUses) throw ExchangeException.Invalid($"Uses must be 1 to {MaxInviteUses}.");

        string code;
        do { code = NewCode(); } while (await _db.Invites.AnyAsync(i => i.Code == code, ct));

        var invite = new Invite
        {
            Code = code, Ein = org.Ein, Org = org, Uses = uses, Used = 0,
            CreatedBy = NormalizeEmail(adminEmail) ?? "admin", CreatedAt = DateTime.UtcNow,
        };
        _db.Invites.Add(invite);
        await _db.SaveChangesAsync(ct);
        return ToInvite(invite);
    }

    /// <summary>
    /// Places left at an organization (S-95): 3, less the people here (not test memberships) and the unused codes members
    /// have made. Codes an admin makes don't hold a place, so they can go past 3.
    /// </summary>
    public async Task<int> PlacesLeftAsync(string ein, CancellationToken ct = default)
    {
        var (people, unused) = await PlacesTakenAsync(ein, ct);
        return Math.Max(0, PlacesPerOrg - people - unused.Count);
    }

    /// <summary>
    /// A member makes a one-use code for a colleague (S-95). Two people asking for the last place at once: each adds its
    /// code, then counts again, and the later code backs out. That holds at any isolation level, on SQLite and SQL Server.
    /// </summary>
    public async Task<InviteDto> CreateMemberInviteAsync(Guid accountId, CancellationToken ct = default)
    {
        var ein = await RequireActingEinAsync(accountId, ct);
        var email = await _db.Accounts.Where(a => a.Id == accountId).Select(a => a.Email).FirstAsync(ct);
        string code;
        do { code = NewCode(); } while (await _db.Invites.AnyAsync(i => i.Code == code, ct));
        var invite = new Invite { Code = code, Ein = ein, Uses = 1, Used = 0, ByMember = true, CreatedBy = email, CreatedAt = DateTime.UtcNow };
        _db.Invites.Add(invite);
        await _db.SaveChangesAsync(ct);

        var (people, unused) = await PlacesTakenAsync(ein, ct);
        if (unused.IndexOf(code) >= PlacesPerOrg - people)
        {
            _db.Invites.Remove(invite);
            await _db.SaveChangesAsync(ct);
            throw ExchangeException.Conflict(PlacesTaken);
        }
        invite.Org = await _db.Organizations.FirstAsync(o => o.Ein == ein, ct);
        return ToInvite(invite);
    }

    /// <summary>People who take a place, and unused member-made codes oldest first (ties by code).</summary>
    private async Task<(int People, List<string> Unused)> PlacesTakenAsync(string ein, CancellationToken ct)
    {
        var people = await _db.Memberships.CountAsync(m => m.Ein == ein && m.Status == MembershipStatus.Confirmed
            && m.InviteCode != AdminTestCode && m.InviteCode != DevCode, ct);
        var unused = (await _db.Invites.AsNoTracking().Where(i => i.Ein == ein && i.ByMember && i.Used < i.Uses)
                .Select(i => new { i.Code, i.CreatedAt }).ToListAsync(ct))
            .OrderBy(i => i.CreatedAt).ThenBy(i => i.Code, StringComparer.Ordinal).Select(i => i.Code).ToList();
        return (people, unused);
    }

    public async Task<IReadOnlyList<InviteDto>> ListInvitesAsync(CancellationToken ct = default)
    {
        var rows = await _db.Invites.AsNoTracking().Include(i => i.Org).OrderByDescending(i => i.CreatedAt).ToListAsync(ct);
        return rows.Select(ToInvite).ToList();
    }

    // ---- helpers -------------------------------------------------------------

    public static string NewCode()
    {
        Span<char> chars = stackalloc char[InviteLength];
        for (var i = 0; i < chars.Length; i++) chars[i] = InviteAlphabet[RandomNumberGenerator.GetInt32(InviteAlphabet.Length)];
        return new string(chars);
    }

    /// <summary>Upper-case, drop spaces and dashes. People type "abcd-2345" from a text message.</summary>
    public static string? NormalizeCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var s = new string(code.Where(char.IsLetterOrDigit).Select(char.ToUpperInvariant).ToArray());
        return s.Length == 0 ? null : s;
    }

    public static string? NormalizeEmail(string? email)
    {
        var s = email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(s) || s.Length > 320) return null;
        var at = s.IndexOf('@');
        return at > 0 && at < s.Length - 1 && s.IndexOf('@', at + 1) < 0 ? s : null;
    }

    private async Task<Organization> RequireOrgAsync(string? ein, CancellationToken ct)
    {
        var normalized = BmfRowParser.NormalizeEin(ein);
        if (normalized is null || (ein ?? string.Empty).Count(char.IsDigit) != 9) throw ExchangeException.Invalid("An EIN is 9 digits.");
        var org = await _db.Organizations.FirstOrDefaultAsync(o => o.Ein == normalized, ct)
                  ?? throw new ExchangeException(404, "We can't find that organization.");
        if (!org.Is501c3) throw ExchangeException.Forbidden("For now, only 501(c)(3) organizations can join.");
        return org;
    }

    private async Task SetMembershipAsync(Guid accountId, string ein, MembershipStatus status, MembershipVia via, string? code, CancellationToken ct)
    {
        var m = await _db.Memberships.FirstOrDefaultAsync(x => x.AccountId == accountId, ct);
        var now = DateTime.UtcNow;
        if (m is null)
        {
            m = new Membership { AccountId = accountId };
            _db.Memberships.Add(m);
        }
        m.Ein = ein;
        m.Status = status;
        m.Via = via;
        m.InviteCode = code;
        m.CreatedAt = now;
        m.DecidedAt = status == MembershipStatus.Pending ? null : now;
        m.DecidedBy = null;
        await _db.SaveChangesAsync(ct);
    }

    private static ClaimDto ToClaim(Membership m) => new(
        m.Id, m.Ein, m.Org is null ? m.Ein : OrgName.Display(m.Org.Name), m.Org?.City,
        m.AccountId, m.Account?.Email ?? string.Empty, m.Account?.Name ?? string.Empty,
        m.Status.ToString().ToLowerInvariant(), m.CreatedAt, m.DecidedAt);

    private static InviteDto ToInvite(Invite i) => new(i.Code, i.Ein, i.Org is null ? i.Ein : OrgName.Display(i.Org.Name), i.Uses, i.Used);
}
