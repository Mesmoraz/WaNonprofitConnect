using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Data.Accounts;

/// <summary>Your organization (S-99): "What you do", a website, and who to ask. Confirmed members only.</summary>
public sealed partial class OrgProfileService
{
    public const int AboutMax = 140;
    public const int WebsiteMax = 200;

    private readonly AppDbContext _db;
    private readonly AccountService _accounts;

    public OrgProfileService(AppDbContext db)
    {
        _db = db;
        _accounts = new AccountService(db, new AccountOptions());
    }

    public async Task<MyOrgDto> GetMineAsync(Guid accountId, CancellationToken ct = default)
        => await MineAsync(accountId, await _accounts.RequireActingEinAsync(accountId, ct), ct);

    public async Task<MyOrgDto> SaveAsync(Guid accountId, SaveOrgProfileRequest req, CancellationToken ct = default)
    {
        var ein = await _accounts.RequireActingEinAsync(accountId, ct);
        var about = Clean(req.About);
        if (about is { Length: > AboutMax }) throw ExchangeException.Invalid($"Keep it to one line, {AboutMax} characters at most.");
        var website = CleanWebsite(req.Website);
        if (req.ContactAccountId is { } contact
            && !await _db.Memberships.AnyAsync(m => m.AccountId == contact && m.Ein == ein && m.Status == MembershipStatus.Confirmed, ct))
            throw ExchangeException.Invalid("Pick someone at your organization.");

        var p = await _db.OrgProfiles.FirstOrDefaultAsync(x => x.Ein == ein, ct);
        if (p is null) { p = new OrgProfile { Ein = ein }; _db.OrgProfiles.Add(p); }
        p.About = about;
        p.Website = website;
        p.ContactAccountId = req.ContactAccountId;
        p.UpdatedAt = DateTime.UtcNow;
        p.UpdatedBy = await _db.Accounts.Where(a => a.Id == accountId).Select(a => a.Email).FirstAsync(ct);
        await _db.SaveChangesAsync(ct);
        return await MineAsync(accountId, ein, ct);
    }

    /// <summary>"Ask for {first name}": the first word of the person's name. Null when there's no name to show.</summary>
    public static string? FirstName(string? name)
        => string.IsNullOrWhiteSpace(name) ? null : name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];

    private async Task<MyOrgDto> MineAsync(Guid accountId, string ein, CancellationToken ct)
    {
        var org = await _db.Organizations.AsNoTracking().FirstAsync(o => o.Ein == ein, ct);
        var summary = (await new HelpbookService(_db).OrgSummariesAsync(new[] { org }, ct))[ein];
        var p = await _db.OrgProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.Ein == ein, ct);
        var people = await _db.Memberships.AsNoTracking()
            .Where(m => m.Ein == ein && m.Status == MembershipStatus.Confirmed)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new { m.AccountId, m.Account!.Name, m.Account.Email })
            .ToListAsync(ct);
        var contact = people.Any(x => x.AccountId == p?.ContactAccountId) ? p!.ContactAccountId : null; // still here
        return new MyOrgDto(summary, p?.About, p?.Website, contact,
            people.Select(x => new OrgPersonDto(x.AccountId, x.Name, x.Email, x.AccountId == accountId)).ToList(),
            PlacesLeft: 0); // filled in by S-95
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    /// <summary>A bare host gets https://. Only http and https are kept.</summary>
    private static string? CleanWebsite(string? raw)
    {
        var s = Clean(raw);
        if (s is null) return null;
        if (!HasScheme().IsMatch(s)) s = "https://" + s;
        if (s.Length > WebsiteMax
            || !Uri.TryCreate(s, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp)
            || !uri.Host.Contains('.'))
            throw ExchangeException.Invalid("Enter a website like yourorganization.org.");
        return s;
    }

    [GeneratedRegex("^[a-zA-Z][a-zA-Z0-9+.-]*:")]
    private static partial Regex HasScheme();
}
