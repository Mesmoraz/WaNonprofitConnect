## 2026-10-02 · Tests for every built alpha story

**Story:** S-113. From Taylor: "write the missing tests."

### What changed

- **9 more acceptance tests**, so every built alpha story has at least one: the base map loads from OpenFreeMap; the map data puts organizations in Washington; tapping an organization's pin opens its card and then its page; the name comes from `brand.json` and the app installs to a home screen; tabs along the bottom on a phone and a rail on a desktop, with no sideways scroll; one address serves the app, the API and deep links, and a reload keeps your place; the Staging tag shows on a staging address and never on the real one; feedback from the name menu reaches Admin; a browser error is reported to the server.
- **The API tests now say which story they prove** (`[Trait("Story", "S-71")]`), so fair ranking, views counted, map data, invites and error logging show up in the coverage table. `dotnet test --filter Story=S-71` runs one story's tests.
- The map exposes itself to tests on its container, so a test can find a pin and tap it like a person.

### Test cases

1. **[verified]** All 22 acceptance tests against the local API and built app: 21 pass, and the empty-board test skips because the local database has posts.
2. **[verified]** The labeled API tests pass (`dotnet test --filter Story=S-71|Story=S-74|...`).
3. **[verified]** `node scripts/acceptance.js`: 23 of 24 built alpha stories covered. The one left is S-113, the test suite itself.
4. **[verified on this PR]** The *acceptance* check is green on GitHub.
