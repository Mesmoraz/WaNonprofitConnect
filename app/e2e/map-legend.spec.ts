import { expect, test } from '@playwright/test'
import { ORG, signIn } from './helpers'

// What the map shows (S-105, docs/ALPHA-BRIEFS.md, Phase A).

test('[S-105] [S-129] the first time you open the map, the legend opens by itself; after that, the ? opens it', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/map')
  const legend = page.getByRole('dialog', { name: 'What the map shows' })
  await expect(legend).toBeVisible()
  // Rewritten for S-129: rings for what's open, golden lines for help given.
  for (const line of [
    'Amber is open needs.',
    'Green is open offers.',
    'A golden thread. Help that was given.',
    'Your threads that are underway.',
    'Every Washington organization, at the address on its IRS record.',
    'A bigger pin has more open.',
  ]) await expect(legend).toContainText(line)
  await legend.getByRole('button', { name: 'Close' }).click()
  await expect(legend).toHaveCount(0)

  // Only the first time: coming back, it stays shut until you tap the ?.
  await page.reload()
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(legend).toHaveCount(0)
  await page.getByRole('button', { name: 'What the map shows' }).click()
  await expect(legend).toBeVisible()
  await page.getByRole('button', { name: 'What the map shows' }).click()
  await expect(legend).toHaveCount(0)
})
