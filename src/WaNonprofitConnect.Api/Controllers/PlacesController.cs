using System.IO.Compression;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Api.Controllers;

/// <summary>
/// The places you can tap on the map (S-144): their outlines, and everyone inside one. Public Census and City of Seattle
/// outlines over public IRS data, so no sign-in, like <c>/map/points</c>.
/// </summary>
[ApiController]
[Route("api/v1/places")]
[Produces("application/json")]
public sealed class PlacesController : ControllerBase
{
    private const string GzipCacheKey = "places:gz";
    private readonly HelpbookService _helpbook;
    private readonly IMemoryCache _cache;

    public PlacesController(HelpbookService helpbook, IMemoryCache cache)
    {
        _helpbook = helpbook;
        _cache = cache;
    }

    /// <summary>Every outline, as one GeoJSON FeatureCollection (about 1 MB, a fifth of that gzipped). Cached a day by the browser.</summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        var raw = Places.File;
        if (raw.Length == 0) return NotFound(new ProblemDetails { Status = 404, Title = "No places on this server." });
        Response.Headers.CacheControl = "public, max-age=86400";
        Response.Headers.Vary = "Accept-Encoding";
        if (!Request.Headers.AcceptEncoding.ToString().Contains("gzip", StringComparison.OrdinalIgnoreCase)) return File(raw, "application/geo+json");
        var gz = _cache.GetOrCreate(GzipCacheKey, _ =>
        {
            using var buffer = new MemoryStream();
            using (var z = new GZipStream(buffer, CompressionLevel.SmallestSize)) z.Write(raw);
            return buffer.ToArray();
        })!;
        Response.Headers.ContentEncoding = "gzip";
        return File(gz, "application/geo+json");
    }

    /// <summary>
    /// The organizations inside a place: how many, how many have joined, and 50 at a time, joined first.
    /// Who is inside is worked out once an hour per place.
    /// </summary>
    [HttpGet("{id}/orgs")]
    [AllowAnonymous]
    public async Task<ActionResult<PlaceOrgsDto>> Orgs(string id, [FromQuery] int skip = 0, [FromQuery] int take = HelpbookService.MaxPlaceOrgs, CancellationToken ct = default)
    {
        if (Places.Find(id) is not { } place) return NotFound(new ProblemDetails { Status = 404, Title = "No place with that id." });
        var eins = await _cache.GetOrCreateAsync($"places:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return await _helpbook.PlaceEinsAsync(place, ct);
        });
        return Ok(await _helpbook.PlaceOrgsAsync(place, eins!, skip, take, ct));
    }
}
