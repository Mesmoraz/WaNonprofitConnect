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
/// Anyone can send one (the sign-in page and the crash screen can break while signed out); the account and
/// organization are added when signed in. Signed out, it's held to less (S-114): 5 an hour from one address, a note of
/// 2,000 characters and a picture of 1.5 MB. Pictures must really be PNG, JPEG or WebP.
/// Also written to the log, so scripts/errors.ps1 shows it next to errors.
/// </summary>
[ApiController]
[Route("api/v1/feedback")]
[AllowAnonymous]
public sealed class FeedbackController(AppDbContext db, AccountService accounts, ILogger<FeedbackController> logger) : ControllerBase
{
    public const int MaxScreenshotBytes = 3 * 1024 * 1024;
    public const int MaxAnonymousScreenshotBytes = 1536 * 1024;
    public const int MaxMessage = 4000;
    public const int MaxAnonymousMessage = 2000;
    public const string BadPicture = "That picture didn't work. Send it without one.";

    [HttpPost]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [SignedOutHourlyLimit]
    public async Task<IActionResult> Send([FromBody] SendFeedbackRequest request, CancellationToken ct)
    {
        var me = User.AccountId() is { } accountId ? await accounts.GetMeAsync(accountId, ct) : null;
        var message = (request.Message ?? "").Trim();
        if (message.Length == 0) return Problem(statusCode: 400, title: "Write a note first.");
        var maxMessage = me is null ? MaxAnonymousMessage : MaxMessage;
        if (message.Length > maxMessage) message = message[..maxMessage];

        byte[]? screenshot = null;
        if (request.Screenshot is { Length: > 0 } dataUrl)
        {
            var comma = dataUrl.IndexOf(',');
            if (!dataUrl.StartsWith("data:image/", StringComparison.Ordinal) || comma < 0) return Problem(statusCode: 400, title: BadPicture);
            try { screenshot = Convert.FromBase64String(dataUrl[(comma + 1)..]); }
            catch (FormatException) { return Problem(statusCode: 400, title: BadPicture); }
            if (ImageType(screenshot) is null) return Problem(statusCode: 400, title: BadPicture);
            if (screenshot.Length > (me is null ? MaxAnonymousScreenshotBytes : MaxScreenshotBytes)) screenshot = null; // keep the note, drop an oversized picture
        }

        var context = request.Context.ValueKind == JsonValueKind.Undefined ? "{}" : request.Context.GetRawText();
        if (context.Length > 64_000) context = "{\"note\":\"context too large, dropped\"}";

        var feedback = new Feedback { Message = message, Context = context, Screenshot = screenshot, CreatedAt = DateTime.UtcNow };
        if (me is not null)
        {
            feedback.AccountId = me.Account.Id;
            feedback.Email = me.Account.Email;
            feedback.Name = me.Account.Name;
            feedback.Ein = me.Membership?.Ein;
        }
        db.Feedback.Add(feedback);
        await db.SaveChangesAsync(ct);

        logger.LogWarning("Feedback #{Id} from {Who} on {Page}: {Message}", feedback.Id, feedback.Email ?? "someone signed out",
            LogText.Clean(PageOf(context), 300), LogText.Clean(message, 300));
        return StatusCode(201, new { id = feedback.Id });
    }

    /// <summary>The image type from the file's first bytes (PNG, JPEG or WebP), or null for anything else.</summary>
    internal static string? ImageType(ReadOnlySpan<byte> b)
    {
        if (b.Length >= 8 && b[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })) return "image/png";
        if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF) return "image/jpeg";
        if (b.Length >= 12 && b[..4].SequenceEqual("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
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
    /// <summary>A data: URL (PNG, JPEG or WebP), or null.</summary>
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
        // Only ever an image, shown in place, that can't run anything (S-114). Anything older that isn't one downloads.
        var type = FeedbackController.ImageType(bytes);
        Response.Headers.ContentSecurityPolicy = "default-src 'none'; sandbox";
        Response.Headers.ContentDisposition = type is null ? $"attachment; filename=\"feedback-{id}.bin\"" : "inline";
        return File(bytes, type ?? "application/octet-stream");
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
