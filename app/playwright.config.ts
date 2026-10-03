import { defineConfig, devices } from '@playwright/test'

/**
 * Acceptance tests: the real app and API, driven like a person on a phone. Each test is named after the roadmap
 * story it checks ("[S-20] ..."); `node scripts/acceptance.js` lists which stories have one.
 *
 * Locally: `npm run test:e2e:local` builds the app into the API's wwwroot, starts the API from this checkout on
 * http://localhost:5253 (or uses one already running there), and runs the tests against it. The API uses its
 * local database, as in development. If an API from another checkout or worktree is already on 5253, the tests
 * use that one and its build of the app: stop it first.
 * On GitHub: the "acceptance" job in .github/workflows/deploy-staging.yml starts its own API on a fresh SQL Server
 * for every pull request, so the web server below is not used there.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,                       // one shared database; tests use their own organizations and fresh posts
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5253',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.CI ? undefined : {
    command: 'dotnet run --project ../src/WaNonprofitConnect.Api --launch-profile http',
    url: 'http://localhost:5253/health',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
})
