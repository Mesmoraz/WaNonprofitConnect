namespace WaNonprofitConnect.Data.Entities;

/// <summary>Seeded lookup of NTEE major groups (A–Z) with the ProPublica 1–10 bucket each belongs to.</summary>
public class NteeCategory
{
    /// <summary>Single letter, A–Z.</summary>
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>ProPublica Nonprofit Explorer category id (1–10), used for cross-referencing their API.</summary>
    public int ProPublicaCategoryId { get; set; }
    public string ProPublicaCategoryName { get; set; } = string.Empty;
}
