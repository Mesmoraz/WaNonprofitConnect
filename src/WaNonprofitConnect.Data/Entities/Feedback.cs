namespace WaNonprofitConnect.Data.Entities;

/// <summary>
/// A note sent from inside the app (S-93), with what was on the screen: a picture, the page, the device, and recent
/// errors. Anyone can send one, signed in or not; the account and organization are filled in when known.
/// </summary>
public class Feedback
{
    public int Id { get; set; }
    public Guid? AccountId { get; set; }
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Ein { get; set; }
    public string Message { get; set; } = string.Empty;
    /// <summary>The page, device, recent pages and recent errors, as the app sent them (JSON).</summary>
    public string Context { get; set; } = "{}";
    /// <summary>A JPEG of the screen, when the person left "Include a picture of this screen" ticked.</summary>
    public byte[]? Screenshot { get; set; }
    public DateTime CreatedAt { get; set; }
    /// <summary>"new" until an admin marks it "done".</summary>
    public string Status { get; set; } = "new";
}
