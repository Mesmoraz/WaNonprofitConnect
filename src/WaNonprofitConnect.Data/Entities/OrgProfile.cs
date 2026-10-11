namespace WaNonprofitConnect.Data.Entities;

/// <summary>
/// What an organization says about itself (S-99): one line, a website, and who to ask. Its own table, so the monthly
/// IRS import never touches it. No row means nothing has been said yet.
/// </summary>
public class OrgProfile
{
    public string Ein { get; set; } = string.Empty;
    public Organization? Org { get; set; }
    /// <summary>"What you do": one line, 140 characters at most.</summary>
    public string? About { get; set; }
    /// <summary>Always http or https.</summary>
    public string? Website { get; set; }
    /// <summary>"Who to ask": a confirmed member here. Others see only the first name. Cleared if that person's account goes.</summary>
    public Guid? ContactAccountId { get; set; }
    public Account? Contact { get; set; }
    public DateTime UpdatedAt { get; set; }
    /// <summary>Email of whoever saved it last.</summary>
    public string UpdatedBy { get; set; } = string.Empty;
}
