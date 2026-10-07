import { expect, test } from '@playwright/test'
import { ORG, email, phone, postListing, run, signIn } from './helpers'

// Every screen says something while it loads or fails (S-106, docs/ALPHA-BRIEFS.md, Phase A).

const WAKING = 'Waking up. The first visit in a while can take a minute.'

test('[S-106] a screen still loading after 2 seconds says it is waking up, then shows the screen', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.route('**/api/v1/threads', async route => { await new Promise(r => setTimeout(r, 3500)); await route.continue() })
  await page.goto('/inbox')
  await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible()
  await expect(page.getByText(WAKING)).toHaveCount(0)              // not in the first 2 seconds
  await expect(page.getByText(WAKING)).toBeVisible()
  await expect(page.getByText(WAKING)).toHaveCount(0, { timeout: 10_000 })
})

test('[S-106] a post or thread that is gone says so, with the way back', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/listing/999999999')
  await expect(page.getByText('This post is gone. Back to the board?')).toBeVisible()
  await page.getByRole('link', { name: 'Back to the board' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/thread/999999999')
  await expect(page.getByText('This thread is gone. Back to your inbox?')).toBeVisible()
  await page.getByRole('link', { name: 'Back to your inbox' }).click()
  await expect(page).toHaveURL(/\/inbox$/)
})

test('[S-106] a thread between two other organizations reads as gone', async ({ page, browser }) => {
  const poster = await phone(browser)
  await signIn(poster.page, { name: 'Morgan', email: email('s106-poster'), org: ORG.rainier })
  const need = await postListing(poster.page, { kind: 'Need', help: 'Things', title: `Hand trucks ${run}` })
  await signIn(poster.page, { name: 'Riley', email: email('s106-helper'), org: ORG.westSeattle })
  const res = await poster.page.request.post('/api/v1/threads', { data: { listingId: need.id, message: 'We have two.' } })
  expect(res.ok()).toBeTruthy()
  const thread = await res.json()
  await poster.context.close()

  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto(`/thread/${thread.id}`)
  await expect(page.getByText('This thread is gone. Back to your inbox?')).toBeVisible()
})

test('[S-106] when the map does not load, it says so, and Try again draws it', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.route(/\/api\/v1\/map$/, route => route.fulfill({ status: 500, body: '{}' }))
  await page.goto('/map')
  await expect(page.getByText('The map didn’t load. Try again?')).toBeVisible({ timeout: 15_000 })
  await page.unroute(/\/api\/v1\/map$/)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.getByText('The map didn’t load.')).toHaveCount(0)
})
