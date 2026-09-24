# Running the alpha

Internal. How to deploy, see what went wrong, and get data back. The live site is https://helpbook-alpha.azurewebsites.net (App Service `helpbook-alpha`, database `helpbook-alpha-db` on server `helpbookalpha0923`, resource group `helpbook-alpha`, West US 2).

## Deploy

```
powershell -ExecutionPolicy Bypass -File scripts/deploy-azure.ps1
```

Builds the app and the API, uploads one zip, and checks `/health`. The site takes up to about 2 minutes to come back, longer if the database was asleep (below). The Azure CLI must be signed in (`az login --tenant 9a32419d-366e-4cdd-858f-95ecb9c983c2`); its sign-in expires every so often.

## See what went wrong

```
powershell -ExecutionPolicy Bypass -File scripts/errors.ps1
```

Prints the last 2 days of:

- **Browser errors** (`Client error (crash|error|rejection) on /page: message`): a screen that crashed or a script error on someone's device. The app sends these itself (`app/src/lib/report.ts`), at most 5 per page load. A crashed screen shows "That didn’t work. Reload the page" instead of going blank.
- **Server errors** (`fail:` lines): an unexpected error answers the person with "That didn’t work. Try again." and a `traceId`. Search the logs for that id to find the matching line.
- **Startup failures** (`ContainerStartupFailure`, `Error Number:`): the site failing to start, for example error 40613, the database asleep.

Logs are kept 3 days on the App Service. For longer retention or alerts, Application Insights is the next step (it has a free monthly allowance).

## The database sleeps

The database is on Azure's free serverless tier: it pauses after 60 idle minutes and takes about a minute to wake (error 40613). The app retries while it wakes, and waits up to about 3 minutes at startup. The first visit after a quiet hour is slow; nothing is lost. Roadmap S-90 is the choice to pay for a database that doesn't pause.

## Backups and restoring

Azure backs the database up automatically: point-in-time restore for the **last 7 days** (differential backups every 12 hours, logs more often), stored locally redundant. Nothing to set up.

To restore to a moment before something went wrong, restore to a **new** database, check it, then point the app at it:

```
az sql db restore -g helpbook-alpha -s helpbookalpha0923 -n helpbook-alpha-db --dest-name helpbook-alpha-db-restored --time "2026-09-24T17:00:00Z"
```

Then either copy the rows you need across, or change the connection string's `Database=` in App Service settings to the restored database and restart. The app's identity needs the same roles on the new database (`db_datareader`, `db_datawriter`, `db_ddladmin`); grant them in the Query editor as for the original.

Restoring creates a second database, which may not fall under the free offer. Delete it when done.
