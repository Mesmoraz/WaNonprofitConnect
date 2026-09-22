# Name TBD roadmap

Generated from `roadmap.json` on 2026-09-22. Don't edit this file; run `node scripts/roadmap.js`. Rules: [SDLC.md](SDLC.md).

## Board

| Backlog | Ready | In progress | In review | Done |
| --- | --- | --- | --- | --- |
| S-13 Foundations flagged from the IRS list's foundation code |  |  | S-17 Board: kind-of-help chips, fair ranking, directory search at the top | S-1 Mission statement saved and pointed at from the repo |
| S-18 A need or offer: who it's from, how it fits you, I can help / I need this |  |  | S-22 Grants tab shows only for confirmed organizations | S-2 Voice sheet: ten rules and a words list |
| S-19 Post: kind of help first, then the rest |  |  |  | S-3 Taxonomy: six kinds of participant, eight kinds of help, words |
| S-20 Thread and inbox: accept, message, mark done, golden |  |  |  | S-4 App map: five tabs, sixteen screens, three stories, order of work |
| S-21 Grants screen: eight filters, a grant card, Apply leaves to the funder |  |  |  | S-5 Sign up: one green button, email behind a link |
| S-23 Directory: all six kinds, filter by kind, cause, city |  |  |  | S-6 Who are you here as: six kinds, button label follows the pick |
| S-24 Profile: one layout, six shapes |  |  |  | S-7 Find yours: list, words, and search follow the kind |
| S-25 Map: fewer controls at once |  |  |  | S-8 Confirm: email-domain match per kind, ways to confirm per kind |
| S-26 Legend and pin colors for six kinds |  |  |  | S-9 About you: a person says where they are, what they can do, and when |
| S-27 Golden threads for every kind of help; Together as a multi-ended thread |  |  |  | S-10 Phone fixes found along the way |
| S-28 You: behind your name in the top bar |  |  |  | S-11 Schools and districts from OSPI's public feature service |
| S-29 Casey needs laptops, trimmed to five steps |  |  |  | S-12 Workforce programs from the WA Workforce Board list |
| S-30 Dana has Saturdays |  |  |  | S-14 Needs and offers for all six kinds of help, plus people |
| S-31 Casey finds a grant |  |  |  | S-15 Three grants from real WA foundations' public pages, labeled as examples |
| S-32 Help sheet and story wrapper rewritten in the voice |  |  |  | S-16 One Together initiative |
| S-33 Design page rewritten to the mission |  |  |  | S-34 IRS Business Master File loaded |
| S-36 Pub 78 and revocation list, so IsActive is real |  |  |  | S-35 OSPI schools loader into a Schools table |
| S-37 Workforce programs list |  |  |  | S-53 Prototype, design brief, and how-it-works pages live |
| S-38 WA business lookup (UBI) for business confirmation |  |  |  | S-54 Roadmap page generated from roadmap.json |
| S-39 ASP.NET Identity replaces the X-Org-Ein header |  |  |  | S-62 Washington higher education: universities, community and technical colleges, private nonprofits |
| S-40 Claim an organization by kind, with the confirm methods from the taxonomy |  |  |  | S-65 Diagnose held-backspace on Android with docs/keytest.html and fix the real cause |
| S-41 Admin review queue |  |  |  |  |
| S-42 Kind of help on every need and offer |  |  |  |  |
| S-43 Cadence and standing agreements |  |  |  |  |
| S-44 P0 to P3 with the monthly P0 cap |  |  |  |  |
| S-45 Fair ranking: priority, then least seen, with the org cap |  |  |  |  |
| S-46 Capability tags and rule-driven alerts |  |  |  |  |
| S-47 Grant model with the eight filter fields and a hand-off URL |  |  |  |  |
| S-48 Leaflet and OpenStreetMap base map |  |  |  |  |
| S-49 Geocode IRS and OSPI addresses to street level |  |  |  |  |
| S-50 Confirm methods per kind, as designed in the taxonomy |  |  |  |  |
| S-51 Grants gated to confirmed organizations |  |  |  |  |
| S-52 Rate limits, reporting, and a review queue for posts |  |  |  |  |
| S-55 Replace Name TBD when the name goes public ⛔ |  |  |  |  |
| S-56 File for 501(c)(3) status |  |  |  |  |
| S-57 Blazor or React, decided after wireframe sign-off |  |  |  |  |
| S-58 Corporate giving platforms (Benevity and others), subject to APIs and agreements |  |  |  |  |
| S-59 Relabel non-district LEAs (ESDs, technical colleges, charters, tribal compacts) with their own sub |  |  |  |  |
| S-60 Render a funder's stated priorities as their quoted words, not our copy |  |  |  |  |
| S-61 Cluster circles and labels that stay readable at 900+ organizations (the B4 cap is a stopgap) |  |  |  |  |
| S-63 Decide whether WSU branch campuses become their own rows, as UW's are |  |  |  |  |
| S-64 A separate email-domain field for confirming, where it differs from the website host |  |  |  |  |

