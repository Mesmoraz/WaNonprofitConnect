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
| Cohort | **Urban Seattle, Mario's contacts first.** Recruiting runs alongside the build (see below). | The alpha only proves something if two organizations actually trade. |

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

Businesses, schools, workforce programs, foundations, Just me. Grants. Together. Standing agreements. (The Urgent cap of 2 a month is in, per the approved B7 brief.) Alerts and email notices. Push notifications. Store apps. The story guide. A domain and email sign-in.

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
                    suggested: { needId: number; offerId: number; fromEin: string; toEin: string }[];
                    open: { ein: string; needs: number; offers: number }[] }   // open posts per org: its pin's ring (S-129)
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
| `PUT /api/v1/listings/{id}` | `{ help, title, description?, quantity?, unit?, urgency, cadence }` (no `kind`: a need stays a need) | `Listing` (S-97). Not yours `403`; closed or done `409` |
| `POST /api/v1/listings/{id}/close` | | 204 |
| `GET /api/v1/threads` | | `Thread[]` for your org, newest activity first |
| `POST /api/v1/threads` | `{ listingId, myListingId?, message }` | `Thread`. With no `myListingId` the API creates the matching need or offer for you from the listing's kind of help, so "I can help" is one tap. |
| `GET /api/v1/threads/{id}` | | `Thread` plus `messages: Message[]` |
| `POST /api/v1/threads/{id}/messages` | `{ body }` | `Message` |
| `POST /api/v1/threads/{id}/accept`, `/decline`, `/complete`, `/cancel` | | `Thread` |
| `GET /api/v1/map` | | `MapData` |
| `GET /api/v1/map/open` | | `Listing[]`: every open need and offer, each with its organization's place, newest first, up to 500 (S-131). Signed in. |
| `GET /api/v1/map/fits?for=needs\|offers` | | `{ myId, myTitle, post: Listing }[]`: other organizations' open posts that fit one of yours, best first, up to 12 (S-130). Confirmed members only. |
| `GET /api/v1/map/points` | | `[ein, lat, lon][]` for every WA 501(c)(3) with a ZIP centroid. Cached a day. |
| `GET /api/v1/admin/claims` · `POST /api/v1/admin/claims/{id}/approve` · `/reject` | | admin only |
| `GET /api/v1/admin/invites` · `POST /api/v1/admin/invites` | `{ ein, uses }` | `{ code, ein, orgName, uses, used }` |
| `GET /api/v1/org` · `PUT /api/v1/org` | `{ about, website, contactAccountId }` | `MyOrg` (S-99). Confirmed members only. |
| `POST /api/v1/org/invites` | | `201` with `{ code, ein, orgName, uses: 1, used: 0 }` (S-95). Confirmed members only. |

SignalR at `/hubs/exchange`, cookie-authenticated, joins the caller to their org's group. Events: `threadChanged(Thread)`, `messageAdded(Message)`, `listingAdded(Listing)`.

Locations: the IRS list has addresses but no coordinates. Every org is placed at its ZIP's centroid from the Census Bureau's 2020 ZCTA gazetteer, loaded into a `ZipCentroids` table. Street-level positions come from the geocoded IRS addresses (S-49).

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

## Backend notes

Added by the backend lane on Sep 23 (S-68, S-71, S-72, S-74, serving). The contract above holds; these are the places the API adds to it or pins down something it left open.

**Additions**

