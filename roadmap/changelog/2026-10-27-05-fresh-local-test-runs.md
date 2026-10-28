## 2026-10-27 · Acceptance tests run locally on a fresh database, and the invite-code test has its own person (T-254)

### What changed

- **`npm run test:e2e:fresh`** (in `app/`) runs every acceptance test the way GitHub does: on an empty local database, `WaNonprofitConnect_E2E`, with the same 13 sample organizations. The everyday database had piled up posts, threads and test accounts from every run (164 waiting threads, 52,000 elements on Admin), which made the full local run slow (8 minutes; 3 on a fresh database) and Admin tests miss what they looked for.
- **A new CLI command, `reset-test-db`,** empties that database first. It refuses any database without E2E or Test in its name, so it can't touch `WaNonprofitConnect_Dev`, staging or production.
- **The invite-code test signs in its own person.** It expected a "Robin" with no organization, but other test files sign in a confirmed Robin first (the phone-width test from earlier today did, in the Board file), so in a full run it landed on Home. It now uses an email of its own, and so does that phone-width test.
- Nothing anyone sees in the app changes. `docs/CONTINUE.md` and `app/README.md` explain the new command.

### Test cases

1. **[verified]** `reset-test-db` on the everyday database refuses: "Not resetting WaNonprofitConnect_Dev: only a database with E2E or Test in its name."
2. **[verified]** On a fresh database, the Board and front-door tests pass together (8 passed), where the invite-code test failed before.
3. **[verified]** The whole suite with `npm run test:e2e:fresh`: 70 passed in 2.6 minutes, none skipped (the empty-board test runs too, since the database is empty).
