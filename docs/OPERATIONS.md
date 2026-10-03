# Running the alpha

Internal. How to deploy, see what went wrong, and get data back. The live site is https://helpbook-alpha.azurewebsites.net (App Service `helpbook-alpha`, database `helpbook-alpha-db` on server `helpbookalpha0923`, resource group `helpbook-alpha`, West US 2).

## Staging and production

| | Staging | Production |
|---|---|---|
| Address | https://helpbook-staging.azurewebsites.net | https://helpbook-alpha.azurewebsites.net |
| App Service | `helpbook-staging` | `helpbook-alpha` |
| Database | `helpbook-staging-db` (its own; test data only) | `helpbook-alpha-db` |
| Gets a new version | Every merge to `main`, by itself, or a pull request labeled `staging` | Only when someone presses **Deploy to production** |

Both run on the same plan (`helpbook-alpha-plan`, B1), so staging costs nothing extra; both databases are on the free serverless offer. Staging shows a small "Staging" tag at the top and in the tab title. Everything else (settings, Google client, admins) is the same.

## Deploy

1. **Merge a pull request.** GitHub's *Deploy to staging* workflow builds once, runs the API tests, and deploys to staging (about 5 minutes). Watch it in the repo's **Actions** tab.
2. **Check it on staging**, on a phone, using the pull request's test cases.

   To check a pull request *before* merging it, add the label **staging** to it. It deploys that branch (merged with the latest `main`) to staging, comments the link on the PR, and redeploys on each new push. Only one PR has the label at a time: labeling another, or merging anything to `main`, takes staging back and removes the label with a comment. A PR on staging never goes to production.

   Careful with a PR that changes the database (a new migration): staging's database keeps the change even if the PR is closed. The PR description says so when it happens; reset staging's database before putting `main` back if it does.
3. **Actions → Deploy to production → Run workflow.** It ships the exact files the last successful staging deploy used, then checks `/health`.

GitHub signs in to Azure with one of two managed identities, so a staging deploy can never touch production:

| | Staging deploys | Production deploys |
|---|---|---|
| Identity | `helpbook-github-staging` | `helpbook-github-deploy` |
| Trusts | this repo's `staging` environment only | this repo's `production` environment only |
| Can deploy | the `helpbook-staging` App Service only (Website Contributor on that site) | the `helpbook-alpha` App Service only (Website Contributor on that site) |
| Repository variable | `AZURE_STAGING_CLIENT_ID` | `AZURE_CLIENT_ID` |

So a branch that edits its workflow to borrow the `staging` environment still gets a token that cannot deploy or change the production site. GitHub presents the repo by its permanent ids (`repo:Mesmoraz@93046683/WaNonprofitConnect@1393798469:environment:staging`), so the identities' federated credentials use that form; if the repo is renamed or moved, they still match, but a new repo needs new ones. No password or key is stored in GitHub; the ids are repository variables (the two above, plus `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID`).

*Deploy to production* only ships a build from a push to `main` (not from a pull request), and checks that the commit is on `main` before it deploys.

By hand, if GitHub is down:

```
powershell -ExecutionPolicy Bypass -File scripts/deploy-azure.ps1                       # staging
powershell -ExecutionPolicy Bypass -File scripts/deploy-azure.ps1 -App helpbook-alpha   # production
```

It builds on this machine, uploads one zip, and checks `/health`. The site takes up to about 2 minutes to come back, longer if the database was asleep (below). The Azure CLI must be signed in (`az login --tenant 9a32419d-366e-4cdd-858f-95ecb9c983c2`); its sign-in expires every so often.

The staging app's identity has `db_datareader`, `db_datawriter` and `db_ddladmin` on `helpbook-staging-db` only. It migrates and loads the IRS list itself on first start, like production.

## See what went wrong

```
powershell -ExecutionPolicy Bypass -File scripts/errors.ps1
```

Prints the last 2 days of (production; add `-App helpbook-staging` for staging):

- **Browser errors** (`Client error (crash|error|rejection) on /page: message`): a screen that crashed or a script error on someone's device. The app sends these itself (`app/src/lib/report.ts`), at most 5 per page load. A crashed screen shows "That didn’t work. Reload the page" instead of going blank.
- **Server errors** (`fail:` lines): an unexpected error answers the person with "That didn’t work. Try again." and a `traceId`. Search the logs for that id to find the matching line.
- **Startup failures** (`ContainerStartupFailure`, `Error Number:`): the site failing to start, for example error 40613, the database asleep.

Logs are kept 3 days on the App Service. For longer retention or alerts, Application Insights is the next step (it has a free monthly allowance).

## The database sleeps

The database is on Azure's free serverless tier: it pauses after 60 idle minutes and takes about a minute to wake (error 40613). The app retries while it wakes, and waits up to about 3 minutes at startup. The first visit after a quiet hour is slow; nothing is lost. Roadmap S-90 is the choice to pay for a database that doesn't pause.

Deploys knock first so they don't wait on it: the staging workflow calls staging's `/health` as its very first step (only for builds that go to staging, so ordinary pull requests don't spend the free allowance), and *Deploy to production* calls production's `/health` before it downloads the files. The database wakes while the build and tests run, and the new version starts without the wait.

## Backups and restoring

Azure backs the database up automatically: point-in-time restore for the **last 7 days** (differential backups every 12 hours, logs more often), stored locally redundant. Nothing to set up.

To restore to a moment before something went wrong, restore to a **new** database, check it, then point the app at it:

```
az sql db restore -g helpbook-alpha -s helpbookalpha0923 -n helpbook-alpha-db --dest-name helpbook-alpha-db-restored --time "2026-09-24T17:00:00Z"
```

Then either copy the rows you need across, or change the connection string's `Database=` in App Service settings to the restored database and restart. The app's identity needs the same roles on the new database (`db_datareader`, `db_datawriter`, `db_ddladmin`); grant them in the Query editor as for the original.

Restoring creates a second database, which may not fall under the free offer. Delete it when done.
