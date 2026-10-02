import { expect, test } from '@playwright/test'
import { ORG, postListing, run, signIn } from './helpers'

// Screen 6, Board. Copy: docs/ALPHA-BRIEFS.md and the S-103 review fixes.

test('[S-103] an empty board invites the first post', async ({ page }) => {
  await signIn(page, { name: 'Morgan', org: ORG.thurston })
  const board = await (await page.request.get('/api/v1/board')).json() as unknown[]
  test.skip(board.length > 0, 'only on a fresh database (CI); this one already has posts')
  await page.goto('/')
  await expect(page.getByText('Nothing here yet.')).toBeVisible()
  await page.getByRole('link', { name: 'Post the first one?' }).click()
  await expect(page).toHaveURL(/\/post$/)
})

test('[S-17] [S-45] a new post shows on the board, and the kinds of help filter it', async ({ page, browser }) => {
  const other = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://localhost:5173' })
  const otherPage = await other.newPage()
  await signIn(otherPage, { name: 'Kim', org: ORG.harvest })
  const offer = await postListing(otherPage, { kind: 'Offer', help: 'Time', title: `Saturday drivers ${run}` })
  await other.close()

  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/')
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
  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Search everyone here' }).fill('West Seattle Tool')
  await page.getByRole('link', { name: new RegExp(ORG.westTools.name) }).click()
  await expect(page).toHaveURL(new RegExp(`/org/${ORG.westTools.ein}$`))
  await expect(page.getByRole('heading', { name: ORG.westTools.name })).toBeVisible()
})