- `Me.membership.urgentLeft: number` (0 to 2). Approved by Taylor (B7). An organization can post 2 urgent (Critical) needs in any rolling 30 days, closed or done ones included. The next one gets `409` with the title "Urgent is 2 a month. Pick This week instead." Each counts from when the need became urgent, by posting or by an edit (S-97); editing an urgent need keeps its place, and editing one back down doesn't give it back. `Me.membership.urgentAgainOn: string | null` is when one comes back, only when none are left (S-109).
- `POST /api/v1/auth/dev` also takes an optional `ein` (Development only). It confirms you for that organization straight away, with no invite. It's for local work and the CLI demo.
- `GET /api/v1/listings/{id}` also returns `myThreadId: number` when you already have a live thread on that post (for B6's "Open your thread"). The field is left out when there isn't one. On your own post, `fits` lists other organizations' posts that could fit (B6's "Could fit"), and `openThreads: number` counts its threads still going (S-97). Every `Listing` has `editedAt: string | null`, when its poster last changed it.
- `GET /api/v1/admin/claims` returns `{ id, ein, orgName, city, accountId, email, name, status, createdAt, decidedAt }[]`, pending ones only, oldest first. `?all=true` includes decided ones. Approve and reject return the same shape. `status` is lower case.
- The old `/api/v1/matches` routes and `GET /api/v1/listings` (the paged search) are still there for the CLI. They use the same records as `/threads`. The old paged org search moved to `GET /api/v1/orgs/search`.

**Pinned down**

- Status codes: `POST /listings`, `POST /threads` and `POST /threads/{id}/messages` return `201` with the body. `POST /listings/{id}/close` returns `204`. Every error is a problem document, and its `title` is the plain sentence to show. Without the cookie you get `401` (never a redirect). Without a confirmed membership, anything that acts for an organization gets `403`.
- Nulls are written as `null`, not left out. Only `fits`, `myThreadId`, `openThreads` and `messages` are left out where they don't apply.
- Who can read: the board, a post, threads and `/map` need you to be signed in. The board, a post and the map work before you're confirmed (`fits` is then empty). `/orgs` and `/map/points` are public. `/orgs` only searches Washington 501(c)(3)s, needs `q`, and takes `limit` up to 50.
- `why`: "Urgent" (Critical), "This week" (High), otherwise "New" (under 7 days old), otherwise "Seen least". The same rule applies to posts inside threads.
- Board: up to 200 open, unexpired posts. Views are counted for the top 12, but never for your own posts. `help`, `kind` and `q` filter the list, and the filters combine.
- `Message.senderName` is the person's name from their account ("Casey"). Messages from before accounts show the organization's name.
- "How soon" applies to needs only. An offer sent with an urgency is saved as Normal.
- Starting a thread with no `myListingId` needs a `message`. It makes your matching post from the other one's title, kind of help, quantity, unit and how often, with your message as the details. That post is a normal open post: it shows on the board and sends `listingAdded`.
- Starting a thread with no `myListingId` when you already have a live (proposed or accepted) thread on that post returns that thread with `200` instead of `201`, with your message added to it. No second thread, no duplicate post.
- `MapData.threads[].help` and `.title` come from the need. `members` also includes any organization in a thread.
- SignalR: you join `org-{ein}` when you connect. After redeeming an invite or getting approved, reconnect to receive `threadChanged` and `messageAdded`. `threadChanged` carries that organization's own `unread`. A new message sends `messageAdded`, then `threadChanged`.
- Unknown paths fall back to `index.html`, except `/api`, `/hubs` and `/swagger`, which 404. The app is served from `wwwroot` next to the published binaries, or the project's `wwwroot` in dev.

**Your organization (S-99, Oct 10)**