## Roadmap

### I-1 A prototype that shows the whole mission · In progress · 17/39 stories done

Every kind of participant and every kind of help, on a phone, in the approved voice. The thing to hand someone so they get it in a minute.

#### E-1 Direction on paper · Done · 4/4

Mission, voice, taxonomy, and app map written and approved before screens are built.

- **S-1** Mission statement saved and pointed at from the repo · Done
    - [x] T-1 Save the mission as written
    - [x] T-2 CLAUDE.md points every session at it
- **S-2** Voice sheet: ten rules and a words list · Done · round 0
    - [x] T-3 Draft and approve
    - [x] T-4 Save as docs/VOICE.md
- **S-3** Taxonomy: six kinds of participant, eight kinds of help, words · Done · round A1
    - [x] T-5 Draft and approve, with the three decisions (money off, grants one-way, Together seeded)
    - [x] T-6 Save as docs/TAXONOMY.md and update the words list
- **S-4** App map: five tabs, sixteen screens, three stories, order of work · Done · round A2
    - [x] T-7 Draft and approve
    - [x] T-8 Save as docs/APP-MAP.md

#### E-2 The front door · Done · 7/7

Sign up through confirm for all six kinds of participant.

- **S-5** Sign up: one green button, email behind a link · Done · round 1
    - [x] T-9 Brief, approve, build, check, ship
- **S-6** Who are you here as: six kinds, button label follows the pick · Done · round B1
    - [x] T-10 Three-card version (round 2)
    - [x] T-11 Six-card version with pinned button (B1)
- **S-7** Find yours: list, words, and search follow the kind · Done · round B2
    - [x] T-12 Nonprofit version with pinned button and fixed search (round 3)
    - [x] T-13 School, workforce, and foundation lists; business set-up form (B2)
- **S-8** Confirm: email-domain match per kind, ways to confirm per kind · Done · round B2
    - [x] T-14 Nonprofit version (round 4)
    - [x] T-15 All kinds, UBI check for businesses, anyone becomes the signed-in person (B2)
- **S-9** About you: a person says where they are, what they can do, and when · Done · round B3
    - [x] T-16 Brief: purpose, one action, every word
    - [x] T-17 Build after approval
    - [x] T-18 Check on a phone with real taps
    - [x] T-19 Ship: artifact, site, both repos
- **S-10** Phone fixes found along the way · Done · _Taylor's phone checks_
    - [x] T-20 Continue buttons pinned below the scroll, not at the end of it
    - [x] T-21 Bottom sheets clear the fixed story bar
    - [x] T-22 Text fields look like fields, not cards
    - [x] T-23 Buttons have a visible disabled state
- **S-65** Diagnose held-backspace on Android with docs/keytest.html and fix the real cause · Done
    - [x] T-31 Remove keytest.html and the ?keys=1 logging once the fix is confirmed on the plain URL

