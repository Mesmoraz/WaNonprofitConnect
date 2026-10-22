## 2026-10-22 · CI keeps a build only when it goes to staging (S-137)

**Story S-137.** On Oct 22 every build started failing at its last step: "Artifact storage quota has been hit." Each run saved its own `site.zip` for 30 days, every pull request included, and 99 of them filled the repo's 2 GB. Because the build failed, `main` stopped deploying to staging. Taylor asked: "open a small PR so pull request runs don't upload site.zip, only pushes to main and labeled staging PRs."

### What changed

- **The build zips and saves `site.zip` only when that build goes to staging:** a push to `main`, a run started by hand, or a pull request labeled `staging`. These are the same cases in which the staging deploy runs, and it's the only thing that reads that file in the same run.
- **Production is unchanged.** It still ships the `site.zip` from the last successful staging deploy of `main`, and those are still kept for 30 days.
- **Every other pull request still builds, lints, and runs the tests.** It just doesn't save the zip.

This stops the storage filling up again. It doesn't clear what's there now: the old artifacts still need deleting once (Taylor, Oct 22).

### Test cases

1. **[verified]** This pull request has no `staging` label: its build job runs every check and skips "Zip" and the upload.
2. **[needs your phone]** After the old artifacts are cleared and this merges, the run on `main` saves `site.zip` and deploys to staging. Open https://helpbook-staging.azurewebsites.net and the staging banner names this pull request.
