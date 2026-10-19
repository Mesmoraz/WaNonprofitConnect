import { expect, test, type Page } from '@playwright/test'
import { ORG, postListing, run, signIn } from './helpers'

// The map (S-48, S-73, S-74, S-84). What it looks like stays [needs your phone]; these check what it does.

type Member = { ein: string; name: string; lat: number | null; lon: number | null }

/** Wait until the map has drawn, then return where a place is on screen. */
async function screenPoint(page: Page, lon: number, lat: number) {
  await page.waitForFunction(() => {
    const box = document.querySelector('.wm-root') as (HTMLElement & { __map?: { loaded(): boolean } }) | null
    return !!box?.__map?.loaded()
  })
  return page.evaluate(([lo, la]) => {
    const box = document.querySelector('.wm-root') as HTMLElement & { __map: { project(p: [number, number]): { x: number; y: number }; jumpTo(o: object): void } }
    box.__map.jumpTo({ center: [lo, la], zoom: 15 })
    const p = box.__map.project([lo, la])
    const r = box.getBoundingClientRect()
    return { x: r.left + p.x, y: r.top + p.y }
  }, [lon, lat] as const)
}

test('[S-48] the base map comes from OpenFreeMap', async ({ page }) => {
  const tiles: string[] = []
  page.on('request', r => { if (r.url().includes('tiles.openfreemap.org')) tiles.push(r.url()) })
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/map')
  await expect(page.locator('canvas').first()).toBeVisible()
  await expect.poll(() => tiles.length, { message: 'map style and tiles requested' }).toBeGreaterThan(0)
  await expect(page.getByText('MapLibre')).toBeVisible()   // the attribution the tiles' license asks for
})

test('[S-74] the map data places organizations in Washington and lists every dot', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await postListing(page, { kind: 'Offer', title: `Bread racks ${run}` })   // a post makes you a pin

  const points = await (await page.request.get('/api/v1/map/points')).json() as [string, number, number][]
  const ballardDot = points.find(p => p[0] === ORG.ballard.ein)
  expect(ballardDot, 'Ballard Food Bank is a dot').toBeTruthy()
  const [, lat, lon] = ballardDot!
  expect(lat).toBeGreaterThan(45.5); expect(lat).toBeLessThan(49.1)     // Washington
  expect(lon).toBeGreaterThan(-124.9); expect(lon).toBeLessThan(-116.9)

  const map = await (await page.request.get('/api/v1/map')).json() as { members: Member[]; threads: unknown[] }
  expect(map.members.map(m => m.ein)).toContain(ORG.ballard.ein)
})

test('[S-84] tapping an organization on the map opens its card, then its page', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await postListing(page, { kind: 'Need', title: `Volunteer drivers ${run}` })
  const map = await (await page.request.get('/api/v1/map')).json() as { members: Member[] }
  const ballard = map.members.find(m => m.ein === ORG.ballard.ein)!
  expect(ballard.lat).not.toBeNull()

  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))   // the legend sits over the middle of a phone
  await page.goto('/map')
  const at = await screenPoint(page, ballard.lon!, ballard.lat!)
  const card = page.getByRole('dialog', { name: 'Details' })
  // The pins draw a moment after the map moves: tap again until the card opens, rather than wait a fixed time.
  await expect(async () => {
    await page.mouse.click(at.x, at.y)
    await expect(card).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await expect(card).toContainText(ORG.ballard.name)
  await card.getByRole('link', { name: 'See their needs and offers' }).click()
  await expect(page).toHaveURL(new RegExp(`/org/${ORG.ballard.ein}$`))
  await expect(page.getByText(`Volunteer drivers ${run}`)).toBeVisible()
})
