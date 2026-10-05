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

    private readonly AppDbContext _db;
    private readonly AccountOptions _options;

    public AccountService(AppDbContext db, AccountOptions? options = null)
    {
        _db = db;
        _options = options ?? new AccountOptions();
    }

    public bool IsAdmin(string? email) => _options.IsAdmin(email);

    // ---- sign in -------------------------------------------------------------

    /// <summary>Find or create the account. Google accounts are found by their subject first, then by email.</summary>
    public async Task<Account> SignInAsync(string email, string? name, string? googleSubject = null, CancellationToken ct = default)
    {
        var normalized = NormalizeEmail(email) ?? throw ExchangeException.Invalid("Enter an email address.");
        var displayName = BmfRowParser.Clean(name) ?? normalized.Split('@')[0];
        if (displayName.Length > 200) displayName = displayName[..200];

        Account? account = null;
        if (googleSubject is not null) account = await _db.Accounts.FirstOrDefaultAsync(a => a.GoogleSubject == googleSubject, ct);
        account ??= await _db.Accounts.FirstOrDefaultAsync(a => a.Email == normalized, ct);

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
    public async Task ConfirmWithoutInviteAsync(Guid accountId, string ein, CancellationToken ct = default, string code = "DEV")
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
        MeMembershipDto? membership = m is null || m.Status == MembershipStatus.Rejected
            ? null
            : new MeMembershipDto(m.Ein, m.Org is null ? m.Ein : OrgName.Display(m.Org.Name), m.Status == MembershipStatus.Confirmed ? "confirmed" : "pending",
                await UrgentCap.LeftAsync(_db, m.Ein, DateTime.UtcNow, ct));
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
