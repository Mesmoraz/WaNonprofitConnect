import { devices, expect, test } from '@playwright/test'
import { ORG, run, signIn } from './helpers'

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
