import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ORG, phone, run, signIn } from './helpers'

// Finding out when something goes wrong: feedback from inside the app (S-93) and browser errors (S-91).

test('[S-93] feedback sent from the name menu reaches Admin', async ({ page, browser }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/')
  await page.getByRole('button', { name: new RegExp(`Casey · ${ORG.computers.name}`) }).click()
  await page.getByRole('menuitem', { name: 'Send feedback' }).click()

  const box = page.getByRole('dialog')
  await expect(box.getByRole('heading', { name: 'Send feedback' })).toBeVisible()
  const send = box.getByRole('button', { name: 'Send' })
  await expect(send).toBeDisabled()                                   // waits for a note
  const note = `The board took a while to load ${run}`
  await box.getByLabel('What happened, or what would you change?').fill(note)
  await send.click()
  await expect(page.getByText('Sent. Thanks for telling us.')).toBeVisible()

  const admin = await phone(browser)
  await signIn(admin.page, { name: 'Taylor', email: ADMIN_EMAIL })
  await admin.page.goto('/admin')
  const card = admin.page.locator('.fb-card', { hasText: note })
  await expect(card).toBeVisible()
  await expect(card).toContainText(ORG.computers.name)                 // who sent it, for which organization
  await admin.context.close()
})

test('[S-91] an error in someone’s browser is sent to the server log', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/')
  await expect(page.getByRole('searchbox', { name: 'Search everyone here' })).toBeVisible()

  // Most browsers send it as a beacon, which still goes out as the page closes. Chrome doesn't show a beacon's body to tests.
  const beacon = page.waitForRequest(r => r.url().includes('/api/v1/client-errors') && r.method() === 'POST')
  await page.evaluate(m => { setTimeout(() => { throw new Error(m) }) }, `e2e beacon ${run}`)
  await beacon

  // Browsers without beacons send it with fetch, which a test can read: the message, and the page it happened on.
  await page.addInitScript(() => { Object.defineProperty(navigator, 'sendBeacon', { value: undefined }) })
  await page.reload()
  await expect(page.getByRole('searchbox', { name: 'Search everyone here' })).toBeVisible()
  const fetched = page.waitForRequest(r => r.url().includes('/api/v1/client-errors') && r.method() === 'POST')
  await page.evaluate(m => { setTimeout(() => { throw new Error(m) }) }, `e2e fetch ${run}`)
  const body = (await fetched).postDataJSON() as { kind: string; message: string; url: string }
  expect(body).toMatchObject({ kind: 'error', url: '/' })
  expect(body.message).toContain(`e2e fetch ${run}`)
})
