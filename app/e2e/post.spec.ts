import { expect, test } from '@playwright/test'
import { ORG, email, phone, postListing, run, signIn } from './helpers'

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

test('[S-117] Auction items is a pick under Things', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/post')
  await page.getByRole('radio', { name: 'Things' }).click()
  await page.getByRole('radio', { name: 'Auction items' }).click()
  await page.getByRole('button', { name: 'Post need' }).click()

  await expect(page.getByText('Posted. It’s on the board now.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Auction items' })).toBeVisible()
  await expect(page.getByText('Need · Things')).toBeVisible()
})

// Edit a need or offer (S-97) and the small lines folded into it (S-109). Copy: docs/ALPHA-BRIEFS.md.

test('[S-97] edit a need: fix the title and count, threads stay', async ({ page, browser }) => {
  await signIn(page, { name: 'Robin', org: ORG.rainier })
  const need = await postListing(page, { kind: 'Need', title: `Folding tables ${run}` })
  const thurston = await phone(browser)
  await signIn(thurston.page, { name: 'Lee', org: ORG.thurston })
  const started = await thurston.page.request.post('/api/v1/threads', { data: { listingId: need.id, message: 'We have 4 tables.' } })
  expect(started.ok(), await started.text()).toBeTruthy()
  const thread = await started.json() as { id: number }

  await page.goto(`/listing/${need.id}`)
  await page.getByRole('link', { name: 'Edit this need' }).click()
  await expect(page.getByRole('heading', { name: 'Edit your need' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'We need' })).toHaveCount(0)    // a need stays a need
  await expect(page.getByRole('radio', { name: 'Something else' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('1 thread is open on this. They’ll see the change.')).toBeVisible()

  const title = `Folding tables, 8 ft ${run}`
  await page.getByRole('textbox', { name: 'What is it?' }).fill(title)
  await page.getByLabel('How many').fill('6')
  await page.getByRole('button', { name: 'Save changes' }).click()

  await expect(page.getByText('Saved.')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/listing/${need.id}$`))
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await expect(page.getByText(/· Edited$/)).toBeVisible()
  await expect(page.getByText('6 needed')).toBeVisible()

  // The other organization's thread is still there, with the new title.
  await thurston.page.goto(`/thread/${thread.id}`)
  await expect(thurston.page.getByText(title).first()).toBeVisible()
  await expect(thurston.page.getByText(`Waiting for ${ORG.rainier.name} to accept.`)).toBeVisible()
  await thurston.context.close()
})

test('[S-97] a closed post has no Edit', async ({ page }) => {
  await signIn(page, { name: 'Robin', org: ORG.rainier })
  const offer = await postListing(page, { kind: 'Offer', title: `Spare chairs ${run}` })
  await page.goto(`/listing/${offer.id}`)
  await expect(page.getByRole('link', { name: 'Edit this offer' })).toBeVisible()
  expect((await page.request.post(`/api/v1/listings/${offer.id}/close`)).ok()).toBeTruthy()
  await page.reload()
  await expect(page.getByRole('link', { name: 'Edit this offer' })).toHaveCount(0)
})

test('[S-109] an offer asks what you’d use it for', async ({ page, browser }) => {
  const giver = await phone(browser)
  await signIn(giver.page, { name: 'Lee', org: ORG.thurston })
  const offer = await postListing(giver.page, { kind: 'Offer', title: `Pallet jack ${run}` })
  await giver.context.close()

  await signIn(page, { name: 'Robin', org: ORG.rainier })
  await page.goto(`/listing/${offer.id}`)
  await expect(page.getByLabel(`Message to ${ORG.thurston.name}`)).toHaveAttribute('placeholder', 'Say what you’d use it for and when.')
})

test('[S-109] Urgent says when it comes back', async ({ page }) => {
  await signIn(page, { name: 'Sam', org: ORG.spokane })
  // Use up this month's 2 (earlier runs may already have).
  for (let i = 0; i < 2; i++) {
    const res = await page.request.post('/api/v1/listings', { data: { kind: 'Need', help: 'Things', title: `Freezer died ${run} ${i}`, urgency: 'Critical', cadence: 'OneTime' } })
    expect([201, 409]).toContain(res.status())
  }
  await page.goto('/post')
  await expect(page.getByRole('radio', { name: 'Urgent' })).toBeDisabled()
  await expect(page.getByText(/^You’ve used Urgent twice this month\. You can use it again on [A-Z][a-z]{2} \d{1,2}\.$/)).toBeVisible()
})

test('[S-135] editing the count drops a unit written for one', async ({ page }) => {
  await signIn(page, { name: 'Robin', org: ORG.rainier })
  // Only older posts (the seed and the CLI) have a unit; the Post screen no longer asks for one.
  const one = await postListing(page, { kind: 'Need', title: `Pallet jack ${run}`, quantity: 1, unit: 'unit' })
  const many = await postListing(page, { kind: 'Need', title: `Laptops ${run}`, quantity: 12, unit: 'laptops' })

  await page.goto(`/listing/${one.id}/edit`)
  await page.getByLabel('How many').fill('2')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Saved.')).toBeVisible()
  await expect(page.getByText('2 needed')).toBeVisible()
  await expect(page.getByText('2 unit')).toHaveCount(0)

  await page.goto(`/listing/${many.id}/edit`)
  await page.getByLabel('How many').fill('15')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByText('Saved.')).toBeVisible()
  await expect(page.getByText('15 laptops')).toBeVisible()
})

test('[S-125] How many says how many of what', async ({ page }) => {
  await signIn(page, { name: 'Robin', email: email('s125'), org: ORG.rainier })
  await page.goto('/post')
  const line = page.locator('#p-qty-hint')
  await expect(line).toHaveText('Just the number, if it matters.')        // no title yet
  await page.getByRole('radio', { name: 'Things' }).click()
  await page.getByRole('radio', { name: 'Something else' }).click()
  const what = page.getByRole('textbox', { name: 'What is it?' })
  await what.fill('Folding tables')
  await expect(line).toHaveText('How many folding tables, if it matters.')
  await what.fill('PPE kits')
  await expect(line).toHaveText('How many PPE kits, if it matters.')     // an acronym keeps its capitals
})
