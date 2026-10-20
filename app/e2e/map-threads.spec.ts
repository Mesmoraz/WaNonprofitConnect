import { expect, test, type Page } from '@playwright/test'
import { ORG, phone, postListing, run, signIn } from './helpers'

// One line per pair of places (S-127, approved Oct 19). How the line looks stays [needs your phone]; these check what it does.

type Member = { ein: string; name: string; lat: number | null; lon: number | null }
type MapBox = HTMLElement & {
  __map: { loaded(): boolean; jumpTo(o: object): void; project(p: [number, number]): { x: number; y: number } }
  __bursts?: number
  __lines?: { pair: [string, string] | null; count: number; middle: [number, number] }[]
}

/** Two of Rebuilding Together's offers, each in a thread on one of Hopelink's needs: two threads between the same two places. */
async function twoThreads(page: Page, hopelink: Page) {
  const ids: number[] = []
  const titles: string[] = []
  for (const what of ['Ladders', 'Paint']) {
    const need = await postListing(hopelink, { kind: 'Need', title: `${what} ${run}` })
    const offer = await postListing(page, { kind: 'Offer', title: `${what} to give ${run}` })
    const res = await page.request.post('/api/v1/threads', { data: { listingId: need.id, myListingId: offer.id, message: 'We have some.' } })
    expect(res.status(), await res.text()).toBe(201)
    ids.push((await res.json() as { id: number }).id)
    titles.push(need.title)
  }
  return { ids, titles }
}

/** Zoom in on the two organizations so each is its own pin, and return where the middle of the line between them is. */
async function lineMiddle(page: Page, a: Member, b: Member) {
  await page.waitForFunction(() => !!(document.querySelector('.wm-root') as MapBox | null)?.__map?.loaded())
  await page.evaluate(([a, b]) => {
    (document.querySelector('.wm-root') as MapBox).__map.jumpTo({ center: [(a.lon! + b.lon!) / 2, (a.lat! + b.lat!) / 2], zoom: 12.5 })
  }, [a, b] as const)
  const pair = [a.ein, b.ein]
  await page.waitForFunction(pair => ((document.querySelector('.wm-root') as MapBox).__lines ?? [])
    .some(l => !!l.pair && pair.includes(l.pair[0]) && pair.includes(l.pair[1])), pair)
  return page.evaluate(pair => {
    const box = document.querySelector('.wm-root') as MapBox
    const line = box.__lines!.find(l => !!l.pair && pair.includes(l.pair[0]) && pair.includes(l.pair[1]))!
    box.__map.jumpTo({ center: line.middle })            // the middle of the line, on screen
    const p = box.__map.project(line.middle), r = box.getBoundingClientRect()
    return { x: r.left + p.x, y: r.top + p.y, count: line.count }
  }, pair)
}

test('[S-127] several threads between two organizations are one line, and tapping it lists them', async ({ page, browser }) => {
  const hope = await phone(browser)
  await signIn(hope.page, { name: 'Sam', org: ORG.hopelink })
  await signIn(page, { name: 'Pat', org: ORG.rebuilding })
  const { titles } = await twoThreads(page, hope.page)
  await hope.context.close()

  const map = await (await page.request.get('/api/v1/map')).json() as { members: Member[] }
  const a = map.members.find(m => m.ein === ORG.rebuilding.ein)!, b = map.members.find(m => m.ein === ORG.hopelink.ein)!
  expect(a.lat).not.toBeNull(); expect(b.lat).not.toBeNull()

  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await page.goto('/map')
  const middle = await lineMiddle(page, a, b)
  expect(middle.count, 'one line carries both threads').toBeGreaterThanOrEqual(2)
  const card = page.getByRole('dialog', { name: 'Details' })
  // The line draws a moment after the map moves: tap again until the card opens.
  await expect(async () => {
    await page.mouse.click(middle.x, middle.y)
    await expect(card).toContainText(`${ORG.rebuilding.name} and ${ORG.hopelink.name}`, { timeout: 1000 })
  }).toPass({ timeout: 20_000 })

  // One row for each thread, saying where it stands.
  for (const t of titles) await expect(card.getByRole('button', { name: new RegExp(`^${t}\\s*Waiting for a yes$`) })).toBeVisible()
  // A row opens that thread's own card.
  await card.getByRole('button', { name: new RegExp(`^${titles[0]}`) }).click()
  await expect(card).toContainText('→')
  await expect(card.getByRole('link', { name: 'Open thread' })).toBeVisible()

  // The legend says what a number on a line means.
  await card.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'What the map shows' }).click()
  await expect(page.getByText('A thicker line with a number is several threads between the same two places.')).toBeVisible()
})

test('[S-127] a thread that turns golden while you look at the map pops confetti', async ({ page, browser }) => {
  const hope = await phone(browser)
  await signIn(hope.page, { name: 'Sam', org: ORG.hopelink })
  await signIn(page, { name: 'Pat', org: ORG.rebuilding })
  const { ids } = await twoThreads(page, hope.page)

  await page.goto('/map')
  await page.waitForFunction(() => !!(document.querySelector('.wm-root') as MapBox | null)?.__map?.loaded())
  const bursts = () => page.evaluate(() => (document.querySelector('.wm-root') as MapBox).__bursts ?? 0)
  const before = await bursts()

  // Hopelink says yes and marks it done, on their own phone.
  for (const action of ['accept', 'complete']) {
    const res = await hope.page.request.post(`/api/v1/threads/${ids[0]}/${action}`)
    expect(res.ok(), await res.text()).toBeTruthy()
  }
  await expect.poll(bursts, { timeout: 15_000 }).toBeGreaterThan(before)
  await hope.context.close()
})
