## 2026-10-25 · Builds use one pinned .NET package version (S-142)

**Story S-142.** On Oct 25 every build and acceptance run failed to restore: "Unable to find a stable package Microsoft.Extensions.Hosting.Abstractions with version (>= 10.0.14)." The project files asked for any 10.0 version (`10.0.*`), so the build took `Microsoft.Extensions.Hosting` 10.0.14 as soon as it appeared, before the package it depends on was out. Taylor asked to fix the NuGet restore error in its own PR.

### What changed

- **All 11 Microsoft .NET 10 packages use one version, 10.0.13, set in one place:** `DotNetPackagesVersion` in `Directory.Build.props`. A new patch comes in only when someone changes that number.
- **10.0.13, not 10.0.14:** an hour after the failure, NuGet listed 10.0.14's files, but restore still couldn't find them. 10.0.13 is fully out.
- **`docs/OPERATIONS.md` says how to move it:** Microsoft ships a patch on the second Tuesday of each month. A day or so later, change the number, run the API tests, and open a pull request.

Nobody using the app will notice a difference.

### Test cases

1. **[verified]** With the pin, `dotnet restore` of the whole solution has no errors, the Release build has 0 errors, and the API tests pass (256 of 256).
2. **[verified]** The same restore with the version set to 10.0.14 fails with NU1103: 10.0.14 isn't fully published yet.
3. **[needs your phone]** This pull request's checks pass ("build" and "acceptance"). After it merges, staging still opens: https://helpbook-staging.azurewebsites.net
