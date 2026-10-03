# Security review, Oct 2 2026

Internal. An authorized test of a local copy of the app (never production or staging) plus a read of the code, the CI workflows and the Azure settings. Nothing critical or high was found.

Where each finding is being fixed:
- **M1** deploy permissions: a staging-only identity now exists (`helpbook-github-staging`, can only deploy `helpbook-staging`). The workflow switch is in the dev-workflow pull request; after it merges, the production identity loses its staging trust and is narrowed to `helpbook-alpha` only.
- **M2, M3, L1 to L6**, and the public imports endpoint: the security-hardening pull request.
- **L9**: the dev-workflow pull request.
- **L7** (Google sign-in falls back to email), **L8** (.NET 8 support ends Nov 10 2026), **L10** (npm audit, unused deck.gl code): written up as roadmap items, decisions for Taylor.

---

# Helpbook security assessment, 2026-10-02

Scope: local instance http://localhost:5253 (Development), code at `main` (369acd4), read-only Azure/GitHub config. No traffic to staging or production. **No critical or high findings.** Sessions: dev-auth as pt-a (Ballard 911428805), pt-b (465378620), pt-c (822888626), pt-u (no org), admin@localhost.

## Findings

| ID | Sev | Title | Where | Evidence | Impact | Fix |
|---|---|---|---|---|---|---|
| M1 | Medium | The staging deploy identity can also deploy production | `.github/workflows/deploy-staging.yml:148-161`; identity `helpbook-github-deploy` | Federated subjects: `…:ref:refs/heads/main`, `…:environment:staging`, `…:environment:production`. The `staging` environment has `protection_rules: []` and no branch policy. The same identity is Website Contributor on the whole RG (per OPERATIONS.md). | Any pushed branch can edit its workflow, take the `staging` environment, get an Azure token, and run `az webapp deploy -n helpbook-alpha` or change app settings (e.g. `Admin__Emails`). That skips the production button and Taylor's merge. Only an account with push rights can do this (today: Mesmoraz and agents using its token). | Use two identities: staging (subject `environment:staging`) with a role on `helpbook-staging` only, and production (`environment:production`) with a role on `helpbook-alpha` only. Drop the `ref:refs/heads/main` subject if nothing uses it. |
| M2 | Medium | No security headers; the admin page can be framed | every response | `curl -i /` returns only Content-Type, Cache-Control, ETag, `Server: Kestrel`. No CSP, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy, or HSTS. | The admin page can be clickjacked (approve claim, act-as, invites are one click). With no nosniff, the screenshot endpoint serves uploaded bytes as-is: `POST /feedback` with `data:image/svg+xml;base64,<html><script>…` was stored and served back as `Content-Type: image/jpeg` with the HTML body. Current browsers don't render that as HTML (inferred). | Add the header set below (T-57). Set `X-Content-Type-Options: nosniff` and `Content-Disposition: inline` on the screenshot, and check the image's magic bytes on upload. |
| M3 | Medium | Anonymous feedback can fill the database | `FeedbackController.cs:24-55` | Anonymous `POST /api/v1/feedback` with a 4 MB base64 (3 MB) PNG → `201 {"id":1007}`. The only limit is 120 req/min per IP. | About 360 MB/min per IP of stored blobs. The free serverless DB caps at 32 GB, so it could fill in about 1.5 hours from one IP, and from many IPs faster. | Require sign-in for screenshots (or for all feedback), add a per-IP/per-account limit (e.g. 5/hour), and cap total stored screenshots. |
| L1 | Low | Sign-out doesn't end the session; 30-day sliding cookie | `AuthSetup.cs:39-40`, `AccountControllers.cs:243-249` | Copied cookie, `POST /auth/signout` → 204, replayed the old cookie on `GET /me` → 200 with the account. | A stolen or leftover cookie (shared computer) works for 30 days, extended on each use, admin rights included. | Add a per-account session stamp in the claims and check it in `OnValidatePrincipal`; bump it on sign-out. Consider an absolute lifetime. |
| L2 | Low | Body-less state changes rely only on SameSite=Lax | `/listings/{id}/close`, `/threads/{id}/accept\|decline\|complete\|cancel`, `/admin/claims/{id}/approve\|reject`, `/admin/feedback/{id}/done`, `/auth/signout` | JSON endpoints refuse `text/plain` and form posts (415). But `POST /listings/2068/close` with `Origin: https://evil.example` and no body → 204. | A plain HTML form on another site would succeed if the browser sent the cookie. SameSite=Lax blocks that today, and azurewebsites.net is on the Public Suffix List, so no "same-site" neighbors. Defense in depth only. | Middleware that rejects unsafe methods when `Origin`/`Sec-Fetch-Site` is cross-site, or require a custom header (e.g. `X-Requested-With`) on every POST/PUT. |
| L3 | Low | Anyone signed in can inflate board views and change rankings | `HelpbookService.cs:50-52` | As pt-u (no org), `GET /board` ×5 moved the top post's views 131 → 137. | "Seen least" ranking can be gamed: any Google account can push others' posts down. | Count a view at most once per viewer per post per day, and only for confirmed members. |
| L4 | Low | Unconfirmed accounts see private thread metadata and closed posts | `GET /api/v1/map`, `GET /api/v1/listings`, `/listings/{id}/matches` | As pt-u: `/map` returns `{"id":2017,"status":"Proposed","fromEin":"465378620","toEin":"911428805","title":…}`. `/listings?status=Closed` returns closed posts. | Any Google account can see which orgs are negotiating and what about, before any approval. | Show only Accepted/Completed threads to non-parties (or to confirmed members only); limit the legacy `/listings` search to open posts or retire it. |
| L5 | Low | Unhandled 500s on bad input | `RequestSizeLimit` on feedback; `Listing.Quantity` | A 7 MB feedback body → 500 (should be 413). `"quantity":99999999999999999` → 500. | Noisy logs, misleading errors. No details leak (only traceId). | Map `BadHttpRequestException` to its status; validate quantity range (e.g. ≤ 1,000,000). |
| L6 | Low | Log forging and large anonymous bodies on client-errors | `ClientErrorsController.cs:15-19`; feedback log line | A 10 MB anonymous body with `message:"x\nfail: … FORGED LINE"` → 204. Fields are cut to length but newlines are kept, and the default 30 MB body limit applies. | Fake `fail:` lines in the output of `scripts/errors.ps1`; 30 MB anonymous bodies. | Replace CR/LF in logged fields; `[RequestSizeLimit(16_384)]`. |
| L7 | Low | Google sign-in links by email even when the subject differs | `AccountService.cs:42-55` | Code: if no account matches `sub`, it falls back to email and keeps the old `GoogleSubject` (`??=`). | A different Google identity with the same verified email (e.g. a recreated Workspace account, or a Google account made on a non-Gmail address) takes over the account. Admin is also granted by email alone. | If the account has a `GoogleSubject` and it differs, refuse or require admin. Keep admin emails to Gmail/Workspace addresses Taylor controls. |
| L8 | Low | .NET 8 runtime reaches end of support on 2026-11-10 | `*.csproj` net8.0; Azure `DOTNETCORE\|8.0` | , | No security patches after about 5 weeks from now. | Plan the move to .NET 10 LTS. |
| L9 | Low | Production picks its artifact by branch name only | `deploy-production.yml:29` | `gh run list --workflow deploy-staging.yml --branch main --status success` has no `--event push` filter. | A PR run whose head branch is named `main` (e.g. from a fork; forking is allowed) could become the "last successful main build". Inferred; low with one collaborator. | Add `--event push`, and check `headSha` is on `origin/main`. |
| L10 | Low | npm audit: 8 high, 3 moderate (transitive, unused code) | `@deck.gl/geo-layers@9.4.0` → mesh-layers, loaders.gl gltf/textures/zip, `fflate`, `image-size` | `npm audit --omit=dev`: 11 vulns (same with dev). Advisories are DoS on malformed ZIP/ICNS. The app uses none of the mesh/glTF/3D-tiles loaders. | Little real exposure. | Drop `@deck.gl/geo-layers` if only one layer is needed, or wait for an upstream fix. Don't take the suggested "fix", which is a downgrade to 9.0.6. |
| I1 | Info | `/api/v1/imports` is public and shows server file paths | `StatsController.cs:324-331` | `GET /imports?take=1` → `"localFilePath":"C:\\Projects\\WaNonprofitConnect\\data\\raw\\…","errors":null`. | Internal paths and import error text are public. | Require admin, or drop `localFilePath`/`errors`. |
| I2 | Info | Validation errors show .NET type names; `Server: Kestrel` | model binding | `"help":"Bogus"` → `could not be converted to WaNonprofitConnect.Data.Entities.KindOfHelp`. | Minor fingerprinting. | `AddServerHeader=false`; optionally replace the model-state messages. |
| I3 | Info | Public enumeration by design | `/orgs`, `/orgs/search` (pageSize clamped at 200), `/map/points`, `/stats`, `/codes`, `/ntee` | 42,510 orgs pageable without sign-in. | Public IRS data. `isMember` in `/orgs` shows which orgs have joined. | Accept, or leave `isMember` out for anonymous callers. |
| I4 | Info | SignalR group is fixed at connect time | `ExchangeHub.cs:24-28` | Code read (inferred): an org change (admin act-as) keeps the old `org-{ein}` group until reconnect. | An admin switching orgs keeps getting the old org's events on that connection. | Re-join groups on membership change, or close connections. |
| I5 | Info | Actions pinned by tag, not SHA; all actions allowed | workflows | `actions/checkout@v4`, `azure/login@v2`; `allowed_actions: all`. | Supply-chain risk if a tag is moved. | Pin by SHA (Dependabot can update them). |

