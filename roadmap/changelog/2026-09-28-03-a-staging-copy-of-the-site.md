## 2026-09-28 · A staging copy of the site

**Story:** S-112. From Taylor: "set up staging."

### What changed

- **Staging** is at https://helpbook-staging.azurewebsites.net: the same app and settings as the real site, on the same Azure plan (no extra cost), with its own database, so nothing done there touches real organizations. A small orange tag sits at the top, and the tab title starts with "Staging ·". The tag names the pull request on staging by number and title ("Staging · #5 Try it as a new organization…") and opens it on GitHub.
- **Every merge to `main` now goes to staging by itself.** GitHub builds once, runs the API tests, deploys, and checks the site answers. Watch it under the repo's Actions tab.
- **Production only changes when you press Actions → Deploy to production → Run workflow.** It ships the exact files that are on staging.
- **Check a PR on staging before merging it:** add the label **staging** to the PR. GitHub puts that PR on staging, comments the link, and updates it on each new push. One PR at a time: labeling another, or any merge to `main`, takes staging back and says so on the PR.
- GitHub signs in to Azure with a trust link, not a stored password. It can only deploy the two sites, and only from `main`.
- **WebSockets are on in production** (Taylor, Sep 28). Live messages used to fall back to slower polling there.
- `scripts/deploy-azure.ps1` still works by hand. It now goes to staging unless you add `-App helpbook-alpha`.

### Still to do by Taylor

- Add `https://helpbook-staging.azurewebsites.net` to the Google sign-in client's authorized JavaScript origins. Until then, Google sign-in on staging says it can't continue.

### Test cases

1. **[verified]** Open https://helpbook-staging.azurewebsites.net. The tab reads "Staging · Helpbook", and a small "Staging" tag shows at the top.
2. **[verified]** https://helpbook-staging.azurewebsites.net/health answers 200.
3. **[needs your phone]** After you add the staging address in Google Cloud, sign in on staging. Your admin menu shows **Admin**.
4. **[needs your phone]** Merge this PR. Within about 5 minutes, Actions shows *Deploy to staging* green.
5. **[needs your phone]** Actions → *Deploy to production* → Run workflow. It goes green, and the real site still works.
