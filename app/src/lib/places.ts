import type { PlaceFeature, PlaceKind } from '../api/types'

// Tap a place, see who's there (S-144, docs/ALPHA-BRIEFS.md). The map hands over a tapped town or neighborhood name and
// where its label sits; this finds the outline it means. Pure, so the screen and the demo share it.

/** A base-map label the map says was tapped: its name, the kind of place OpenStreetMap calls it, and where the label sits. */
export interface TappedLabel { name: string; kind: string; lon: number; lat: number }

const TOWNISH = new Set(['city', 'town', 'village', 'hamlet'])
/** Which of our kinds a label of this OpenStreetMap class can mean, best first. */
const kindsFor = (osm: string): PlaceKind[] => (TOWNISH.has(osm) ? ['city', 'cdp'] : ['district', 'neighborhood', 'cdp', 'city'])

/** "Mount Vernon", "Mt. Vernon" and "mount-vernon" all read the same. */
export const sameName = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\bmt\b\.?/g, 'mount').replace(/\bst\b\.?/g, 'saint').replace(/[^a-z0-9]+/g, '')

/** Is the point inside? Even-odd over each polygon's rings, so holes stay out. */
export function contains(f: PlaceFeature, lon: number, lat: number): boolean {
  const [w, s, e, n] = f.properties.bbox
  if (lon < w || lon > e || lat < s || lat > n) return false
  const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  return polygons.some(rings => {
    let inside = false
    for (const ring of rings)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i], [xj, yj] = ring[j]
        if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
      }
    return inside
  })
}

/**
 * The outline a tapped label means: same name, and the label inside it (or, failing that, close to it: a label can sit
 * just past a small town's edge). Several kinds share a name ("Ballard" is a district and a neighborhood), so the kind
 * the label is wins. Nothing for names we have no outline for, like a neighborhood outside Seattle.
 */
export function findPlace(features: PlaceFeature[], label: TappedLabel): PlaceFeature | null {
  const want = sameName(label.name)
  const named = features.filter(f => sameName(f.properties.name) === want)
  if (!named.length) return null
  const order = kindsFor(label.kind)
  const rank = (f: PlaceFeature) => { const i = order.indexOf(f.properties.kind); return i < 0 ? order.length : i }
  const inside = named.filter(f => contains(f, label.lon, label.lat)).sort((a, b) => rank(a) - rank(b))
  if (inside.length) return inside[0]
  const near = (f: PlaceFeature) => {
    const [w, s, e, n] = f.properties.bbox
    const dx = Math.max(w - label.lon, 0, label.lon - e), dy = Math.max(s - label.lat, 0, label.lat - n)
    return Math.hypot(dx * Math.cos((label.lat * Math.PI) / 180), dy)
  }
  const close = named.filter(f => near(f) < 0.03).sort((a, b) => near(a) - near(b) || rank(a) - rank(b))   // ~3 km
  return close[0] ?? null
}
