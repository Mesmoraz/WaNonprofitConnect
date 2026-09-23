# Helpbook alpha

Decided 2026-09-23 with Taylor. This is the scope, the stack, and the contract between the app and the backend for the first working release. Internal doc: the real name is fine here. The public roadmap still says Name TBD.

## Decisions

| Decision | What we chose | Why |
|---|---|---|
| Name | **Helpbook**, shown to invited organizations. Lives in one file, `app/brand.json`, so it can change in minutes. | Taylor: "let's do Helpbook but make it easy to change." |
| Prototype | **Skipped from here.** B6 to B9 are built in the real app, still briefed and approved screen by screen. `docs/helpbook-prototype.html` is frozen: bugs only. | Taylor wants a working alpha, not more mock-up. |
| App | React + TypeScript (Vite) in `app/`. MapLibre GL base map, deck.gl for pins and threads, supercluster for clusters. Installable web app (PWA). | One GPU renderer, so the map and the golden threads look the same on Android, iPhone, tablets and desktops. |
| Store apps | **Not in the alpha.** Capacitor wraps the same `app/` for iOS and Android in Beta. | No Apple developer account yet. The alpha is a link. |
| Hosting | One Azure App Service serves the API, the SignalR hub and the built app from the same origin, on its free `*.azurewebsites.net` address. Azure SQL (free offer) for the database. | No domain yet. Same origin means ordinary first-party cookies, which Safari and Chrome both keep. A domain is a DNS change later. |
| Sign in | Google sign-in. A development-only sign-in by email for local work. | Screen 1 is already approved as "Sign in with Google". Email links need a domain to send reliably; they come with the domain. |
| Trust | **Invite codes are tied to one organization.** Taylor makes the code for an org he recruited, so redeeming it confirms you. Anyone else can claim an org, and it waits for Taylor in the admin page. | The IRS list has no email domains, so a domain match can't confirm anyone yet. |
| Who | Nonprofits only. The other five kinds come in Beta. | Smallest loop that can make a real golden thread. |
| Cohort | **None lined up yet.** Recruiting runs alongside the build (see below). | The alpha only proves something if two organizations actually trade. |

## What's in

1. Sign in with Google, enter an invite code, land confirmed for your organization. Or find your organization and wait for approval.
2. Board: needs and offers, six kinds of help (Time, Skills, Things, Partnership, For schools, Jobs and mentoring), fair ranking (urgent first, then least seen, max 2 per org in the top 6).
3. A need or offer: who it's from, how it fits you, "I can help" or "I need this" starts a thread.
4. Post: kind of help first, then the rest (title, details, quantity, how soon, how often).
5. Thread: messages live over SignalR, Accept, Mark done. Done makes it golden.
6. Inbox: your threads, newest activity first.
7. Map: real base map of Washington, every IRS-listed nonprofit as a faint dot, member organizations as pins, clusters that split as you zoom, threads as curved strings in four states (suggested, proposed, in progress, golden), the dash drifting from giver to receiver, golden threads glowing, tap for details.
8. Admin page (Taylor only): make invite codes, approve or reject claims.
9. Works at phone, tablet and desktop widths. Installable to the home screen.

## What's out (Beta or later)

Businesses, schools, workforce programs, foundations, Just me. Grants. Together. Standing agreements and the monthly urgent cap. Alerts and email notices. Push notifications. Store apps. The story guide. A domain and email sign-in.

## Layout

```
app/                     React app (Vite). npm run dev proxies /api and /hubs to the API.
  brand.json             the name and short lines. The only place the name lives.
  src/styles/tokens.css  colors, spacing, type (carried from the prototype's :root)
  src/api/               typed client for the contract below
  src/map/               the map: MapLibre + deck.gl. Takes MapData, draws it. Knows nothing else.
  src/screens/           one folder per screen
src/WaNonprofitConnect.Api   serves /api/v1, /hubs/exchange, and the built app from wwwroot
```

`npm run build` in `app/` writes to `src/WaNonprofitConnect.Api/wwwroot` (git-ignored). Unknown non-API paths fall back to `index.html`.

## The contract

JSON, camelCase, enums as strings. Auth is a cookie set by the API. Every call that acts for an organization uses the signed-in person's confirmed membership. The `X-Org-Ein` header is gone.

```ts
type KindOfHelp = 'Time' | 'Skills' | 'Things' | 'Partnership' | 'ForSchools' | 'JobsAndMentoring';
type Urgency = 'Low' | 'Normal' | 'High' | 'Critical';           // shown as nothing, nothing, "This week", "Urgent"
type Cadence = 'OneTime' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Ongoing';
type ThreadStatus = 'Proposed' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled';

interface Me { account: { id: string; email: string; name: string; isAdmin: boolean };
               membership: { ein: string; orgName: string; status: 'confirmed' | 'pending' } | null }
interface OrgSummary { ein: string; name: string; city: string | null; zip5: string | null; ntee: string | null; lat: number | null; lon: number | null; isMember: boolean }
interface Listing { id: number; kind: 'Need' | 'Offer'; help: KindOfHelp; title: string; description: string | null;
                    quantity: number | null; unit: string | null; urgency: Urgency; cadence: Cadence; status: string;
                    org: OrgSummary; createdAt: string; views: number; why: string }   // why: one line, "Urgent" / "Near you" / "Seen least"
interface Thread { id: number; status: ThreadStatus; need: Listing; offer: Listing; startedByEin: string;
                   createdAt: string; respondedAt: string | null; completedAt: string | null; lastMessageAt: string | null; unread: number }
interface Message { id: number; threadId: number; senderEin: string; senderName: string; body: string; sentAt: string }
interface MapData { members: OrgSummary[];                                  // orgs with a confirmed member or a listing
                    threads: { id: number; status: ThreadStatus; help: KindOfHelp; fromEin: string; toEin: string; title: string }[];  // from = giver (offer side)
                    suggested: { needId: number; offerId: number; fromEin: string; toEin: string }[] }
```

