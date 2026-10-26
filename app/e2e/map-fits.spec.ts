import { expect, test, type Page } from '@playwright/test'
import { ORG, phone, postListing, run, signIn } from './helpers'

// Find what fits you (S-130, docs/ALPHA-BRIEFS.md). How the lines look stays [needs your phone]; these check what they do.

type MapBox = HTMLElement & {
  __map: { loaded(): boolean; project(p: [number, number]): { x: number; y: number }; isMoving(): boolean }
  __lines?: { fit: string | null; middle: [number, number] }[]
}

/** Where the middle of the fit line to an organization is on screen, once the map has framed it. */
async function fitLineMiddle(page: Page, ein: string) {
  await page.waitForFunction(ein => {
    const box = document.querySelector('.wm-root') as MapBox | null
    return !!box?.__map?.loaded() && !box.__map.isMoving() && (box.__lines ?? []).some(l => l.fit === ein)
  }, ein)
  return page.evaluate(ein => {
    const box = document.querySelector('.wm-root') as MapBox
    const line = box.__lines!.find(l => l.fit === ein)!
    const p = box.__map.project(line.middle), r = box.getBoundingClientRect()
    return { x: r.left + p.x, y: r.top + p.y }
  }, ein)
}

test('[S-130] "Offers for your needs" lists what fits, draws a line to it, and both open the post', async ({ page, browser }) => {
  const word = `Tables${run}`
  const rainier = await phone(browser)
  await signIn(rainier.page, { name: 'Robin', org: ORG.rainier })
  const offer = await postListing(rainier.page, { kind: 'Offer', title: `Folding ${word} to lend` })
  await rainier.context.close()

  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  const need = await postListing(page, { kind: 'Need', title: `Folding ${word} for Saturday` })

  // The API: the offer fits the need, paired with it.
  const fits = await (await page.request.get('/api/v1/map/fits?for=needs')).json() as { myId: number; post: { id: number } }[]
  expect(fits).toContainEqual(expect.objectContaining({ myId: need.id, post: expect.objectContaining({ id: offer.id }) }))

  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await page.goto('/map')
  const toggle = page.getByRole('button', { name: 'Offers for your needs' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const card = page.getByRole('dialog', { name: 'What fits you' })
  await expect(card).toContainText(/\d+ offers? could fit your needs/)
  const row = card.getByRole('link', { name: new RegExp(`Folding ${word} to lend`) })
  await expect(row).toContainText(ORG.rainier.name)
  await expect(row).toContainText(`For your: Folding ${word} for Saturday`)

  // The line to Rainier Valley Food Bank opens their post.
  const at = await fitLineMiddle(page, ORG.rainier.ein)
  await expect(async () => {
    await page.mouse.click(at.x, at.y)
    await expect(page).toHaveURL(/\/listing\/\d+$/, { timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await page.goBack()

  // So does the row.
  await page.getByRole('button', { name: 'Offers for your needs' }).click()
  await card.getByRole('link', { name: new RegExp(`Folding ${word} to lend`) }).click()
  await expect(page).toHaveURL(new RegExp(`/listing/${offer.id}$`))
  await expect(page.getByText(`Folding ${word} to lend`)).toBeVisible()
})

test('[S-130] a toggle turns off when tapped again, and the ? shows the legend instead', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  await postListing(page, { kind: 'Offer', title: `Crates ${run}` })
  await page.addInitScript(() => localStorage.setItem('helpbook.mapLegendSeen', '1'))
  await page.goto('/map')
  const toggle = page.getByRole('button', { name: 'Needs you can help with' })
  const card = page.getByRole('dialog', { name: 'What fits you' })
  await toggle.click()
  await expect(card).toBeVisible()
  await toggle.click()
  await expect(card).toHaveCount(0)
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')

  await toggle.click()
  await page.getByRole('button', { name: 'What the map shows' }).click()
  await expect(card).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'What the map shows' })).toBeVisible()
})

test('[S-130] fits are for confirmed members, about their own posts', async ({ page }) => {
  await signIn(page, { name: 'Jordan', org: ORG.ballard })
  expect((await page.request.get('/api/v1/map/fits?for=sideways')).status()).toBe(400)
  await signIn(page, { name: 'Nobody' })
  expect((await page.request.get('/api/v1/map/fits?for=needs')).status()).toBe(403)
})
