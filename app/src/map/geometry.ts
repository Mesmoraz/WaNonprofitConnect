// Threads are gentle curves, not straight lines: a quadratic bend like the prototype's, computed in
// Web Mercator so the curve looks the same at every zoom, then sampled into a polyline for PathLayer.

export type LonLat = [number, number]

const mercX = (lon: number) => (lon + 180) / 360
const mercY = (lat: number) => {
  const s = Math.sin((lat * Math.PI) / 180)
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)
}
const lonOf = (x: number) => x * 360 - 180
const latOf = (y: number) => (360 / Math.PI) * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - 90

export interface Arc {
  path: LonLat[]
  /** Cumulative length at each vertex, 0..1, for placing the mover at constant speed. */
  cum: number[]
}

const SEGMENTS = 28

/**
 * @param bend how far the control point sits off the chord, as a share of its length. The prototype
 * uses 0.16. Positive bends to the left of from→to, so A→B and B→A curve apart instead of overlapping.
 */
export function curve(from: LonLat, to: LonLat, bend = 0.16): Arc {
  const x1 = mercX(from[0]), y1 = mercY(from[1]), x2 = mercX(to[0]), y2 = mercY(to[1])
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1e-12
  const cx = (x1 + x2) / 2 - (dy / d) * d * bend, cy = (y1 + y2) / 2 + (dx / d) * d * bend
  const path: LonLat[] = [], cum: number[] = [0]
  let px = x1, py = y1, total = 0
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS, u = 1 - t
    const x = u * u * x1 + 2 * u * t * cx + t * t * x2
    const y = u * u * y1 + 2 * u * t * cy + t * t * y2
    if (i > 0) { total += Math.hypot(x - px, y - py); cum.push(total) }
    path.push([lonOf(x), latOf(y)])
    px = x; py = y
  }
  for (let i = 0; i < cum.length; i++) cum[i] = total > 0 ? cum[i] / total : i / SEGMENTS
  return { path, cum }
}

/** The point at share `t` (0..1) of the arc's length. */
export function pointAt(arc: Arc, t: number): LonLat {
  const { path, cum } = arc
  if (t <= 0) return path[0]
  if (t >= 1) return path[path.length - 1]
  let lo = 0, hi = cum.length - 1
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < t) lo = mid; else hi = mid }
  const span = cum[hi] - cum[lo] || 1, f = (t - cum[lo]) / span
  const a = path[lo], b = path[hi]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
}

/** Small, stable jitter so thousands of orgs sharing one ZIP centroid read as a patch, not one dot. */
export function jitter(key: string, lat: number, lon: number, radiusDeg = 0.012): LonLat {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) }
  const a = ((h >>> 0) % 3600) / 3600 * Math.PI * 2
  const r = Math.sqrt((((h >>> 12) % 1000) / 1000)) * radiusDeg
  return [lon + (Math.cos(a) * r) / Math.cos((lat * Math.PI) / 180), lat + Math.sin(a) * r]
}
