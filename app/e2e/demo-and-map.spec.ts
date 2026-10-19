import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ORG, signIn } from './helpers'

test('[S-110] [S-101] an admin can walk the front door again as a new organization, in the demo', async ({ page }) => {
  await signIn(page, { name: 'Taylor', email: ADMIN_EMAIL, org: ORG.ballard })
  await page.goto('/admin')
  await page.getByRole('button', { name: 'Try as a new organization' }).click()
  await expect(page).toHaveURL(/\/invite$/)
  await expect(page.getByText('Demo: try RAINIER.')).toBeVisible()
  await page.getByLabel('Invite code').fill('RAINIER')
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByRole('button', { name: /· Rainier Valley Food Bank/ })).toBeVisible()
  await expect(page.getByText('Demo: sample organizations. Only you see this.')).toBeVisible()

  // What you post in the demo survives a reload (S-101).
  await page.goto('/post')
  await page.getByRole('radio', { name: 'Things' }).click()
  await page.getByRole('radio', { name: 'Food' }).click()
  await page.getByRole('button', { name: 'Post need' }).click()
  await expect(page.getByRole('heading', { name: 'Food' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Food' })).toBeVisible()

  // Leaving the demo puts you back on the real site as yourself.
  await page.getByRole('button', { name: /· Rainier Valley Food Bank/ }).click()
  await page.getByRole('menuitem', { name: 'Leave the demo' }).click()
  await expect(page.getByRole('button', { name: new RegExp(`· ${ORG.ballard.name}`) })).toBeVisible()
  await expect(page.getByText('Demo: sample organizations.')).toHaveCount(0)
})

test('[S-73] [S-103] the map draws, and its code only loads when you open it', async ({ page }) => {
  const mapCode: string[] = []
  page.on('request', r => { if (/\/assets\/map-|maplibre/.test(r.url())) mapCode.push(r.url()) })
  await signIn(page, { name: 'Casey', org: ORG.computers })
  // The Board, not Home: Home's "Near you" is a small live map (S-126), loaded once the rest of Home is up.
  await page.goto('/board')
  await expect(page.getByRole('searchbox', { name: 'Search everyone here' })).toBeVisible()
  expect(mapCode, 'map code loaded before opening the map').toHaveLength(0)
  await page.getByRole('link', { name: 'Map', exact: true }).click()
  await expect(page.locator('canvas').first()).toBeVisible()
})
