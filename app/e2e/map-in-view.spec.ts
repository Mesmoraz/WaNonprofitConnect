import { expect, test, type Page } from '@playwright/test'
import { ORG, postListing, run, signIn } from './helpers'

// What's open in view (S-131, docs/ALPHA-BRIEFS.md): the count at the top, its list, and the kind of help chips.

type Member = { ein: string; lat: number | null; lon: number | null }

/** Open the map close in on an organization, and wait for the count to be about that view. */
async function mapAt(page: Page, o: Member) {
  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await page.goto(`/map?at=${o.lat},${o.lon},14`)
  await expect(page.getByRole('button', { name: /\d+ needs? · \d+ offers? in view/ })).toBeVisible({ timeout: 20_000 })
}

test('[S-131] the count says what is open in view, and its list opens each post', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  const title = `Volunteer sorters ${run}`
  const need = await postListing(page, { kind: 'Need', help: 'Time', title })
  const open = await (await page.request.get('/api/v1/map/open')).json() as { id: number; org: Member }[]
  const ballard = open.find(l => l.id === need.id)!.org
  expect(ballard.lat, 'the post comes with its place').not.toBeNull()

  await mapAt(page, ballard)
  const strip = page.getByRole('button', { name: /in view$/ })
  await expect(strip).toHaveText(/^[1-9]\d* needs? · \d+ offers? in view$/)
  await strip.click()
  const list = page.getByRole('dialog', { name: 'Open in view' })
  const row = list.getByRole('link', { name: new RegExp(title) })
  await expect(row).toContainText('Time')
  await expect(row).toContainText(ORG.ballard.name)
  await row.click()
  await expect(page).toHaveURL(new RegExp(`/listing/${need.id}$`))
})

test('[S-131] a kind of help chip narrows the count and the list to that kind', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  const time = await postListing(page, { kind: 'Need', help: 'Time', title: `Drivers ${run}` })
  const things = await postListing(page, { kind: 'Offer', help: 'Things', title: `Milk crates ${run}` })
  const open = await (await page.request.get('/api/v1/map/open')).json() as { id: number; org: Member }[]
  await mapAt(page, open.find(l => l.id === time.id)!.org)

  const chips = page.getByRole('group', { name: 'Kind of help' })
  await chips.getByRole('button', { name: 'Things' }).click()
  await expect(chips.getByRole('button', { name: 'Things' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /in view$/ }).click()
  const list = page.getByRole('dialog', { name: 'Open in view' })
  await expect(list.getByRole('link', { name: new RegExp(`Milk crates ${run}`) })).toBeVisible()
  await expect(list.getByRole('link', { name: new RegExp(`Drivers ${run}`) })).toHaveCount(0)

  await chips.getByRole('button', { name: 'All' }).click()
  await expect(list.getByRole('link', { name: new RegExp(`Drivers ${run}`) })).toBeVisible()
  expect(things.id).toBeGreaterThan(0)
})
