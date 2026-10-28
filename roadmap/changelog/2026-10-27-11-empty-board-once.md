## 2026-10-27 · The empty board says it's empty once (S-134)

Built to the brief "Three small fixes from the friction list", approved Oct 27 (Taylor: "Approve #70").

### What changed

- **With no open posts and none done, the count above the board goes.** It said "0 open · 0 done" right above "Nothing here yet. Post the first one?", so the board said it was empty twice. Filters stays where it is, on the right.
- **With any post open or done, the count shows as before,** "0 open · 3 done" included.
- No new words.

### Test cases

1. **[verified]** The empty-board acceptance test (runs on a fresh database) now also checks there's no count and Filters is still there. New `[S-134]` test: once something is posted, the count shows. The whole suite on a fresh database: 75 passed. 270 API tests pass.
2. **[needs your phone]** Admin → Demo → "Empty board" → Show this demo, then the Board: "Nothing here yet. Post the first one?" with no "0 open · 0 done" above it.
3. **[needs your phone]** On staging's real board: the count still shows.