#### E-3 Seed data from real sources · Backlog · 6/9

Schools, programs, foundations, people, needs, offers, grants, and one Together, generated from public data where it exists.

- **S-11** Schools and districts from OSPI's public feature service · Done · _Discovery: OSPI ArcGIS service has 2,498 schools and 335 LEAs with lat/lon_
    - [x] T-24 scripts/fetch-schools.js pulls the service and writes a normalized seed (districts plus high schools)
    - [ ] T-25 District website domains from OSPI's directory download, for the email-domain confirm (Backlog)
    - [ ] T-26 Replace the seven hand-typed school rows (Backlog)
- **S-12** Workforce programs from the WA Workforce Board list · Done
- **S-13** Foundations flagged from the IRS list's foundation code · Backlog
- **S-14** Needs and offers for all six kinds of help, plus people · Done
- **S-15** Three grants from real WA foundations' public pages, labeled as examples · Done
- **S-16** One Together initiative · Done
- **S-59** Relabel non-district LEAs (ESDs, technical colleges, charters, tribal compacts) with their own sub · Backlog
- **S-62** Washington higher education: universities, community and technical colleges, private nonprofits · Done
- **S-63** Decide whether WSU branch campuses become their own rows, as UW's are · Backlog

#### E-4 The core loop · In progress · 0/4

Board, a need or offer, post, thread, inbox: the same flow for six kinds of help.

- **S-17** Board: kind-of-help chips, fair ranking, directory search at the top · In review · round B5
- **S-18** A need or offer: who it's from, how it fits you, I can help / I need this · Backlog · round B6
- **S-19** Post: kind of help first, then the rest · Backlog · round B7
- **S-20** Thread and inbox: accept, message, mark done, golden · Backlog · round B8

#### E-5 Grants · In progress · 0/3

Confirmed organizations search grants and leave to apply on the funder's site.

- **S-21** Grants screen: eight filters, a grant card, Apply leaves to the funder · Backlog · round B9
- **S-22** Grants tab shows only for confirmed organizations · In review
- **S-60** Render a funder's stated priorities as their quoted words, not our copy · Backlog

#### E-6 Directory and profiles · Backlog · 0/2

Find anyone here, joined or not; one profile layout for six shapes.

- **S-23** Directory: all six kinds, filter by kind, cause, city · Backlog · round B10
- **S-24** Profile: one layout, six shapes · Backlog · round B10

#### E-7 The map · Backlog · 0/4

The picture of threads and golden threads, with fewer controls and a legend for six kinds.

- **S-25** Map: fewer controls at once · Backlog · round B11 · _Taylor: too many buttons on screen at the same time_
- **S-26** Legend and pin colors for six kinds · Backlog · round B11
- **S-27** Golden threads for every kind of help; Together as a multi-ended thread · Backlog · round B11
- **S-61** Cluster circles and labels that stay readable at 900+ organizations (the B4 cap is a stopgap) · Backlog

#### E-8 You · Backlog · 0/1

Your profile, your posts, how often you're seen.

- **S-28** You: behind your name in the top bar · Backlog · round B12

#### E-9 The story guide · Backlog · 0/4

Three short stories that each end on the map.

- **S-29** Casey needs laptops, trimmed to five steps · Backlog · round B13
- **S-30** Dana has Saturdays · Backlog · round B13
- **S-31** Casey finds a grant · Backlog · round B13
- **S-32** Help sheet and story wrapper rewritten in the voice · Backlog · round B13

#### E-10 The design page · Backlog · 0/1

The mission, the six kinds, the eight threads, and the decisions, in the voice, on one page.

- **S-33** Design page rewritten to the mission · Backlog · round B14

### I-2 A backend that can run it for real · Backlog · 2/16 stories done

Real data, real accounts, real matching. The prototype's flows, made durable.

#### E-11 Data loads · Backlog · 2/5

Every list the app relies on arrives through a loader that produces one shape.

