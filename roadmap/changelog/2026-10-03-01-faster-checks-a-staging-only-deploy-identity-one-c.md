## 2026-10-03 · Faster checks, a staging-only deploy identity, one command for local tests

**Story:** S-115, and S-114 for the deploy identity. PR #12. From the Oct 2 developer-workflow audit.

### What changed

- PR checks reuse downloaded browsers and .NET packages, and start the test database while everything builds.
- Lint runs on every PR.
- Staging deploys sign in to Azure as their own identity, which can only deploy the staging site.
- "Deploy to production" only ships a build from a push to `main` whose commit is on `main`.
- Deploys wake a sleeping database first.
- Node 22.12 or newer is required and checked (`.nvmrc`, `engines`, `engine-strict`). Taylor upgraded this machine to 22.23.2 on Oct 2.
- `npm run test:e2e:local` in `app/` builds the app, starts the API and runs the acceptance tests.
- The map test retries its tap instead of a fixed wait. GitHub actions are current.
- `docs/CONTINUE.md`, `docs/OPERATIONS.md` and `app/README.md` are rewritten.

### Test cases

1. **[verified]** The PR's build (with lint) and acceptance checks pass.
2. **[verified]** The first deploy from `main` after merging signs in with the staging identity and passes its health check.
3. **[verified]** On Node 22.23.2, `npm ci`, `npm run build` and `npm run lint` work locally.
4. **[needs you]** Actions → Deploy to production: it prints the merged commit and the real site still works.
