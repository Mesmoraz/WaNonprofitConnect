import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { ORG, postListing, run, signIn } from './helpers'

// The shell around every screen: the name, installing to a home screen, layouts, one address, the staging tag.
// These need the built app (served by the API, as on Azure and in CI): `npm run build`, then BASE_URL=http://localhost:5253.

const brand = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'brand.json'), 'utf8')) as { name: string; shortName: string; tagline: string; themeColor: string }

test('[S-80] [S-76] the name comes from brand.json, and the app can be installed to a home screen', async ({ page }) => {
  await page.goto('/signup')
  await expect(page).toHaveTitle(new RegExp(brand.name))
  await expect(page.getByRole('heading', { name: `Join ${brand.name}` })).toBeVisible()
  await expect(page.getByText(brand.tagline)).toBeVisible()

  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href, 'a web manifest is linked').toBeTruthy()
  const manifest = await (await page.request.get(new URL(href!, page.url()).toString())).json()
  expect(manifest).toMatchObject({ name: brand.name, short_name: brand.shortName, display: 'standalone', start_url: '/', theme_color: brand.themeColor })
  expect(manifest.icons?.length).toBeGreaterThan(0)
})

test('[S-76] phones get tabs along the bottom, desktops a rail down the left', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/')
  const tabs = page.locator('.tabs')
  const phone = (await tabs.boundingBox())!
  const viewport = page.viewportSize()!
  expect(phone.y + phone.height).toBeGreaterThan(viewport.height - 4)   // pinned to the bottom
  expect(phone.width).toBeGreaterThan(viewport.width - 4)                 // full width
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)  // no sideways scroll

  await page.setViewportSize({ width: 1280, height: 800 })
  await expect.poll(async () => (await tabs.boundingBox())!.x).toBeLessThan(40)
  const rail = (await tabs.boundingBox())!
  expect(rail.width).toBeLessThan(300)                                   // a narrow column on the left
  await expect(page.getByRole('link', { name: 'Board', exact: true })).toBeVisible()
})

test('[S-75] one address serves the app, the API and deep links, and a reload keeps your place', async ({ page }) => {
  expect((await page.request.get('/health')).status()).toBe(200)
  const missing = await page.request.get(`/api/v1/no-such-thing-${run}`)
  expect(missing.status()).toBe(404)                                     // the API never answers with the app

  await signIn(page, { name: 'Casey', org: ORG.computers })
  const l = await postListing(page, { kind: 'Offer', title: `Projector ${run}` })
  await page.goto(`/listing/${l.id}`)
  await expect(page.getByRole('heading', { name: l.title })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`/listing/${l.id}$`))
  await expect(page.getByRole('heading', { name: l.title })).toBeVisible()
})

test('[S-112] the staging copy wears a Staging tag, and the real site never does', async ({ page, baseURL }) => {
  await page.goto('/signup')
  await expect(page.locator('.staging-flag')).toHaveCount(0)

  // Chrome sends any *.localhost name to this machine, so the same server can be reached as a staging address.
  const staging = new URL(baseURL!)
  test.skip(staging.hostname !== 'localhost', 'needs BASE_URL on localhost')
  staging.hostname = 'staging.localhost'
  await page.goto(new URL('/signup', staging).toString())
  await expect(page.locator('.staging-flag')).toContainText('Staging')
  await expect(page).toHaveTitle(/^Staging · /)
})