- `GET /api/v1/org` returns `{ org: OrgSummary, about, website, contactAccountId, people: { accountId, name, email, isYou }[], placesLeft }` for your own organization. `PUT` takes `{ about, website, contactAccountId }`, saves all three (empty or null clears one), and returns the same shape. Confirmed members only: `403` otherwise. `placesLeft` is `0` until S-95.
- `about` is trimmed, 140 characters at most. `website` is trimmed; a bare host gets `https://`, and anything that isn't `http` or `https` is `400` "Enter a website like yourorganization.org." `contactAccountId` must be a confirmed member of the same organization, or `400`. If that person's account goes, it clears.
- `GET /orgs/{ein}/page` also returns `about`, `website` and `askFor` (the contact's first name, never an email), each `null` when not filled in.
- Stored in its own `OrgProfiles` table (migration `AddOrgProfile`), so the monthly IRS import never touches it.

**Invite someone (S-95, Oct 16)**

- `POST /api/v1/org/invites` makes a one-use code for your own organization. `409` "All 3 places are taken." once it's full. `403` without a confirmed membership.
- An organization has 3 places, the first person included (Taylor, Oct 16). `placesLeft` in `GET /org` is 3, less the people here and the unused codes members have made. Memberships from "Test as this organization" (`ADMIN`) and the development sign-in (`DEV`) don't take a place, and the `ADMIN` ones aren't in `people` either. Codes made on Admin don't hold a place, so they can go past 3.
- Two people asking for the last place at once: each adds its code, then counts again, and the later one backs out with `409`. New column `Invites.ByMember` (migration `AddInviteByMember`).

**Security hardening (S-114, Oct 2)**

From the Oct 2 security assessment. What changed for anyone calling the API:

- Every response carries security headers: a Content-Security-Policy (Google sign-in, Google Fonts, OpenFreeMap, this host's WebSocket, `data:`/`blob:` images and workers, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` and `Cross-Origin-Opener-Policy: same-origin-allow-popups`. HSTS (a year) outside Development. No `Server` header. A new outside source (a CDN, an image host) has to be added to `Security/SecurityHeaders.cs` first. `Security__CspReportOnly=true` sends the policy as report-only, for trying a change on staging.
- `POST /auth/signout` ends the session on the server, on every device: each cookie carries the account's session number (`Accounts.SessionVersion`, new column), and sign-out moves it on. A cookie made before that gets `401`.
- `POST`, `PUT`, `PATCH` and `DELETE` under `/api` from another site's page get `403` ("That came from another site, so we stopped it."). Ours: the same host, `Cors:AllowedOrigins` and `Security:TrustedOrigins`. Calls with no `Origin` and no cross-site `Sec-Fetch-Site` (the CLI, scripts, tests) go through.
- `POST /feedback` still works signed out (the crash screen can show then), but signed out it takes 5 an hour from one address (`RateLimit:SignedOutPerHour`), keeps 2,000 characters of the note and drops a picture over 1.5 MB. Signed in: 4,000 characters and 3 MB, as before. A picture must really be PNG, JPEG or WebP, or it's `400` "That picture didn't work. Send it without one." The admin screenshot is served with its real type, `inline`, and its own policy `default-src 'none'; sandbox`.
- Bodies are 1 MB at most, except feedback (6 MB) and `POST /client-errors` (16 KB). Too big is `413` "That's too much to send at once.", never `500`.
- `quantity` is 1 to 1,000,000; anything else is `400` "Pick a number from 1 to 1,000,000."
- Board views are counted only for confirmed members.
- Before you're confirmed, `GET /map` has `members` only: `threads` and `suggested` are empty. The old `GET /listings` search gives open posts only, whatever `status` you ask for.
- `GET /imports` (the import log, with server paths) is for admins.
- Browser text written to the log (client errors, the feedback note and page) has line breaks and control characters replaced and is cut to length, so it can't start a fake log line.

**Organization names in normal case (S-98, Oct 4)**

- Every organization name the API sends reads in normal case, keeping acronyms: "YWCA of Olympia", "Northwest Harvest E M M", "Tacoma-Pierce Habitat for Humanity". That covers `OrgSummary.name` (board, posts, threads, map members, the org page, `/orgs`), `Me.membership.orgName`, `orgName` on admin claims, invites and feedback, `Message.senderName` when it falls back to the organization, the SignalR payloads, and the older `/orgs/search`, `/orgs/{ein}` and `/listings` routes.
- The database keeps the IRS spelling (all capitals) for matching and imports. The rules live in one place, `OrgName.Display` in `WaNonprofitConnect.Data/OrgName.cs`, with its tests in `OrgNameTests.cs`. The app never re-cases a name.
- A name that already has a lower-case letter (a future self-registered organization, say) is sent as it is.
- Search still matches either spelling: it runs on the stored name.