| Method and path | Body | Returns |
|---|---|---|
| `POST /api/v1/auth/google` | `{ idToken }` | `Me` (sets cookie) |
| `POST /api/v1/auth/dev` (Development only) | `{ email, name }` | `Me` |
| `POST /api/v1/auth/signout` | | 204 |
| `GET /api/v1/me` | | `Me` or 401 |
| `POST /api/v1/invites/redeem` | `{ code }` | `Me` (membership confirmed) |
| `GET /api/v1/orgs?q=&limit=` | | `OrgSummary[]` (existing search, reshaped) |
| `POST /api/v1/claims` | `{ ein }` | `Me` (membership pending) |
| `GET /api/v1/board?help=&kind=&q=` | | `Listing[]`, fairly ranked; counts a view per listing returned in the top 12 |
| `GET /api/v1/listings/{id}` | | `Listing` plus `fits: Listing[]` (your listings that pair with it, best first) |
| `POST /api/v1/listings` | `{ kind, help, title, description?, quantity?, unit?, urgency, cadence }` | `Listing` |
| `POST /api/v1/listings/{id}/close` | | 204 |
| `GET /api/v1/threads` | | `Thread[]` for your org, newest activity first |
| `POST /api/v1/threads` | `{ listingId, myListingId?, message }` | `Thread`. With no `myListingId` the API creates the matching need or offer for you from the listing's kind of help, so "I can help" is one tap. |
| `GET /api/v1/threads/{id}` | | `Thread` plus `messages: Message[]` |
| `POST /api/v1/threads/{id}/messages` | `{ body }` | `Message` |
| `POST /api/v1/threads/{id}/accept`, `/decline`, `/complete`, `/cancel` | | `Thread` |
| `GET /api/v1/map` | | `MapData` |
| `GET /api/v1/map/points` | | `[ein, lat, lon][]` for every WA 501(c)(3) with a ZIP centroid. Cached a day. |
| `GET /api/v1/admin/claims` · `POST /api/v1/admin/claims/{id}/approve` · `/reject` | | admin only |
| `GET /api/v1/admin/invites` · `POST /api/v1/admin/invites` | `{ ein, uses }` | `{ code, ein, orgName, uses, used }` |

SignalR at `/hubs/exchange`, cookie-authenticated, joins the caller to their org's group. Events: `threadChanged(Thread)`, `messageAdded(Message)`, `listingAdded(Listing)`.

Locations: the IRS list has addresses but no coordinates. Every org is placed at its ZIP's centroid from the Census Bureau's 2020 ZCTA gazetteer, loaded into a `ZipCentroids` table. Street-level geocoding is Beta (S-49).

## Recruiting the cohort (runs alongside the build)

**Cohort (Taylor, 2026-09-23): urban Seattle only; Mario's contacts first. Mario's guide: `docs/ALPHA-RECRUITING.md`.** Aim for **8 to 12 organizations in two or three clusters** where trades are likely: for example, a food bank, a tool library and a tech-refurb nonprofit in the same city. A thread needs two sides.

1. Taylor picks the clusters and the first names. The idea-giver's contacts come first.
2. Claude drafts a short invite (what it is, what we ask of them: 20 minutes to post one need and one offer, a 15-minute call after two weeks). Taylor approves it and sends it himself.
3. Each yes gets an invite code tied to their EIN from the admin page.
4. What we watch in the alpha: needs and offers posted, threads started, threads accepted, golden threads, time to first message, and what they tell us.

## Schedule (Sep 23 to Sep 30)

| Day | Backend | App | Map |
|---|---|---|---|
| Wed 23 | Accounts, invites, claims, kind of help | Shell, tokens, front door on the approved copy | Standalone map on seed data |
| Thu 24 | Board ranking, threads API, ZIP centroids, map endpoints | Briefs for B6 to B8 approved; board | Clusters, four thread states, golden glow |
| Fri 25 | SignalR over cookies, admin endpoints | A need or offer; post | Wired to `/api/v1/map` |
| Sat 26 | Azure deploy (needs Taylor's subscription) | Thread and inbox, live | Tap for details, performance on a cheap Android |
| Sun 27 | Error logging, backups | Admin page, installable, empty states | |
| Mon 28 | Privacy and terms pages | Phone, tablet, desktop pass | |
| Tue 29 | Seed nothing fake: the board starts empty except for the cohort's own posts | Taylor's phone check, an iPhone, a desktop | |
| Wed 30 | **Alpha live. Invite codes go out as each organization says yes.** | | |
