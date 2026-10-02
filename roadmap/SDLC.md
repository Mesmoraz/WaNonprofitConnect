# How we build (SDLC)

The rules for planning, building, and shipping this project. Short on purpose. Adopted 2026-09-21.

## The hierarchy

| Level | What it is | Size | Example |
|---|---|---|---|
| **Initiative** | A goal the mission needs. Lives for months. | 3 to 10 epics | Prototype that shows the whole mission |
| **Epic** | A capability that delivers part of an initiative. Lives for weeks. | 2 to 8 stories | The front door: sign up through confirm, for all six kinds |
| **Story** | One thing a person can do or see when it's done. Fits in one sitting (a "round"). | 1 to 8 tasks | About you: a person says where they are, what they can do, and when |
| **Task** | One concrete step. Minutes to an hour. | | Brief the screen; build it; check on a phone; ship |

Ids are stable and never reused: `I-n`, `E-n`, `S-n`, `T-n`. Everything lives in `roadmap/roadmap.json`. The board and the site page are generated from it; never edit those by hand.

## Statuses (the Kanban columns)

| Status | Means |
|---|---|
| `backlog` | We know we want it. Not yet defined well enough to start. |
| `ready` | Defined: purpose, the one action, and what "done" looks like are written down. Could start today. |
| `in-progress` | Someone is on it right now. |
| `review` | Built; waiting on Taylor's check (on a phone, for screens). |
| `done` | Shipped: its pull request merged into `main`, and the site rebuilt where it changed. |

Any item can also carry `blocked: "reason"`. Blocked items stay in their column and show the reason.

Epic and initiative status is derived from their children: done when all are done, in progress when any is in progress or in review, ready when any is ready, otherwise backlog.

**Work-in-progress limit: one story in `in-progress` per lane.** Lanes: `app` (screens in the real app, `app/src/screens`), `map` (`app/src/map` only), `screens` (the frozen prototype, bugs only), `data` (seed scripts and seed files), `backend` (the .NET project), `research` (finding and verifying sources), `site` (the public site). A story's `lane` field says which; screens is the default. Work in different lanes runs in parallel; finish or park a story before starting another in the same lane.

## The round (how a story moves)

Every story that touches what a person sees goes through the same loop, and no step is skipped:

1. **Brief.** Post what the screen is for, the one action, every word of copy, and what stays and goes. Check it against `docs/MISSION.md`, `docs/TAXONOMY.md`, `docs/APP-MAP.md`, `docs/VOICE.md`.
2. **Approve.** Taylor edits or approves line by line. Nothing is built before this.
3. **Build.** Exactly what was approved. Anything extra that was needed to make it true (a bug found, a missing style) is called out by name when shipping.
4. **Check.** Phone width, real taps and typing, console clean. The story's acceptance criteria (the approved brief, the change log's test cases) become an automated test named after it, `test('[S-12] ...')` in `app/e2e/`, and every test passes (`npm run test:e2e` in `app/`; see "Automated tests" below).
5. **Ship.** Open a pull request (see below) with the change log entry and test cases in its description. For a screen change, label it **staging** so Taylor can run the phone test cases on https://helpbook-staging.azurewebsites.net before merging (`docs/OPERATIONS.md`). Set the story to `review`. Taylor's OK merges it, and merging moves the story to `done`.

A round fits in one sitting. If it doesn't, the story is too big: split it.

## Staying responsive (agile rules)

- **Discoveries become items the same day.** A bug found mid-round, a data source found, a question Taylor answers: add a task or story with `added` set to today and `source` saying where it came from. Don't hold it in your head or in chat.
- **Re-plan at the start of each sitting, not mid-round.** Look at `ready`, pick the next story, and go. Mid-round, only the current story changes.
- **Only `ready` gets detail.** Backlog items stay one line until they're next. Detail written early is detail rewritten later.
- **Order is a suggestion, not a promise.** `order` on epics is the current plan; Taylor can reorder any time. Dates are not tracked; the roadmap shows sequence and status.
- **Small and shipped beats big and pending.** Every round ends with something live.
- **Parallel where files don't collide.** Data, backend, and research stories can run side by side with a screen round. Agents working in parallel never commit; the person running them commits once each piece is checked, on the round's branch.
- **Decisions are written where they're used.** A product decision goes in `docs/TAXONOMY.md` or `docs/APP-MAP.md`; a copy decision in `docs/VOICE.md`; a process decision here. The roadmap item links to it rather than repeating it.

## Keeping designs uncoupled

So one part can change without dragging the others:

