## 2026-09-24 · No more silent blank screen while the site wakes

**Story:** S-91. From Taylor: after leaving the demo, the site was completely blank.

### What changed

- While the app finds out who you are, it used to show nothing at all. After a quiet hour (the database waking) or during a restart, that could last a minute and look broken. Now, after 2 seconds, it says "Waking up. The first visit in a while can take a minute."
- The page itself is always checked with the server, so a new version is seen at once. The app's code files, which never change once built, are kept by the browser for a year.
- No error reached the log from Taylor's browser, so this was a wait, not a crash.

### Test cases

1. **[verified]** The page is served with "no-cache" (a new test).
2. **[needs your phone]** Open the site after an hour away. → "Waking up. The first visit in a while can take a minute." then the app.

### New line, for approval

- "Waking up. The first visit in a while can take a minute."
