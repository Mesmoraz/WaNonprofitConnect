import { expect, test, type Page } from '@playwright/test'
import { ORG, signIn } from './helpers'

// Welcome card (docs/ALPHA-BRIEFS.md, approved in PR #6): on Home (S-126) until your organization has a need and an offer.

/** Start from nothing: close whatever Tacoma-Pierce Habitat has open from earlier runs. */
async function closeOpenPosts(page: Page) {
  const org = await (await page.request.get(`/api/v1/orgs/${ORG.habitat.ein}/page`)).json() as { listings: { id: number }[] }
  for (const l of org.listings) expect((await page.request.post(`/api/v1/listings/${l.id}/close`)).status()).toBe(204)
}

test('[S-96] a new organization is asked for one need and one offer, and the card goes once both are posted', async ({ page }) => {
  await signIn(page, { name: 'Drew', org: ORG.habitat })
  await closeOpenPosts(page)
  await page.goto('/')

  const card = page.getByRole('region', { name: 'Start with one need, one offer' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Post one thing you need and one thing you could give. When another organization helps, it becomes a golden thread on the map.')
  await expect(card.getByRole('link', { name: 'the map' })).toHaveAttribute('href', '/map')
  // Home has no green button (S-126): both are plain.
  await expect(card.getByRole('link', { name: 'Post a need' })).not.toHaveClass(/primary/)
  await expect(card.getByRole('link', { name: 'Post an offer' })).not.toHaveClass(/primary/)

  // Post a need: back on Home, only "Post an offer" is left.
  await card.getByRole('link', { name: 'Post a need' }).click()
  await expect(page.getByRole('heading', { name: 'What do you need?' })).toBeVisible()
  await page.getByRole('radio', { name: 'Things' }).click()
  await page.getByRole('radio', { name: 'Supplies' }).click()
  await page.getByRole('button', { name: 'Post need' }).click()
  await expect(page.getByText('Posted. It’s on the board now.')).toBeVisible()
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(card.getByRole('link', { name: 'Post a need' })).toHaveCount(0)
  await expect(card.getByRole('link', { name: 'Post an offer' })).toBeVisible()

  // Post an offer: Post opens on "We have", and afterwards the card is gone.
  await card.getByRole('link', { name: 'Post an offer' }).click()
  await expect(page.getByRole('heading', { name: 'What do you have?' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'We have' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: 'Time' }).click()
  await page.getByRole('radio', { name: 'Event help' }).click()
  await page.getByRole('button', { name: 'Post offer' }).click()
  await expect(page.getByText('Posted. It’s on the board now.')).toBeVisible()
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Waiting on you' })).toBeVisible()
  await expect(card).toHaveCount(0)
})

test('[S-96] "Not now" hides the welcome card on this device', async ({ page }) => {
  await signIn(page, { name: 'Drew', org: ORG.habitat })
  await closeOpenPosts(page)
  await page.goto('/')
  const card = page.getByRole('region', { name: 'Start with one need, one offer' })
  await expect(card).toBeVisible()
  await card.getByRole('button', { name: 'Not now' }).click()
  await expect(card).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Waiting on you' })).toBeVisible()
  await expect(card).toHaveCount(0)
})
