import { defineConfig, devices } from '@playwright/test'

/**
 * Acceptance tests: the real app and API, driven like a person on a phone. Each test is named after the roadmap
 * story it checks ("[S-20] ..."); `node scripts/acceptance.js` lists which stories have one.
 *
 * Locally: run the API and the app (preview_start "api" and "app"), then `npm run test:e2e`.
 * On GitHub: .github/workflows/acceptance.yml runs them against a fresh SQL Server on every pull request.
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
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
})
