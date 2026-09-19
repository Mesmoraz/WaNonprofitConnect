using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using WaNonprofitConnect.Data.Entities;
using WaNonprofitConnect.Data.Exchange;

namespace WaNonprofitConnect.Cli;

/// <summary>CLI front-end for the exchange API: post needs/offers, find matches, connect, message, watch live.</summary>
public static class ExchangeCommands
{
    public static readonly string[] Commands = { "listing", "match", "msg", "watch", "demo" };

    public static async Task<int> RunAsync(Args argv, string apiBase)
    {
        var api = new ExchangeClient(apiBase);
        try
        {
            return argv.Positional[0].ToLowerInvariant() switch
            {
                "listing" => await ListingAsync(argv, api),
                "match" => await MatchAsync(argv, api),
                "msg" => await MessageAsync(argv, api),
                "watch" => await WatchAsync(argv, api),
                "demo" => await DemoAsync(argv, api),
                _ => Usage(),
            };
        }
        catch (ApiException ex)
        {
            Console.Error.WriteLine($"API {ex.StatusCode}: {ex.Message}");
            return 1;
        }
        catch (HttpRequestException ex)
        {
            Console.Error.WriteLine($"Cannot reach the API at {api.BaseUrl} ({ex.Message}). Start it with:");
            Console.Error.WriteLine("  dotnet run --project src/WaNonprofitConnect.Api --launch-profile http");
            return 1;
        }
    }

    public static int Usage()
    {
        Console.WriteLine("""
            Exchange commands (talk to the running API; set --api or WANC_API, default http://localhost:5253)

              listing post --as <ein> --kind need|offer --category <cat> --title "..." [--desc "..."]
                           [--qty 40] [--unit sheets] [--urgency low|normal|high|critical] [--tags "a,b"] [--expires <days>]
              listing list [--kind need|offer] [--category <cat>] [--city SEATTLE] [--q "plywood"] [--org <ein>] [--status open|matched|fulfilled|closed]
              listing show <id>
              listing matches <id>            suggested counterparts with score + reasons
              listing close <id> --as <ein>
              match propose <needId> <offerId> --as <ein> [--note "..."]
              match accept|decline|complete|cancel <matchId> --as <ein>
              match inbox --as <ein>
              match show <matchId> --as <ein>
              msg send <matchId> --as <ein> "text"
              watch [--as <ein>]              live event feed (SignalR); --as also joins that org's private channel
              demo                            scripted end-to-end scenario with real WA 501(c)(3)s

            Categories: Materials, Equipment, Technology, Furniture, Food, Clothing, Vehicles, Services, Volunteers, Space, Funding, Other
            """);
        return 2;
    }

    // ---- listing ----------------------------------------------------------

    private static async Task<int> ListingAsync(Args a, ExchangeClient api)
    {
        switch (a.Sub(1))
        {
            case "post":
            {
                var ein = a.Require("--as");
                var req = new CreateListingRequest
                {
                    Kind = a.Enum<ListingKind>("--kind") ?? throw new ArgumentException("--kind need|offer is required"),
                    Category = a.Enum<ListingCategory>("--category") ?? throw new ArgumentException("--category is required"),
                    Title = a.Require("--title"),
                    Description = a.Value("--desc"),
                    Quantity = a.Decimal("--qty"),
                    Unit = a.Value("--unit"),
                    Urgency = a.Enum<Urgency>("--urgency") ?? Urgency.Normal,
                    Tags = a.Value("--tags"),
                    ExpiresInDays = a.Int("--expires"),
                };
                var l = await api.PostListingAsync(ein, req);
                Console.WriteLine($"Posted {Fmt(l)}");
                return 0;
            }
            case "list":
            {
                var page = await api.SearchListingsAsync(new ListingSearchRequest
                {
                    Kind = a.Enum<ListingKind>("--kind"),
                    Category = a.Enum<ListingCategory>("--category"),
                    Status = a.Has("--status") ? a.Enum<ListingStatus>("--status") : ListingStatus.Open,
                    City = a.Value("--city"),
                    Q = a.Value("--q"),
                    OrgEin = a.Value("--org"),
                    PageSize = a.Int("--take") ?? 50,
                });
                Console.WriteLine($"{page.Total} listing(s)");
                foreach (var l in page.Items) Console.WriteLine("  " + Fmt(l));
                return 0;
            }
            case "show":
            {
                var l = await api.GetListingAsync(a.IntArg(2));
                Console.WriteLine(Fmt(l));
                if (l.Description is not null) Console.WriteLine($"    {l.Description}");
                if (l.Tags is not null) Console.WriteLine($"    tags: {l.Tags}");
                return 0;
            }
            case "matches":
            {
                var id = a.IntArg(2);
                var source = await api.GetListingAsync(id);
                Console.WriteLine($"Matches for {Fmt(source)}");
                var suggestions = await api.SuggestAsync(id, a.Int("--take") ?? 10);
                if (suggestions.Count == 0) Console.WriteLine("  (none yet)");
                foreach (var s in suggestions)
                {
                    Console.WriteLine($"  score {s.Score,3}  {Fmt(s.Listing)}");
                    Console.WriteLine($"             because: {string.Join("; ", s.Reasons)}");
                }
                return 0;
            }
            case "close":
            {
                var l = await api.CloseListingAsync(a.IntArg(2), a.Require("--as"));
                Console.WriteLine($"Closed {Fmt(l)}");
                return 0;
            }
            default:
                return Usage();
        }
    }

