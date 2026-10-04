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
