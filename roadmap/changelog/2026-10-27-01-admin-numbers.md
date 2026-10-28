## 2026-10-27 · Admin shows how the alpha is going: the six numbers, real organizations only (S-100)

**Story S-100,** built to the brief in docs/ALPHA-BRIEFS.md ("How it's going (Admin)"), approved with PRs #26 and #28. Taylor answered its three questions on Oct 27, each with the recommended answer: wait before counting young posts and organizations, leave out threads an admin started while testing, and count declined, cancelled and month-old threads as not golden.

### What changed

- **"How it's going" is the first section on Admin.** A totals line ("492 posts · 0 threads started · 0 accepted · 0 golden"), then six rows, each with the number large, what it counts, and its goal in grey:
  1. Golden threads this month. Goal: 3 by Oct 31, then 3 a month.
  2. Posts that got a thread within 14 days. Goal: 1 in 3.
  3. Typical wait for a first answer ("40 minutes", "5 hours", "2 days"). Goal: under a day.
  4. Threads that became golden. Goal: half.
  5. Organizations that posted a need and an offer in their first week. Goal: 8 in 10.
  6. Organizations that have both given and received. No goal.
- **A row with nothing to count yet says "None yet".** Under the rows: "Counts real organizations only. The demo isn't counted."
- **Real organizations only.** An organization counts once a real person is confirmed there. People from "Test as this organization" and the development sign-in don't count. A thread counts when both sides are real and an admin didn't start it.
- **Each new thread now records the person who started it** (a new database column). That's how a thread you start while testing is left out. Threads from before this change don't have it, so they still count.
- **The months follow Seattle time.** A thread marked done at 9 pm on Oct 31 counts in October.
- **A new admin-only API route,** `GET /api/v1/admin/numbers`. The demo gets the same section with nothing counted.

Needed to make it true, beyond the brief: the totals line says "1 post" and "1 thread started" when there's only one.

**This PR changes the database** (migration `AddThreadStartedBy`, one new nullable column on `Matches`). If it goes on staging and is then closed, staging's database keeps the column, which does no harm.

### Test cases

1. **[verified]** New API tests (`AlphaNumbersTests`): each of the six rows, an empty database showing "None yet" everywhere, months in Pacific time, a first answer that ignores the starter's own messages, young posts not counted yet, declined and month-old threads counted as not golden, and test organizations and admin-started threads left out. All 267 API tests pass.
2. **[verified]** New acceptance tests `[S-100]`: "How it's going" is the first section, with the totals line, six rows, their goals, and the line about the demo. Someone who isn't an admin gets a 403 from the route. All 66 acceptance tests pass locally (2 skipped, as before).
3. **[verified]** In the browser at phone width, light and dark: the six labels line up whatever the widest number is, and the page doesn't scroll sideways.
4. **[needs your phone]** On staging, open Admin. "How it's going" is at the top, above Demo, with the totals line and six rows.
5. **[needs your phone]** The first row says "Golden threads in October" and "Goal: 3 by Oct 31". After Nov 1 it says November and "Goal: 3 a month".
6. **[needs your phone]** Scroll down. Demo, Invite codes, Waiting for you, Waiting on someone and Feedback are all still there, in the same order.