    // ---- match ------------------------------------------------------------

    private static async Task<int> MatchAsync(Args a, ExchangeClient api)
    {
        switch (a.Sub(1))
        {
            case "propose":
            {
                var m = await api.ProposeAsync(a.Require("--as"), new ProposeMatchRequest
                {
                    NeedListingId = a.IntArg(2), OfferListingId = a.IntArg(3), Note = a.Value("--note"),
                });
                Console.WriteLine($"Proposed match #{m.Id} — waiting for {(m.ProposedBy.Ein == m.Need.Org.Ein ? m.Offer.Org.Name : m.Need.Org.Name)} to respond");
                Print(m);
                return 0;
            }
            case "accept": case "decline": case "complete": case "cancel":
            {
                var m = await api.MatchActionAsync(a.IntArg(2), a.Require("--as"), a.Sub(1)!);
                Console.WriteLine($"Match #{m.Id} is now {m.Status}");
                Print(m);
                return 0;
            }
            case "inbox":
            {
                var ein = a.Require("--as");
                var inbox = await api.InboxAsync(ein);
                Console.WriteLine($"{inbox.Count} match(es) for {ein}");
                foreach (var m in inbox)
                {
                    var other = m.Need.Org.Ein == NormalizeEin(ein) ? m.Offer.Org : m.Need.Org;
                    var waitingOnMe = m.Status == MatchStatus.Proposed && m.ProposedBy.Ein != NormalizeEin(ein);
                    Console.WriteLine($"  #{m.Id,-4} {m.Status,-9} with {other.Name} ({other.City}) — need: \"{m.Need.Title}\" / offer: \"{m.Offer.Title}\"  {m.Messages.Count} msg{(waitingOnMe ? "  <-- awaiting your response" : "")}");
                }
                return 0;
            }
            case "show":
            {
                Print(await api.GetMatchAsync(a.IntArg(2), a.Require("--as")));
                return 0;
            }
            default:
                return Usage();
        }
    }

    // ---- msg --------------------------------------------------------------

    private static async Task<int> MessageAsync(Args a, ExchangeClient api)
    {
        if (a.Sub(1) != "send") return Usage();
        var body = a.Positional.Count > 3 ? string.Join(' ', a.Positional.Skip(3)) : throw new ArgumentException("message text is required");
        var m = await api.SendMessageAsync(a.IntArg(2), a.Require("--as"), body);
        Console.WriteLine($"[{m.SentAt:HH:mm:ss}] {m.Sender.Name}: {m.Body}");
        return 0;
    }

    // ---- watch ------------------------------------------------------------

    private static async Task<int> WatchAsync(Args a, ExchangeClient api)
    {
        var hub = api.CreateHub();
        hub.On<JsonElement>(ExchangeHubNames.EventName, evt => Console.WriteLine(FormatEvent(evt)));
        hub.Reconnected += _ => { Console.WriteLine("  (reconnected)"); return Task.CompletedTask; };
        hub.Closed += ex => { Console.WriteLine($"  (connection closed{(ex is null ? "" : ": " + ex.Message)})"); return Task.CompletedTask; };

        await hub.StartAsync();
        Console.WriteLine($"Watching {api.BaseUrl}/hubs/exchange — Ctrl+C to stop");
        if (a.Value("--as") is { } ein)
        {
            await hub.InvokeAsync("JoinOrg", ein);
            Console.WriteLine($"Joined private channel for org {NormalizeEin(ein)} (match + message events)");
        }

        var stop = new TaskCompletionSource();
        Console.CancelKeyPress += (_, e) => { e.Cancel = true; stop.TrySetResult(); };
        await stop.Task;
        await hub.StopAsync();
        return 0;
    }

