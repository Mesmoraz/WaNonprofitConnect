import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { devices } from '@playwright/test'

/** Where the app is served: the same default as playwright.config.ts, so a second person lands on the same app. */
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5253'

/**
 * Real Washington 501(c)(3)s from tests/acceptance/fixtures/eo_wa_sample.csv. Each test signs in as its own
 * organizations so tests don't step on each other's posts and threads. Names are as the API shows them (S-98):
 * the IRS list is all capitals, the fixture keeps it that way, and the API turns it into normal case.
 */
export const ORG = {
  ballard: { ein: '911428805', name: 'Ballard Food Bank' },
  toolLibrary: { ein: '465378620', name: 'Southeast Seattle Tool Library' },
  computers: { ein: '822888626', name: 'Computers 4 People in Need' },
  rebuilding: { ein: '911606330', name: 'Rebuilding Together Seattle' },
  rainier: { ein: '911500768', name: 'Rainier Valley Food Bank' },
  westSeattle: { ein: '911464412', name: 'West Seattle Food Bank' },
  treehouse: { ein: '911425676', name: 'Treehouse' },
  harvest: { ein: '910826037', name: 'Northwest Harvest E M M' },
  habitat: { ein: '581735531', name: 'Tacoma-Pierce Habitat for Humanity' },
  hopelink: { ein: '910982116', name: 'Hopelink' },
  westTools: { ein: '811434757', name: 'West Seattle Tool Library' },
  thurston: { ein: '237297837', name: 'Thurston County Food Bank' },
  spokane: { ein: '237173826', name: 'Second Harvest Inland Northwest' },
} as const
export type Org = (typeof ORG)[keyof typeof ORG]

/** The admin email the API knows in Development (appsettings.Development.json). */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@localhost'

/** Unique per run, so posts and accounts from earlier runs never match. */
export const run = Date.now().toString(36)
export const email = (who: string) => `e2e-${who}-${run}@example.org`

/** Sign in through the API's Development-only sign-in. With an organization, you're confirmed for it at once. */
export async function signIn(page: Page, who: { name: string; email?: string; org?: Org }) {
  const res = await page.request.post('/api/v1/auth/dev', {
    data: { email: who.email ?? email(who.name.toLowerCase()), name: who.name, ein: who.org?.ein },
  })
  expect(res.ok(), `dev sign-in for ${who.name}: ${res.status()}`).toBeTruthy()
  return res.json()
}

/** A second person on their own phone: a fresh browser context with its own cookies. */
export async function phone(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ ...devices['Pixel 7'], baseURL: BASE_URL })
  return { context, page: await context.newPage() }
}

/** Post through the API, for tests that are about something else. */
export async function postListing(page: Page, l: { kind: 'Need' | 'Offer'; help?: string; title: string; urgency?: string; description?: string; quantity?: number; unit?: string }) {
  const res = await page.request.post('/api/v1/listings', {
    data: { help: 'Things', urgency: 'Normal', cadence: 'OneTime', ...l },
  })
  expect(res.status(), await res.text()).toBe(201)
  return res.json() as Promise<{ id: number; title: string }>
}

