## 2026-10-06 · Who they serve shows everyone while the board is small

**Story:** S-108. Brief approved by Taylor in PR #17 (Phase A briefs).

### What changed

- While the board has fewer than 30 open posts, "Who they serve" starts with nothing picked, so you see every organization's posts instead of only the ones your cause code matches.
- The line under the chips reads "Showing everyone while the board is small. Tap to narrow it." At 30 posts, or once you pick a group, it goes back to "Set from your organization's cause code. Tap to change."
- Picks your organization already saved are kept and still apply. Only the starting picks from your cause code wait until the board is bigger.

### Test cases

1. **[verified]** In the demo as Rainier Valley Food Bank (cause code Food), open Filters: no group is picked and the line reads "Showing everyone while the board is small. Tap to narrow it." (acceptance test `[S-108]`)
2. **[verified]** No "more outside your filters. Show them" line under the board.
3. **[verified]** Tap Food: it turns on, and the line changes to "Set from your organization's cause code. Tap to change."
4. **[verified]** On a board with more than 30 open posts (75 locally), the line stays "Set from your organization's cause code. Tap to change."
5. **[needs your phone]** On staging, Admin, then Try as a new organization, code RAINIER, then Board, then Filters: steps 1 to 3 on your phone.
6. **[needs your phone]** On staging as your own organization: if your organization never saved picks, Filters shows nothing picked and every post on the board.
