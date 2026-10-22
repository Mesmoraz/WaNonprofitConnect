using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WaNonprofitConnect.Api.Security;
using WaNonprofitConnect.Data.Accounts;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Api.Controllers;

[ApiController]
[Route("api/v1/map")]
[Produces("application/json")]
public sealed class MapController : ControllerBase
{
    public const string PointsCacheKey = "map:points";
    private readonly HelpbookService _helpbook;
    private readonly IMemoryCache _cache;

    public MapController(HelpbookService helpbook, IMemoryCache cache)
    {
        _helpbook = helpbook;
        _cache = cache;
    }

    /// <summary>
    /// Member pins, live and golden threads (from = giver, to = receiver), and suggested threads.
    /// Before you're confirmed, the pins only (S-114).
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<MapDataDto> Get([FromServices] AccountService accounts, CancellationToken ct)
    {
        var confirmed = User.AccountId() is { } id && await accounts.FindActingEinAsync(id, ct) is not null;
        return await _helpbook.MapAsync(confirmed, ct);
    }

    /// <summary>Every open need and offer with its place (S-131): the map's count of what's in view, its list, and its chips.</summary>
    [HttpGet("open")]
    [Authorize]
    public async Task<IReadOnlyList<ListingViewDto>> Open(CancellationToken ct) => await _helpbook.MapOpenAsync(ct);

    /// <summary>
    /// What fits your organization (S-130): <c>for=needs</c>, offers that could fit your needs; <c>for=offers</c>, needs
    /// you could help with. Confirmed members only: it's about your own posts.
    /// </summary>
    [HttpGet("fits")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<MapFitDto>>> Fits([FromQuery(Name = "for")] string? forWhat, [FromServices] AccountService accounts, CancellationToken ct)
    {
        if (forWhat is not ("needs" or "offers")) return BadRequest(new ProblemDetails { Status = 400, Title = "Say for=needs or for=offers." });
        var ein = await accounts.RequireActingEinAsync(User.RequireAccountId(), ct);
        return Ok(await _helpbook.MapFitsAsync(ein, forWhat == "needs", ct));
    }

    /// <summary>
    /// <c>[ein, lat, lon][]</c> for every Washington 501(c)(3) with a ZIP centroid: the faint dots.
    /// Public IRS and Census data, so no sign-in; cached an hour by the browser and in memory here.
    /// </summary>
    [HttpGet("points")]
    [AllowAnonymous]
    public async Task<IActionResult> Points(CancellationToken ct)
    {
        var bytes = await _cache.GetOrCreateAsync(PointsCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            var points = await _helpbook.MapPointsAsync(ct);
            if (points.Count == 0) entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1); // centroids not imported yet
            using var buffer = new MemoryStream(points.Count * 32 + 2);
            using (var w = new Utf8JsonWriter(buffer))
            {
                w.WriteStartArray();
                foreach (var (ein, lat, lon) in points)
                {
                    w.WriteStartArray();
                    w.WriteStringValue(ein);
                    w.WriteNumberValue(Math.Round(lat, 5)); // ~1 m; the centroid is far coarser than that
                    w.WriteNumberValue(Math.Round(lon, 5));
                    w.WriteEndArray();
                }
                w.WriteEndArray();
            }
            return buffer.ToArray();
        });

        Response.Headers.CacheControl = "public, max-age=3600";
        return File(bytes!, "application/json");
    }
}
