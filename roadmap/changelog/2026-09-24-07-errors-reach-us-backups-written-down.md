## 2026-09-24 · Errors reach us; backups written down

**Story:** S-91.

### What changed

- **Browser errors are reported.** A script error or a crashed screen on anyone's device is sent to the server log, with the page and the browser, at most 5 per page load.
- **A crashed screen says so.** "That didn’t work. Reload the page" instead of going blank.
- **Server errors carry a reference.** An unexpected error answers "That didn’t work. Try again." with a traceId, and the log line has the same id.
- **One command shows recent errors:** `powershell -File scripts/errors.ps1`.
- **Backups:** Azure keeps 7 days of point-in-time restore automatically. How to restore is in `docs/OPERATIONS.md`, with deploying and reading errors.

### Test cases

1. **[verified]** Throw a test error in the browser. → It appears in the server log as "Client error (error) on /: …", with the stack.
2. **[verified]** A test error report without signing in is accepted (a new test).
3. **[needs your phone]** Nothing to tap: tell me if a screen ever shows "That didn’t work. Reload the page", and I'll find it in the log.

### Found along the way

- App output wasn't being saved to the log files today; container logging to the file system is now on.
- A restart while the database was waking still crashed the site (18:09 UTC): the retry checked only the innermost error, a reset connection, not the database error around it. It now looks through the whole chain, and Azure allows the app 10 minutes to start instead of about 140 seconds.
- Checked end to end on the live site: a test error sent from outside appears in the log, and `scripts/errors.ps1` finds it.

### New line, for approval

- Crash screen: "That didn’t work. Reload the page" ("Reload the page" is the link).
