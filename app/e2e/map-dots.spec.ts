import { expect, test, type Page } from '@playwright/test'
import { ORG, signIn } from './helpers'

// Every dot is a Washington organization (S-143, docs/ALPHA-BRIEFS.md): the line under the chips counts the dots in view.

const line = (page: Page) => page.getByText(/organizations? in view · IRS addresses$/)
const count = async (page: Page) => Number((await line(page).textContent())!.replace(/[^\d]/g, ''))

test('[S-143] the map says what the dots are, and counts the ones in view', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))

  // The whole state: every organization with an address.
  await page.goto('/map')
  await expect(line(page)).toHaveText(/^[1-9][\d,]* organizations? in view · IRS addresses$/, { timeout: 20_000 })
  const state = await count(page)
  const points = await (await page.request.get('/api/v1/map/points')).json() as unknown[]
  expect(state).toBeLessThanOrEqual(points.length)

  // Out over the Pacific: none.
  await page.goto('/map?at=46.8,-128.5,12')
  await expect(line(page)).toHaveText('0 organizations in view · IRS addresses', { timeout: 20_000 })

  // The legend leads with the dot.
  await page.getByRole('button', { name: 'What the map shows' }).click()
  await expect(page.getByRole('dialog', { name: 'What the map shows' }).locator('li').first())
    .toHaveText('Every Washington organization, at the address on its IRS record.')
})
