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
| `done` | Shipped: in the artifact, on the site, and committed. |

Any item can also carry `blocked: "reason"`. Blocked items stay in their column and show the reason.

Epic and initiative status is derived from their children: done when all are done, in progress when any is in progress or in review, ready when any is ready, otherwise backlog.

**Work-in-progress limit: one story in `in-progress` at a time.** Finish it or park it back to `ready` before starting another.

## The round (how a story moves)

Every story that touches what a person sees goes through the same loop, and no step is skipped:

1. **Brief.** Post what the screen is for, the one action, every word of copy, and what stays and goes. Check it against `docs/MISSION.md`, `docs/TAXONOMY.md`, `docs/APP-MAP.md`, `docs/VOICE.md`.
2. **Approve.** Taylor edits or approves line by line. Nothing is built before this.
3. **Build.** Exactly what was approved. Anything extra that was needed to make it true (a bug found, a missing style) is called out by name when shipping.
4. **Check.** Phone width, real taps and typing, console clean. Tests pass (`node scripts/test-prototype.js`).
5. **Ship.** Republish the artifact, rebuild the site, commit both repos, push the site. Set the story to `review`; Taylor's OK moves it to `done`.

A round fits in one sitting. If it doesn't, the story is too big: split it.

## Staying responsive (agile rules)

- **Discoveries become items the same day.** A bug found mid-round, a data source found, a question Taylor answers: add a task or story with `added` set to today and `source` saying where it came from. Don't hold it in your head or in chat.
- **Re-plan at the start of each sitting, not mid-round.** Look at `ready`, pick the next story, and go. Mid-round, only the current story changes.
- **Only `ready` gets detail.** Backlog items stay one line until they're next. Detail written early is detail rewritten later.
- **Order is a suggestion, not a promise.** `order` on epics is the current plan; Taylor can reorder any time. Dates are not tracked; the roadmap shows sequence and status.
- **Small and shipped beats big and pending.** Every round ends with something live.
- **Decisions are written where they're used.** A product decision goes in `docs/TAXONOMY.md` or `docs/APP-MAP.md`; a copy decision in `docs/VOICE.md`; a process decision here. The roadmap item links to it rather than repeating it.

## Keeping designs uncoupled

So one part can change without dragging the others:

- **The docs are the contract.** `MISSION.md`, `TAXONOMY.md`, `APP-MAP.md`, `VOICE.md` define the product. The prototype and the backend each implement them; neither reads the other. If they disagree, the docs win and both get fixed.
- **One shape for an organization or person**, whatever the source: `{ id, name, city, zip, type, sub, domain, lat, lon }` plus tags. The IRS list, OSPI's schools, the workforce list, self-registered businesses all arrive through loaders that produce that shape. Screens never know which source a row came from.
- **Seeds are generated, not typed.** Prototype data comes from `scripts/fetch-*.js` against public sources, with anything invented labeled as such. Hand-typed rows are temporary and get replaced.
- **Screens depend on the taxonomy and the shared state, not on each other.** Each screen's copy lives in that screen's code. No screen assumes another screen's layout. Cross-screen behavior (pins, chips, labels) keys off `type` and `kind`, not off which screen drew it.
- **Style is tokens.** Colors, spacing, and type live in `:root`; screens use tokens, never raw values. A theme change touches one block.
- **The framework decision stays open.** The prototype is plain HTML/JS; the backend is .NET; the API between them is the seam. Nothing in the prototype should be hard to redo in whatever framework is picked after the wireframes are signed off.
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

## Definition of done

- The story's one action works on a phone with real taps.
- Copy matches the approved brief and `docs/VOICE.md`.
- Tests pass. Console is clean.
- Artifact republished, site rebuilt and pushed, both repos committed.
- Anything discovered along the way is on the roadmap.
