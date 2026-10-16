import { expect, test } from '@playwright/test'
import { ORG, run, signIn } from './helpers'

// UX review, Oct 14 (S-119): an inbox row says what the thing is, with the count after it, and a thread's two posts
// open when you tap them. Copy: docs/ALPHA-BRIEFS.md (B8 Thread, B8 Inbox). No new words.

test('[S-119] the inbox says what the thing is, and a thread opens its posts', async ({ page, browser }) => {
  const other = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://localhost:5253' })
  const habitat = await other.newPage()
  await signIn(habitat, { name: 'Riley', org: ORG.habitat })
  const title = `Laptops ${run}`
  const res = await habitat.request.post('/api/v1/listings', {
    data: { kind: 'Need', help: 'Things', title, quantity: 12, unit: 'laptops', urgency: 'Normal', cadence: 'OneTime' },
  })
  expect(res.status(), await res.text()).toBe(201)
  const need = await res.json() as { id: number }
  await other.close()

  await signIn(page, { name: 'Sky', org: ORG.hopelink })
  const started = await page.request.post('/api/v1/threads', { data: { listingId: need.id, message: 'We have twelve.' } })
  expect(started.ok()).toBeTruthy()

  await page.goto('/inbox')
  const row = page.locator('.inbox-row', { hasText: ORG.habitat.name }).filter({ hasText: title })
  await expect(row).toContainText(`Their need · ${title} · 12 laptops`)

  await row.click()
  await expect(page).toHaveURL(/\/thread\/\d+$/)
  const needLink = page.locator('.thread-pair').getByRole('link', { name: title }).first()
  await expect(needLink).toHaveAttribute('href', `/listing/${need.id}`)
  await needLink.click()
  await expect(page).toHaveURL(new RegExp(`/listing/${need.id}$`))
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})
