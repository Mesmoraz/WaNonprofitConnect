import type { StyleSpecification } from 'maplibre-gl'
import type { MapTheme } from './theme'

// Free, keyless vector styles from OpenFreeMap. Both are already quiet; we quiet them further so the
// threads are the brightest thing on screen.
export const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
export const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

/** Washington, and a margin around it you can pan into. */
export const WA_BOUNDS: [[number, number], [number, number]] = [[-124.8, 45.5], [-116.9, 49.0]]
// Tall on purpose: a portrait phone fits WA's width at a zoom where the screen spans ~15 degrees of latitude.
export const MAX_BOUNDS: [[number, number], [number, number]] = [[-136, 38], [-105, 56]]

const DROP = /shield|poi|airport|aeroway|oneway|housenumber|railway/i
const ROADS = /highway|road|bridge|tunnel|path|minor|major|motorway/i
const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`

export function quietStyle(style: StyleSpecification, theme: MapTheme): StyleSpecification {
  const layers = style.layers
    .filter(l => !DROP.test(l.id))
    .map(l => {
      if (l.type === 'background') return { ...l, paint: { ...l.paint, 'background-color': rgb(theme.ground) } }
      if (l.type === 'line' && ROADS.test(l.id)) {
        const cur = l.paint?.['line-opacity']
        return { ...l, paint: { ...l.paint, 'line-opacity': typeof cur === 'number' ? cur * 0.4 : 0.4 } }
      }
      if (l.type === 'symbol') {
        const paint = { ...l.paint, 'text-opacity': theme.dark ? 0.65 : 0.5, 'icon-opacity': 0.4 }
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