    private static string FormatEvent(JsonElement evt)
    {
        var type = evt.GetProperty("type").GetString() ?? "?";
        var at = evt.GetProperty("at").GetDateTime().ToLocalTime().ToString("HH:mm:ss");
        var p = evt.GetProperty("payload");
        try
        {
            switch (type)
            {
                case "listing.created":
                {
                    var l = p.Deserialize<ListingDto>(ExchangeClient.Json)!;
                    return $"[{at}] NEW {l.Kind.ToString().ToUpperInvariant(),-5} {Fmt(l)}";
                }
                case "listing.updated":
                {
                    var l = p.Deserialize<ListingDto>(ExchangeClient.Json)!;
                    return $"[{at}] NOW {l.Status.ToString().ToUpperInvariant(),-9} {Fmt(l)}";
                }
                case var t when t.StartsWith("match."):
                {
                    var m = p.Deserialize<MatchDto>(ExchangeClient.Json)!;
                    return $"[{at}] MATCH #{m.Id} {t[6..].ToUpperInvariant()} — {m.Need.Org.Name} needs \"{m.Need.Title}\" ↔ {m.Offer.Org.Name} offers \"{m.Offer.Title}\" (by {m.ProposedBy.Name})";
                }
                case "message.sent":
                {
                    var msg = p.GetProperty("message").Deserialize<MessageDto>(ExchangeClient.Json)!;
                    return $"[{at}] MSG on match #{msg.MatchId} — {msg.Sender.Name}: {msg.Body}";
                }
            }
        }
        catch (JsonException) { /* fall through to raw */ }
        return $"[{at}] {type} {p.GetRawText()}";
    }

    // ---- demo -------------------------------------------------------------

