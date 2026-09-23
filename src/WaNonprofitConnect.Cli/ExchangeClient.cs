using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Cli;

/// <summary>
/// Thin typed client over the exchange API, used by the CLI demo and watcher.
/// The API acts for the signed-in person's confirmed organization, so each EIN gets its own cookie session,
/// opened with the Development-only <c>POST /api/v1/auth/dev</c> (run the API in Development).
/// </summary>
public sealed class ExchangeClient
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly Uri _base;
    private readonly HttpClient _anonymous;
    private readonly Dictionary<string, (HttpClient Http, CookieContainer Cookies)> _sessions = new();

    public ExchangeClient(string baseUrl)
    {
        _base = new Uri(baseUrl.TrimEnd('/') + "/");
        _anonymous = new HttpClient { BaseAddress = _base };
    }

    public string BaseUrl => _base.ToString().TrimEnd('/');

    // ---- listings ----
    public Task<ListingDto> PostListingAsync(string ein, CreateListingRequest req)
        => SendAsync<ListingDto>(HttpMethod.Post, "api/v1/listings", ein, req);

    public Task<PagedResult<ListingDto>> SearchListingsAsync(ListingSearchRequest req)
    {
        var qs = new List<string>();
        void Add(string k, object? v) { if (v is not null) qs.Add($"{k}={Uri.EscapeDataString(v.ToString()!)}"); }
        Add("kind", req.Kind); Add("category", req.Category); Add("status", req.Status); Add("city", req.City);
        Add("orgEin", req.OrgEin); Add("q", req.Q); Add("page", req.Page); Add("pageSize", req.PageSize);
        return SendAsync<PagedResult<ListingDto>>(HttpMethod.Get, "api/v1/listings?" + string.Join('&', qs), CliEin, null);
    }

    public Task<ListingDto> GetListingAsync(int id) => SendAsync<ListingDto>(HttpMethod.Get, $"api/v1/listings/{id}", CliEin, null);
    public Task<IReadOnlyList<MatchSuggestionDto>> SuggestAsync(int id, int take = 10)
        => SendAsync<IReadOnlyList<MatchSuggestionDto>>(HttpMethod.Get, $"api/v1/listings/{id}/matches?take={take}", CliEin, null);
    public async Task<ListingDto> CloseListingAsync(int id, string ein)
    {
        await SendAsync<JsonElement?>(HttpMethod.Post, $"api/v1/listings/{id}/close", ein, null);
        return await GetListingAsync(id);
    }

    // ---- matches ----
    public Task<MatchDto> ProposeAsync(string ein, ProposeMatchRequest req) => SendAsync<MatchDto>(HttpMethod.Post, "api/v1/matches", ein, req);
    public Task<MatchDto> MatchActionAsync(int id, string ein, string action) => SendAsync<MatchDto>(HttpMethod.Post, $"api/v1/matches/{id}/{action}", ein, null);
    public Task<MatchDto> GetMatchAsync(int id, string ein) => SendAsync<MatchDto>(HttpMethod.Get, $"api/v1/matches/{id}", ein, null);
    public Task<IReadOnlyList<MatchDto>> InboxAsync(string ein) => SendAsync<IReadOnlyList<MatchDto>>(HttpMethod.Get, "api/v1/matches", ein, null);
    public Task<MessageDto> SendMessageAsync(int matchId, string ein, string body)
        => SendAsync<MessageDto>(HttpMethod.Post, $"api/v1/matches/{matchId}/messages", ein, new SendMessageRequest { Body = body });

    // ---- orgs ----
    public async Task<(string Ein, string Name, string? City)?> GetOrgAsync(string ein)
    {
        using var resp = await _anonymous.GetAsync($"api/v1/orgs/{ein}");
        if (!resp.IsSuccessStatusCode) return null;
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        return (root.GetProperty("ein").GetString()!, root.GetProperty("name").GetString()!, root.GetProperty("address").GetProperty("city").GetString());
    }

    // ---- realtime ----
    /// <summary>The hub needs the cookie; with an EIN the connection lands in that org's group automatically.</summary>
    public async Task<HubConnection> CreateHubAsync(string? ein)
    {
        var (_, cookies) = await SessionAsync(ein ?? CliEin);
        return new HubConnectionBuilder()
            .WithUrl($"{BaseUrl}/hubs/exchange", o => o.Cookies = cookies)
            .WithAutomaticReconnect()
            .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
            .Build();
    }

    /// <summary>Reads need a signed-in person but no organization.</summary>
    private const string CliEin = "";

    private async Task<(HttpClient Http, CookieContainer Cookies)> SessionAsync(string ein)
    {
        if (_sessions.TryGetValue(ein, out var s)) return s;
        var cookies = new CookieContainer();
        var http = new HttpClient(new HttpClientHandler { CookieContainer = cookies }) { BaseAddress = _base };
        var email = ein.Length == 0 ? "cli@dev.local" : $"cli-{ein}@dev.local";
        using var resp = await http.PostAsJsonAsync("api/v1/auth/dev", new { email, name = "CLI", ein = ein.Length == 0 ? null : ein }, Json);
        if (!resp.IsSuccessStatusCode && ein.Length > 0)
        {
            // Unknown or non-501(c)(3) EIN: sign in without an org, so the API answers the real call with its own 403.
            using var fallback = await http.PostAsJsonAsync("api/v1/auth/dev", new { email, name = "CLI" }, Json);
            if (!fallback.IsSuccessStatusCode) throw new ApiException((int)fallback.StatusCode, "Dev sign-in failed. Run the API in Development.");
        }
        else if (!resp.IsSuccessStatusCode) throw new ApiException((int)resp.StatusCode, "Dev sign-in failed. Run the API in Development.");
        s = (http, cookies);
        _sessions[ein] = s;
        return s;
    }

    private async Task<T> SendAsync<T>(HttpMethod method, string path, string? ein, object? body)
    {
        var (http, _) = await SessionAsync(ein ?? CliEin);
        using var req = new HttpRequestMessage(method, path);
        if (body is not null) req.Content = JsonContent.Create(body, options: Json);
        using var resp = await http.SendAsync(req);
        var text = await resp.Content.ReadAsStringAsync();
        if (!resp.IsSuccessStatusCode)
        {
            string detail = text;
            try
            {
                using var doc = JsonDocument.Parse(text);
                if (doc.RootElement.TryGetProperty("title", out var t)) detail = t.GetString() ?? text;
            }
            catch (JsonException) { /* not JSON */ }
            throw new ApiException((int)resp.StatusCode, detail);
        }
        if (string.IsNullOrEmpty(text)) return default!;
        return JsonSerializer.Deserialize<T>(text, Json) ?? throw new ApiException(500, "Empty response");
    }
}

public sealed class ApiException : Exception
{
    public int StatusCode { get; }
    public ApiException(int status, string message) : base(message) => StatusCode = status;
}