- **The docs are the contract.** `MISSION.md`, `TAXONOMY.md`, `APP-MAP.md`, `VOICE.md` define the product. The prototype and the backend each implement them; neither reads the other. If they disagree, the docs win and both get fixed.
- **One shape for an organization or person**, whatever the source: `{ id, name, city, zip, type, sub, domain, lat, lon }` plus tags. The IRS list, OSPI's schools, the workforce list, self-registered businesses all arrive through loaders that produce that shape. Screens never know which source a row came from.
- **Seeds are generated, not typed.** Prototype data comes from `scripts/fetch-*.js` against public sources, with anything invented labeled as such. Hand-typed rows are temporary and get replaced.
- **Screens depend on the taxonomy and the shared state, not on each other.** Each screen's copy lives in that screen's code. No screen assumes another screen's layout. Cross-screen behavior (pins, chips, labels) keys off `type` and `kind`, not off which screen drew it.
- **Style is tokens.** Colors, spacing, and type live in `:root`; screens use tokens, never raw values. A theme change touches one block.
- **The framework is React (decided 2026-09-23, `docs/ALPHA.md`).** The API between the app and the backend is still the seam: the app never reaches past `/api/v1`, and the map never reaches past the `MapData` shape.
- **The roadmap is data.** `roadmap.json` renders to Markdown and to the site page; neither view is edited directly, and the roadmap doesn't depend on the app.

## Public vs private

`roadmap.json` renders to the public site. It says **Name TBD**, never the real name, until Taylor says the name is public. Internal docs (`docs/*.md`, this file) may use the real name.

## Commands

```bash
node scripts/roadmap.js                     # validate, regenerate roadmap/README.md, print the board
node scripts/roadmap.js set S-12 review     # move an item (any id) to a status
node scripts/roadmap.js block S-12 "waiting on OSPI directory file"
node scripts/roadmap.js unblock S-12
node scripts/roadmap.js add task S-12 "Check on a phone"
node scripts/roadmap.js add story E-3 "Fetch schools from OSPI"
node scripts/build-site.js                  # rebuilds the site, including roadmap.html
```

## Pull requests

Adopted 2026-09-28 (Taylor: "so I can see what the changes are and keep track of them"). The repo is `Mesmoraz/WaNonprofitConnect` (private) and its default branch is `main`.

- **Nothing is committed straight to `main`.** Every round works on its own branch from an up-to-date `main`: `story/S-12-short-name` for a story, `fix/short-name` for a bug, `process/short-name` for docs and roadmap only.
- **One pull request per round.** The title says what a person will notice. The description is the change log entry (what changed, why, test cases marked [verified] or [needs your phone]) plus any copy waiting for approval.
- **Small commits inside it**, each one readable on its own (server, app, roadmap).
- **Taylor reviews and merges.** Claude never merges its own pull request, never enables auto-merge, and never force-pushes `main`.
- The public site repo (`helpbook-site`) is only a build output and keeps its direct pushes.

## Automated tests

Adopted 2026-10-02 (Taylor: "automated tests to ensure functionality based off of acceptance criteria and road maps").

- **Acceptance tests** (`app/e2e/*.spec.ts`, Playwright, phone-sized): the real app and API, driven like a person. Each test is named after the stories it proves, `[S-20] one organization helps another, start to golden thread`, and checks the approved words and what happens next. Write them from the brief and the change log's test cases; a step that needs a real phone stays **[needs your phone]**.
- **API and service tests** (`tests/WaNonprofitConnect.Tests`, xUnit): rules the screens can't show, such as limits, permissions, and races.
- **On every pull request** GitHub runs both, the acceptance tests against a fresh SQL Server loaded with 13 real organizations (`tests/acceptance/fixtures`). Nothing reaches staging unless they pass.
- **Coverage by story:** `node scripts/acceptance.js` lists the alpha's built stories and the tests that cover each. GitHub shows the same table on every run's summary page.
- **Locally:** run the API and the app, then `npm run test:e2e` in `app/`. Tests sign in through the Development-only sign-in and use fresh posts each run, so they also pass on a database with data in it.

## Change log and test cases

**Every shipped change gets an entry in `roadmap/CHANGELOG.md`, newest first, and the same entry is given to Taylor in chat.** An entry has three parts and nothing else:

1. **What changed** — one line per change, in plain words, saying what a person will notice. Not the code.
2. **Why** — only when it is not obvious, or when it came from Taylor's feedback (say so).
3. **Test cases** — numbered steps Taylor can run on a phone, each with the expected result. Cover the change itself, the thing it might have broken, and anything Claude could not verify in the browser pane (say which, and why).

Rules for the test cases: write them for a phone, not a desktop. One action per step. Say the exact words to look for. Mark any step Claude already verified as **[verified]** and any step only Taylor can do as **[needs your phone]**. Keep the whole list short enough to run in a couple of minutes.

## Definition of done

- The story's one action works on a phone with real taps.
- Copy matches the approved brief and `docs/VOICE.md`.
- Its acceptance test exists and passes, with the API tests. Console is clean.
- Pull request open with the change log entry and test cases; merged into `main` once Taylor approves.
- Anything discovered along the way is on the roadmap.
