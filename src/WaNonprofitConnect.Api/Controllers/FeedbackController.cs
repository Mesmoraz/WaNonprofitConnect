using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WaNonprofitConnect.Api.Security;
using WaNonprofitConnect.Data;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Entities;

namespace WaNonprofitConnect.Api.Controllers;

/// <summary>
/// "Send feedback" (S-93): a note from inside the app with a picture of the screen and what the app knew at the time.
/// Anyone can send one (the sign-in page can break too); the account and organization are added when signed in.
/// Also written to the log, so scripts/errors.ps1 shows it next to errors.
/// </summary>
[ApiController]
[Route("api/v1/feedback")]
[AllowAnonymous]
public sealed class FeedbackController(AppDbContext db, AccountService accounts, ILogger<FeedbackController> logger) : ControllerBase
{
    private const int MaxScreenshotBytes = 3 * 1024 * 1024;

    [HttpPost]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> Send([FromBody] SendFeedbackRequest request, CancellationToken ct)
    {
        var message = (request.Message ?? "").Trim();
        if (message.Length == 0) return Problem(statusCode: 400, title: "Write a note first.");
        if (message.Length > 4000) message = message[..4000];

        byte[]? screenshot = null;
        if (request.Screenshot is { Length: > 0 } dataUrl)
        {
            var comma = dataUrl.IndexOf(',');
            if (!dataUrl.StartsWith("data:image/", StringComparison.Ordinal) || comma < 0)
                return Problem(statusCode: 400, title: "That picture didn't come through. Send it without the picture.");
            try { screenshot = Convert.FromBase64String(dataUrl[(comma + 1)..]); }
            catch (FormatException) { return Problem(statusCode: 400, title: "That picture didn't come through. Send it without the picture."); }
            if (screenshot.Length > MaxScreenshotBytes) screenshot = null; // keep the note, drop an oversized picture
        }

        var context = request.Context.ValueKind == JsonValueKind.Undefined ? "{}" : request.Context.GetRawText();
        if (context.Length > 64_000) context = "{\"note\":\"context too large, dropped\"}";

        var feedback = new Feedback { Message = message, Context = context, Screenshot = screenshot, CreatedAt = DateTime.UtcNow };
        if (User.AccountId() is { } accountId && await accounts.GetMeAsync(accountId, ct) is { } me)
        {
            feedback.AccountId = me.Account.Id;
            feedback.Email = me.Account.Email;
            feedback.Name = me.Account.Name;
            feedback.Ein = me.Membership?.Ein;
        }
        db.Feedback.Add(feedback);
        await db.SaveChangesAsync(ct);

        logger.LogWarning("Feedback #{Id} from {Who} on {Page}: {Message}", feedback.Id, feedback.Email ?? "someone signed out",
            PageOf(context), message.Length > 300 ? message[..300] + "…" : message);
        return StatusCode(201, new { id = feedback.Id });
    }

    internal static string PageOf(string context)
    {
        try { using var doc = JsonDocument.Parse(context); return doc.RootElement.TryGetProperty("page", out var p) ? p.GetString() ?? "?" : "?"; }
        catch (JsonException) { return "?"; }
    }
}

public sealed class SendFeedbackRequest
{
    public string? Message { get; set; }
    /// <summary>A data: URL (image/jpeg or image/png), or null.</summary>
    public string? Screenshot { get; set; }
    public JsonElement Context { get; set; }
}

/// <summary>Feedback for the Admin page.</summary>
[ApiController]
[Route("api/v1/admin/feedback")]
[Authorize(Policy = AuthSetup.AdminPolicy)]
public sealed class AdminFeedbackController(AppDbContext db) : ControllerBase
{
    /// <summary>Newest first. Pass all=true to include ones marked done.</summary>
    [HttpGet]
    public async Task<IReadOnlyList<FeedbackItem>> List([FromQuery] bool all = false, CancellationToken ct = default)
    {
        var q = db.Feedback.AsNoTracking();
        if (!all) q = q.Where(f => f.Status == "new");
        var rows = await q.OrderByDescending(f => f.CreatedAt).Take(100)
            .Select(f => new { f.Id, f.Email, f.Name, f.Ein, f.Message, f.Context, HasScreenshot = f.Screenshot != null, f.CreatedAt, f.Status })
            .ToListAsync(ct);
        var eins = rows.Where(r => r.Ein != null).Select(r => r.Ein!).Distinct().ToList();
        var names = await db.Organizations.AsNoTracking().Where(o => eins.Contains(o.Ein)).ToDictionaryAsync(o => o.Ein, o => o.Name, ct);
        return rows.Select(r => new FeedbackItem(r.Id, r.Email, r.Name, r.Ein, r.Ein != null && names.TryGetValue(r.Ein, out var n) ? n : null,
            r.Message, FeedbackController.PageOf(r.Context), r.Context, r.HasScreenshot, r.CreatedAt, r.Status)).ToList();
    }

    [HttpGet("{id:int}/screenshot")]
    public async Task<IActionResult> Screenshot(int id, CancellationToken ct)
    {
        var bytes = await db.Feedback.AsNoTracking().Where(f => f.Id == id).Select(f => f.Screenshot).FirstOrDefaultAsync(ct);
        if (bytes is null) return NotFound();
        var png = bytes.Length > 4 && bytes[0] == 0x89 && bytes[1] == 0x50;
        return File(bytes, png ? "image/png" : "image/jpeg");
    }

    [HttpPost("{id:int}/done")]
    public async Task<IActionResult> Done(int id, CancellationToken ct)
    {
        var changed = await db.Feedback.Where(f => f.Id == id).ExecuteUpdateAsync(s => s.SetProperty(f => f.Status, "done"), ct);
        return changed == 0 ? NotFound() : NoContent();
    }
}

public sealed record FeedbackItem(int Id, string? Email, string? Name, string? Ein, string? OrgName, string Message, string Page,
    string Context, bool HasScreenshot, DateTime CreatedAt, string Status);
