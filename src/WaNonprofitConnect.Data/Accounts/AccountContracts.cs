namespace WaNonprofitConnect.Data.Accounts;

// Shapes from the alpha contract (docs/ALPHA.md). Membership status goes on the wire lower-case.

public sealed record MeAccountDto(Guid Id, string Email, string Name, bool IsAdmin);

/// <summary><see cref="Status"/> is "confirmed" or "pending". A rejected claim shows as no membership.
/// <see cref="UrgentLeft"/> is how many urgent needs the organization can still post this rolling month (0 to 2).</summary>
public sealed record MeMembershipDto(string Ein, string OrgName, string Status, int UrgentLeft);

public sealed record MeDto(MeAccountDto Account, MeMembershipDto? Membership);

public sealed record ClaimDto(
    int Id, string Ein, string OrgName, string? City,
    Guid AccountId, string Email, string Name,
    string Status, DateTime CreatedAt, DateTime? DecidedAt);

public sealed record InviteDto(string Code, string Ein, string OrgName, int Uses, int Used);

public sealed class GoogleSignInRequest { public string IdToken { get; set; } = string.Empty; }

public sealed class DevSignInRequest
{
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>Development only, optional: confirm the account for this EIN straight away (for local work and the CLI demo).</summary>
    public string? Ein { get; set; }
}

public sealed class RedeemInviteRequest { public string Code { get; set; } = string.Empty; }

public sealed class ClaimRequest { public string Ein { get; set; } = string.Empty; }

public sealed class CreateInviteRequest
{
    public string Ein { get; set; } = string.Empty;
    public int Uses { get; set; } = 1;
}

/// <summary>Bound from config. <c>Admin:Emails</c> is a string array.</summary>
public sealed class AccountOptions
{
    public IReadOnlyCollection<string> AdminEmails { get; init; } = Array.Empty<string>();

    public bool IsAdmin(string? email)
        => email is not null && AdminEmails.Any(a => string.Equals(a.Trim(), email.Trim(), StringComparison.OrdinalIgnoreCase));
}
