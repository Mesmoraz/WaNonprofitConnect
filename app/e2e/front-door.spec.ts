import { expect, test } from '@playwright/test'
import { ADMIN_EMAIL, ORG, email, phone, run, signIn } from './helpers'

// The front door: sign in, then an invite code or a claim. Copy: docs/ALPHA-BRIEFS.md (Invite code, Waiting).

test('[S-70] [S-77] signed out, you see the approved sign-in page and can read the terms and privacy pages', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/signup$/)
  await expect(page.getByRole('heading', { name: /^Join / })).toBeVisible()
  await expect(page.getByText('Washington nonprofits, helping each other with what they have.')).toBeVisible()
  await expect(page.getByText('Free. No forms. Your organization is already here.')).toBeVisible()
  await page.getByRole('link', { name: 'the terms' }).click()
  await expect(page).toHaveURL(/\/terms$/)
  await page.goto('/signup')
  await page.getByRole('link', { name: 'the privacy page' }).click()
  await expect(page).toHaveURL(/\/privacy$/)
})

test('[S-68] [S-69] an invite code from Admin confirms you for that organization', async ({ page, browser }) => {
  // Taylor makes a code for Treehouse on the Admin page.
  const admin = await phone(browser)
  await signIn(admin.page, { name: 'Taylor', email: ADMIN_EMAIL })
  const made = await admin.page.request.post('/api/v1/admin/invites', { data: { ein: ORG.treehouse.ein, uses: 3 } })
  expect(made.ok(), await made.text()).toBeTruthy()
  const { code } = await made.json() as { code: string }
  await admin.context.close()

  // Someone from Treehouse signs in, with no organization yet.
  await signIn(page, { name: 'Robin', email: email('s68-invite') })   // its own person: other files sign in a confirmed Robin
  await page.goto('/')
  await expect(page).toHaveURL(/\/invite$/)
  await expect(page.getByRole('heading', { name: 'Your invite code' })).toBeVisible()
  await expect(page.getByText('It came in the message that invited you.')).toBeVisible()

  // A wrong code says so, and the right one gets you in.
  const field = page.getByLabel('Invite code')
  await field.fill(`WRONG${run}`)
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page.getByRole('alert')).toContainText('That code didn’t work.')
  await field.fill(code)
  await page.getByRole('button', { name: 'Join' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText(`You’re in. Welcome, ${ORG.treehouse.name}.`)).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(`Robin · ${ORG.treehouse.name}`) })).toBeVisible()
})

test('[S-68] [S-41] a claim waits for Admin, and approving it lets you in', async ({ page, browser }) => {
  await signIn(page, { name: 'Sam', email: email('sam') })
  await page.goto('/invite')
  await page.getByRole('link', { name: 'No code? Find your organization' }).click()
  await page.getByRole('searchbox').fill('Hopelink')
  // The full IRS list has other Hopelinks; pick by EIN.
  await page.getByRole('button', { name: /EIN 91-0982116/ }).click()
  await page.getByRole('button', { name: /^Join as / }).click()
  await expect(page.getByRole('heading', { name: 'We’ll check and let you know' })).toBeVisible()
  await expect(page.getByText(`Someone will confirm you belong to ${ORG.hopelink.name} within a day.`)).toBeVisible()

  // Taylor approves it on the Admin page.
  const admin = await phone(browser)
  await signIn(admin.page, { name: 'Taylor', email: ADMIN_EMAIL })
  await admin.page.goto('/admin')
  const claim = admin.page.locator('.card', { hasText: email('sam') })
  await expect(claim).toContainText(ORG.hopelink.name)
  await claim.getByRole('button', { name: 'Approve' }).click()
  await expect(claim).toHaveCount(0)
  await admin.context.close()

  // The waiting screen checks every 30 seconds; a reload is the same check.
  await page.reload()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: new RegExp(`Sam · ${ORG.hopelink.name}`) })).toBeVisible()
})
