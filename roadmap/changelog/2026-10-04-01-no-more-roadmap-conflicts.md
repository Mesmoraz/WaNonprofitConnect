## 2026-10-04 · No more roadmap conflicts between pull requests

**From Taylor, Oct 4:** stop the roadmap conflicts.

### What changed

- Each change log entry is its own file in `roadmap/changelog/`, so two pull requests never edit the same lines. `node scripts/changelog.js` joins them, newest first, into `roadmap/CHANGELOG.md` on your machine.
- The generated board (`roadmap/README.md`) and the joined change log are no longer committed. The public site's roadmap page is unchanged.
- The roadmap no longer stores an "updated" date, the line every pull request rewrote.
- Every pull request now checks the roadmap and the change log, so a problem like Oct 3's duplicate task numbers fails the PR instead of reaching `main`.
- The database that doesn't pause stays in the backlog: Taylor chose the free one while it's a demo.

### Test cases

1. **[verified]** `node scripts/changelog.js` rebuilds all 40 earlier entries in the same order, with the same text.
2. **[verified]** `node scripts/roadmap.js` passes, and its board shows today's date.
3. **[verified on this PR]** The new check step is green.
4. **[needs you]** The next two PRs that both add a change log entry merge without a conflict.
