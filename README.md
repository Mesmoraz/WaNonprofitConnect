# WaNonprofitConnect

A platform for Washington State 501(c)(3) organizations to be discovered from authoritative public data, claim their profile, post what they need, talk to each other, and receive in-kind offers from businesses — exposed as a clean, versioned REST API so web, iOS, Android, and desktop clients (or third-party tools) can all plug in.

**Status: Prototype 1 — backend data layer.** IRS data for WA is ingested into a database and served through a search API. No auth, no UI yet. See [Roadmap](#roadmap).

## Quick start

Requirements: .NET 8 SDK, SQL Server LocalDB (dev). Both install via `winget install Microsoft.DotNet.SDK.8` and the [SQL Server 2022 LocalDB MSI](https://download.microsoft.com/download/3/8/d/38de7036-2433-4207-8eae-06e247e17b25/SqlLocalDB.msi).

```powershell
dotnet build WaNonprofitConnect.sln
dotnet test tests/WaNonprofitConnect.Tests/WaNonprofitConnect.Tests.csproj

# Download the IRS WA extract (~7 MB) and load it. Migrations run automatically.
dotnet run --project src/WaNonprofitConnect.Cli -- import bmf

# How much data is there?
dotnet run --project src/WaNonprofitConnect.Cli -- stats

# Serve it (Swagger UI at http://localhost:5253/swagger)
dotnet run --project src/WaNonprofitConnect.Api --launch-profile http
```

CLI options: `import bmf [--state WA|all] [--url <csv>] [--file <local.csv>] [--force]`, `stats [--state WA|all]`, `imports`.
Connection string: `ConnectionStrings:Default` (API appsettings) or `WANC_CONNECTION` env var (CLI); default is LocalDB `WaNonprofitConnect_Dev`.

## API (v1)

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/orgs?q=&city=&zip=&ntee=&foundation=&subsection=&only501c3=true&excludePrivateFoundations=&minRevenue=&maxRevenue=&page=&pageSize=` | Paged search. `q` matches every word against the normalized name, or does an exact lookup when it is a 9-digit EIN. `ntee` accepts a major letter (`K`) or full code (`K31`). |
| `GET /api/v1/orgs/{ein}` | Full record with every IRS code decoded, plus links to ProPublica and IRS TEOS. Omits `InCareOf` (PII). |
| `GET /api/v1/stats?state=WA` | Counts by subsection, NTEE group, foundation type, filing requirement, income band, city, ruling decade. |
| `GET /api/v1/ntee`, `GET /api/v1/codes` | Lookup tables for building client filters. |
| `GET /api/v1/imports` | Provenance: every import run with file hash and row counts. |
| `GET /health`, `GET /swagger` | Health check; OpenAPI document + UI (Development). |

Design choices that keep clients interchangeable: stateless JSON, `/api/v1/` versioned routes, enums as strings, OpenAPI published so typed SDKs can be generated for .NET MAUI / React Native / Flutter / TypeScript, per-IP rate limiting on every public route, CORS allow-list in config.

## What the data looks like (WA, IRS EO BMF posted 2026-09-08)

| | Count |
|---|---|
| Exempt organizations in WA | **42,510** |
| of which 501(c)(3) | **35,361** (83%) |
| — public charities / churches / schools / other | 33,257 |
| — private foundations (grant-makers) | 2,104 |
| 501(c)(3) with an NTEE category code | 28,074 (79%) |
| 501(c)(3) with non-zero revenue on file | 10,406 (29%) — the rest are 990-N "e-Postcard" filers (< $50k) or churches, which report no financials |
| 501(c)(3) required to file a full 990/990-EZ | 9,774 |
| 501(c)(3) filing only the 990-N e-Postcard | 17,636 |
| Churches (no filing required) | ~5,600 |

Largest NTEE groups among 501(c)(3)s: Education 4,710 · Arts 3,196 · Religion 3,134 · Human Services 2,845 · Recreation/Sports 2,621 · Philanthropy 1,874 · Youth 1,376 · Animals 981 · Food/Agriculture 463 · Housing 510. 7,287 have no NTEE code at all.

Top cities: Seattle 5,156 · Spokane 1,627 · Tacoma 1,489 · Vancouver 1,241 · Bellevue 1,089.

Import runs in ~30 s on LocalDB; the same code path handles the national regional files (~2M rows) in batches.

## Data sources

### Loaded now

| Source | Gives | URL / cadence |
|---|---|---|
| **IRS EO Business Master File, WA extract** | Every IRS-recognized exempt org: EIN, name, address, subsection (03 = 501c3), foundation code, NTEE, ruling year, deductibility, filing requirement, latest asset/income/revenue | `https://www.irs.gov/pub/irs-soi/eo_wa.csv` (regional `eo1–4.csv` for scale-out). Monthly. Public domain. |

### Next (all free, bulk, monthly, pipe-delimited)

| Source | Why it matters | URL |
|---|---|---|
| **IRS Pub 78** | Orgs *currently* eligible for tax-deductible contributions — the "is this a real, live 501c3" check | `https://apps.irs.gov/pub/epostcard/data-download-pub78.zip` |
| **IRS Auto-Revocation list** | Orgs that lost exemption for 3 years of non-filing — hide these | `https://apps.irs.gov/pub/epostcard/data-download-revocation.zip` |
| **IRS Form 990-N** | Small orgs: last filing year, contact name, **website** | `https://apps.irs.gov/pub/epostcard/data-download-epostcard.zip` |
| **IRS Form 990 XML** | Full returns for larger orgs: mission, officers, website, program descriptions | `https://www.irs.gov/charities-non-profits/form-990-series-downloads` (zipped XML by month, CSV index; filter by state first) |
| **ProPublica Nonprofit Explorer API** | Multi-year 990 financials already parsed to JSON | `https://projects.propublica.org/nonprofits/api/v2/organizations/{ein}.json` — free, no key, be polite, attribute. |
| **Urban Institute NCCS Unified BMF** | Historical BMF 1989→present, geocoded variant | `s3://nccsdata/unified/bmf/` |

### Washington-specific (valuable, but no bulk feed)

The **WA Secretary of State Charities Program** (RCW 19.09, [CCFS](https://ccfs.sos.wa.gov)) holds what the IRS files lack — phone, email, officers, state registration status, WA-reported revenue and program-expense %. The SOS discontinued its bulk "Corporations Data Extract"; options are (1) CCFS Advanced Search → CSV export by hand, (2) the site's own JSON endpoints (e.g. `cfda.sos.wa.gov/api/BusinessSearch/BusinessInformation?businessID=`) with ≥1 s throttling, or (3) a public-records request to the Charities Program (360-725-0377) for an extract — **(3) is the production path**.

### Known data-quality issues

- The BMF has **no phone, email, or website**. Contact channels come from 990-N / 990 XML / WA SOS, or from the org itself once it claims its profile.
- NTEE codes are missing on ~21% of WA 501(c)(3)s and sometimes wrong (e.g. a food bank coded `Z99Z`). Plan a fallback (name keywords, ACTIVITY codes) and let claimed orgs correct it.
- `REVENUE_AMT` reflects whichever return the IRS processed most recently, which can be newer than what ProPublica shows.
- Foundation code separates private foundations (02/03/04 — donors) from public charities (15/16), churches (10), schools (11), hospitals (12). The API exposes `isPrivateFoundation` and an `excludePrivateFoundations` filter.

## Project layout

```
src/WaNonprofitConnect.Data/   entities, AppDbContext + migrations, IRS code tables (Codes/BmfCodes.cs),
                               CSV importer (Import/), shared search + stats queries (Queries/)
src/WaNonprofitConnect.Api/    ASP.NET Core Web API: controllers, DTOs (Contracts/), Swagger, rate limiting, health
src/WaNonprofitConnect.Cli/    import / stats / imports commands (shares Data)
tests/WaNonprofitConnect.Tests xUnit + FluentAssertions; importer and query tests run on in-memory SQLite
data/raw/                      downloaded snapshots (git-ignored)
```

EF Core is used provider-agnostically (no SQL-Server-only features) so the production DB can be PostgreSQL.

## Roadmap

1. **Backend data prototype** — done (this).
2. **Data quality + liveness** — merge Pub 78 / revocation / 990-N; `IsActive501c3` flag; NTEE fallback; WA SOS enrichment.
3. **Identity + claiming** — ASP.NET Identity + Google/Microsoft login; `OrgClaim` flow (email-domain match against 990-N/990 website, admin fallback); editable `OrganizationProfile`.
4. **Needs + messaging** — `Need` posts (goods / services / volunteers / space / funding), org↔org threads, email notifications, moderation.
5. **Business side** — `Business` accounts, browse needs by category/radius, `Offer` workflow, delivery confirmation, in-kind acknowledgements (the app never values gifts — IRS rule).
6. **Connectability** — API keys (hashed, scoped), webhooks (`need.created`, `offer.accepted`, …), CSV export, optional MCP server for AI-agent access.
7. **Scale-out** — national BMF files, `state` as first-class filter, per-state charity-registry adapters (WA is the template).
8. **Clients** — web first, then .NET MAUI (iOS/Android/Windows/macOS from one C# codebase) or React Native against the same API.

### Compliance notes to decide early

- **No money moves through the app in v1.** Cash giving links out to the org's own donate page; a Stripe Connect flow can come later. Routing donations yourself in WA can trigger charitable-solicitation / commercial-fundraiser registration (RCW 19.09) and money-transmitter questions. In-kind offers avoid this entirely.
- **PII**: the IRS `ICO` ("in care of") name is stored but never served publicly. WA SOS officer contact data should be visible only to verified users and never bulk-exported.
- **Terms**: IRS data is public domain; ProPublica requires attribution and non-resale; check terms on any SOS extract.
