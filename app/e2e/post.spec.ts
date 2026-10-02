import { expect, test } from '@playwright/test'
import { ORG, signIn } from './helpers'

// B7 Post, with the pick-a-title change (S-111). Copy: docs/ALPHA-BRIEFS.md.

test('[S-19] [S-111] post a need by picking: kind of help, then what it is', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/post')
  await expect(page.getByRole('heading', { name: 'What do you need?' })).toBeVisible()
  const post = page.getByRole('button', { name: 'Post need' })
  await expect(post).toBeDisabled()

  await page.getByRole('radio', { name: 'Things' }).click()
  await expect(post).toBeDisabled()                    // still needs "What is it?"
  await page.getByRole('radio', { name: 'Laptops' }).click()
  await page.getByLabel('How many').fill('12')
  await expect(post).toBeEnabled()
  await post.click()

  await expect(page.getByText('Posted. It’s on the board now.')).toBeVisible()
  await expect(page).toHaveURL(/\/listing\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Laptops' })).toBeVisible()
  await expect(page.getByText('Need · Things')).toBeVisible()
  await expect(page.getByText('12 needed')).toBeVisible()
})

test('[S-111] "Something else" opens a box to type the title, and We have switches to an offer', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/post')
  await page.getByRole('radio', { name: 'We have' }).click()
  await expect(page.getByRole('heading', { name: 'What do you have?' })).toBeVisible()
  await expect(page.getByText('How soon')).toHaveCount(0)   // needs only
  await page.getByRole('radio', { name: 'Skills' }).click()
  await page.getByRole('radio', { name: 'Something else' }).click()
  const title = `Grant budget review ${Date.now()}`
  await page.getByRole('textbox', { name: 'What is it?' }).fill(title)
  await page.getByRole('button', { name: 'Post offer' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText('Offer · Skills')).toBeVisible()
})
