import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ORG, email, postListing, run, signIn } from './helpers'

// Admin, "Waiting on someone" (S-116, docs/ALPHA-BRIEFS.md). The 2-day and 7-day rules can't be waited out here;
// AccountServiceTests proves them. This proves the section is on Admin and a thread started today isn't in it.

test('[S-116] Admin lists threads waiting on someone, and leaves out one started today', async ({ page, browser }) => {
  const other = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://localhost:5253' })
  const otherPage = await other.newPage()
  await signIn(otherPage, { name: 'Casey', org: ORG.computers })
  const need = await postListing(otherPage, { kind: 'Need', help: 'Things', title: `Folding tables ${run}` })
  await signIn(page, { name: 'Jordan', email: email('s116-starter'), org: ORG.toolLibrary })
  const started = await page.request.post('/api/v1/threads', { data: { listingId: need.id, message: 'We have six.' } })
  expect(started.ok()).toBeTruthy()
  await other.close()

  await signIn(page, { name: 'Taylor', email: ADMIN_EMAIL, org: ORG.ballard })
  await page.goto('/admin')
  await expect(page.getByText('Waiting on someone')).toBeVisible()
  // Either stalled threads or the empty line, once the list has loaded (a database with old test threads has rows).
  const rows = page.locator('.card', { hasText: /hasn’t answered|Quiet since/ })
  await expect(rows.first().or(page.getByText('Every thread is moving.'))).toBeVisible()
  await expect(page.getByText(need.title)).toHaveCount(0)
})

// Admin, "How it's going" (S-100, docs/ALPHA-BRIEFS.md). The counting rules are proven in AlphaNumbersTests; the
// test sign-in's memberships aren't real organizations, so this proves the section, its words, and its place.
test('[S-100] Admin shows how it’s going', async ({ page }) => {
  await signIn(page, { name: 'Taylor', email: ADMIN_EMAIL, org: ORG.ballard })
  await page.goto('/admin')
  const first = page.locator('.label').first()
  await expect(first).toHaveText('How it’s going')
  await expect(page.locator('.numbers-totals')).toHaveText(/^\d+ posts? · \d+ threads? started · \d+ accepted · \d+ golden$/)
  const rows = page.locator('.numbers-row')
  await expect(rows).toHaveCount(6)
  for (const what of ['Posts that got a thread within 14 days', 'Typical wait for a first answer', 'Threads that became golden',
    'Organizations that posted a need and an offer in their first week', 'Organizations that have both given and received'])
    await expect(rows.filter({ hasText: what })).toHaveCount(1)
  await expect(rows.first()).toContainText(/Golden threads in [A-Z][a-z]+/)
  await expect(rows.first()).toContainText(/Goal: 3 (by Oct 31|a month)/)
  await expect(rows.filter({ hasText: 'Typical wait' })).toContainText('Goal: under a day')
  await expect(rows.last().locator('.goal')).toHaveCount(0)
  await expect(page.getByText('Counts real organizations only. The demo isn’t counted.')).toBeVisible()
})

test('[S-100] the numbers are for admins only', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  expect((await page.request.get('/api/v1/admin/numbers')).status()).toBe(403)
})
