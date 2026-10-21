import type { MapData, OrgSummary } from '../../api'

// Where your organization is on the map, for Near you (S-126) and "Who's near us?" (S-132).

export const RADIUS_MI = 25
export const FRAME_PX = 200                  // the small map's height on Home
export const RING_PX = FRAME_PX / 2 - 16     // the 25 mi circle, in pixels

/** The map zoom at which 25 mi is RING_PX at this latitude (512-pixel tiles: 78,271.5 m a pixel at zoom 0). */
const zoomFor = (lat: number) => Math.log2(78271.5 * Math.cos(lat * Math.PI / 180) * RING_PX / (RADIUS_MI * 1609.34))

export type At = { lat: number; lon: number }
export const at = (o: OrgSummary | undefined): At | null => o && o.lat != null && o.lon != null ? { lat: o.lat, lon: o.lon } : null

/** Where your organization is, the map view around it, and the link that opens the Map there. */
export function placeOf(data: MapData | undefined, me: OrgSummary | undefined) {
  const here = at(me) ?? at(me && data?.members.find(o => o.ein === me.ein))
  const zoom = here ? zoomFor(here.lat) : undefined
  const view = here && zoom !== undefined ? { center: [here.lon, here.lat] as [number, number], zoom } : undefined
  const to = view ? `/map?at=${here!.lat.toFixed(4)},${here!.lon.toFixed(4)},${zoom!.toFixed(2)}` : '/map'
  return { here, view, to }
}
