import { expect, test } from '@playwright/test'
import { ORG, phone, postListing, run, signIn } from './helpers'

// Home (S-126, S-140, docs/ALPHA-BRIEFS.md "Home"): a calm first tab, the map first, then what's waiting and what's new.

test('[S-126] [S-140] Home shows the map first, then what waits on you, where you stand and what is new, and each one opens', async ({ page, browser }) => {
  // Thurston County Food Bank has a need and an offer open, so the welcome card gives way to the counts line.
  await signIn(page, { name: 'Morgan', org: ORG.thurston })
  const need = await postListing(page, { kind: 'Need', title: `Pallet jack ${run}` })
  const offer = await postListing(page, { kind: 'Offer', title: `Spare freezer ${run}` })

  // Northwest Harvest starts a thread on the need: the next step is Thurston's.
  const harvest = await phone(browser)
  await signIn(harvest.page, { name: 'Riley', org: ORG.harvest })
  const theirs = await postListing(harvest.page, { kind: 'Offer', title: `Pallet jack to lend ${run}` })
  const started = await harvest.page.request.post('/api/v1/threads', { data: { listingId: need.id, myListingId: theirs.id, message: 'Ours is free Tuesday.' } })
  expect(started.status(), await started.text()).toBe(201)
  await harvest.context.close()

  await page.goto('/')
  // Tabs, in order, with Home first. The logo goes Home too.
  await expect(page.locator('.tabs a')).toHaveText(['Home', 'Board', 'Map', 'Post', /^Inbox/])   // Inbox carries its unread count
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveClass(/active/)

  // Your organization: name, "Olympia · Food", the counts line, and "Your page".
  await expect(page.getByRole('heading', { level: 1, name: ORG.thurston.name })).toBeVisible()
  await expect(page.getByText('Olympia · Food', { exact: true })).toBeVisible()
  await expect(page.locator('.home-standing')).toHaveText(/^\d+ needs?, \d+ offers? open( · \d+ golden threads?)? · Your page$/)
  await expect(page.getByRole('link', { name: 'Your page' })).toHaveAttribute('href', `/org/${ORG.thurston.ein}`)

  // No green button on Home.
  await expect(page.locator('.home .btn.primary')).toHaveCount(0)

  // Waiting on you: the thread Northwest Harvest started.
  const waiting = page.getByRole('region', { name: 'Waiting on you' })
  const row = waiting.getByRole('link', { name: new RegExp(need.title) })
  await expect(row).toContainText(`${ORG.harvest.name} started a thread`)

  // The map comes first (S-140): right under your name, a live map around Thurston with its label on it.
  const near = page.getByRole('region', { name: 'Near you' })
  await expect(page.locator('.home > *').nth(1)).toHaveAttribute('aria-label', 'Near you')
  await expect(near.locator('.near-label')).toHaveText(/^(\d+ organizations?( · \d+ golden threads?)?|No other organizations within 25 mi yet)$/)
  await expect(near.getByText('Tap the map to open it.')).toBeVisible()
  await expect(near.locator('canvas').first()).toBeVisible()
  expect((await near.locator('.near-frame').boundingBox())!.height).toBeGreaterThanOrEqual(250)

  // New this week: the 2 newest posts, two lines each, and the whole board one tap away.
  const fresh = page.getByRole('region', { name: 'New this week' })
  await expect(fresh.getByRole('link', { name: new RegExp(offer.title) })).toBeVisible()
  await expect(fresh.getByRole('link', { name: new RegExp(offer.title) })).toContainText(`Offer · ${ORG.thurston.name} ·`)
  expect(await fresh.locator('.home-post').count()).toBeLessThanOrEqual(2)
  await expect(fresh.getByRole('link', { name: 'See the whole board' })).toHaveAttribute('href', '/board')

  // On the board is gone (S-140).
  await expect(page.getByRole('region', { name: 'On the board' })).toHaveCount(0)

  // On a phone the header pill is your initial only; a screen reader still reads your name and organization.
  await expect(page.locator('.who .name')).toBeHidden()
  await expect(page.locator('.who')).toHaveAttribute('aria-label', `Morgan · ${ORG.thurston.name}`)

  // Each part opens: the thread, the map, the board.
  await page.locator('.logo').click()
  await expect(page).toHaveURL(/\/$/)
  await row.click()
  await expect(page).toHaveURL(/\/thread\/\d+$/)
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await near.getByRole('link').click()
  await expect(page).toHaveURL(/\/map\?at=47\.\d+,-122\.\d+,\d+\.\d+$/)   // the full map, opened on the same place
  await expect(page.locator('canvas').first()).toBeVisible()
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await fresh.getByRole('link', { name: 'See the whole board' }).click()
  await expect(page).toHaveURL(/\/board$/)
  await expect(page.getByRole('searchbox', { name: 'Search everyone here' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Board', exact: true })).toHaveClass(/active/)
})

test('[S-126] [S-140] with nothing waiting and nothing new, Home leaves Waiting on you out and points to the board', async ({ page }) => {
  await signIn(page, { name: 'Morgan', org: ORG.thurston })
  await page.route('**/api/v1/threads', route => route.fulfill({ json: [] }))
  await page.route(/\/api\/v1\/board(\?.*)?$/, route => route.fulfill({ json: [] }))
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'New this week' })).toContainText('Nothing new this week. See the whole board?')
  await expect(page.getByRole('region', { name: 'Waiting on you' })).toHaveCount(0)
  await page.getByRole('link', { name: 'See the whole board' }).click()
  await expect(page).toHaveURL(/\/board$/)
})
