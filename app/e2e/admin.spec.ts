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
  const rows = page.locator('.card', { hasText: /hasn’t answered|Quiet since/ })
  if (!(await rows.count())) await expect(page.getByText('Every thread is moving.')).toBeVisible()
  await expect(page.getByText(need.title)).toHaveCount(0)
})
