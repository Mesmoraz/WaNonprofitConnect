import { devices, expect, test, type Page } from '@playwright/test'
import { ORG, phone, postListing, run, signIn } from './helpers'

// The map shows what's open (S-129, approved Oct 20). How the rings look stays [needs your phone]; these check what it does.

type Member = { ein: string; name: string; lat: number | null; lon: number | null }
type MapBox = HTMLElement & {
  __map: { loaded(): boolean; jumpTo(o: object): void; project(p: [number, number]): { x: number; y: number } }
  __lines?: { pair: [string, string] | null; count: number }[]
}

async function members(page: Page) {
  return (await (await page.request.get('/api/v1/map')).json() as { members: Member[] }).members
}

/** Open the map zoomed in between two organizations, so each is its own pin. */
async function between(page: Page, a: Member, b: Member) {
  await page.goto('/map')
  await page.waitForFunction(() => !!(document.querySelector('.wm-root') as MapBox | null)?.__map?.loaded())
  await page.evaluate(([a, b]) => {
    (document.querySelector('.wm-root') as MapBox).__map.jumpTo({ center: [(a.lon! + b.lon!) / 2, (a.lat! + b.lat!) / 2], zoom: 12.5 })
  }, [a, b] as const)
}

/** How many threads the line between two organizations carries; 0 when there's no line. */
const lineCount = (page: Page, a: string, b: string) => page.evaluate(([a, b]) => {
  const line = ((document.querySelector('.wm-root') as MapBox).__lines ?? []).find(l => !!l.pair && l.pair.includes(a) && l.pair.includes(b))
  return line?.count ?? 0
}, [a, b] as const)

test('[S-129] the map counts each organization\'s open needs and offers', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  const before = (await (await page.request.get('/api/v1/map')).json() as { open: { ein: string; needs: number; offers: number }[] })
    .open.find(o => o.ein === ORG.ballard.ein) ?? { needs: 0, offers: 0 }
  await postListing(page, { kind: 'Need', title: `Egg cartons ${run}` })
  await postListing(page, { kind: 'Offer', title: `Pallet jack ${run}` })
  const after = (await (await page.request.get('/api/v1/map')).json() as { open: { ein: string; needs: number; offers: number }[] })
    .open.find(o => o.ein === ORG.ballard.ein)!
  expect(after.needs).toBe(before.needs + 1)
  expect(after.offers).toBe(before.offers + 1)
})

test('[S-129] tapping a pin says what is open there and lists it', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  const title = `Cold storage shelves ${run}`
  await postListing(page, { kind: 'Need', title })
  const ballard = (await members(page)).find(m => m.ein === ORG.ballard.ein)!

  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await page.goto('/map')
  await page.waitForFunction(() => !!(document.querySelector('.wm-root') as MapBox | null)?.__map?.loaded())
  const at = await page.evaluate(([lo, la]) => {
    const box = document.querySelector('.wm-root') as MapBox
    box.__map.jumpTo({ center: [lo, la], zoom: 15 })
    const p = box.__map.project([lo, la]), r = box.getBoundingClientRect()
    return { x: r.left + p.x, y: r.top + p.y }
  }, [ballard.lon!, ballard.lat!] as const)
  const card = page.getByRole('dialog', { name: 'Details' })
  await expect(async () => {
    await page.mouse.click(at.x, at.y)
    await expect(card).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await expect(card).toContainText(/\d+ needs? · \d+ offers? · \d+ golden threads?/)
  await card.getByRole('link', { name: new RegExp(`Need\\s*${title}`) }).click()
  await expect(page).toHaveURL(/\/listing\/\d+$/)
})

test('[S-129] only golden threads are drawn for everyone; your own underway are drawn for you', async ({ page, browser }) => {
  test.setTimeout(120_000)   // three phones, and the map opens three times
  const hope = await phone(browser)
  await signIn(hope.page, { name: 'Sam', org: ORG.hopelink })
  await signIn(page, { name: 'Pat', org: ORG.rebuilding })
  const need = await postListing(hope.page, { kind: 'Need', title: `Ramps ${run}` })
  const offer = await postListing(page, { kind: 'Offer', title: `Ramp lumber ${run}` })
  const res = await page.request.post('/api/v1/threads', { data: { listingId: need.id, myListingId: offer.id, message: 'We have some.' } })
  expect(res.status(), await res.text()).toBe(201)
  const id = (await res.json() as { id: number }).id

  const all = await members(page)
  const a = all.find(m => m.ein === ORG.rebuilding.ein)!, b = all.find(m => m.ein === ORG.hopelink.ein)!

  // Yours, underway: drawn for you.
  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await between(page, a, b)
  await expect.poll(() => lineCount(page, a.ein, b.ein), { timeout: 15_000 }).toBeGreaterThan(0)

  // Someone else's, underway: not drawn. (This one looks at the map, so it opens the same app as the test.)
  const ctx = await browser.newContext({ ...devices['Pixel 7'], baseURL: test.info().project.use.baseURL })
  const other = { context: ctx, page: await ctx.newPage() }
  await signIn(other.page, { name: 'Jordan', org: ORG.ballard })
  await other.page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  const theirs = async () => {
    await between(other.page, a, b)
    // Both ends are their own pins at this zoom once the map has re-grouped: a line between them, or none, has a pair.
    await other.page.waitForFunction(() => ((document.querySelector('.wm-root') as MapBox).__lines ?? []).some(l => !!l.pair))
    await other.page.waitForTimeout(500)
    return lineCount(other.page, a.ein, b.ein)
  }
  const before = await theirs()

  // Once it's golden, everyone sees it.
  for (const action of ['accept', 'complete']) {
    const r = await hope.page.request.post(`/api/v1/threads/${id}/${action}`)
    expect(r.ok(), await r.text()).toBeTruthy()
  }
  expect(await theirs(), "the golden one is drawn for them too").toBe(before + 1)
  await hope.context.close()
  await other.context.close()
})
