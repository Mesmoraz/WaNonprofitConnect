## 2026-10-28 · A golden thread links to the map, opened on that thread (S-149)

Taylor, Oct 28, on a golden thread: "this should be a link back to the map to see the golden thread". Brief approved in chat ("and approve").

### What changed

- **A golden thread says "Done. This is a golden thread. See it on the map".** "See it on the map" is the link.
- **The map opens on that thread:** zoomed to its two organizations, the golden line between them, and the thread's card open (the card you get when you tap a line, with Open thread). The line sits above the middle, so the card doesn't cover either end: across Seattle it opens close in, from Seattle to Spokane it opens on the state.
- The link is `/map?thread={id}`. A thread that isn't on the map (not golden, or gone) opens the map as usual.
- Not in this round: the same link on a golden thread's row in the Inbox.

### Test cases

1. **[verified]** The golden thread acceptance test (S-18) now follows "See it on the map": the map opens with the thread's card, Golden and the need's title on it, and Open thread leads back. The whole suite on a fresh database: 75 passed.
2. **[verified]** Screenshots at phone size: Ballard to the Tool Library opens on Seattle with both ends above the card; Ballard to Spokane opens on the state with the whole line showing.
3. **[needs your phone]** On staging, open a golden thread, tap "See it on the map": the map opens on the two organizations, the golden line between them, the card open.
