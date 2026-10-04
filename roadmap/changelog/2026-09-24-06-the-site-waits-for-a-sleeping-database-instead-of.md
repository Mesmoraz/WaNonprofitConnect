## 2026-09-24 · The site waits for a sleeping database instead of crashing

**Story:** S-75.

### What changed

- The Azure database is on the free serverless tier. It pauses after an idle hour and takes about a minute to wake. The app used to crash if it started while the database slept, which took the site down three times on Sep 24 (13:25, 15:48, 16:19 UTC). Now it waits up to about 3 minutes at startup, and every database call retries while it wakes.
- Starting a thread runs through the same retry, so it can't half-finish.
- Filters saved to your organization are live. The new table was created, which confirms Taylor's permission change worked.

### Test cases

1. **[verified]** Start a thread against real SQL Server with retries on. → 201, the thread exists.
2. **[verified]** The live filters endpoint answers "sign in first" (401), not "not found".
3. **[needs your phone]** Leave the site alone for over an hour, then open it. → It loads, maybe a little slowly the first time, not an error.