### Recommended headers (compatible with GIS, MapLibre/OpenFreeMap, deck.gl)

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://tiles.openfreemap.org https://*.googleusercontent.com; connect-src 'self' wss: https://tiles.openfreemap.org https://accounts.google.com/gsi/; frame-src https://accounts.google.com/gsi/; worker-src 'self' blob:; child-src blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000   (production only; HTTPS-only is already on)
Cross-Origin-Opener-Policy: same-origin-allow-popups   (GIS popup)
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```
Start with `Content-Security-Policy-Report-Only` on staging and check the map and Google sign-in on a phone. Narrow `wss:` to `wss://helpbook-*.azurewebsites.net`.

## Verified safe

- **IDOR:** as a third org (pt-c) on thread 2017 between A and B, GET/messages/accept/decline/complete/cancel on `/threads/{id}` and `/matches/{id}` all returned 403. Closing A's listing → 403. The proposer accepting its own thread → 403.
- **Unconfirmed account:** GET /threads, GET /threads/{id}, POST /listings → 403. A pending claim can't act.
- **Admin endpoints as a non-admin:** claims, invites, feedback list, screenshot, act-as, create invite, org filters, approve claim, feedback done → 403.
- **Dev auth:** `if (!_env.IsDevelopment()) return NotFound()`. Neither Azure app sets `ASPNETCORE_ENVIRONMENT` (setting names checked), so both run as Production. Swagger is mapped only in Development and excluded from the SPA fallback.
- **Google ID token:** `GoogleJsonWebSignature.ValidateAsync` checks signature, issuer and expiry, with `Audience = [clientId]`, plus `EmailVerified`.
- **Cookie:** HttpOnly, SameSite=Lax, Secure=Always outside Development. Unauthenticated calls get 401 problem JSON, never a redirect.
- **CORS:** no `Access-Control-Allow-Origin` for a foreign origin; production `Cors__*` is not set.
- **SignalR:** anonymous negotiate → 401. The hub has no client-callable methods (`JoinGroup` → "Method does not exist"). Live test: the third org and the unconfirmed connection got no `threadChanged`/`messageAdded`, while the party got both.
- **XSS:** no `dangerouslySetInnerHTML`, `innerHTML` or `setHTML` in `app/src`. Payloads in title, description and feedback are stored raw and rendered by React as text. The screenshot is never served as SVG or HTML.
- **SQL:** no `FromSqlRaw`/`ExecuteSql`/`SqlQuery`. All LIKE patterns are parameterized through EF.
- **Limits:** message over 4,000 → 400. Invite codes are 8 characters from 31 (about 8.5e11), so brute force at 120/min/IP isn't feasible; 30 wrong tries → 404s. `/orgs/search` pageSize clamped to 200. `expiresInDays` clamped.
- **Errors:** 500s return only a generic title and a traceId (no stack trace); `/health` returns "Healthy" only.
- **CI:** `pull_request`, not `pull_request_target`. The PR title is passed through `env:` and stripped of CR/LF before going into `GITHUB_ENV`, so it can't inject a script or env var. Default workflow token is read-only.
- **Azure:** HTTPS-only, TLS 1.2 minimum (site and SCM), FTPS-only, SCM and FTP basic-auth publishing off on both apps, remote debugging off, detailed errors off, system-assigned identity. SQL: Entra-only auth, TLS 1.2, 13 single-IP app-outbound rules, no 0.0.0.0 "Allow Azure services" rule.
- **Secrets:** none in the tree or git history. Only the public Google client id (`app/.env`) and the throwaway CI SQL password built from `github.run_id`.
- **.NET:** `dotnet list package --vulnerable --include-transitive` found nothing for Api and Data.

Test data left in the local dev DB: accounts `pt-a|b|c|u|so@example.org`, listings 2055, 2056, 2068, thread 2017 (+ messages), feedback 1006 and 1007, and pt-u's pending claim on 911606330.