- **S-34** IRS Business Master File loaded · Done
- **S-35** OSPI schools loader into a Schools table · Done · _Discovery: OSPI ArcGIS feature service_
- **S-36** Pub 78 and revocation list, so IsActive is real · Backlog
- **S-37** Workforce programs list · Backlog
- **S-38** WA business lookup (UBI) for business confirmation · Backlog

#### E-12 Accounts and claiming · Backlog · 0/3

Real sign-in, one account per person, claiming an organization by kind.

- **S-39** ASP.NET Identity replaces the X-Org-Ein header · Backlog
- **S-40** Claim an organization by kind, with the confirm methods from the taxonomy · Backlog
- **S-41** Admin review queue · Backlog

#### E-13 Mission features in the backend · Backlog · 0/5

Kinds of help, cadence, priority levels, fair ranking, tags, alerts, threads.

- **S-42** Kind of help on every need and offer · Backlog
- **S-43** Cadence and standing agreements · Backlog
- **S-44** P0 to P3 with the monthly P0 cap · Backlog
- **S-45** Fair ranking: priority, then least seen, with the org cap · Backlog
- **S-46** Capability tags and rule-driven alerts · Backlog

#### E-14 Grants in the backend · Backlog · 0/1

Grant records, the eight filters, gating, and the hand-off link.

- **S-47** Grant model with the eight filter fields and a hand-off URL · Backlog

#### E-15 A real map · Backlog · 0/2

Base map tiles and street-level geocoding of every address.

- **S-48** Leaflet and OpenStreetMap base map · Backlog
- **S-49** Geocode IRS and OSPI addresses to street level · Backlog

### I-3 Trust · Backlog · 0/4 stories done

Everyone here is who they say they are. Grants only reach confirmed organizations. No spam, no fraud.

#### E-16 Confirmation per kind · Backlog · 0/3

Each of the six kinds has at least one way to prove they belong, and a person reviews the rest.

- **S-50** Confirm methods per kind, as designed in the taxonomy · Backlog
- **S-51** Grants gated to confirmed organizations · Backlog
- **S-64** A separate email-domain field for confirming, where it differs from the website host · Backlog

#### E-17 Spam and fraud · Backlog · 0/1

Rate limits, a review queue, reporting, and revocation.

- **S-52** Rate limits, reporting, and a review queue for posts · Backlog

### I-4 The public site · Backlog · 2/3 stories done

Where the idea-giver and early partners see progress: prototype, design brief, how it works, this roadmap.

#### E-18 GitHub Pages site · Done · 2/2

Prototype, design brief, how it works, and roadmap, phone-first, rebuilt from the repo.

- **S-53** Prototype, design brief, and how-it-works pages live · Done
- **S-54** Roadmap page generated from roadmap.json · Done
    - [x] T-27 roadmap/ directory with SDLC.md and roadmap.json
    - [x] T-28 scripts/roadmap.js: validate, render README, set status
    - [x] T-29 roadmap.html on the site, phone-first, board and roadmap views
    - [x] T-30 Taylor checks it on a phone

#### E-19 Going public with the name · Backlog · 0/1

Replace Name TBD everywhere when the name is announced.

- **S-55** Replace Name TBD when the name goes public · Backlog · ⛔ Taylor decides when the name is public

### I-5 The organization behind it · Backlog · 0/3 stories done

Decisions that aren't code: the name, the entity, the platform, the partners.

#### E-20 Form the 501(c)(3) · Backlog · 0/1

The entity that runs this as a community-impact organization.

- **S-56** File for 501(c)(3) status · Backlog

#### E-21 Pick the web framework · Backlog · 0/1

After wireframe sign-off, choose what the real app is built in.

- **S-57** Blazor or React, decided after wireframe sign-off · Backlog

#### E-22 Integrations · Backlog · 0/1

Corporate giving and volunteering platforms, once there's something to integrate with.

- **S-58** Corporate giving platforms (Benevity and others), subject to APIs and agreements · Backlog

