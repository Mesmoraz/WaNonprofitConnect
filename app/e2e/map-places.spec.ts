import { expect, test, type Page } from '@playwright/test'
import { ORG, postListing, run, signIn } from './helpers'

// Tap a place, see who's there (S-144, docs/ALPHA-BRIEFS.md): a town or neighborhood name on the map outlines it, the strip
// counts everyone inside it, and its list puts the organizations that have joined first. How the outline and fade look
// stays [needs your phone].

type PlaceOrgs = { id: string; name: string; total: number; joined: number; orgs: { org: { ein: string; name: string }; needs: number; offers: number }[] }
type MapBox = HTMLElement & {
  __map: {
    loaded(): boolean
    project(p: [number, number]): { x: number; y: number }
    queryRenderedFeatures(): { layer: { 'source-layer'?: string }; properties: Record<string, unknown>; geometry: { type: string; coordinates: [number, number] } }[]
  }
}

/** Where a place name sits on screen, once the base map has drawn it; null until then. */
const labelAt = (page: Page, name: string) => page.evaluate(n => {
  const box = document.querySelector('.wm-root') as MapBox | null
  if (!box?.__map?.loaded()) return null
  const f = box.__map.queryRenderedFeatures().find(f => f.layer['source-layer'] === 'place' && f.properties.name === n)
  if (!f) return null
  const p = box.__map.project(f.geometry.coordinates), r = box.getBoundingClientRect()
  return { x: r.left + p.x, y: r.top + p.y }
}, name)

test('[S-144] everyone inside a place: joined first, then everyone else, from public data', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await postListing(page, { kind: 'Need', title: `Egg cartons ${run}` })

  const outlines = await page.request.get('/api/v1/places')
  expect(outlines.ok()).toBeTruthy()
  const ids = ((await outlines.json()) as { features: { id: string; properties: { name: string; kind: string } }[] }).features
  expect(ids.find(f => f.properties.name === 'Seattle' && f.properties.kind === 'city')).toBeTruthy()
  expect(ids.find(f => f.properties.name === 'Ballard' && f.properties.kind === 'district')).toBeTruthy()

  const seattle = await (await page.request.get('/api/v1/places/p5363000/orgs')).json() as PlaceOrgs
  expect(seattle.name).toBe('Seattle')
  expect(seattle.joined).toBeGreaterThanOrEqual(1)
  expect(seattle.total).toBeGreaterThanOrEqual(seattle.joined)
  const first = seattle.orgs.slice(0, seattle.joined).map(o => o.org.ein)
  expect(first, 'a Seattle organization with an open need is among the joined').toContain(ORG.ballard.ein)

  expect((await page.request.get('/api/v1/places/nowhere/orgs')).status()).toBe(404)
})

test('[S-144] tapping a Seattle neighborhood name outlines it, counts it, lists it, and × clears it', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await postListing(page, { kind: 'Offer', title: `Pallet jack ${run}` })
  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await page.goto('/map?at=47.676,-122.39,13.2')
  await expect(page.getByRole('button', { name: /in view$/ })).toBeVisible({ timeout: 20_000 })

  let at: { x: number; y: number } | null = null
  await expect(async () => { at = await labelAt(page, 'Ballard'); expect(at).not.toBeNull() }).toPass({ timeout: 30_000 })
  await page.mouse.click(at!.x, at!.y)

  const strip = page.getByRole('button', { name: /organizations? in Ballard/ })
  await expect(strip).toHaveText(/^[1-9][\d,]* organizations? in Ballard · [1-9]\d* joined$/, { timeout: 20_000 })
  await expect(page.getByRole('button', { name: 'Clear Ballard' })).toHaveText('Ballard ×')

  await strip.click()
  const list = page.getByRole('dialog', { name: /organizations? in Ballard/ })
  await expect(list.getByRole('link').first()).toContainText(ORG.ballard.name)
  await expect(list.getByRole('link').first()).toContainText(/open$/)

  await list.getByRole('button', { name: 'Close' }).click()
  await expect(strip).toBeVisible()                                     // closing the list keeps the place
  await page.getByRole('button', { name: 'Clear Ballard' }).click()
  await expect(page.getByRole('button', { name: /in view$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear Ballard' })).toHaveCount(0)
})
