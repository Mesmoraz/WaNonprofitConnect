import { expect, test, type Page } from '@playwright/test'
import { ADMIN_EMAIL, email, phone, postListing, run } from './helpers'

// After sign-in, go back to the link you opened (a shared post, an invite). No new words: the front door is as before.
// Org names are about to change case (another story), so these tests check URLs, the post's own title, and the toast's start.

/** Real organizations from tests/acceptance/fixtures/eo_wa_sample.csv, by EIN only. */
const SPOKANE = '237173826'   // Second Harvest Inland Northwest
const RAINIER = '911500768'   // Rainier Valley Food Bank

/** The Development-only sign-in, by EIN (helpers.ts signIn takes a named ORG, whose names are changing). */
async function signIn(page: Page, who: { name: string; email: string; ein?: string }) {
  const res = await page.request.post('/api/v1/auth/dev', { data: who })
  expect(res.ok(), `dev sign-in for ${who.name}: ${res.status()}`).toBeTruthy()
}

/** What the app keeps (src/lib/returnTo.ts), written straight into both stores. */
async function plantReturn(page: Page, path: string) {
  await page.evaluate(p => {
    const v = JSON.stringify({ path: p, at: Date.now() })
    sessionStorage.setItem('returnTo', v)
    localStorage.setItem('returnTo', v)
  }, path)
}

test('[S-107] signed out, a shared post opens after you sign in', async ({ page, browser }) => {
  const poster = await phone(browser)
  await signIn(poster.page, { name: 'Jordan', email: email('s107-poster'), ein: SPOKANE })
  const post = await postListing(poster.page, { kind: 'Offer', title: `Pallet jack to lend ${run}` })
  await poster.context.close()

  await page.goto(`/listing/${post.id}`)
  await expect(page).toHaveURL(/\/signup$/)

  await signIn(page, { name: 'Casey', email: email('s107-casey'), ein: RAINIER })
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`/listing/${post.id}$`))
  await expect(page.getByRole('heading', { name: post.title })).toBeVisible()

  // Used once: home is Home again.
  await page.goto('/')
  await expect(page).toHaveURL(/\/$/)
})

test('[S-107] an organization link survives the invite code, and the welcome still shows', async ({ page, browser }) => {
  const admin = await phone(browser)
  await signIn(admin.page, { name: 'Taylor', email: ADMIN_EMAIL })
  const made = await admin.page.request.post('/api/v1/admin/invites', { data: { ein: RAINIER, uses: 1 } })
  expect(made.ok(), await made.text()).toBeTruthy()
  const { code } = await made.json() as { code: string }
  await admin.context.close()

  await signIn(page, { name: 'Riley', email: email('s107-riley') })
  await page.goto(`/org/${SPOKANE}`)
  await expect(page).toHaveURL(/\/invite$/)

  await page.getByLabel('Invite code').fill(code)
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page).toHaveURL(new RegExp(`/org/${SPOKANE}$`))
  await expect(page.getByRole('status').filter({ hasText: 'You’re in. Welcome, ' })).toBeVisible()
})

test('[S-107] a link with a query keeps it', async ({ page }) => {
  await page.goto('/post?kind=Offer')
  await expect(page).toHaveURL(/\/signup$/)
  await signIn(page, { name: 'Morgan', email: email('s107-morgan'), ein: RAINIER })
  await page.reload()
  await expect(page).toHaveURL(/\/post\?kind=Offer$/)
})

test('[S-107] [S-130] Home with a query (a demo link) isn’t kept, so you land on plain Home', async ({ page }) => {
  await page.goto('/?demo=new-org')
  await expect(page).toHaveURL(/\/signup$/)
  await signIn(page, { name: 'Morgan', email: email('s107-home-query'), ein: RAINIER })
  await page.reload()
  await expect(page).toHaveURL(/\/$/)
})

test('[S-107] an off-site or protocol-relative link is never followed', async ({ page }) => {
  for (const [i, bad] of ['//evil.example', '/\\evil.example', 'https://evil.example/', '/signup'].entries()) {
    await page.context().clearCookies()
    await page.goto('/signup')
    const ours = new URL(page.url()).origin
    await plantReturn(page, bad)
    await signIn(page, { name: 'Avery', email: email(`s107-avery${i}`), ein: RAINIER })
    await page.goto('/')
    await expect(page).toHaveURL(url => url.origin === ours && url.pathname === '/' && !url.search)
    await expect(page.getByRole('button', { name: /^Avery · / })).toBeVisible()
  }
})
