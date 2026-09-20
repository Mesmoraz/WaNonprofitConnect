# Continuation brief — "Name TBD" (working title; formerly HelpBook)

Paste this into a new conversation to pick up where we left off. Last updated 2026-09-20.

## What this is

A platform where Washington's 501(c)(3)s say what they **need** and what they **have**, get matched, connect, message, and hand off — plus businesses and community members who give. Public IRS data (35,361 WA 501c3s) is the org directory; nobody has to self-register to be found.

Two artifacts exist, and both are deployed:

| Thing | Where | Notes |
|---|---|---|
| **Backend prototype** (.NET 8 API + CLI) | `C:\Projects\WaNonprofitConnect` (private, local git only) | Real IRS data loaded into SQL Server LocalDB; needs/offers exchange with scored matching, propose/accept/complete, private messaging, SignalR real-time; CLI `demo` and `watch`. 57 xUnit tests. |
| **Clickable prototype + design brief** (static HTML) | `docs/helpbook-prototype.html`, `docs/helpbook-step2-design.html` in the same repo; published via `scripts/build-site.js` → `C:\Projects\helpbook-site` (public repo `Mesmoraz/helpbook-site`) → **https://mesmoraz.github.io/helpbook-site/** | Also mirrored as private claude.ai artifacts (prototype `14WxTqjyxp8hBrgXqyELN9`, design `Tev9dE62ksqfMLQLrqqXTv`). |

The person who gave Taylor the idea is the audience for the public site. Keep it phone-first.

## How to work on it

```powershell
# backend
cd C:\Projects\WaNonprofitConnect
dotnet build WaNonprofitConnect.sln; dotnet test tests/WaNonprofitConnect.Tests/WaNonprofitConnect.Tests.csproj
dotnet run --project src/WaNonprofitConnect.Api --launch-profile http     # http://localhost:5253, Swagger at /swagger
dotnet run --project src/WaNonprofitConnect.Cli -- demo                     # end-to-end story via the API
dotnet run --project src/WaNonprofitConnect.Cli -- watch --as 581735531     # live SignalR feed

# static prototype: edit docs/*.html, then
node scripts/test-prototype.js          # 18 headless checks (story via Play and by hand)
node scripts/build-site.js              # wraps pages as full HTML docs into ../helpbook-site
cd ..\helpbook-site; git add -A; git commit -m "..."; git push    # GitHub Pages rebuilds in ~20 s
```

Machine notes (this box, user Taylor): .NET 8 SDK, SQL Server 2022 LocalDB, GitHub CLI (logged in as **Mesmoraz**, `gh auth setup-git` done) were installed 2026-09-19/20. In Claude's Bash tool, prefix with `export PATH="/c/Program Files/dotnet:/c/Program Files/GitHub CLI:$PATH"`. If LocalDB "cannot create file … already exists": re-attach the .mdf (README has the command). Git identity for commits: Taylor Philpott <taylor.philpott@gmail.com>, add `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

Editing gotcha: the prototype HTML contains literal non-ASCII characters (·, →, ↻, ’). When patching it with a Node script written via the Write tool, `\u00b7`-style escapes get decoded/mangled; every patch script so far included a `U()` normalizer (decode `\uXXXX`, strip a stray backslash before non-ASCII) applied to both search and replacement strings. Bash heredocs containing apostrophes also fail in this harness — write scripts to files instead. Verify visually with the browser pane at the mobile preset (`localhost:8765` via `npx serve` on the site folder); synthetic `.click()` passes where real taps can fail (see pointer-capture bug below).

## Product decisions made (see design.html for the full brief)

- **Accounts**: Nonprofit (free, must claim an IRS-listed org; verification methods pluggable: email-domain instant, mailed code, document, member invite, admin), Business (paid subscription, WA UBI lookup, allow-listed sponsored placements only), Supporter (pay-what-you-want or proof of a donation), Admin. Roles attach to memberships, not people. Unverified users browse/draft only.
- **No money moves through the app** (RCW 19.09 commercial-fundraiser exposure). Cash giving links out.
- **Priority** P0 can't operate · P1 this week · P2 this month · P3 whenever; **P0 capped at 2 per org per rolling 30 days**.
- **Cadence** One-time / Weekly / Monthly / Quarterly / Ongoing; accepting a recurring pair creates a **standing agreement** (log deliveries, next date, end it).
- **Equitable exposure**: board ranks by priority band then fewest views; max 2 listings per org in the top 6; slot 3 reserved for the least-seen; every card says why; alerts are rule-driven (tags/category/area), never popularity; placement can't be bought.
- **Map** ("golden thread"): full-screen, pinch/scroll/drag/double-tap, 1–40×, ZIP-centroid placement, zoom-dependent clustering with heat glow (tap cluster → animated zoom), curved string threads whose dash drifts giver→receiver (gold completed · green in progress · amber dashed proposed · grey dotted suggested), filters shared with the Board (kind, who, category, distance; thread statuses), connections list, degree-scaled hover, edge-aware/abbreviated labels with collision avoidance.
- **Data freshness**: IRS files monthly (BMF, Pub 78, revocation, 990-N); scheduled import upserts by EIN and never overwrites what members typed; WA SOS registry only via public-records request. Every screen states the file date (2026-09-08).
- Naming: "HelpBook" was rejected; use **Name TBD** everywhere until chosen.

## Prototype internals (docs/helpbook-prototype.html)

Single-file vanilla JS. `S` = state (persisted to localStorage key `helpbook-proto`; boot migrates old shapes and self-heals). `STEPS[0..7]` = the story with `enter()`, `auto()`, `done()`; the guide advances on Play and on manual completion (`syncStep`). `ORGS` = 32 real WA 501c3s (EIN, city, ZIP, cause, revenue, tags) + 3 example businesses + 1 community member. Matching in `score()` mirrors the backend `MatchScorer` (+50 category, +25/+10 keywords, +20 city/+10 area, urgency, quantity, recency). Map: `renderMap()` (clustering, threads, labels), `fitView/zoomAt/clampView/animateView`, gesture handlers at the bottom (no pointer capture — it retargets clicks to the SVG and broke real taps). `mapUpp` = map units per CSS px, measured after render; `MAP_H` follows the container's aspect.

## Backend internals (short)

`src/WaNonprofitConnect.Data` (entities, EF Core + migrations `InitialCreate`, `AddExchange`; `Import/BmfImporter` download→SHA-256→batched upsert; `Exchange/ExchangeService` + `MatchScorer` + shared DTOs; `Queries/`), `Api` (controllers under `/api/v1`, `X-Org-Ein` acting-org header until identity exists, `Realtime/ExchangeHub` at `/hubs/exchange`), `Cli` (import/stats direct to DB; listing/match/msg/watch/demo over HTTP). Demo EINs: Ballard Food Bank 911428805, Computers 4 People 822888626, Tacoma-Pierce Habitat 581735531, Rebuilding Together Seattle 911606330, SE Seattle Tool Library 465378620.

## Backlog / next candidates

1. Backend phase 2a–2b: ASP.NET Identity + org claiming (replace `X-Org-Ein`), Pub 78 + revocation → `IsActive`, admin queue.
2. Bring prototype features to the backend: cadence/agreements, P-levels + cap, fair ranking, org capability tags, alerts.
3. Real base map (Leaflet + OpenStreetMap) and street-level geocoding of IRS addresses.
4. Business/supporter sign-up flows in the prototype (currently the role picker explains they're not built).
5. Decide the name; decide web framework (Blazor vs React) after wireframe sign-off.
