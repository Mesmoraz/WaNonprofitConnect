namespace WaNonprofitConnect.Data.Entities;

/// <summary>A person who signed in (Google, or the development-only email sign-in). Admin is derived from config, not stored.</summary>
public class Account
{
    public Guid Id { get; set; }
    /// <summary>Lower-cased, trimmed. Unique.</summary>
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>Google's stable "sub" claim, when the account came through Google sign-in.</summary>
    public string? GoogleSubject { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastSignInAt { get; set; }

    public Membership? Membership { get; set; }
}

public enum MembershipStatus { Pending = 1, Confirmed = 2, Rejected = 3 }

public enum MembershipVia { Invite = 1, Claim = 2 }

/// <summary>
/// The link between a person and the organization they act for. One per account in the alpha.
/// An invite code confirms it at once; a claim waits for an admin.
/// </summary>
public class Membership
{
    public int Id { get; set; }
    public Guid AccountId { get; set; }
    public Account? Account { get; set; }
    public string Ein { get; set; } = string.Empty;
    public Organization? Org { get; set; }
    public MembershipStatus Status { get; set; }
    public MembershipVia Via { get; set; }
    /// <summary>The invite code redeemed, when <see cref="Via"/> is Invite.</summary>
    public string? InviteCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DecidedAt { get; set; }
    /// <summary>Email of the admin who approved or rejected a claim.</summary>
    public string? DecidedBy { get; set; }
}

/// <summary>An invite code tied to one organization. Redeeming it confirms the redeemer for that organization.</summary>
public class Invite
{
    /// <summary>8 characters from an unambiguous alphabet (no 0/O, 1/I/L). Primary key.</summary>
    public string Code { get; set; } = string.Empty;
    public string Ein { get; set; } = string.Empty;
    public Organization? Org { get; set; }
    public int Uses { get; set; } = 1;
    public int Used { get; set; }
    /// <summary>Email of the admin who made it.</summary>
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// An organization's board filters, shared by everyone at it (S-88). Serve is "Who they serve": group names from
/// ServeGroups, comma-separated. No row means "start from the IRS cause code".
/// </summary>
public class OrgPreference
{
    public string Ein { get; set; } = string.Empty;
    public Organization? Org { get; set; }
    public string Serve { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    /// <summary>Email of whoever saved it last (a member, or an admin).</summary>
    public string UpdatedBy { get; set; } = string.Empty;
}
