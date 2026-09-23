using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
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

    /// <summary>Member pins, live and golden threads (from = giver, to = receiver), and suggested threads.</summary>
    [HttpGet]
    [Authorize]
    public Task<MapDataDto> Get(CancellationToken ct) => _helpbook.MapAsync(ct);

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
