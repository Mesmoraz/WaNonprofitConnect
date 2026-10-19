import { Link } from 'react-router-dom'
import type { MapData, OrgSummary } from '../../api'

// A still picture of the map around you (S-126). Plain SVG from the map data, so Home never loads MapLibre or deck.gl.
const RADIUS_MI = 25
const W = 320, H = 160
const PX_PER_MI = (H / 2 - 12) / RADIUS_MI   // the 25 mi circle fills the height
const MI_PER_DEG_LAT = 69
const WA = { lat: 47.4, lon: -120.5 }        // the middle of Washington, when your organization has no place yet

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function miles(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2
  return 2 * 3958.8 * Math.asin(Math.sqrt(h))
}

type At = { lat: number; lon: number }
const at = (o: OrgSummary | undefined): At | null => o && o.lat != null && o.lon != null ? { lat: o.lat, lon: o.lon } : null

/** Your pin, the organizations around you, and their golden threads. Tap opens the map. */
export function NearYou({ data, me }: { data: MapData; me: OrgSummary | undefined }) {
  const byEin = new Map(data.members.map(o => [o.ein, o]))
  const here = at(me) ?? at(me && byEin.get(me.ein))
  const center = here ?? WA
  const scale = here ? PX_PER_MI : PX_PER_MI / 12   // no place: show the whole state
  const cosLat = Math.cos(center.lat * Math.PI / 180)
  const xy = (p: At): [number, number] => [
    W / 2 + (p.lon - center.lon) * cosLat * MI_PER_DEG_LAT * scale,
    H / 2 - (p.lat - center.lat) * MI_PER_DEG_LAT * scale,
  ]

  const others = data.members.filter(o => o.ein !== me?.ein && at(o))
  const near = here ? others.filter(o => miles(here, at(o)!) <= RADIUS_MI) : []
  const nearEins = new Set(near.map(o => o.ein))
  if (me) nearEins.add(me.ein)
  const golden = data.threads.filter(t => t.status === 'Completed')
  const goldenNear = golden.filter(t => nearEins.has(t.fromEin) || nearEins.has(t.toEin))

  const lines = golden.flatMap(t => {
    const a = at(byEin.get(t.fromEin)), b = at(byEin.get(t.toEin))
    if (!a || !b) return []
    const [x1, y1] = xy(a), [x2, y2] = xy(b)
    // A gentle arc, like the live map's threads.
    const mx = (x1 + x2) / 2 - (y2 - y1) * 0.2, my = (y1 + y2) / 2 + (x2 - x1) * 0.2
    return [<path key={t.id} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} className="near-thread" />]
  })

  return (
    <Link to="/map" className="card tap near-card">
      <svg className="near-pic" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <rect width={W} height={H} className="near-ground" />
        {here && <circle cx={W / 2} cy={H / 2} r={RADIUS_MI * scale} className="near-ring" />}
        {lines}
        {others.map(o => { const [x, y] = xy(at(o)!); return <circle key={o.ein} cx={x} cy={y} r={3.5} className="near-org" /> })}
        {here && <>
          <circle cx={W / 2} cy={H / 2} r={11} className="near-halo" />
          <circle cx={W / 2} cy={H / 2} r={6} className="near-you" />
        </>}
      </svg>
      <span className="near-line">
        {here && <>{plural(near.length, 'organization')}, {plural(goldenNear.length, 'golden thread')} within {RADIUS_MI} mi. </>}
        <span className="near-open">Open the map</span>
      </span>
    </Link>
  )
}
