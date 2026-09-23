namespace WaNonprofitConnect.Data.Entities;

/// <summary>A Need is "we need X"; an Offer is "we have extra X". Matches pair one of each.</summary>
public enum ListingKind { Need = 1, Offer = 2 }

public enum ListingCategory
{
    Materials = 1,     // lumber, plywood, paint, fabric
    Equipment = 2,     // tools, appliances, kitchen gear
    Technology = 3,    // laptops, phones, networking
    Furniture = 4,
    Food = 5,
    Clothing = 6,
    Vehicles = 7,
    Services = 8,      // printing, legal, plumbing, transport
    Volunteers = 9,
    Space = 10,        // storage, meeting rooms, event venues
    Funding = 11,
    Other = 99,
}

/// <summary>The six kinds of help in the alpha (docs/TAXONOMY.md). 0 means "not set" (listings from before kinds of help existed are migrated to Things).</summary>
public enum KindOfHelp { Time = 1, Skills = 2, Things = 3, Partnership = 4, ForSchools = 5, JobsAndMentoring = 6 }

/// <summary>How often. Standing agreements for recurring pairs come in Beta; for now it's shown and matched on, nothing more.</summary>
public enum Cadence { OneTime = 1, Weekly = 2, Monthly = 3, Quarterly = 4, Ongoing = 5 }

public enum Urgency { Low = 1, Normal = 2, High = 3, Critical = 4 }

public enum ListingStatus { Open = 1, Matched = 2, Fulfilled = 3, Closed = 4, Expired = 5 }

public class Listing
{
    public int Id { get; set; }
    public ListingKind Kind { get; set; }
    /// <summary>The 501(c)(3) that posted it.</summary>
    public string OrgEin { get; set; } = string.Empty;
    public Organization? Org { get; set; }

    public KindOfHelp Help { get; set; }
    /// <summary>Older, finer grouping for Things. New listings from the app leave it at Other.</summary>
    public ListingCategory Category { get; set; } = ListingCategory.Other;
    public Cadence Cadence { get; set; } = Cadence.OneTime;
    /// <summary>Times it was shown near the top of the board to another organization. Fair ranking shows the least seen first.</summary>
    public int Views { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public Urgency Urgency { get; set; } = Urgency.Normal;
    public ListingStatus Status { get; set; } = ListingStatus.Open;
    /// <summary>Comma-separated free keywords ("plywood,lumber,3/4").</summary>
    public string? Tags { get; set; }
    /// <summary>Normalized title + description + tags, for keyword matching.</summary>
    public string SearchText { get; set; } = string.Empty;

    // Location snapshot from the org at post time (orgs can later override).
    public string? City { get; set; }
    public string? Zip5 { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public ICollection<Match> MatchesAsNeed { get; set; } = new List<Match>();
    public ICollection<Match> MatchesAsOffer { get; set; } = new List<Match>();
}

public enum MatchStatus { Proposed = 1, Accepted = 2, Declined = 3, Completed = 4, Cancelled = 5 }

/// <summary>A proposed connection between one Need and one Offer. Either side can propose; the other side accepts.</summary>
public class Match
{
    public int Id { get; set; }
    public int NeedListingId { get; set; }
    public Listing? NeedListing { get; set; }
    public int OfferListingId { get; set; }
    public Listing? OfferListing { get; set; }

    public string ProposedByEin { get; set; } = string.Empty;
    public MatchStatus Status { get; set; } = MatchStatus.Proposed;
    public string? Note { get; set; }
    /// <summary>Score at the time of proposal, for later tuning of the matcher.</summary>
    public int? Score { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    /// <summary>When each side last opened the thread, for unread counts.</summary>
    public DateTime? NeedSideReadAt { get; set; }
    public DateTime? OfferSideReadAt { get; set; }

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}

/// <summary>Org-to-org message inside a match thread.</summary>
public class Message
{
    public int Id { get; set; }
    public int MatchId { get; set; }
    public Match? Match { get; set; }
    public string SenderEin { get; set; } = string.Empty;
    /// <summary>The person who wrote it (their account name), shown as "Casey · 2h". Null on messages from before accounts.</summary>
    public string? SenderName { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
}