    private static async Task<int> DemoAsync(Args a, ExchangeClient api)
    {
        // Real WA 501(c)(3)s from the IRS BMF. The listings are invented for the demo.
        const string Habitat = "581735531";     // TACOMA-PIERCE HABITAT FOR HUMANITY, TACOMA
        const string Rebuild = "911606330";     // REBUILDING TOGETHER SEATTLE, TUKWILA
        const string ToolLib = "465378620";     // SOUTHEAST SEATTLE TOOL LIBRARY, SEATTLE
        const string C4P = "822888626";         // COMPUTERS 4 PEOPLE IN NEED, BELLINGHAM
        const string Ballard = "911428805";     // BALLARD FOOD BANK, SEATTLE

        var orgs = new Dictionary<string, string>();
        foreach (var ein in new[] { Habitat, Rebuild, ToolLib, C4P, Ballard })
        {
            var o = await api.GetOrgAsync(ein) ?? throw new InvalidOperationException($"Org {ein} not in DB — run `import bmf` first.");
            orgs[ein] = $"{Title(o.Name)} ({Title(o.City ?? "?")})";
        }

        Step(1, "Organizations post what they have and what they need");
        var offerPly = await Post(api, orgs, Habitat, ListingKind.Offer, ListingCategory.Materials, "40 sheets of 3/4\" plywood left over from a build",
            "Full sheets, dry, stored indoors. Pickup in Tacoma weekdays.", 40, "sheets", Urgency.Normal, "plywood,lumber,building materials");
        var needPly = await Post(api, orgs, Rebuild, ListingKind.Need, ListingCategory.Materials, "Plywood for wheelchair ramps",
            "Building 6 accessibility ramps for seniors this month; need ~25 sheets 3/4\" exterior plywood.", 25, "sheets", Urgency.High, "plywood,ramps,accessibility");
        var needBench = await Post(api, orgs, ToolLib, ListingKind.Need, ListingCategory.Materials, "Lumber and plywood for workshop benches",
            null, 10, "sheets", Urgency.Normal, "plywood,lumber,workbench");
        var offerLaptops = await Post(api, orgs, C4P, ListingKind.Offer, ListingCategory.Technology, "15 refurbished laptops (Win 11, 8 GB)",
            "Wiped and reimaged. Can ship anywhere in WA.", 15, "laptops", Urgency.Normal, "laptops,computers");
        var needLaptops = await Post(api, orgs, Ballard, ListingKind.Need, ListingCategory.Technology, "Laptops for client intake stations",
            "Our intake computers died; need 12 laptops so clients can register for services.", 12, "laptops", Urgency.Critical, "laptops,computers,intake");
        var needCooler = await Post(api, orgs, Ballard, ListingKind.Need, ListingCategory.Equipment, "Walk-in cooler or commercial refrigerator",
            "For fresh produce storage.", 1, "unit", Urgency.High, "refrigerator,cooler,cold storage");

        Step(2, $"The system suggests matches for {orgs[Rebuild]}'s plywood need");
        await ShowMatches(api, needPly.Id);

        Step(3, $"...and for {orgs[Habitat]}'s plywood offer (two orgs want it)");
        await ShowMatches(api, offerPly.Id);

        Step(4, $"{orgs[Ballard]}'s cooler need has no counterpart yet");
        await ShowMatches(api, needCooler.Id);

        Step(5, $"{orgs[Rebuild]} proposes a connection with {orgs[Habitat]}");
        var m1 = await api.ProposeAsync(Rebuild, new ProposeMatchRequest { NeedListingId = needPly.Id, OfferListingId = offerPly.Id, Note = "We can pick up in Tacoma this Thursday with our truck." });
        Console.WriteLine($"  match #{m1.Id} {m1.Status} (score {m1.Score}) — note: {m1.Note}");

        Step(6, $"{orgs[Habitat]} sees it in their inbox and accepts");
        await Inbox(api, orgs, Habitat);
        m1 = await api.MatchActionAsync(m1.Id, Habitat, "accept");
        Console.WriteLine($"  match #{m1.Id} → {m1.Status}; both listings are now Matched");

        Step(7, "They coordinate the hand-off in the match thread");
        await Say(api, m1.Id, Habitat, "Thursday works. Loading dock on S 56th St, ask for Maria.");
        await Say(api, m1.Id, Rebuild, "Perfect — we'll be there around 10am. Thank you!");

        Step(8, "Hand-off done: either side marks it complete → listings become Fulfilled");
        m1 = await api.MatchActionAsync(m1.Id, Rebuild, "complete");
        Console.WriteLine($"  match #{m1.Id} → {m1.Status}");
        Console.WriteLine($"  need #{needPly.Id} is now {(await api.GetListingAsync(needPly.Id)).Status}, offer #{offerPly.Id} is now {(await api.GetListingAsync(offerPly.Id)).Status}");

        Step(9, $"The Tool Library's plywood need no longer matches (offer is fulfilled)");
        await ShowMatches(api, needBench.Id);

        Step(10, $"Meanwhile {orgs[C4P]} spots the critical laptop need and proposes");
        var m2 = await api.ProposeAsync(C4P, new ProposeMatchRequest { NeedListingId = needLaptops.Id, OfferListingId = offerLaptops.Id, Note = "We can send 12 of the 15 this week." });
        Console.WriteLine($"  match #{m2.Id} {m2.Status} (score {m2.Score})");
        m2 = await api.MatchActionAsync(m2.Id, Ballard, "accept");
        await Say(api, m2.Id, Ballard, "Yes please! Ship to 7001 24th Ave NW, Seattle 98117.");

        Step(11, "The rules hold");
        Console.WriteLine("  a third org cannot read a private thread:");
        await Expect(() => api.GetMatchAsync(m2.Id, ToolLib), 403);
        Console.WriteLine("  a listing that is already Matched cannot be matched again:");
        await Expect(() => api.ProposeAsync(ToolLib, new ProposeMatchRequest { NeedListingId = needBench.Id, OfferListingId = offerLaptops.Id }), 409);
        Console.WriteLine("  the proposer cannot accept its own proposal (the other side must):");
        var offerFridge = await Post(api, orgs, ToolLib, ListingKind.Offer, ListingCategory.Equipment, "Used 2-door commercial refrigerator",
            "Works, needs a new gasket.", 1, "unit", Urgency.Normal, "refrigerator,cooler");
        var m3 = await api.ProposeAsync(ToolLib, new ProposeMatchRequest { NeedListingId = needCooler.Id, OfferListingId = offerFridge.Id });
        await Expect(() => api.MatchActionAsync(m3.Id, ToolLib, "accept"), 403);
        Console.WriteLine("  an org that is not a 501(c)(3) cannot post at all:");
        await Expect(() => api.PostListingAsync("910000000", new CreateListingRequest { Kind = ListingKind.Need, Category = ListingCategory.Other, Title = "x" }), 403);

        Step(12, "Open board right now");
        var open = await api.SearchListingsAsync(new ListingSearchRequest { PageSize = 50 });
        foreach (var l in open.Items) Console.WriteLine("  " + Fmt(l));

        Console.WriteLine();
        Console.WriteLine("Tip: run `watch` in a second terminal and re-run `demo` to see every step arrive in real time.");
        return 0;
    }

