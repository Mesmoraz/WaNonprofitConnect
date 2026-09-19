using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using WaNonprofitConnect.Data.Exchange;
using WaNonprofitConnect.Data.Queries;

namespace WaNonprofitConnect.Cli;

/// <summary>
/// Thin typed client over the exchange API. This is exactly what a mobile/desktop app would use —
/// the DTOs come from the shared Data assembly, so a .NET MAUI client can reuse this file as-is.
/// </summary>
public sealed class ExchangeClient
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly HttpClient _http;

    public ExchangeClient(string baseUrl)
    {
        _http = new HttpClient { BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/") };
    }

    public string BaseUrl => _http.BaseAddress!.ToString().TrimEnd('/');

    // ---- listings ----
    public Task<ListingDto> PostListingAsync(string ein, CreateListingRequest req)
        => SendAsync<ListingDto>(HttpMethod.Post, "api/v1/listings", ein, req);

    public Task<PagedResult<ListingDto>> SearchListingsAsync(ListingSearchRequest req)
    {
        var qs = new List<string>();
        void Add(string k, object? v) { if (v is not null) qs.Add($"{k}={Uri.EscapeDataString(v.ToString()!)}"); }
        Add("kind", req.Kind); Add("category", req.Category); Add("status", req.Status); Add("city", req.City);
        Add("orgEin", req.OrgEin); Add("q", req.Q); Add("page", req.Page); Add("pageSize", req.PageSize);
        return SendAsync<PagedResult<ListingDto>>(HttpMethod.Get, "api/v1/listings?" + string.Join('&', qs), null, null);
    }

    public Task<ListingDto> GetListingAsync(int id) => SendAsync<ListingDto>(HttpMethod.Get, $"api/v1/listings/{id}", null, null);
    public Task<IReadOnlyList<MatchSuggestionDto>> SuggestAsync(int id, int take = 10)
        => SendAsync<IReadOnlyList<MatchSuggestionDto>>(HttpMethod.Get, $"api/v1/listings/{id}/matches?take={take}", null, null);
    public Task<ListingDto> CloseListingAsync(int id, string ein) => SendAsync<ListingDto>(HttpMethod.Post, $"api/v1/listings/{id}/close", ein, null);

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
        using var resp = await _http.GetAsync($"api/v1/orgs/{ein}");
        if (!resp.IsSuccessStatusCode) return null;
        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;
        return (root.GetProperty("ein").GetString()!, root.GetProperty("name").GetString()!, root.GetProperty("address").GetProperty("city").GetString());
    }

    // ---- realtime ----
    public HubConnection CreateHub() => new HubConnectionBuilder()
        .WithUrl($"{BaseUrl}/hubs/exchange")
        .WithAutomaticReconnect()
        .AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
        .Build();

    private async Task<T> SendAsync<T>(HttpMethod method, string path, string? ein, object? body)
    {
        using var req = new HttpRequestMessage(method, path);
        if (ein is not null) req.Headers.Add("X-Org-Ein", ein);
        if (body is not null) req.Content = JsonContent.Create(body, options: Json);
        using var resp = await _http.SendAsync(req);
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
        return JsonSerializer.Deserialize<T>(text, Json) ?? throw new ApiException(500, "Empty response");
    }
}

public sealed class ApiException : Exception
{
    public int StatusCode { get; }
    public ApiException(int status, string message) : base(message) => StatusCode = status;
}
