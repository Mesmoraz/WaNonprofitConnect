import { expect, test } from '@playwright/test'
import { BASE_URL, ADMIN_EMAIL, ORG, postListing, run, signIn } from './helpers'

// Screen 6, Board. Copy: docs/ALPHA-BRIEFS.md and the S-103 review fixes.

test('[S-17] [S-45] a new post shows on the board, and the kinds of help filter it', async ({ page, browser }) => {
  const other = await browser.newContext({ baseURL: BASE_URL })
  const otherPage = await other.newPage()
  await signIn(otherPage, { name: 'Kim', org: ORG.harvest })
  const offer = await postListing(otherPage, { kind: 'Offer', help: 'Time', title: `Saturday drivers ${run}` })
  await other.close()

  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/board')
  // "Who they serve" can hide it; this test is about the board itself.
  const card = page.locator('.listing-card', { hasText: offer.title })
  const showAll = page.getByRole('button', { name: 'Show them' })
  await expect(page.getByText(/\d+ open/)).toBeVisible()
  if (await showAll.isVisible()) await showAll.click()
  await expect(card).toBeVisible()
  await expect(card).toContainText(ORG.harvest.name)

  await page.getByRole('tab', { name: 'Things' }).click()
  await expect(card).toHaveCount(0)
  await page.getByRole('tab', { name: 'Time' }).click()
  await expect(page.getByText(/\d+ open/)).toBeVisible()
  if (await showAll.isVisible()) await showAll.click()
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(new RegExp(`/listing/${offer.id}$`))
})

test('[S-103] searching everyone here opens the organization', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/board')
  await page.getByRole('searchbox', { name: 'Search everyone here' }).fill('West Seattle Tool')
  await page.getByRole('link', { name: new RegExp(ORG.westTools.name) }).click()
  await expect(page).toHaveURL(new RegExp(`/org/${ORG.westTools.ein}$`))
  await expect(page.getByRole('heading', { name: ORG.westTools.name })).toBeVisible()
})

test('[S-98] organization names read in normal case, keeping acronyms', async ({ page, browser }) => {
  // The fixture has the IRS spelling, all capitals: NORTHWEST HARVEST E M M, TACOMA-PIERCE HABITAT FOR HUMANITY.
  const other = await browser.newContext({ baseURL: BASE_URL })
  const otherPage = await other.newPage()
  await signIn(otherPage, { name: 'Kim', org: ORG.harvest })
  const offer = await postListing(otherPage, { kind: 'Offer', help: 'Time', title: `Forklift training ${run}` })
  await other.close()

  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/board')
  await expect(page.getByRole('button', { name: 'Casey · Computers 4 People in Need', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Time' }).click()
  const showAll = page.getByRole('button', { name: 'Show them' })
  await expect(page.getByText(/\d+ open/)).toBeVisible()
  if (await showAll.isVisible()) await showAll.click()
  const card = page.locator('.listing-card', { hasText: offer.title })
  await expect(card).toContainText('Northwest Harvest E M M')
  await expect(card).not.toContainText('NORTHWEST HARVEST')

  await page.getByRole('searchbox', { name: 'Search everyone here' }).fill('Ballard Food')
  await expect(page.getByRole('link', { name: /Ballard Food Bank/ })).toBeVisible()

  await page.goto(`/org/${ORG.habitat.ein}`)
  await expect(page.getByRole('heading', { name: 'Tacoma-Pierce Habitat for Humanity', exact: true })).toBeVisible()
})

test('[S-108] while the board is small, Who they serve starts with nothing picked', async ({ page }) => {
  // The demo's board is small whatever the database holds. Rainier Valley Food Bank's cause code is Food, which
  // a bigger board would start from.
  await signIn(page, { name: 'Taylor', email: ADMIN_EMAIL, org: ORG.ballard })
  await page.goto('/admin')
  await page.getByRole('radio', { name: /^A new organization/ }).click()
  await page.getByRole('button', { name: 'Show this demo' }).click()
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByRole('button', { name: /· Rainier Valley Food Bank/ })).toBeVisible()
  await page.goto('/board')
  await expect(page.getByText(/\d+ open/)).toBeVisible()
  await page.getByRole('button', { name: /^Filters/ }).click()
  const filters = page.locator('.flt')
  await expect(page.getByText('Showing everyone while the board is small. Tap to narrow it.')).toBeVisible()
  await expect(filters.getByRole('button', { name: 'Food', pressed: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Show them' })).toHaveCount(0)

  // Narrowing it still works, and the usual line comes back once something is picked.
  await filters.getByRole('button', { name: 'Food', pressed: false }).click()
  await expect(filters.getByRole('button', { name: 'Food', pressed: true })).toBeVisible()
  await expect(page.getByText('Set from your organization’s cause code. Tap to change.')).toBeVisible()
  await page.getByRole('button', { name: /· Rainier Valley Food Bank/ }).click()
  await page.getByRole('menuitem', { name: 'Leave the demo' }).click()
})

test('[S-124] every kind of help shows on a small phone, none past the edge', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await signIn(page, { name: 'Robin', org: ORG.rainier })
  const inView = async (items: import('@playwright/test').Locator) => {
    for (const item of await items.all()) {
      const box = (await item.boundingBox())!
      expect(box.x + box.width, await item.textContent() ?? '').toBeLessThanOrEqual(360)
    }
  }

  await page.goto('/board')
  const tabs = page.getByRole('tablist', { name: 'Kind of help' }).getByRole('tab')
  await expect(tabs).toHaveCount(7)
  await inView(tabs)

  await page.goto('/map')
  await page.getByRole('button', { name: 'Filter' }).click()
  const chips = page.getByRole('group', { name: 'Kind of help' }).getByRole('button')
  await expect(chips).toHaveCount(7)   // "All", then the six kinds
  await inView(chips)
  await page.screenshot({ path: 'test-results/s124-map.png' })
  await page.goto('/board')
  await page.screenshot({ path: 'test-results/s124-board.png' })
})
