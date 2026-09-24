using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using WaNonprofitConnect.Data;
using static WaNonprofitConnect.Tests.TestData;

namespace WaNonprofitConnect.Tests;

/// <summary>The real API over an in-memory SQLite database, in Development (so /auth/dev exists).</summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string AdminEmail = "admin@test.local";
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();
        builder.UseEnvironment("Development");
        builder.UseSetting("Admin:Emails:0", AdminEmail);
        builder.UseSetting("Auth:Google:ClientId", "");
        builder.ConfigureServices(s =>
        {
            s.RemoveAll<DbContextOptions<AppDbContext>>();
            s.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        });
    }

    public void Seed(Action<AppDbContext> seed)
    {
        using var scope = Services.CreateScope();
        seed(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public HttpClient NewClient() => CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true, AllowAutoRedirect = false });

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}

public sealed class ApiTests : IDisposable
{
    internal static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    private readonly ApiFactory _factory = new();

    public ApiTests()
    {
        _factory.NewClient().Dispose(); // boots the host, which creates the schema
        _factory.Seed(SeedOrgs);
    }

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task Me_is_401_without_the_cookie()
    {
        using var http = _factory.NewClient();
        var resp = await http.GetAsync("/api/v1/me");
        resp.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await Problem(resp)).Should().Be("Sign in first.");
    }

    [Fact]
    public async Task Acting_without_a_confirmed_membership_is_403()
    {
        using var http = _factory.NewClient();
        var me = await PostOk<JsonElement>(http, "/api/v1/auth/dev", new { email = "new@example.org", name = "New" });
        me.GetProperty("membership").ValueKind.Should().Be(JsonValueKind.Null);

        var post = new { kind = "Need", help = "Things", title = "Laptops", urgency = "Normal", cadence = "OneTime" };
        var resp = await http.PostAsJsonAsync("/api/v1/listings", post, Json);
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Problem(resp)).Should().StartWith("Join your organization first.");

        // A claim is pending, which is still not enough to act.
        var claimed = await PostOk<JsonElement>(http, "/api/v1/claims", new { ein = A });
        claimed.GetProperty("membership").GetProperty("status").GetString().Should().Be("pending");
        resp = await http.PostAsJsonAsync("/api/v1/listings", post, Json);
        resp.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await http.GetAsync("/api/v1/threads")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_makes_an_invite_and_redeeming_it_confirms()
    {
        using var admin = _factory.NewClient();
        using var person = _factory.NewClient();
        await PostOk<JsonElement>(admin, "/api/v1/auth/dev", new { email = ApiFactory.AdminEmail, name = "Admin" });
        await PostOk<JsonElement>(person, "/api/v1/auth/dev", new { email = "sam@example.org", name = "Sam" });

        (await person.GetAsync("/api/v1/admin/invites")).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var invite = await PostOk<JsonElement>(admin, "/api/v1/admin/invites", new { ein = B, uses = 1 });
        invite.GetProperty("orgName").GetString().Should().Be("BETA HABITAT");

        var me = await PostOk<JsonElement>(person, "/api/v1/invites/redeem", new { code = invite.GetProperty("code").GetString() });
        me.GetProperty("membership").GetProperty("status").GetString().Should().Be("confirmed");
        me.GetProperty("membership").GetProperty("ein").GetString().Should().Be(B);

        var signout = await person.PostAsync("/api/v1/auth/signout", null);
        signout.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await person.GetAsync("/api/v1/me")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Admin_can_switch_organization_to_test_and_no_one_else_can()
    {
        using var admin = _factory.NewClient();
        using var person = _factory.NewClient();
        await PostOk<JsonElement>(admin, "/api/v1/auth/dev", new { email = ApiFactory.AdminEmail, name = "Admin" });
        await PostOk<JsonElement>(person, "/api/v1/auth/dev", new { email = "rae@example.org", name = "Rae" });

        (await person.PostAsJsonAsync("/api/v1/admin/act-as", new { ein = B })).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var me = await PostOk<JsonElement>(admin, "/api/v1/admin/act-as", new { ein = B });
        me.GetProperty("membership").GetProperty("ein").GetString().Should().Be(B);
        me.GetProperty("membership").GetProperty("status").GetString().Should().Be("confirmed");

        me = await PostOk<JsonElement>(admin, "/api/v1/admin/act-as", new { ein = A });
        me.GetProperty("membership").GetProperty("ein").GetString().Should().Be(A);
    }

    [Fact]
    public async Task An_organization_saves_its_filters_for_everyone_there_and_admins_can_set_them()
    {
        using var one = _factory.NewClient();
        using var two = _factory.NewClient();
        using var admin = _factory.NewClient();
        await PostOk<JsonElement>(one, "/api/v1/auth/dev", new { email = "f1@example.org", name = "Fay", ein = C });
        await PostOk<JsonElement>(two, "/api/v1/auth/dev", new { email = "f2@example.org", name = "Flo", ein = C });
        await PostOk<JsonElement>(admin, "/api/v1/auth/dev", new { email = ApiFactory.AdminEmail, name = "Admin" });

        var before = await one.GetFromJsonAsync<JsonElement>("/api/v1/filters", Json);
        before.GetProperty("serve").ValueKind.Should().Be(JsonValueKind.Null); // never saved: start from the cause code

        var saved = await one.PutAsJsonAsync("/api/v1/filters", new { serve = new[] { "Animals", "Not a group", "Food" } }, Json);
        saved.StatusCode.Should().Be(HttpStatusCode.OK);
        var theirs = await two.GetFromJsonAsync<JsonElement>("/api/v1/filters", Json);
        theirs.GetProperty("serve").EnumerateArray().Select(x => x.GetString()).Should().Equal("Food", "Animals"); // known names, fixed order

        (await one.PutAsJsonAsync($"/api/v1/admin/orgs/{D}/filters", new { serve = new[] { "Food" } }, Json)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await admin.PutAsJsonAsync($"/api/v1/admin/orgs/{D}/filters", new { serve = new[] { "Veterans" } }, Json)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await admin.PutAsJsonAsync("/api/v1/admin/orgs/000000000/filters", new { serve = new[] { "Food" } }, Json)).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Browser_errors_are_accepted_without_signing_in()
    {
        using var http = _factory.NewClient();
        var resp = await http.PostAsJsonAsync("/api/v1/client-errors",
            new { kind = "crash", message = new string('x', 10_000), url = "/board", stack = "at Board", build = "main-abc" }, Json);
        resp.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Google_sign_in_without_a_client_id_is_503()
    {
        using var http = _factory.NewClient();
        var resp = await http.PostAsJsonAsync("/api/v1/auth/google", new { idToken = "x" }, Json);
        resp.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        (await Problem(resp)).Should().Contain("Auth:Google:ClientId");
    }


    [Fact]
    public async Task Board_to_golden_thread_over_http()
    {
        using var alpha = _factory.NewClient();
        using var beta = _factory.NewClient();
        await PostOk<JsonElement>(alpha, "/api/v1/auth/dev", new { email = "robin@alpha.org", name = "Robin", ein = A });
        await PostOk<JsonElement>(beta, "/api/v1/auth/dev", new { email = "casey@beta.org", name = "Casey", ein = B });

        var need = await PostOk<JsonElement>(alpha, "/api/v1/listings",
            new { kind = "Need", help = "Things", title = "12 laptops for client intake", quantity = 12, unit = "laptops", urgency = "High", cadence = "OneTime" });
        need.GetProperty("why").GetString().Should().Be("This week");
        need.GetProperty("description").ValueKind.Should().Be(JsonValueKind.Null); // nulls are written, not dropped
        need.GetProperty("org").GetProperty("isMember").GetBoolean().Should().BeTrue();

        var board = await beta.GetFromJsonAsync<JsonElement>("/api/v1/board?help=Things", Json);
        board.EnumerateArray().Select(l => l.GetProperty("id").GetInt32()).Should().Contain(need.GetProperty("id").GetInt32());

        var thread = await PostOk<JsonElement>(beta, "/api/v1/threads", new { listingId = need.GetProperty("id").GetInt32(), message = "We have 15." });
        var id = thread.GetProperty("id").GetInt32();
        thread.GetProperty("status").GetString().Should().Be("Proposed");
        thread.GetProperty("offer").GetProperty("org").GetProperty("ein").GetString().Should().Be(B);

        (await beta.PostAsync($"/api/v1/threads/{id}/accept", null)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        var inbox = await alpha.GetFromJsonAsync<JsonElement>("/api/v1/threads", Json);
        inbox[0].GetProperty("unread").GetInt32().Should().Be(1);

        var detail = await alpha.GetFromJsonAsync<JsonElement>($"/api/v1/threads/{id}", Json);
        detail.GetProperty("messages")[0].GetProperty("senderName").GetString().Should().Be("Casey");

        (await PostOk<JsonElement>(alpha, $"/api/v1/threads/{id}/accept", null)).GetProperty("status").GetString().Should().Be("Accepted");
        (await PostOk<JsonElement>(beta, $"/api/v1/threads/{id}/messages", new { body = "Thursday?" })).GetProperty("threadId").GetInt32().Should().Be(id);
        (await PostOk<JsonElement>(beta, $"/api/v1/threads/{id}/complete", null)).GetProperty("status").GetString().Should().Be("Completed");

        var close = await alpha.PostAsync($"/api/v1/listings/{need.GetProperty("id").GetInt32()}/close", null);
        close.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Unknown_api_paths_404_and_client_routes_fall_back_to_the_app()
    {
        using var http = _factory.NewClient();
        var api = await http.GetAsync("/api/v1/nope");
        api.StatusCode.Should().Be(HttpStatusCode.NotFound);
        api.Content.Headers.ContentType?.MediaType.Should().NotBe("text/html");
        (await http.GetAsync("/hubs/nope")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html");
        var projectRoot = _factory.Services.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>().WebRootPath;
        if (!File.Exists(webRoot) && !File.Exists(Path.Combine(projectRoot ?? "", "index.html"))) return; // app not built on this machine
        var page = await http.GetAsync("/inbox/42");
        page.StatusCode.Should().Be(HttpStatusCode.OK);
        page.Content.Headers.ContentType!.MediaType.Should().Be("text/html");

        // Files are served as themselves: a missing one 404s, a real one keeps its own type.
        (await http.GetAsync("/assets/missing-abc123.js")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        var icon = await http.GetAsync("/favicon.svg");
        icon.StatusCode.Should().Be(HttpStatusCode.OK);
        icon.Content.Headers.ContentType!.MediaType.Should().Be("image/svg+xml");
    }
    internal static async Task<T> PostOk<T>(HttpClient http, string path, object? body)
    {
        var resp = await http.PostAsJsonAsync(path, body, Json);
        var text = await resp.Content.ReadAsStringAsync();
        resp.IsSuccessStatusCode.Should().BeTrue($"POST {path} returned {(int)resp.StatusCode}: {text}");
        return JsonSerializer.Deserialize<T>(text, Json)!;
    }

    internal static async Task<string?> Problem(HttpResponseMessage resp)
    {
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("title").GetString();
    }
}
