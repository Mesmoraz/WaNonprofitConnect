## 2026-10-04 · An empty board always says so

**Story:** S-103 (a fix to its empty-board line). Found by the acceptance tests on the names PR.

### What changed

- On a board with no posts at all, a new organization always sees "Nothing here yet. Post the first one?". Before, once its "Who they serve" picks loaded from its cause code, the line switched to "Nothing here with those filters", which isn't true when there's nothing to filter.
- "Nothing here with those filters. Clear them?" still shows when Needs or Offers is picked and nothing matches.

### Test cases

1. **[verified on this PR]** The fresh-database test passes: a food bank on an empty board sees "Nothing here yet. Post the first one?".
2. **[needs your phone]** On staging, Try as a new organization (RAINIER), with the board empty: the line reads "Nothing here yet."
