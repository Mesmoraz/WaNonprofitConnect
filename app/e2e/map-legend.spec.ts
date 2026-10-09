import { expect, test } from '@playwright/test'
import { ORG, signIn } from './helpers'

// What the map shows (S-105, docs/ALPHA-BRIEFS.md, Phase A).

test('[S-105] the first time you open the map, the legend opens by itself; after that, the ? opens it', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/map')
  const legend = page.getByRole('dialog', { name: 'What the map shows' })
  await expect(legend).toBeVisible()
  for (const line of [
    'Golden thread. Help that was given.',
    'In progress. They’re working it out.',
    'Started. Waiting for a yes.',
    'Could fit. A need and an offer that might go together.',
    'The dashes run from the one giving to the one receiving.',
    'A pin is an organization here. A faint dot is any Washington nonprofit.',
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
