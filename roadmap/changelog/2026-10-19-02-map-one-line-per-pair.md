## 2026-10-19 · The map draws one fuller line per pair of places, with sparks, a number, and confetti (S-127)

**Story S-127,** built to the brief Taylor approved on Oct 19 (docs/ALPHA-BRIEFS.md, "Map threads, one line per pair"). Taylor, on the busy lines in Home's small map: "instead of adding MORE lines we make the lines look different if there are multiple connections", something "juicy".

### What changed

- **One line per pair of places.** Every thread between the same two pins is one curve now, in the color of the furthest along. Before, each one fanned out as its own line.
- **Fuller with each thread:** the line gets thicker (up to 5), a bright spark runs along it for each thread (up to 5) the way the help goes, and golden lines glow stronger the more golden threads they carry.
- **A number in the middle** of any line that carries more than one.
- **Confetti** pops at both pins when a thread turns golden while you're looking at the map. Not when your phone asks for reduced motion.
- **Tap a line with a number** between two organizations: a card "{Org A} and {Org B}" lists each thread with where it stands (Golden, In progress, Waiting for a yes, Could fit). Tap one to see it. A line to a cluster opens the cluster.
- **The legend** says: "A thicker line with a number is several threads between the same two places."
- **The legend waits for the map.** It opens by itself only once the map has loaded. Its new line made it tall enough to cover "The map didn't load. Try again?" on a phone.

### Test cases

1. **[verified]** New acceptance test `[S-127]`: two threads between Rebuilding Together Seattle and Hopelink are one line carrying both; tapping it opens "Rebuilding Together Seattle and Hopelink" with a "Waiting for a yes" row for each, and a row opens that thread's card.
2. **[verified]** New acceptance test `[S-127]`: when Hopelink accepts and marks a thread done from their phone, the map open on the other phone pops confetti.
3. **[verified]** In the browser at phone size: the Seattle to Olympia line that had fanned into 22 lines is one line with "22"; a line to a cluster zooms into it; the card scrolls when it has many rows.
4. **[needs your phone]** On staging, open the Map. Lines between the same two places are single, with a number when there are several, and sparks running along them.
5. **[needs your phone]** Tap a line with a number between two organizations. The card lists the threads. Tap one: its own card opens.
6. **[needs your phone]** With the Map open on your phone, have someone mark a thread with you done. Confetti pops at both pins.
7. **[needs your phone]** Open Home (once PR #40 is in). The small map shows the same single lines.
