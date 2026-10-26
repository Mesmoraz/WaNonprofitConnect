import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ORG, signIn } from './helpers'

test('[S-110] [S-101] an admin can walk the front door again as a new organization, in the demo', async ({ page }) => {
  await signIn(page, { name: 'Taylor', email: ADMIN_EMAIL, org: ORG.ballard })
  await page.goto('/admin')
  await page.getByRole('radio', { name: /^A new organization/ }).click()
  await page.getByRole('button', { name: 'Show this demo' }).click()
  await expect(page).toHaveURL(/\/invite$/)
  await expect(page.getByText('Demo: try RAINIER.')).toBeVisible()
  await expect(page.getByLabel('Invite code')).toHaveValue('RAINIER')   // filled in: a real code doesn't work here (S-145)
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByRole('button', { name: /· Rainier Valley Food Bank/ })).toBeVisible()
  await expect(page.getByText('Demo: A new organization.')).toBeVisible()

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
  await expect(page.getByText(/^Demo: /)).toHaveCount(0)
})

test('[S-128] [S-145] an admin picks what the demo shows, and changes it while in the demo', async ({ page }) => {
  await signIn(page, { name: 'Taylor', email: ADMIN_EMAIL, org: ORG.ballard })
  // Only an admin's Admin page starts a demo from a link; for anyone else /admin isn't there.
  await page.goto('/admin?demo=busy')
  await expect(page.getByText('Demo: Busy.')).toBeVisible()
  await expect(page).not.toHaveURL(/demo=/)
  await page.goto('/inbox')
  await expect(page.getByRole('link', { name: /Waiting on you/ })).toHaveCount(3)
  await expect(page.getByRole('link', { name: 'Inbox' })).toContainText('3')

  // Settings, from the demo bar: nothing changes until Show this demo (S-145). Cancel leaves it as it was.
  await page.getByRole('button', { name: 'Settings' }).click()
  const sheet = page.getByRole('dialog', { name: 'Demo settings' })
  await sheet.getByRole('radiogroup', { name: 'Waiting on you' }).getByRole('radio', { name: '0' }).click()
  await expect(sheet.getByText('Now: Busy, changed.')).toBeVisible()
  await expect(page.getByText('Demo: Busy.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Waiting on you/ })).toHaveCount(3)
  await sheet.getByRole('button', { name: 'Cancel' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Waiting on you/ })).toHaveCount(3)

  // Change one thing, then Show this demo: the sheet closes and the screen behind redraws.
  await page.getByRole('button', { name: 'Settings' }).click()
  await sheet.getByRole('radiogroup', { name: 'Waiting on you' }).getByRole('radio', { name: '0' }).click()
  await sheet.getByRole('button', { name: 'Show this demo' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(page.getByText('Demo: Busy, changed.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Waiting on you/ })).toHaveCount(0)

  // A preset: nothing posted anywhere.
  await page.getByRole('button', { name: 'Settings' }).click()
  await sheet.getByRole('radio', { name: /^Empty board/ }).click()
  await sheet.getByRole('button', { name: 'Show this demo' }).click()
  await expect(page.getByText('Demo: Empty board.')).toBeVisible()
  await expect(page.getByText(/^No threads yet./)).toBeVisible()   // the inbox, emptied
  await page.goto('/board')
  await expect(page.getByText('Nothing here yet.')).toBeVisible()

  await page.getByRole('button', { name: 'Leave the demo' }).click()
  await expect(page.getByText(/^Demo: /)).toHaveCount(0)
})

test('[S-128] someone who isn’t an admin gets nothing from a demo link', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/admin?demo=busy')
  await expect(page.getByRole('link', { name: 'Board' })).toBeVisible()
  await expect(page.getByText(/^Demo: /)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Admin' })).toHaveCount(0)
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
