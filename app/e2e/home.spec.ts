import { expect, test } from '@playwright/test'
import { ORG, phone, postListing, run, signIn } from './helpers'

// Home (S-126, docs/ALPHA-BRIEFS.md "Home"): a calm first tab that points to the board, the map, and what's waiting.

test('[S-126] Home shows where you stand, what waits on you, who is near and what is new, and each one opens', async ({ page, browser }) => {
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

  // Near you: a still picture and its line.
  const near = page.getByRole('region', { name: 'Near you' })
  await expect(near.getByRole('link')).toHaveText(/^\d+ organizations?, \d+ golden threads? within 25 mi\. Open the map$/)

  // New this week: the newest posts, as board cards, and the whole board one tap away.
  const fresh = page.getByRole('region', { name: 'New this week' })
  await expect(fresh.getByRole('link', { name: new RegExp(offer.title) })).toBeVisible()
  expect(await fresh.locator('.listing-card').count()).toBeLessThanOrEqual(3)
  await expect(fresh.getByRole('link', { name: 'See the whole board' })).toHaveAttribute('href', '/board')

  // Go to: every chip has something behind it, and opens the Board with the same count.
  const chips = page.getByRole('region', { name: 'Go to' }).locator('.chip')
  expect(await chips.count()).toBeGreaterThan(0)
  expect(await chips.count()).toBeLessThanOrEqual(5)
  for (const label of await chips.allTextContents()) expect(label).toMatch(/ · [1-9]\d*$/)
  const first = (await chips.first().textContent())!
  await chips.first().click()
  await expect(page).toHaveURL(/\/board(\?|$)/)
  await expect(page.locator('.flt-head')).toContainText(new RegExp(`^${first.split(' · ')[1]} open`))

  // Each part opens: the thread, the map, the board.
  await page.locator('.logo').click()
  await expect(page).toHaveURL(/\/$/)
  await row.click()
  await expect(page).toHaveURL(/\/thread\/\d+$/)
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await near.getByRole('link').click()
  await expect(page).toHaveURL(/\/map$/)
  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await fresh.getByRole('link', { name: 'See the whole board' }).click()
  await expect(page).toHaveURL(/\/board$/)
  await expect(page.getByRole('searchbox', { name: 'Search everyone here' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Board', exact: true })).toHaveClass(/active/)
})

test('[S-126] with nothing waiting and nothing new, Home says so and points to the board', async ({ page }) => {
  await signIn(page, { name: 'Morgan', org: ORG.thurston })
  await page.route('**/api/v1/threads', route => route.fulfill({ json: [] }))
  await page.route(/\/api\/v1\/board(\?.*)?$/, route => route.fulfill({ json: [] }))
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Waiting on you' })).toContainText('Nothing waiting on you.')
  await expect(page.getByRole('region', { name: 'New this week' })).toContainText('Nothing new this week. See the whole board?')
  await expect(page.getByRole('region', { name: 'Go to' })).toHaveCount(0)   // no chip with nothing behind it
  await page.getByRole('link', { name: 'See the whole board' }).click()
  await expect(page).toHaveURL(/\/board$/)
})
