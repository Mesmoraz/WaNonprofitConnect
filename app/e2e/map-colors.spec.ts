import { expect, test } from '@playwright/test'
import { ORG, signIn } from './helpers'

// The map is always light (S-139). How it looks stays [needs your phone]; this checks the colors it is given.

type MapBox = HTMLElement & {
  __map: { loaded(): boolean; getStyle(): { layers: { id: string; type: string; paint?: Record<string, unknown> }[] } }
}

test('[S-139] with the phone in dark mode, the map stays light and its pins and threads keep their light colors', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await signIn(page, { name: 'Casey', org: ORG.computers })
  await page.goto('/map')
  await page.waitForFunction(() => {
    const box = document.querySelector('.wm-root') as MapBox | null
    return !!box?.__map?.loaded() && box.__map.getStyle().layers.some(l => l.id === 'water')
  })

  const seen = await page.evaluate(() => {
    const box = document.querySelector('.wm-root') as MapBox
    const layers = box.__map.getStyle().layers
    const paint = (id: string, key: string) => layers.find(l => l.id === id)?.paint?.[key]
    const css = getComputedStyle(box), page = getComputedStyle(document.documentElement)
    return {
      land: paint('background', 'background-color'),
      water: paint('water', 'fill-color'),
      need: css.getPropertyValue('--need').trim().toLowerCase(),
      offer: css.getPropertyValue('--offer').trim().toLowerCase(),
      golden: css.getPropertyValue('--thread-golden').trim().toLowerCase(),
      pageGround: page.getPropertyValue('--ground').trim().toLowerCase(),
    }
  })
  expect(seen.land).toBe('rgb(244, 241, 234)')    // --map-land, warm cream
  expect(seen.water).toBe('rgb(207, 224, 227)')   // --map-water, soft blue
  expect(seen.need).toBe('#b8741a')               // light-mode amber, not dark mode's #E0A04B
  expect(seen.offer).toBe('#2e6b4e')              // light-mode green
  expect(seen.golden).toBe('#d9a12b')
  expect(seen.pageGround).toBe('#0f1418')         // the rest of the app still follows the phone
})
