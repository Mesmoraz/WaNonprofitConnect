## 2026-10-27 · A package with a known security advisory is lifted to a fixed version

### What changed

- **`System.Security.Cryptography.Pkcs` goes from 9.0.11 to 10.0.13.** It comes in with the SQL Server driver (Microsoft.Data.SqlClient 6.1.7) and had two published advisories, one high (GHSA-846f-f764-76mx) and one moderate (GHSA-2fmv-rv2c-59x7). Every build warned about it. The Data project now lists it on the same .NET 10 patch as every other Microsoft package, so the API, the CLI and the tests all get the fixed one.
- `dotnet list package --vulnerable --include-transitive` now finds nothing. `docs/OPERATIONS.md` says why the line is there and when it can go.
- Nothing anyone sees in the app changes.

### Test cases

1. **[verified]** The build has no NU1902 or NU1903 warnings, and no project has a vulnerable package.
2. **[verified]** All 267 API tests pass.
3. **[verified]** The whole acceptance suite on a fresh SQL Server database (`npm run test:e2e:fresh`): 70 passed.
