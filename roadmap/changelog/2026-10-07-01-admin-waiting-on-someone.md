## 2026-10-07 · Admin shows threads waiting on someone

**Story:** S-116. Brief approved by Taylor in PR #17 (Phase A briefs).

### What changed

- Admin has a new list, "Waiting on someone", under "Waiting for you". A thread shows there when it has waited 2 days for a yes, or has been accepted with no message for 7 days.
- Each row shows the need's title, then "{organization} hasn't answered · 3 days" or "Quiet since Sep 30", then each person at the organization it's waiting on, as "{name} · {email}". Tap an email to copy it.
- A quiet thread is waiting on whoever didn't write last. If no one has written since the yes, both organizations' people are listed.
- With nothing stalled: "Every thread is moving."

### Why

Until email notices exist, Taylor nudges people by hand. This shows who to nudge.

### Test cases

1. **[verified]** The service test: a thread started 3 days ago shows as unanswered and lists only the other side's confirmed people. A 1-day-old thread doesn't show. A thread accepted 9 days ago with no messages lists both sides. A thread with a message 2 days ago doesn't show. A done thread doesn't show. The longest waiting is listed first.
2. **[verified]** On Admin, "Waiting on someone" shows, and a thread started today isn't in it (acceptance test `[S-116]`).
3. **[needs your phone]** On staging, open Admin. Under "Waiting for you", see "Waiting on someone", and either rows or "Every thread is moving."
4. **[needs your phone]** If a row shows, tap an email. "Copied." appears, and pasting it gives the address.
5. **[needs your phone]** Make an invite code and approve a claim as before. Both still work.
