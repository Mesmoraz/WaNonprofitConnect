## 2026-09-22 · Artifact v29 · B4: real seed data for every kind

**Stories:** S-11, S-12, S-14, S-15, S-16 (seed data), round B4.

### What changed

- **The app now holds 946 organizations**, up from 47: 335 school districts and 520 high schools from OSPI, 12 workforce boards and 35 WorkSource centers, 5 foundations, 32 nonprofits, 3 example businesses, and 4 people.
- **14 new needs and offers** cover Time, Skills, Partnership, For schools, and Jobs and mentoring, so every kind of help in the taxonomy has something real behind it. Two existing posts were retagged to their true kind.
- **The three verified grants** and **one Together initiative** (South Seattle winter coat drive) are loaded, though no screen shows them yet.
- **Seeds are generated, not typed.** `scripts/build-seeds.js` writes the data block from `docs/seeds/*.json`; the hand-typed rows are gone.
- **Scalable by level.** One line in that script (`LEVELS`) turns on middle schools, elementary schools, universities, or community colleges. Nothing in the app keys off the level, only off the participant type.
- Map cluster circles are capped so dense areas read as counts rather than blobs.

### Why

Taylor approved the 18 seeded titles and asked that schools scale to universities, middle schools, and elementary schools.

### Test cases

1. **[needs your phone]** Sign up → **A school or district** → **Find my school** → type `ballard high`. → One result: "Ballard High School", Seattle. **[verified]**
2. **[needs your phone]** Same screen, type `seattle public`. → "Seattle Public Schools · Seattle · District". **[verified]**
3. **[needs your phone]** Back → **A workforce program** → type `workforce southwest`. → "Workforce Southwest Washington". **[verified]**
4. **[needs your phone]** Go to **Board**. → Posts include "Career day speakers, March 12", "Three apprenticeships this fall", and "A sponsor for our summer meals program". **[verified]**
5. **[needs your phone]** Go to **Map**. → Circles show counts (about 109 around Seattle) rather than one large blob, and the map still pans and zooms. **[verified]**
6. **[needs your phone]** The app should still open in about a second. It is now 293 KB, up from 139 KB.
7. **[needs your phone]** Just me → Set up my profile → tap **City or ZIP**. → The place list still works. **[verified]**

### Known and deliberate

- The board still shows everything in one list; kind-of-help chips are round B5.
- Grants and the Together initiative are loaded but not reachable until B9 and B11.
- The map cluster cap is a stopgap so it stays readable at this scale; the map redesign is B11.
