import { expect, test } from '@playwright/test'
import { ORG, signIn } from './helpers'

// Runs first (files run in name order, one at a time): what the first organization sees on launch day, before anyone
// has posted. On GitHub the database is fresh every run; locally it usually has posts, so this skips.

test('[S-103] [S-134] an empty board invites the first post, and says it is empty once', async ({ page }) => {
  await signIn(page, { name: 'Morgan', org: ORG.thurston })
  const board = await (await page.request.get('/api/v1/board')).json() as unknown[]
  test.skip(board.length > 0, 'only on a fresh database (CI); this one already has posts')
  await page.goto('/board')
  await expect(page.getByText('Nothing here yet.')).toBeVisible()
  await expect(page.getByText(/\d+ open/)).toHaveCount(0)                  // [S-134] said once, not "0 open · 0 done" too
  await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible()
  await page.getByRole('link', { name: 'Post the first one?' }).click()
  await expect(page).toHaveURL(/\/post$/)
})
