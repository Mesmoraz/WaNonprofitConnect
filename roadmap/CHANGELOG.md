# Change log

Newest first. Every shipped change lands here with test cases Taylor can run on a phone. Rules: `SDLC.md`, section "Change log and test cases".

---

## 2026-09-23 · Azure alpha deployed

**Story:** S-75.

### What changed

- The React app, API, SignalR hub, and Azure SQL database are live at [helpbook-alpha.azurewebsites.net](https://helpbook-alpha.azurewebsites.net).
- The app connects to SQL with its managed identity. The temporary firewall access from Taylor’s computer has been removed.
- Google sign-in still needs the OAuth client ID before people can sign in.

### Why

Taylor upgraded the Azure account and asked to finish the backend setup.

### Test cases

1. **[needs your phone]** Open `https://helpbook-alpha.azurewebsites.net`. → The sign-up page loads over HTTPS.
2. **[needs your phone]** Open `https://helpbook-alpha.azurewebsites.net/signup` directly. → The sign-up page loads after a refresh.

## 2026-09-23 · Artifact v35 · B5.1: the card and the filters

**Story:** S-67, round B5.

### What changed

- **Priority reads in plain words, and most posts carry none.** Critical is **Urgent**, High is **This week**, and the two lower levels show no mark at all. Six of the fifteen open needs are marked; the other nine are clean.
- **No more doubled priority.** The `P1` pill and the grey `P1 · seen 1×` line underneath were saying the same thing twice. The grey line now appears only when it says something surprising: the fair-rotation slot, or a post that is being lifted for being under-seen.
- **The card has three clear lines**: the title, then the organization on its own line, then one grey line of facts — city, how many, how often, how long ago. The organization used to be buried mid-sentence and wrapped.
- **NEED and OFFER keep the strongest pill**, since that is the distinction that matters most.
- **Kinds of help now look like navigation, not filters.** That top row is a segmented selector with the active one underlined, and it no longer counts towards "Filters".
- **The filter sheet is grouped under labels**: What, Who, How far. The two rows of pills were reading as one category.

### Why

Taylor: the board "feels a little busy still like too much text", `P1` was on the card twice and meant nothing to a reader, and the two chip groups "look the same aesthetically" while doing different jobs.

### Test cases

1. **[needs your phone]** Open the **Board**. → Cards read: NEED (and This week only when urgent), title, organization, then "Spokane · 15 employers · 12h". No `P1`, no "seen 1×". **[verified]**
2. **[needs your phone]** Look down the list. → Most cards have only the NEED or OFFER pill. **[verified]**
3. **[needs your phone]** Tap **Time** in the top row. → It underlines, three posts show, and the Filters link still reads just "Filters". **[verified]**
4. **[needs your phone]** Tap **Filters**. → Three labelled groups: What, Who, How far. **[verified]**
5. **[needs your phone]** Open any post. → Under the title it says "Needed this week" or "Needed this month" as a sentence, with no stray punctuation. **[verified]**
6. **[needs your phone]** Tap **Post** and open the urgency list. → "Urgent · can’t operate without it (0 of 2 used this month)", "This week · needed this week", "Needed this month", "Whenever it works". **[verified]**

### Known and deliberate

- `docs/TAXONOMY.md` and `docs/VOICE.md` were updated: they said "P0 to P3, with its meaning beside it", which is no longer true.
- The seeded data leans towards High, so "This week" shows on about 4 in 10 open needs. If that starts to feel like noise, the fix is the seed data, not the design.
- The Post screen was touched only where it printed the old labels; its own round is B7.

---

## 2026-09-22 · Artifact v34 · Opening a search result no longer freezes the app

**Story:** S-66, round B5.

### What changed

- **Tapping an organization in search works.** The app was turning an EIN like `911428805` into a number, failing to find the organization, and throwing part-way through drawing the screen. Everything after that point stopped responding.
- **The stuck welcome message was the same bug.** The message clears itself after a few seconds, but the code that clears it never ran once the screen had failed, so it sat on top of the tab bar. With the crash fixed it disappears on its own; it can also be tapped away.
- **The message now sits above the tab bar** rather than over it. It was measured against the taller phone-width bar, not guessed.
- **A screen that fails can no longer freeze the app.** If one ever throws, it returns to the board instead of leaving a dead picture on screen.

### Why

Taylor: "Selecting an option from the search seems to freeze the app, the You’re in Welcome message doesn’t disappear and blocks the bottom menu."

The fault predates round B5 — the old Orgs list had the same link — but the board search is what made it easy to reach.

### Test cases

1. **[needs your phone]** Board → search `ballard` → tap **Ballard Food Bank**. → Its page opens. **[verified]**
2. **[needs your phone]** Search `ballard` → tap **Ballard High School**. → The school’s page opens. **[verified]**
3. **[needs your phone]** Search `seattle foundation`, `worksource`, `dana`, and a university, and open each. → All open. **[verified]** (all six kinds checked)
4. **[needs your phone]** Sign up fresh and reach the board. → The welcome message sits above the tabs, all five are readable, and it vanishes after a few seconds. **[verified]**
5. **[needs your phone]** Tap the message while it is showing. → It disappears. **[verified]**

---

## 2026-09-22 · Artifact v33 · B5: the Board

**Stories:** S-17 (board), S-22 (grants tab), S-23 (directory search), round B5.

### What changed

- **Kinds of help replace the category dropdown.** One sideways-scrolling row: All, Things, Time, Skills, For schools, Jobs and mentoring, Partnership, Together.
- **Search everyone here** sits at the top. Two characters or more replaces the board with organizations and people, by name or EIN; clearing it brings the board back. This is the old Orgs tab, where people actually look for it.
- **Five tabs**: Board, Map, Post, Grants, Inbox. Grants only appears for organizations, so someone signed up as "Just me" sees four.
- **Your name in the top bar opens your own page** instead of the perspective switcher, which now lives on that page.
- The two big post buttons are gone (the Post tab does that), the count line reads "31 open · 3 done", and the ranking paragraph is one line: "Urgent first, then whoever’s been seen least."
- Empty states offer the next step: "Nothing under Together yet. Post the first one?" and "Nothing here with those filters. Clear them?"
- The Grants tab exists but says "Nothing here yet" until round B9.

### Test cases

1. **[needs your phone]** Open the **Board**. → A search field, one row of chips, "31 open · 3 done", then the posts. No big buttons at the top. **[verified]**
2. **[needs your phone]** Tap **For schools**. → Four posts: career day speakers, a shop field trip, robotics mentors, a design workshop. The Filters link reads "Filters · 1". **[verified]**
3. **[needs your phone]** Tap **Together**. → "Nothing under Together yet. Post the first one?" **[verified]**
4. **[needs your phone]** Tap **All**, then type `ballard` in the search. → Ballard Food Bank and Ballard High School. **[verified]**
5. **[needs your phone]** Type `zzzz`. → "No one by that name. Try an EIN." **[verified]**
6. **[needs your phone]** Clear the search, tap **Grants**. → The Grants page with "Nothing here yet". **[verified]**
7. **[needs your phone]** Tap your name in the top bar. → Your own page, with "Switch perspective" on it. **[verified]**
8. **[needs your phone]** Switch to a person (your page → Switch perspective → Dana). → The Grants tab disappears and four tabs remain. **[verified]**

### Known and deliberate

- The standalone Orgs screen still exists behind the search results; B10 folds it in properly along with the profile layout.
- The Together initiative still has no post of its own, so that chip is empty until B11.
- The old categories (Materials, Equipment, Food) survive as tags on each post; only the filter changed.

---

## 2026-09-22 · Artifact v32 · Scaffolding removed, build stamp added

**Stories:** S-9, S-65 (held backspace), round B3.

### What changed

- The diagnostic page and the `?keys=1` logger are gone from the app and the site.
- **The help sheet now shows a build stamp**, filled in when the site is built. Tap **?** and read the bottom line.

### Why, and what was actually wrong

Backspace is confirmed working on the plain URL, but **no defect was ever found**. Nothing in the app changed between the last "still stuck" report and the confirmation except adding a logger that only observes. The likeliest explanation is that the earlier tests loaded a cached copy of the page, before the fix reached the phone.

Three changes were shipped for this bug and described as fixes. A seven-case diagnostic page then showed every case working, including a replica of the app shell, which disproved all three theories. The build stamp exists so a stale page can be spotted in one glance rather than costing another round.

### Test cases

1. **[verified]** The app carries no debug overlay and the place dropdown still filters (`sea` gives Seatac and the Seattles).
2. **[verified]** Tap **?** in the app. → The last line reads "Build" and a date.
3. **[needs your phone]** Hold backspace in **Your name** and in **City or ZIP**. → Both clear all the way.

### Standing rule

Held-key behaviour cannot be verified in Claude’s browser pane, which cannot synthesise a native held key. It is always marked **[needs your phone]**, and an unverified change is never announced as a fix.

---

## 2026-09-22 · Artifact v31 · Held backspace no longer sticks

**Story:** S-9 (About you), round B3.

### What changed

- **Typing does no layout work.** Holding backspace used to rebuild the place suggestion list on every repeat; the list growing and shrinking under the field is what made the key stick on Android.
- The list of places is now built once instead of rescanning all 995 organizations per keystroke, the suggestion box is only touched when its contents actually change, and rapid keys are held until they stop (about a seventh of a second) before the list updates.
- The save button is likewise only rewritten when it actually changes.

### Why

Taylor: "holding the backspace button gets stuck." This was made worse by the seed data landing: the suggestion list was scanning every organization on every keystroke, and there are now 995 of them.

### Test cases

1. **[needs your phone]** Just me → Set up my profile → type something into **City or ZIP**, then hold backspace. → The text clears smoothly and the field keeps up. This is the one that was broken.
2. **[needs your phone]** Hold backspace in **Your name**. → Same.
3. **[needs your phone]** Tap **City or ZIP** and type `tac`. → After a moment, eight Tacoma entries appear. **[verified]**
4. **[needs your phone]** Tap one. → The field fills and the list closes. **[verified]**
5. **[needs your phone]** Tap **Driving**, then save. → The board opens as that person. **[verified]**

### Measured

13 rapid keystrokes now cause **0 writes** to the suggestion list and take 1.2 ms in total, against one full rebuild per keystroke before.

---

## 2026-09-22 · Artifact v30 · Universities and colleges

**Story:** S-62 (higher education seed), round B4.

### What changed

- **49 higher-education institutions** joined the app: 8 public four-year campuses (including UW Bothell and UW Tacoma), 34 community and technical colleges, and 7 private nonprofit universities and colleges. The app now holds 995 organizations.
- They are the same participant type as K-12 schools, so **A school or district** finds all of them with no new screen or code.
- **48 of the 49 carry real coordinates**, from the federal NCES geocoded campus locations, so they sit correctly on the map today rather than waiting for the geocoding step.

### Why

Taylor asked that schools scale to universities, middle schools, and elementary schools. Universities and colleges are switched on; middle and elementary remain one line away in `scripts/build-seeds.js`.

### Test cases

1. **[needs your phone]** Sign up → **A school or district** → **Find my school** → type `university of washington`. → Three results: Seattle, Bothell, Tacoma, each labelled "University". **[verified]**
2. **[needs your phone]** Type `cascadia`. → Two high schools and "Cascadia College · Bothell · Community college" together in one list. **[verified]**
3. **[needs your phone]** Type `whitman`. → "Whitman College · Walla Walla · Private college", not "university". **[verified]**
4. **[needs your phone]** Type `evergreen`. → Two districts, three high schools, and "The Evergreen State College · Olympia · College". **[verified]**
5. **[needs your phone]** The app should still open quickly. It is now 302 KB.

### Known and deliberate

- **UW has its branch campuses as their own rows; WSU does not.** WSU Vancouver, Tri-Cities, Spokane and Everett exist in the same federal source and could be added the same way. Taylor decides whether the two should match.
- `domain` is each institution’s website host, which is not always the staff email domain (Spokane’s colleges and the UW branches especially). Confirming by email domain may need a second field.
- Yakima Valley College carries a PO Box ZIP from the federal source; its coordinates are the physical campus.
- Only main campuses are included for the community and technical colleges.

---

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

---

## 2026-09-22 · Artifact v28 · About you: a real dropdown for City or ZIP

**Story:** S-9 (About you), round B3.

### What changed

- **City or ZIP now shows a real dropdown.** Tapping the field lists nearby places; typing filters them; tapping one fills the field and closes the list.
- The old approach used the browser's own `datalist`, which Android does not draw as a dropdown. It pushed the options into the keyboard's suggestion strip instead, with nothing on screen to say where they came from.

### Why

Taylor's phone check: "The carrot in the City or Zip doesn't make a drop down on my phone, I see options on my keyboard on android, but it isn't clear where those are coming from."

### Test cases

1. **[needs your phone]** Sign up → Just me → Set up my profile. Tap **City or ZIP**. → A list appears under the field, starting with "Bellingham 98225".
2. **[needs your phone]** Type `spo`. → The list narrows to four Spokane entries (99201, 99202, 99217, 99220). **[verified]** in the browser pane.
3. **[needs your phone]** Tap **Spokane 99202**. → The field fills with "Spokane 99202" and the list closes. **[verified]**
4. **[needs your phone]** Tap **Driving**, then **Save and go to the board**. → The board opens and the toast reads "You're in. Welcome, Dana." **[verified]**
5. **[needs your phone]** Go back into the field and hold the delete key. → The text clears continuously, not one character per press. *Claude cannot verify this one: the browser-automation tool does not perform the native delete, though the key event does reach the page un-blocked.*
6. **[needs your phone]** Type a place that matches nothing, like `zzz`. → No list appears, and the field keeps what you typed.

---

## 2026-09-22 · Artifact v27 · About you: four fixes from the phone check

**Story:** S-9 (About you), round B3.

### What changed

- **Holding delete now repeats.** Typing no longer redraws the screen, so the field is never replaced mid-keystroke.
- **Typed text counts on its own.** Anything in "Something else?" enables **Save and go to the board** without tapping a tag first.
- **A typed entry becomes a tag.** **Add**, or Enter, turns it into a chip beside the built-in ones, already picked, with a × to take it off.
- **"When" is gone.** People can be flexible.
- The button under the form reads "Fill in the top two" until it is ready.

### Why

All four came from Taylor's phone check of v26.

### Test cases

1. **[verified]** Just me → Set up my profile. → No "When" section between the tags and "Causes you care about".
2. **[verified]** Type "Beekeeping" into **Something else?** without tapping anything. → The save button turns green.
3. **[verified]** Tap **Add**. → "Beekeeping ×" appears as a selected tag with the others; the field clears.
4. **[verified]** Tap the "Beekeeping ×" tag. → It disappears from the list.
5. **[needs your phone]** Hold delete in **Your name**. → The text clears continuously. *Not verifiable in the automation pane; see the entry above.*

---

## 2026-09-22 · Artifact v26 · About you (new screen)

**Story:** S-9 (About you), round B3. First build of the screen for people who sign up as "Just me": name, place, what they can do, causes. Saving creates the person and opens the board.

Also: the role screen's "Demo: this path isn't built yet" line was removed, because all six paths now exist.

### Test cases

1. **[verified]** Sign up → **Just me** → the button reads "Set up my profile".
2. **[verified]** Fill name, place, and one tag → the button reads "Save and go to the board" → tapping it opens the board as that person.
3. **[verified]** No path on the role screen shows a "not built yet" note.
