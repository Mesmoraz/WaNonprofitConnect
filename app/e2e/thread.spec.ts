import { expect, test } from '@playwright/test'
import { ORG, email, phone, postListing, run, signIn } from './helpers'

// The core loop: a need, "I can help", accept, message, mark done, golden. Copy: docs/ALPHA-BRIEFS.md (B6, B8).

test('[S-18] [S-20] [S-72] one organization helps another, start to golden thread', async ({ page, browser }) => {
  // Ballard Food Bank needs a cooler.
  const ballard = await phone(browser)
  await signIn(ballard.page, { name: 'Jordan', org: ORG.ballard })
  const need = await postListing(ballard.page, { kind: 'Need', title: `Walk-in cooler ${run}` })

  // The Tool Library sees it and offers help. The button waits for a message (S-103).
  await signIn(page, { name: 'Alex', org: ORG.toolLibrary })
  await page.goto(`/listing/${need.id}`)
  await expect(page.getByRole('heading', { name: need.title })).toBeVisible()
  await expect(page.getByText(ORG.ballard.name).first()).toBeVisible()
  const help = page.getByRole('button', { name: 'I can help' })
  await expect(help).toBeEnabled()   // green even before a message (S-120)
  await page.getByLabel(`Message to ${ORG.ballard.name}`).fill('We have a used one. Pick up Saturday?')
  await help.click()
  await expect(page.getByText(`Thread started. ${ORG.ballard.name} will see it in their inbox.`)).toBeVisible()
  await expect(page).toHaveURL(/\/thread\/\d+$/)
  await expect(page.getByText(`Waiting for ${ORG.ballard.name} to accept.`)).toBeVisible()
  // Times read right (S-103): just now, not 7 hours off.
  await expect(page.locator('.msg').last()).toContainText('Alex · 1m')
  const threadUrl = page.url()

  // Ballard sees it waiting in the inbox and accepts.
  const threadPath = new URL(threadUrl).pathname
  await ballard.page.goto('/inbox')
  const row = ballard.page.locator(`a.inbox-row[href="${threadPath}"]`)
  await expect(row).toContainText(ORG.toolLibrary.name)
  await expect(row).toContainText('Waiting on you')
  await row.click()
  await ballard.page.getByRole('button', { name: 'Accept' }).click()
  await expect(ballard.page.getByText('You’re on. Work out the details here.')).toBeVisible()

  // A message goes back, and the Tool Library sees it without a reload (SignalR).
  await page.goto(threadUrl)
  await expect(page.getByText('You’re on. Work out the details here.')).toBeVisible()
  await ballard.page.getByLabel('Write a message').fill('Saturday at 10 works.')
  await ballard.page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Saturday at 10 works.')).toBeVisible()

  // Done makes it golden, for both.
  await ballard.page.getByRole('button', { name: 'Mark done' }).click()
  await expect(ballard.page.getByText('Mark this done? Both posts close.')).toBeVisible()
  await ballard.page.locator('.thread-confirm').getByRole('button', { name: 'Mark done' }).click()
  await expect(ballard.page.getByText('Done. This is a golden thread.')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Done. This is a golden thread.')).toBeVisible()

  // [S-149] See it on the map: the map opens on this thread, its card open.
  await page.getByRole('link', { name: 'See it on the map' }).click()
  await expect(page).toHaveURL(new RegExp(`/map\\?thread=${threadPath.split('/').pop()}$`))
  const card = page.getByRole('dialog', { name: 'Details' })
  await expect(card).toContainText('Golden')
  await expect(card).toContainText(need.title)
  await card.getByRole('link', { name: 'Open thread' }).click()
  await expect(page).toHaveURL(new RegExp(`${threadPath}$`))
  await ballard.page.goto('/inbox')
  await expect(ballard.page.locator(`a.inbox-row[href="${threadPath}"]`)).toContainText('Golden')
  await ballard.context.close()
})

test('[S-103] starting again on the same post opens your thread instead of a second one', async ({ page, browser }) => {
  const owner = await phone(browser)
  await signIn(owner.page, { name: 'Pat', org: ORG.westSeattle })
  const need = await postListing(owner.page, { kind: 'Need', title: `Volunteers for sorting ${run}` })
  await owner.context.close()

  await signIn(page, { name: 'Lee', org: ORG.rebuilding })
  const start = () => page.request.post('/api/v1/threads', { data: { listingId: need.id, message: 'We can send four people.' } })
  const first = await (await start()).json()
  const again = await start()
  expect(again.status()).toBe(200)
  expect((await again.json()).id).toBe(first.id)

  await page.goto(`/listing/${need.id}`)
  await expect(page.getByRole('link', { name: 'Open your thread' })).toHaveAttribute('href', `/thread/${first.id}`)
})

test('[S-103] times from the server are UTC, so phones show the right age', async ({ page }) => {
  await signIn(page, { name: 'Casey', org: ORG.computers })
  const l = await postListing(page, { kind: 'Offer', title: `Monitors ${run}` })
  const got = await (await page.request.get(`/api/v1/listings/${l.id}`)).json()
  expect(got.createdAt).toMatch(/Z$/)
  await page.goto(`/listing/${l.id}`)
  await expect(page.getByText(/Posted (just now|1 minute ago)/)).toBeVisible()
})

test('[S-120] I can help stays green, and says what it needs when there is nothing to send', async ({ page, browser }) => {
  const poster = await phone(browser)
  await signIn(poster.page, { name: 'Drew', email: email('s120-poster'), org: ORG.rebuilding })
  const need = await postListing(poster.page, { kind: 'Need', title: `Ladders ${run}` })
  await poster.context.close()

  await signIn(page, { name: 'Casey', email: email('s120'), org: ORG.toolLibrary })
  await page.goto(`/listing/${need.id}`)
  const help = page.getByRole('button', { name: 'I can help' })
  await expect(help).toBeEnabled()
  await help.click()
  await expect(page.getByRole('alert')).toHaveText('Write a message first, or pick one of yours.')
  await expect(page.getByRole('textbox', { name: `Message to ${ORG.rebuilding.name}` })).toBeFocused()
  await expect(page).toHaveURL(new RegExp(`/listing/${need.id}$`))   // nothing was sent

  await page.getByRole('textbox', { name: `Message to ${ORG.rebuilding.name}` }).fill('We can lend two this Saturday.')
  await help.click()
  await expect(page).toHaveURL(/\/thread\/\d+$/)
})
