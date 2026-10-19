import { expect, test } from '@playwright/test'
import { ORG, email, phone, postListing, run, signIn } from './helpers'

// A closed thread says so (S-104, docs/ALPHA-BRIEFS.md, Phase A): declined, or its post closed.

async function threadOnANeed(browser: Parameters<typeof phone>[0], title: string) {
  const poster = await phone(browser)
  await signIn(poster.page, { name: 'Drew', email: email('s104-poster'), org: ORG.rebuilding })
  const need = await postListing(poster.page, { kind: 'Need', help: 'Things', title })
  const helper = await phone(browser)
  await signIn(helper.page, { name: 'Avery', email: email('s104-helper'), org: ORG.habitat })
  const res = await helper.page.request.post('/api/v1/threads', { data: { listingId: need.id, message: 'We have two.' } })
  expect(res.ok()).toBeTruthy()
  const { id } = await res.json()
  return { poster, helper, need, path: `/thread/${id}` }
}

test('[S-104] turning a thread down says so on both sides, and the inbox says Closed', async ({ browser }) => {
  const { poster, helper, path } = await threadOnANeed(browser, `Ladders ${run}`)
  await poster.page.goto(path)
  await poster.page.getByRole('button', { name: 'Not this time' }).click()
  await expect(poster.page.getByText('You said not this time. Their post stays on the board.')).toBeVisible()
  await expect(poster.page.getByPlaceholder('Write a message')).toHaveCount(0)
  await expect(poster.page.getByText('We have two.')).toBeVisible()           // the messages so far stay readable
  await poster.page.goto('/inbox')
  await expect(poster.page.locator(`a.inbox-row[href="${path}"]`)).toContainText('Closed')

  await helper.page.goto(path)
  await expect(helper.page.getByText(`${ORG.rebuilding.name} said not this time. Your post stays on the board.`)).toBeVisible()
  await poster.context.close(); await helper.context.close()
})

test('[S-104] closing a post closes its thread, which points back to the board', async ({ browser }) => {
  const { poster, helper, need, path } = await threadOnANeed(browser, `Wheelbarrows ${run}`)
  const closed = await poster.page.request.post(`/api/v1/listings/${need.id}/close`)
  expect(closed.ok()).toBeTruthy()

  await helper.page.goto(path)
  await expect(helper.page.getByText('This thread is closed. Find another on the board?')).toBeVisible()
  await expect(helper.page.getByPlaceholder('Write a message')).toHaveCount(0)
  await expect(helper.page.getByText('We have two.')).toBeVisible()
  await helper.page.goto('/inbox')
  await expect(helper.page.locator(`a.inbox-row[href="${path}"]`)).toContainText('Closed')
  await helper.page.goto(path)
  await helper.page.getByRole('link', { name: 'the board' }).click()
  await expect(helper.page).toHaveURL(/\/board$/)
  await poster.context.close(); await helper.context.close()
})
