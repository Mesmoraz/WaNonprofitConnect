import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MapData, OrgSummary } from '../../api'
import { at, FRAME_PX, placeOf, RADIUS_MI, RING_PX, type At } from './place'

// "Near you" (S-126, Taylor Oct 19: "truly a live map, small, around your organization"). The live map is MapLibre and
// deck.gl, about 2 MB, so it loads once the rest of Home is up. Until then a plain drawing of the same place stands in.
const NearMap = lazy(() => import('./NearMap'))

const W = 320, H = 160
const PX_PER_MI = (H / 2 - 12) / RADIUS_MI
const MI_PER_DEG_LAT = 69
const WA = { lat: 47.4, lon: -120.5 }        // the middle of Washington, when your organization has no place yet

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function miles(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2
  return 2 * 3958.8 * Math.asin(Math.sqrt(h))
}

/** Your pin, the organizations around you, and their golden threads, on a small live map. Tap opens the Map there. */
export function NearYou({ data, me }: { data: MapData; me: OrgSummary | undefined }) {
  const byEin = new Map(data.members.map(o => [o.ein, o]))
  const { here, view, to } = placeOf(data, me)

  const others = data.members.filter(o => o.ein !== me?.ein && at(o))
  const near = here ? others.filter(o => miles(here, at(o)!) <= RADIUS_MI) : []
  const nearEins = new Set(near.map(o => o.ein))
  if (me) nearEins.add(me.ein)
  const goldenNear = data.threads.filter(t => t.status === 'Completed' && (nearEins.has(t.fromEin) || nearEins.has(t.toEin)))

  // After the rest of Home has drawn.
  const [live, setLive] = useState(false)
  useEffect(() => {
    if ('requestIdleCallback' in window) { const id = requestIdleCallback(() => setLive(true), { timeout: 1500 }); return () => cancelIdleCallback(id) }
    const t = setTimeout(() => setLive(true), 300)
    return () => clearTimeout(t)
  }, [])

  const picture = <Picture data={data} me={me} here={here} byEin={byEin} others={others} />
  return (
    <Link to={to} className="card tap near-card">
      <span className="near-frame" style={{ height: FRAME_PX }}>
        {live ? <Suspense fallback={picture}><NearMap data={data} me={me?.ein} view={view} /></Suspense> : picture}
        {here && <span className="near-ring" style={{ width: RING_PX * 2, height: RING_PX * 2 }} aria-hidden="true" />}
      </span>
      <span className="near-line">
        {/* S-132: no "0 organizations, 0 golden threads". */}
        {here && (!near.length ? <>No other organizations within {RADIUS_MI} mi yet. </>
          : goldenNear.length ? <>{plural(near.length, 'organization')}, {plural(goldenNear.length, 'golden thread')} within {RADIUS_MI} mi. </>
            : <>{plural(near.length, 'organization')} within {RADIUS_MI} mi. </>)}
        <span className="near-open">Open the map</span>
      </span>
    </Link>
  )
}

/** The stand-in while the map loads: the same place, drawn plainly. */
function Picture({ data, me, here, byEin, others }: {
  data: MapData; me: OrgSummary | undefined; here: At | null; byEin: Map<string, OrgSummary>; others: OrgSummary[]
}) {
  const center = here ?? WA
  const scale = here ? PX_PER_MI : PX_PER_MI / 12   // no place: show the whole state
  const cosLat = Math.cos(center.lat * Math.PI / 180)
  const xy = (p: At): [number, number] => [
    W / 2 + (p.lon - center.lon) * cosLat * MI_PER_DEG_LAT * scale,
    H / 2 - (p.lat - center.lat) * MI_PER_DEG_LAT * scale,
  ]
  const lines = data.threads.filter(t => t.status === 'Completed').flatMap(t => {
    const a = at(byEin.get(t.fromEin)), b = at(byEin.get(t.toEin))
    if (!a || !b) return []
    const [x1, y1] = xy(a), [x2, y2] = xy(b)
    const mx = (x1 + x2) / 2 - (y2 - y1) * 0.2, my = (y1 + y2) / 2 + (x2 - x1) * 0.2
    return [<path key={t.id} d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} className="near-thread" />]
  })
  return (
    <svg className="near-pic" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={W} height={H} className="near-ground" />
      {lines}
      {others.map(o => { const [x, y] = xy(at(o)!); return <circle key={o.ein} cx={x} cy={y} r={3.5} className="near-org" /> })}
      {here && me && <>
        <circle cx={W / 2} cy={H / 2} r={11} className="near-halo" />
        <circle cx={W / 2} cy={H / 2} r={6} className="near-you" />
      </>}
    </svg>
  )
}
