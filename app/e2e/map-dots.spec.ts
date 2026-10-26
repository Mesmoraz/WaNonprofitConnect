import { expect, test } from '@playwright/test'
import { ORG, signIn } from './helpers'

// The faint dots stay in the background (S-146, docs/ALPHA-BRIEFS.md): no count on the map, and the ? says what they are.

test('[S-143] [S-146] the map has no dot count, and the legend says what the faint dots are', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))

  await page.goto('/map')
  await expect(page.getByRole('button', { name: /in view$/ })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/organizations? in view/)).toHaveCount(0)

  await page.getByRole('button', { name: 'What the map shows' }).click()
  await expect(page.getByRole('dialog', { name: 'What the map shows' }).locator('li').first())
    .toHaveText('Faint dots are Washington nonprofits that haven’t joined yet.')
})
