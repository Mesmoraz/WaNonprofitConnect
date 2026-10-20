// The map harness's faint dots: ~3000 points around WA population centers. Organizations and threads come from
// the demo's one seed (src/api/mock/data.ts), built by the same settings as the app's demo.
import type { MapPoint } from './types'

// ---- ~3000 faint points around WA population centers, snapped to a ZIP-ish grid --------------------
const CENTERS: [number, number, number, number][] = [   // lat, lon, count, spread (deg)
  [47.61, -122.33, 820, 0.07], [47.25, -122.44, 260, 0.06], [47.66, -117.41, 300, 0.07], [47.61, -122.18, 200, 0.06],
  [47.98, -122.20, 150, 0.06], [45.64, -122.60, 170, 0.07], [47.04, -122.90, 130, 0.05], [48.75, -122.48, 120, 0.05],
  [46.60, -120.51, 100, 0.05], [46.23, -119.18, 100, 0.07], [47.42, -120.31, 55, 0.04], [46.06, -118.34, 45, 0.03],
  [46.73, -117.18, 35, 0.03], [48.12, -123.44, 30, 0.04], [46.98, -123.81, 30, 0.04], [46.14, -122.94, 35, 0.04],
  [48.42, -122.33, 50, 0.05], [46.99, -120.55, 30, 0.03], [47.13, -119.28, 25, 0.04], [47.38, -122.23, 120, 0.05],
  [46.66, -122.96, 25, 0.04], [48.41, -119.52, 15, 0.04], [48.55, -117.90, 15, 0.04], [48.12, -122.76, 25, 0.03],
  [48.29, -122.64, 25, 0.03], [47.21, -123.10, 20, 0.03], [47.57, -122.63, 60, 0.05], [48.05, -122.18, 50, 0.04],
]

function rng(seed: number) {   // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function samplePoints(): MapPoint[] {
  const r = rng(20260923), out: MapPoint[] = []
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r())
  const snap = (v: number) => Math.round(v / 0.025) * 0.025
  let n = 0
  for (const [lat, lon, count, s] of CENTERS)
    for (let i = 0; i < count; i++) out.push([`9${String(n++).padStart(8, '0')}`, snap(lat + gauss() * s * 0.7), snap(lon + gauss() * s)])
  for (let i = 0; i < 150; i++) out.push([`9${String(n++).padStart(8, '0')}`, snap(46.1 + r() * 2.8), snap(-122.4 + r() * 5.2)])
  return out
}
