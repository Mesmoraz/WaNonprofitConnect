## 2026-10-27 · Acceptance tests: a second person opens the same app as the first (T-223, T-243)

### What changed

- **Tests with two people now run locally without setting `BASE_URL`.** The second person's browser defaulted to port 5173 (the Vite dev server) while the tests run against the API on 5253, so any test with a second person failed unless `BASE_URL=http://localhost:5253` was set. Every test now takes the address from one place, `BASE_URL` in `app/e2e/helpers.ts`, with the same default as `playwright.config.ts`.
- Nothing anyone sees in the app changes.

### Test cases

1. **[verified]** With no `BASE_URL` set, the Board and Your organization acceptance tests, which each sign in a second person, pass locally (6 passed, 1 skipped as before).
2. **[verified]** CI still sets `BASE_URL` itself, so its runs are unchanged.
