import { setWorkerUrl, type Map as MlMap } from 'maplibre-gl'
// MapLibre 6 finds its worker next to its own module (import.meta.url). Once Vite bundles it, that
// file isn't there, so vector tiles never parse. Bundle the worker ourselves and point MapLibre at it.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl)

/**
 * deck.gl 9.4's MapboxOverlay reads `map.transform` (height, _nearZ, _farZ), which MapLibre 6 no
 * longer exposes. Give it the same numbers from public API. Near/far come from the custom layer's
 * render parameters during drawing; outside drawing (picking) deck falls back to its own defaults.
 */
export function shimTransformForDeck(map: MlMap) {
  if ('transform' in map && (map as unknown as { transform: unknown }).transform) return
  Object.defineProperty(map, 'transform', {
    configurable: true,
    get: () => ({
      height: map.getCanvas().clientHeight,
      width: map.getCanvas().clientWidth,
      elevation: map.getCenterElevation?.() ?? 0,
      _nearZ: undefined,
      _farZ: undefined,
    }),
  })
}
