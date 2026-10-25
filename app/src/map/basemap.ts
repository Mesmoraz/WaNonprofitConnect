import type { StyleSpecification } from 'maplibre-gl'
import type { MapTheme } from './theme'

// Free, keyless vector styles from OpenFreeMap. Both are already quiet; we quiet them further so the
// threads are the brightest thing on screen. The map is always light (S-139), so the dark one only shows
// if the --map-land token is ever set dark.
export const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
export const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

/** Washington, and a margin around it you can pan into. */
export const WA_BOUNDS: [[number, number], [number, number]] = [[-124.8, 45.5], [-116.9, 49.0]]
// Tall on purpose: a portrait phone fits WA's width at a zoom where the screen spans ~15 degrees of latitude.
export const MAX_BOUNDS: [[number, number], [number, number]] = [[-136, 38], [-105, 56]]

const DROP = /shield|poi|airport|aeroway|oneway|housenumber|railway/i
const ROADS = /highway|road|bridge|tunnel|path|minor|major|motorway/i
const WATER = /^water/
const GREEN = /park|wood/
const LAND = /residential|building|pier|ice_shelf|glacier/
const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`

export function quietStyle(style: StyleSpecification, theme: MapTheme): StyleSpecification {
  const layers = style.layers
    .filter(l => !DROP.test(l.id))
    .map(l => {
      if (l.type === 'background') return { ...l, paint: { ...l.paint, 'background-color': rgb(theme.land) } }
      if (l.type === 'fill' && WATER.test(l.id)) return { ...l, paint: { ...l.paint, 'fill-color': rgb(theme.water) } }
      if (l.type === 'line' && WATER.test(l.id)) return { ...l, paint: { ...l.paint, 'line-color': rgb(theme.water) } }
      if (l.type === 'fill' && GREEN.test(l.id)) return { ...l, paint: { ...l.paint, 'fill-color': rgb(theme.park) } }
      if (l.type === 'fill' && LAND.test(l.id)) return { ...l, paint: { ...l.paint, 'fill-color': rgb(theme.land) } }
      if (l.type === 'line' && ROADS.test(l.id)) {
        const cur = l.paint?.['line-opacity']
        return { ...l, paint: { ...l.paint, 'line-opacity': typeof cur === 'number' ? cur * 0.4 : 0.4 } }
      }
      if (l.type === 'symbol') {
        const paint = { ...l.paint, 'text-opacity': theme.dark ? 0.65 : 0.5, 'icon-opacity': 0.4, 'text-halo-color': rgb(theme.land) }
        return { ...l, paint }
      }
      return l
    })
  return { ...style, layers }
}

/** Our under-label layers go just below the first symbol layer, so town names stay readable. */
export function firstSymbolId(style: { layers: { id: string; type: string }[] } | undefined): string | undefined {
  return style?.layers.find(l => l.type === 'symbol')?.id
}
