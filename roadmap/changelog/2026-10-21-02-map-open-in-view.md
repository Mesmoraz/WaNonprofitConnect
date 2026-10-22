## 2026-10-21 · The map counts what's open in view, lists it, and filters by kind of help (S-131)

**Story S-131,** built to the brief in docs/ALPHA-BRIEFS.md ("What's open in view"), approved Oct 21. It came from Taylor on Oct 20: the map should be "a place where people can intuitively see where there are available offers and available needs", and "more usable".

### What changed

- **A count at the top of the map:** "14 needs · 9 offers in view". It changes as you move or zoom.
- **Tap the count** and a list opens with one row per open post in view, nearest the middle of the map first. Each row shows its kind of help (amber for a need, green for an offer, like the pins), the title, the organization and the city. Tap a row to open the post.
- **Kind of help chips** under the count: All, Things, Time, Skills, For schools, Jobs and mentoring, Partnership. Pick one and the pins' rings, the count and the list show only that kind. Tap it again, or All, to go back.
- **When nothing is in view,** the list says "Nothing open in view. Move the map to see more."
- **New in the API:** `GET /api/v1/map/open`, every open post with its place.

Decided while building, beyond the brief, and written into it: need and offer colors on the row chips; the chips in the board's order; tapping a picked chip again goes back to All; and the toggles step aside while the list is open. On the roadmap, S-130 is marked done since PR #48 merged.

### Test cases

1. **[verified]** New API test: every open post comes back newest first, with its kind, kind of help and its organization's place.
2. **[verified]** New acceptance test `[S-131]`: at Ballard Food Bank, the count reads "… needs · … offers in view". The list has Ballard's new "Volunteer sorters" need, marked Time, and tapping it opens the post.
3. **[verified]** New acceptance test `[S-131]`: picking Things shows Ballard's milk crates and hides its drivers. All brings them back.
4. **[verified]** In the browser at phone size, in the demo: the count, the chips scrolling sideways, Things narrowing the list, and long names cut off on one line.
5. **[needs your phone]** On staging, open the Map. The count at the top changes as you pan and zoom.
6. **[needs your phone]** Tap the count. The list shows what's open nearest the middle first. Tap a row: the post opens.
7. **[needs your phone]** Pick Time. The rings, the count and the list show only Time. Tap All.
