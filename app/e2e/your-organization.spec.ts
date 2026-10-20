import { devices, expect, test } from '@playwright/test'
import { ORG, email, run, signIn } from './helpers'

// Your organization (S-99, docs/ALPHA-BRIEFS.md "Your organization"): the About you part, and the lines everyone else
// sees on the organization's page. People here and Invite someone come with S-95.

test('[S-99] an organization says what it does, and others see it on its page', async ({ page, browser }) => {
  const first = `Casey${run}`            // unique, so this run's chip is the only one with this name
  const about = `We lend tools to neighbors, run ${run}.`
  await signIn(page, { name: `${first} Jones`, org: ORG.westTools })

  await page.goto('/')
  await page.getByRole('button', { name: new RegExp(ORG.westTools.name) }).click()
  await page.getByRole('menuitem', { name: 'Your organization' }).click()
  await expect(page).toHaveURL(/\/org$/)

  await expect(page.getByRole('heading', { name: ORG.westTools.name })).toBeVisible()
  await expect(page.getByText('Seattle · Community · EIN 81-1434757')).toBeVisible()
  await expect(page.getByText('About you')).toBeVisible()
  await expect(page.getByText('One line. Others see it on your page.')).toBeVisible()
  await expect(page.getByText('Others see the name, not the email. Messages still go through threads.')).toBeVisible()

  const whatYouDo = page.getByLabel('What you do')
  await expect(whatYouDo).toHaveAttribute('placeholder', 'We run a food bank and a free store in Ballard.')
  await expect(whatYouDo).toHaveAttribute('maxlength', '140')
  await whatYouDo.fill(about)
  await page.getByLabel('Website').fill(`tools-${run}.example.org`)
  await page.getByRole('radio', { name: first }).click()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Saved.')).toBeVisible()
  await expect(page.getByLabel('Website')).toHaveValue(`https://tools-${run}.example.org`)

  // Someone at another organization opens the page.
  const other = await browser.newContext({ ...devices['Pixel 7'], baseURL: process.env.BASE_URL ?? 'http://localhost:5253' })
  const otherPage = await other.newPage()
  await signIn(otherPage, { name: 'Morgan', org: ORG.thurston })
  await otherPage.goto(`/org/${ORG.westTools.ein}`)
  await expect(otherPage.getByText(about)).toBeVisible()
  const link = otherPage.getByRole('link', { name: `tools-${run}.example.org` })
  await expect(link).toHaveAttribute('href', `https://tools-${run}.example.org`)
  await expect(link).toHaveAttribute('rel', 'noopener nofollow ugc')
  await expect(otherPage.getByText(`Ask for ${first}`)).toBeVisible()
  await expect(otherPage.getByText('Needs and offers')).toBeVisible()
  await expect(otherPage.locator('main')).not.toContainText('@')
  await expect(otherPage.locator('main')).not.toContainText('Jones')
  await other.close()
})

// Invite someone (S-95): a member makes a one-use code, and a colleague joins with it. 3 places, the first person
// included. People signed in by the test sign-in don't take a place, so this organization starts with 3 unless
// earlier local runs used them up (a fresh database on GitHub always has them).
test('[S-95] a member makes a code and a colleague joins with it', async ({ page, browser }) => {
  const first = `Avery${run}`
  await signIn(page, { name: `${first} Kim`, org: ORG.spokane })
  await page.goto('/org')
  await expect(page.getByText('People here')).toBeVisible()
  await expect(page.getByText(`${first} Kim · ${email(`${first} kim`.toLowerCase())} (you)`, { exact: true })).toBeVisible()
  await expect(page.getByText('Invite someone')).toBeVisible()
  const places = page.getByText(/^Up to 3 people can be here\. \d left\.$|^All 3 places are taken\.$/)
  await expect(places).toBeVisible()
  test.skip(await page.getByText('All 3 places are taken.').isVisible(), 'earlier local runs used the places; a fresh database has them')
  const before = Number((await places.textContent())!.match(/(\d) left/)![1])

  await page.getByRole('button', { name: 'Make a code' }).click()
  await expect(page.getByText('Send it to them yourself. It works once.')).toBeVisible()
  const codeButton = page.locator('.org-code')
  const code = (await codeButton.textContent())!.trim()
  expect(code).toMatch(/^[A-Z2-9]{8}$/)
  await expect(page.getByText(before - 1 ? `Up to 3 people can be here. ${before - 1} left.` : 'All 3 places are taken.')).toBeVisible()
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await codeButton.click()
  await expect(page.getByText('Copied.')).toBeVisible()

  // The colleague, on their own phone, signs in and enters the code.
  const other = await browser.newContext({ ...devices['Pixel 7'], baseURL: process.env.BASE_URL ?? 'http://localhost:5253' })
  const colleague = await other.newPage()
  await signIn(colleague, { name: `Jesse${run}` })
  await colleague.goto('/invite')
  await colleague.getByLabel('Invite code').fill(code)
  await colleague.getByRole('button', { name: 'Join' }).click()
  await expect(colleague.getByText(`You’re in. Welcome, ${ORG.spokane.name}.`)).toBeVisible()
  await other.close()

  await page.reload()
  await expect(page.getByText(`Jesse${run} · ${email(`jesse${run}`)}`, { exact: true })).toBeVisible()
})

test('[S-109] Find yours says to ask someone there for an invite code', async ({ page }) => {
  await signIn(page, { name: 'Quinn', org: ORG.ballard })            // so Ballard has someone on it
  await signIn(page, { name: `Newcomer${run}` })                     // signed in, no organization yet
  await page.goto('/find')
  await page.getByPlaceholder('Organization name or EIN').fill('Ballard Food')
  await expect(page.getByText(/^Already on .+\. Ask someone there for an invite code\.$/)).toBeVisible()
})
