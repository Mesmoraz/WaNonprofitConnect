## 2026-10-02 · Automated acceptance tests on every pull request

**Story:** S-113. From Taylor: "automated tests up and running to ensure functionality based off of acceptance criteria and road maps."

### What changed

- **13 acceptance tests** drive the real app and API in a phone-sized browser, each named after the roadmap stories it proves: the sign-in page and legal links, an invite code, a claim approved in Admin, posting by picking, the board and its kinds of help, directory search, one organization helping another all the way to a golden thread, one thread per post, times in UTC, the new-organization demo, and the map loading only when opened.
- **Every pull request runs them** on GitHub against a fresh SQL Server loaded with 13 real Washington organizations, alongside the 143 API tests. Staging only gets a build that passed both, so production does too.
- **Coverage by story:** each run's summary page shows which built alpha stories have a test (13 of 23 today) and which don't. `node scripts/acceptance.js` prints the same table.
- The SDLC now asks for each story's acceptance criteria to become a test named after it.

### Test cases

1. **[verified]** `npm run test:e2e` in `app/` against the local API and app: 12 pass, and the empty-board test skips on a database that has posts.
2. **[verified]** On this PR, the *acceptance* check is green, and its summary page shows the coverage table.
3. **[needs you]** Open any PR's checks, then *Deploy to staging* → Summary. The table lists stories with ✅ or ⬜.
