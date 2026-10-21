## 2026-10-20 · The demo stays signed in on Admin, and a demo link isn't a place to return to (S-133)

**Story S-133,** found in the Oct 20 polish walk (phone width, every demo preset). Two bugs, no new words.

### What changed

- **Admin in the demo no longer signs you out.** The feedback list always comes from the real server, even in the demo. When the real server said no (signed out there, or `npm run dev:mock` with the API running), the app took it as the demo's session ending and sent you to sign up. Because /admin was also remembered as where to return, every later visit did the same.
- **A demo link isn't kept as where to return.** Opening `/?demo=new-org` signed out remembered it, so after the invite code you landed on `/?demo=new-org`, and a reload started the demo over. Home, with or without a query, is no longer remembered: you land on plain Home.
- Roadmap: two more things from the walk, each to be briefed (S-134, the empty board's "0 open · 0 done"; S-135, an edited count keeping an old unit, "2 unit").

### Test cases

1. **[verified]** In `npm run dev:mock` with the API running, as an admin in the Busy demo: open Admin. It stays on Admin ("Demo" section showing) though the feedback call is refused. Before the fix it went to "Join Helpbook".
2. **[verified]** New acceptance test `[S-107] [S-133]`: open `/?demo=new-org` signed out, sign in, reload: you're on `/`. The full acceptance suite passes.
3. **[needs your phone]** On staging, start the demo from your name menu, then open Admin. You stay in the demo on Admin, and the feedback list shows as before.
