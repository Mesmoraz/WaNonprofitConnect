## 2026-10-25 · Saved build files clean themselves up (S-141)

**Story S-141.** The fix for pull requests in S-137 slowed the storage filling, but every merge to `main` still saves a 30 MB `site.zip` for 30 days. On a busy day that adds up, and on Oct 25 the builds for #52 and the S-138 pull request failed again with "Artifact storage quota has been hit." Taylor asked for a way to clean the saved files regularly so the checks stop failing.

### What changed

- **A new workflow, "Clean saved build files," deletes the saved build files nobody will read again.** It runs after every "Deploy to staging" run, once a day at 4:17 am Pacific, and from the Actions tab when you press "Run workflow."
- **It keeps what's still needed:** the `site.zip` that "Deploy to production" would ship (found the same way production finds it), anything from a run that's still going, and failed-test reports for 3 days.
- **Failed-test reports are now kept 3 days instead of 14.**
- Each run's summary lists what it kept, what it deleted, and how much space it freed.

GitHub recounts storage only every 6 to 12 hours, so freed space reaches uploads a few hours after a cleanup, not right away.

### Test cases

1. **[verified]** A dry run of the cleanup against the repo today, with deletes switched off, keeps the one saved file (production's build from Oct 21) and deletes nothing.
2. **[verified]** The same dry run with production's build hidden marks that file for deletion: "Deleted 1 saved files (30 MB)."
3. **[needs your phone]** After this merges, open the Actions tab and choose "Clean saved build files." There's a run that started after the merge's "Deploy to staging," and its summary says "Deleted … kept …"
4. **[needs your phone]** "Deploy to production" still finds its build: press "Run workflow" on it the next time you ship, and it passes "Find the last successful staging deploy of main."
