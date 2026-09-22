# CLAUDE.md

Read these two files before any design, copy, or development work in this repo, and check every change against them:

- **`docs/MISSION.md`** — the mission statement and direction for Helpbook, written by Taylor. It is the source of truth for what this project is for: Golden Threads between community needs and the people, organizations, funding, skills, and resources that can meet them, run as a 501(c)(3) community-impact organization. If a feature, screen, or line of copy does not serve that, say so before building it. Change the mission only when Taylor changes it.
- **`docs/VOICE.md`** — the approved voice sheet for everything a user reads. Every screen is briefed to Taylor first (what it's for, the one action, every word, what stays and goes), approved line by line, then built, then checked on a phone.

Handoff, build steps, and prototype internals: `docs/CONTINUE.md`.

## How work is tracked

- **`roadmap/SDLC.md`** — the rules: Initiative → Epic → Story → Task, the five statuses, the round loop (brief, approve, build, check, ship), the WIP limit of one story, how discoveries become items the same day, and how designs stay uncoupled.
- **`roadmap/roadmap.json`** — the single source for the roadmap. `node scripts/roadmap.js` validates it and regenerates `roadmap/README.md`; `node scripts/build-site.js` renders it to `roadmap.html` on the public site. Move items with `node scripts/roadmap.js set <id> <status>`. Add anything discovered with `add story` / `add task`. The roadmap is public: it says "Name TBD", never the real name.
- Update the roadmap as part of every round, not after.