    private static async Task<ListingDto> Post(ExchangeClient api, Dictionary<string, string> orgs, string ein, ListingKind kind, ListingCategory cat,
        string title, string? desc, decimal qty, string unit, Urgency urgency, string tags)
    {
        var l = await api.PostListingAsync(ein, new CreateListingRequest
        {
            Kind = kind, Category = cat, Title = title, Description = desc, Quantity = qty, Unit = unit, Urgency = urgency, Tags = tags, ExpiresInDays = 60,
        });
        Console.WriteLine($"  {orgs[ein]}");
        Console.WriteLine($"      {kind.ToString().ToUpperInvariant(),-5} #{l.Id}: {title}  [{cat}, {urgency}, {qty:0.##} {unit}]");
        return l;
    }

    private static async Task ShowMatches(ExchangeClient api, int listingId)
    {
        var s = await api.SuggestAsync(listingId);
        if (s.Count == 0) { Console.WriteLine("  (no matches)"); return; }
        foreach (var m in s)
        {
            Console.WriteLine($"  score {m.Score,3}  {Fmt(m.Listing)}");
            Console.WriteLine($"             {string.Join("; ", m.Reasons)}");
        }
    }

    private static async Task Inbox(ExchangeClient api, Dictionary<string, string> orgs, string ein)
    {
        foreach (var m in await api.InboxAsync(ein))
            Console.WriteLine($"  inbox: #{m.Id} {m.Status} from {m.ProposedBy.Name} — \"{m.Need.Title}\" ↔ \"{m.Offer.Title}\"");
    }

    private static async Task Say(ExchangeClient api, int matchId, string ein, string text)
    {
        var m = await api.SendMessageAsync(matchId, ein, text);
        Console.WriteLine($"  {Title(m.Sender.Name)}: {m.Body}");
    }

    private static async Task Expect(Func<Task> action, int status)
    {
        try { await action(); Console.WriteLine($"  UNEXPECTED: call succeeded (expected {status})"); }
        catch (ApiException ex) when (ex.StatusCode == status) { Console.WriteLine($"  {status} as expected: {ex.Message}"); }
    }

    private static void Step(int n, string text)
    {
        Console.WriteLine();
        Console.WriteLine($"── {n}. {text}");
    }

    // ---- formatting -------------------------------------------------------

    private static string Fmt(ListingDto l)
    {
        var qty = l.Quantity is { } q ? $" {q:0.##} {l.Unit}".TrimEnd() : "";
        return $"#{l.Id} {l.Kind.ToString().ToUpperInvariant(),-5} [{l.Category}/{l.Urgency}/{l.Status}] \"{l.Title}\"{qty} — {Title(l.Org.Name)}, {Title(l.Org.City ?? "?")}";
    }

    private static void Print(MatchDto m)
    {
        Console.WriteLine($"  need : {Fmt(m.Need)}");
        Console.WriteLine($"  offer: {Fmt(m.Offer)}");
        Console.WriteLine($"  proposed by {Title(m.ProposedBy.Name)} at {m.CreatedAt.ToLocalTime():g}; status {m.Status}{(m.Score is { } s ? $", score {s}" : "")}");
        if (m.Note is not null) Console.WriteLine($"  note: {m.Note}");
        foreach (var msg in m.Messages) Console.WriteLine($"    [{msg.SentAt.ToLocalTime():HH:mm}] {Title(msg.Sender.Name)}: {msg.Body}");
    }

    private static string Title(string s) => System.Globalization.CultureInfo.InvariantCulture.TextInfo.ToTitleCase(s.ToLowerInvariant());

    private static string? NormalizeEin(string? s) => Data.Import.BmfRowParser.NormalizeEin(s);
}

/// <summary>Mirror of the hub's event name so the CLI doesn't reference the Api project.</summary>
internal static class ExchangeHubNames
{
    public const string EventName = "exchange";
}
