# Continuation brief

Paste this into a new conversation to pick up the work. Last updated 2026-10-02. The name people see lives only in
`app/brand.json`; the public roadmap says "Name TBD".

## What this is

A place where Washington's 501(c)(3)s say what they need and what they have, find each other, and hand things off.
Public IRS data (about 35,000 WA 501(c)(3)s) is the directory, so nobody has to sign up to be found. The alpha is a
real app: a React app (`app/`) served by a .NET 10 API (`src/`) on Azure, with SQL Server.

## Where things are

| What | Where |
|---|---|
| Why we build it, and how every word reads | `docs/MISSION.md`, `docs/VOICE.md` (read both before any work; see `CLAUDE.md`) |
| The alpha: scope, stack, API contract | `docs/ALPHA.md` (screen briefs in `docs/ALPHA-BRIEFS.md`) |
| Deploying, logs, the sleeping database, backups | `docs/OPERATIONS.md` |
| The roadmap and how work is tracked | `roadmap/SDLC.md` (rules), `roadmap/roadmap.json` (the source), `roadmap/changelog/` (one file per entry) |
| Backend quick start and CLI | `README.md` at the repo root |
| The old clickable prototype and design brief | `docs/helpbook-prototype.html`, `docs/helpbook-step2-design.html` (historical) |

## How work flows

1. **Every round is a branch and a pull request** on `Mesmoraz/WaNonprofitConnect`. Nothing goes straight to `main`;
   Taylor merges. Parallel agents each use their own worktree off `origin/main`
   (`git worktree add -b <branch> ../wt-<name> origin/main`), because the main checkout may be someone else's.
2. **Brief, approve, build, check, ship** (`roadmap/SDLC.md`). Update the roadmap in the same round with
   `node scripts/roadmap.js set <id> <status>`, and add a change log entry as a new file in `roadmap/changelog/` with numbered phone tests.
3. **Checks on every pull request** (`.github/workflows/deploy-staging.yml`):
   - `build`: installs, lints and builds the app, runs the API tests (`dotnet test`), and packs the site.
   - `acceptance`: starts the real API on a fresh SQL Server, loads 13 real organizations from
     `tests/acceptance/fixtures/`, and drives the app like a person on a phone (`app/e2e/*.spec.ts`, Playwright).
     The job summary lists which roadmap stories have tests (`node scripts/acceptance.js`).
4. **Staging**: every merge to `main` deploys to https://helpbook-staging.azurewebsites.net. A pull request labeled
   `staging` goes there too, until something else takes its place.
5. **Production**: Actions, then *Deploy to production*, then *Run workflow*. It ships the exact files of the last
   staging deploy of `main` to https://helpbook-alpha.azurewebsites.net. Details in `docs/OPERATIONS.md`.

## Local setup (Windows)

Needs: .NET 10 SDK, SQL Server 2022 LocalDB, Git, GitHub CLI (signed in as Mesmoraz), and **Node 22.12 or newer**
(`.nvmrc` says 22; `app/package.json` "engines" says `^20.19.0 || >=22.12.0`).

```powershell
# the API on http://localhost:5253 (Swagger at /swagger); it migrates the database itself
dotnet run --project src/WaNonprofitConnect.Api --launch-profile http
dotnet test tests/WaNonprofitConnect.Tests/WaNonprofitConnect.Tests.csproj

# the app on http://localhost:5173, calling the API above
cd app; npm ci; npm run dev          # npm run dev:mock runs it without the API
npm run lint; npm run build          # build writes into the API's wwwroot

# acceptance tests: builds the app, starts the API from this checkout (or uses one already on 5253), runs them
npm run test:e2e:local
```

In the Claude desktop app, the `api` and `app` entries in `.claude/launch.json` start the two servers.

Notes:

- **Node 22.12 or newer is required.** `app/.npmrc` sets `engine-strict`, so an older Node stops `npm ci` with a
  clear message; upgrade with `winget install OpenJS.NodeJS.LTS`, then `npm ci` again. (History: on Node 22.11,
  npm silently left out the rolldown and oxlint native bindings, which broke `npm run build` and `npm run lint`
  until Node was upgraded on 2026-10-02.)
- **Acceptance tests with two checkouts**: if an API from another worktree is already on port 5253, the tests use
  it, and it serves that checkout's build of the app. Stop it first.
- **Dev server polling**: Vite polls for file changes once a second, because Windows file events missed edits.
  `VITE_POLL=0` turns it off.
- **LocalDB** "cannot create file ... already exists": re-attach the database (command in `README.md`).
- **Claude's Bash tool**: prefix commands with `export PATH="/c/Program Files/dotnet:/c/Program Files/GitHub CLI:$PATH"`.
  Heredocs that contain apostrophes fail there; write scripts to files instead.
- **Commits**: as Taylor Philpott <taylor.philpott@gmail.com>, with the Co-Authored-By line for Claude.

## Product decisions that hold

- No money moves through the app; cash giving links out.
- Ranking is fair, not bought: priority first, then the least seen; every card says why it is shown.
- The IRS files are the directory and are re-imported monthly by EIN; an import never overwrites what members typed.
- The map's "golden threads" connect who gives with who receives. See `docs/MISSION.md` and `docs/APP-MAP.md`.
