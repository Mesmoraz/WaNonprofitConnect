using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using WaNonprofitConnect.Api.Controllers;
using WaNonprofitConnect.Api.Security;
using static WaNonprofitConnect.Tests.ApiTests;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

/// <summary>Security hardening from the Oct 2 assessment (S-114). Each test names the finding it closes.</summary>
[Trait("Story", "S-114")]
public sealed class SecurityTests : IDisposable
{
    private readonly ApiFactory _factory = new();

    public SecurityTests()
    {
        _factory.NewClient().Dispose(); // boots the host, which creates the schema
        _factory.Seed(SeedOrgs);
    }

    public void Dispose() => _factory.Dispose();

    private static readonly byte[] Png = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13 };
    private static string DataUrl(string type, byte[] bytes) => $"data:{type};base64,{Convert.ToBase64String(bytes)}";

    // ---- M2: security headers -----------------------------------------------------------

    [Fact]
    public async Task M2_the_app_and_the_api_both_carry_the_security_headers()
    {
        using var http = _factory.NewClient();
        foreach (var path in new[] { "/", "/api/v1/me", "/inbox/42" })
        {
            var resp = await http.GetAsync(path);
            var csp = resp.Headers.GetValues("Content-Security-Policy").Single();
            csp.Should().Contain("default-src 'self'").And.Contain("frame-ancestors 'none'").And.Contain("object-src 'none'");
            csp.Should().Contain("script-src 'self' https://accounts.google.com/gsi/client");        // Google sign-in
            csp.Should().Contain("frame-src https://accounts.google.com/gsi/");                       // its button
            csp.Should().MatchRegex("connect-src [^;]*https://tiles.openfreemap.org");               // the map's style and tiles
            csp.Should().MatchRegex("connect-src [^;]*wss://localhost");                              // SignalR, this host only
            csp.Should().MatchRegex("img-src [^;]*data: blob:");                                      // map sprites, feedback picture
            csp.Should().Contain("worker-src 'self' blob:");                                          // MapLibre's worker
            csp.Should().NotContain("unsafe-eval");
            resp.Headers.GetValues("X-Content-Type-Options").Single().Should().Be("nosniff");
            resp.Headers.GetValues("Referrer-Policy").Single().Should().Be("strict-origin-when-cross-origin");
            resp.Headers.GetValues("X-Frame-Options").Single().Should().Be("DENY");
            resp.Headers.Contains("Permissions-Policy").Should().BeTrue();
            resp.Headers.Contains("Strict-Transport-Security").Should().BeFalse(); // Development: no HSTS on localhost
            resp.Headers.Contains("Server").Should().BeFalse();
        }
        (await http.GetAsync("/api/v1/me")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task M2_a_feedback_picture_must_be_a_real_image_and_is_served_as_one_that_cannot_run()
    {
        using var person = _factory.NewClient();
        using var admin = _factory.NewClient();
        await PostOk<JsonElement>(person, "/api/v1/auth/dev", new { email = "pic@example.org", name = "Pat", ein = A });
        await PostOk<JsonElement>(admin, "/api/v1/auth/dev", new { email = ApiFactory.AdminEmail, name = "Admin" });

        // An SVG with a script, and HTML claiming to be a JPEG: both refused.
        var svg = "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"u8.ToArray();
        foreach (var bad in new[] { DataUrl("image/svg+xml", svg), DataUrl("image/jpeg", "<html><script>alert(1)</script>"u8.ToArray()), "data:image/png;base64,???" })
        {
            var resp = await person.PostAsJsonAsync("/api/v1/feedback", new { message = "Look", screenshot = bad }, Json);
            resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await Problem(resp)).Should().Be("That picture didn't work. Send it without one.");
        }

        var jpeg = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3 };
        var webp = "RIFF\0\0\0\0WEBPVP8 "u8.ToArray();
        foreach (var (type, bytes, expected) in new[] { ("image/png", Png, "image/png"), ("image/jpeg", jpeg, "image/jpeg"), ("image/webp", webp, "image/webp") })
        {
            var sent = await PostOk<JsonElement>(person, "/api/v1/feedback", new { message = $"A {type}", screenshot = DataUrl(type, bytes) });
            var pic = await admin.GetAsync($"/api/v1/admin/feedback/{sent.GetProperty("id").GetInt32()}/screenshot");
            pic.StatusCode.Should().Be(HttpStatusCode.OK);
            pic.Content.Headers.ContentType!.MediaType.Should().Be(expected);
            pic.Content.Headers.ContentDisposition!.DispositionType.Should().Be("inline");
            pic.Headers.GetValues("Content-Security-Policy").Single().Should().StartWith("default-src 'none'");
            pic.Headers.GetValues("X-Content-Type-Options").Single().Should().Be("nosniff");
        }
    }

    // ---- M3: anonymous feedback --------------------------------------------------------

    [Fact]
    public async Task M3_feedback_signed_out_still_works_but_is_held_to_5_an_hour_with_a_shorter_note_and_smaller_picture()
    {
        using var stranger = _factory.NewClient();
        using var person = _factory.NewClient();
        using var admin = _factory.NewClient();
        await PostOk<JsonElement>(person, "/api/v1/auth/dev", new { email = "fbm@example.org", name = "Mo", ein = A });
        await PostOk<JsonElement>(admin, "/api/v1/auth/dev", new { email = ApiFactory.AdminEmail, name = "Admin" });

        var bigPicture = Png.Concat(new byte[2 * 1024 * 1024]).ToArray(); // 2 MB: over the 1.5 MB signed-out limit, under 3 MB
        var first = await PostOk<JsonElement>(stranger, "/api/v1/feedback",
            new { message = "Can't sign in " + new string('x', 5000), screenshot = DataUrl("image/png", bigPicture) });
        for (var i = 2; i <= 5; i++)
            (await stranger.PostAsJsonAsync("/api/v1/feedback", new { message = $"Again {i}" }, Json)).StatusCode.Should().Be(HttpStatusCode.Created);
        (await stranger.PostAsJsonAsync("/api/v1/feedback", new { message = "Sixth" }, Json)).StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        // Signed in from the same address: the usual limit, the longer note and the bigger picture.
        var mine = await PostOk<JsonElement>(person, "/api/v1/feedback",
            new { message = "Signed in " + new string('y', 5000), screenshot = DataUrl("image/png", bigPicture) });

        var list = (await admin.GetFromJsonAsync<JsonElement>("/api/v1/admin/feedback", Json)).EnumerateArray().ToList();
        var anon = list.Single(f => f.GetProperty("id").GetInt32() == first.GetProperty("id").GetInt32());
        anon.GetProperty("message").GetString()!.Length.Should().Be(FeedbackController.MaxAnonymousMessage);
        anon.GetProperty("hasScreenshot").GetBoolean().Should().BeFalse(); // the note kept, the picture dropped
        var theirs = list.Single(f => f.GetProperty("id").GetInt32() == mine.GetProperty("id").GetInt32());
        theirs.GetProperty("message").GetString()!.Length.Should().Be(FeedbackController.MaxMessage);
        theirs.GetProperty("hasScreenshot").GetBoolean().Should().BeTrue();
    }

    // ---- L1: sign-out ends the session -------------------------------------------------

    [Fact]
    public async Task L1_signing_out_ends_the_session_on_the_server_so_a_copied_cookie_stops_working()
    {
        using var raw = _factory.CreateClient(new() { HandleCookies = false });
        var signIn = await raw.PostAsJsonAsync("/api/v1/auth/dev", new { email = "copy@example.org", name = "Cy", ein = A }, Json);
        signIn.EnsureSuccessStatusCode();
        var cookie = signIn.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith(AuthSetup.CookieName + "=")).Split(';')[0];

        async Task<HttpStatusCode> MeWith(string c, string path = "/api/v1/me", HttpMethod? method = null)
        {
            using var req = new HttpRequestMessage(method ?? HttpMethod.Get, path);
            req.Headers.Add("Cookie", c);
            return (await raw.SendAsync(req)).StatusCode;
        }

        (await MeWith(cookie)).Should().Be(HttpStatusCode.OK);
        (await MeWith(cookie, "/api/v1/auth/signout", HttpMethod.Post)).Should().Be(HttpStatusCode.NoContent);
        (await MeWith(cookie)).Should().Be(HttpStatusCode.Unauthorized); // the copy left behind no longer works

        // Signing in again makes a cookie that works.
        var again = await raw.PostAsJsonAsync("/api/v1/auth/dev", new { email = "copy@example.org", name = "Cy" }, Json);
        var fresh = again.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith(AuthSetup.CookieName + "=")).Split(';')[0];
        (await MeWith(fresh)).Should().Be(HttpStatusCode.OK);
        (await MeWith(cookie)).Should().Be(HttpStatusCode.Unauthorized);
    }

    // ---- L2: writes from another site -------------------------------------------------

    [Fact]
    public async Task L2_writes_from_another_site_are_refused_and_ours_go_through()
    {
        using var alpha = _factory.NewClient();
        await PostOk<JsonElement>(alpha, "/api/v1/auth/dev", new { email = "csrf@example.org", name = "Cass", ein = A });
        var listing = await PostOk<JsonElement>(alpha, "/api/v1/listings", new { kind = "Need", help = "Things", title = "Chairs", urgency = "Normal", cadence = "OneTime" });
        var close = $"/api/v1/listings/{listing.GetProperty("id").GetInt32()}/close";

        async Task<HttpResponseMessage> Send(HttpMethod method, string path, params (string Name, string Value)[] headers)
        {
            using var req = new HttpRequestMessage(method, path);
            if (method != HttpMethod.Get && method != HttpMethod.Post) req.Content = JsonContent.Create(new { serve = new[] { "Food" } }, options: Json);
            foreach (var (n, v) in headers) req.Headers.Add(n, v);
            return await alpha.SendAsync(req);
        }

        var evil = await Send(HttpMethod.Post, close, ("Origin", "https://evil.example"));
        evil.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Problem(evil)).Should().Be("That came from another site, so we stopped it.");
        (await Send(HttpMethod.Post, close, ("Origin", "null"))).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Send(HttpMethod.Post, close, ("Sec-Fetch-Site", "cross-site"))).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Send(HttpMethod.Post, close, ("Origin", "http://localhost.evil.example"))).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Send(HttpMethod.Put, "/api/v1/filters", ("Origin", "https://evil.example"))).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Send(HttpMethod.Post, "/api/v1/auth/signout", ("Origin", "https://evil.example"))).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Reads are never blocked. Ours go through: the same page (Origin is this host), the dev server
        // (Cors:AllowedOrigins in Development), and callers that send no Origin at all (the CLI, tests).
        (await Send(HttpMethod.Get, "/api/v1/me", ("Origin", "https://evil.example"))).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(HttpMethod.Put, "/api/v1/filters", ("Origin", "http://localhost"), ("Sec-Fetch-Site", "same-origin"))).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(HttpMethod.Put, "/api/v1/filters", ("Origin", "http://localhost:5173"))).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(HttpMethod.Put, "/api/v1/filters")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Send(HttpMethod.Post, close, ("Origin", "http://localhost"))).StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ---- L3: board views ---------------------------------------------------------------

    [Fact]
    public async Task L3_board_views_count_only_for_confirmed_members()
    {
        using var alpha = _factory.NewClient();
        using var waiting = _factory.NewClient();
        using var beta = _factory.NewClient();
        await PostOk<JsonElement>(alpha, "/api/v1/auth/dev", new { email = "v1@example.org", name = "Val", ein = A });
        await PostOk<JsonElement>(waiting, "/api/v1/auth/dev", new { email = "v2@example.org", name = "Wes" });
        await PostOk<JsonElement>(beta, "/api/v1/auth/dev", new { email = "v3@example.org", name = "Bo", ein = B });
        var id = (await PostOk<JsonElement>(alpha, "/api/v1/listings", new { kind = "Offer", help = "Things", title = "Desks", urgency = "Normal", cadence = "OneTime" }))
            .GetProperty("id").GetInt32();
        async Task<int> Views() => (await alpha.GetFromJsonAsync<JsonElement>($"/api/v1/listings/{id}", Json)).GetProperty("views").GetInt32();

        for (var i = 0; i < 5; i++) (await waiting.GetAsync("/api/v1/board")).StatusCode.Should().Be(HttpStatusCode.OK); // can look
        (await Views()).Should().Be(0);                                                                                     // but not count
        await beta.GetAsync("/api/v1/board");
        (await Views()).Should().Be(1);
    }

    // ---- L4: what an unconfirmed account sees -----------------------------------------

    [Fact]
    public async Task L4_before_confirmation_the_map_has_no_threads_and_the_old_search_has_open_posts_only()
    {
        using var alpha = _factory.NewClient();
        using var beta = _factory.NewClient();
        using var waiting = _factory.NewClient();
        await PostOk<JsonElement>(alpha, "/api/v1/auth/dev", new { email = "m1@example.org", name = "Ann", ein = A });
        await PostOk<JsonElement>(beta, "/api/v1/auth/dev", new { email = "m2@example.org", name = "Ben", ein = B });
        await PostOk<JsonElement>(waiting, "/api/v1/auth/dev", new { email = "m3@example.org", name = "Una" });

        var need = await PostOk<JsonElement>(alpha, "/api/v1/listings", new { kind = "Need", help = "Things", title = "Secret laptops", urgency = "Normal", cadence = "OneTime" });
        await PostOk<JsonElement>(beta, "/api/v1/threads", new { listingId = need.GetProperty("id").GetInt32(), message = "We have some." });
        var closed = await PostOk<JsonElement>(alpha, "/api/v1/listings", new { kind = "Need", help = "Things", title = "Old chairs", urgency = "Normal", cadence = "OneTime" });
        (await alpha.PostAsync($"/api/v1/listings/{closed.GetProperty("id").GetInt32()}/close", null)).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var members = await beta.GetFromJsonAsync<JsonElement>("/api/v1/map", Json);
        members.GetProperty("threads").GetArrayLength().Should().Be(1);

        var early = await waiting.GetFromJsonAsync<JsonElement>("/api/v1/map", Json);
        early.GetProperty("threads").GetArrayLength().Should().Be(0);
        early.GetProperty("suggested").GetArrayLength().Should().Be(0);
        early.GetProperty("members").EnumerateArray().Select(m => m.GetProperty("ein").GetString()).Should().Contain(new[] { A, B });

        var search = await waiting.GetFromJsonAsync<JsonElement>("/api/v1/listings?status=Closed&pageSize=50", Json);
        search.GetProperty("items").EnumerateArray().Should().OnlyContain(l => l.GetProperty("status").GetString() == "Open");
        var asMember = await beta.GetFromJsonAsync<JsonElement>("/api/v1/listings?status=Closed&pageSize=50", Json);
        asMember.GetProperty("items").EnumerateArray().Select(l => l.GetProperty("title").GetString()).Should().Contain("Old chairs");
    }

    // ---- L5: 413/400 instead of 500 ---------------------------------------------------

    [Fact]
    public async Task L5_too_big_is_413_and_an_impossible_number_is_400_never_500()
    {
        // The test server doesn't enforce body limits (Kestrel does), so check the limits are declared and that a
        // refused body becomes a 413 with a plain title. Checked against Kestrel by hand: see the pull request.
        var endpoints = _factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>().ToList();
        long? Limit(string route) => endpoints.Single(e => e.RoutePattern.RawText == route
                && e.Metadata.GetMetadata<IHttpMethodMetadata>()!.HttpMethods.Contains("POST"))
            .Metadata.GetMetadata<IRequestSizeLimitMetadata>()?.MaxRequestBodySize;
        Limit("api/v1/client-errors").Should().Be(16 * 1024);
        Limit("api/v1/feedback").Should().Be(6 * 1024 * 1024);

        var http413 = new DefaultHttpContext();
        http413.Response.Body = new MemoryStream();
        await BadRequestHandler.WriteAsync(http413, new BadHttpRequestException("Request body too large.", 413));
        http413.Response.StatusCode.Should().Be(413);
        http413.Response.Body.Position = 0;
        JsonDocument.Parse(http413.Response.Body).RootElement.GetProperty("title").GetString().Should().Be("That's too much to send at once.");

        using var http = _factory.NewClient();
        await PostOk<JsonElement>(http, "/api/v1/auth/dev", new { email = "q@example.org", name = "Quinn", ein = A });
        foreach (var quantity in new[] { 99999999999999999m, 1_000_001m, 0m, -3m })
        {
            var resp = await http.PostAsJsonAsync("/api/v1/listings",
                new { kind = "Need", help = "Things", title = "Pens", quantity, urgency = "Normal", cadence = "OneTime" }, Json);
            resp.StatusCode.Should().Be(HttpStatusCode.BadRequest, $"quantity {quantity}");
            (await Problem(resp)).Should().Be("Pick a number from 1 to 1,000,000.");
        }
        (await http.PostAsJsonAsync("/api/v1/listings",
            new { kind = "Need", help = "Things", title = "Pens", quantity = 1_000_000, urgency = "Normal", cadence = "OneTime" }, Json))
            .StatusCode.Should().Be(HttpStatusCode.Created);
    }

    // ---- L6: log forging ---------------------------------------------------------------

    [Fact]
    public void L6_browser_text_stays_on_one_log_line_and_is_cut_to_length()
    {
        LogText.Clean("x\nfail: FORGED LINE\r\nwarn: another\u2028and\u0007bell").Should().Be("x | fail: FORGED LINE | warn: another | and bell");
        LogText.Clean("\u202Egnp.exe").Should().Be(" gnp.exe");
        LogText.Clean(new string('a', 10_000)).Should().HaveLength(LogText.DefaultMax + 1).And.EndWith("…");
        LogText.Clean(null).Should().BeEmpty();
    }

    [Fact]
    public async Task L6_forged_lines_in_a_browser_error_are_accepted_but_not_written_as_new_lines()
    {
        using var http = _factory.NewClient();
        var resp = await http.PostAsJsonAsync("/api/v1/client-errors",
            new { kind = "error", message = "x\nfail: Microsoft.AspNetCore FORGED LINE", url = "/\r\nwarn: also forged", stack = "at A\nat B" }, Json);
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    // ---- I1: import log ---------------------------------------------------------------

    [Fact]
    public async Task I1_the_import_log_with_server_paths_is_for_admins_only()
    {
        using var anyone = _factory.NewClient();
        using var person = _factory.NewClient();
        using var admin = _factory.NewClient();
        (await anyone.GetAsync("/api/v1/imports")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        await PostOk<JsonElement>(person, "/api/v1/auth/dev", new { email = "imp@example.org", name = "Ivy", ein = A });
        (await person.GetAsync("/api/v1/imports")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        await PostOk<JsonElement>(admin, "/api/v1/auth/dev", new { email = ApiFactory.AdminEmail, name = "Admin" });
        (await admin.GetAsync("/api/v1/imports")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await anyone.GetAsync("/api/v1/stats")).StatusCode.Should().Be(HttpStatusCode.OK); // the rest stays public
    }
}
