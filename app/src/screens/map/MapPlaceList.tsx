import { Link } from 'react-router-dom'
import type { PlaceOrg } from '../../api'
import { causeOf, cap } from '../../lib/words'
import './map.css'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** An organization's pin, as the map draws it (S-147): amber with needs, green with only offers, white with nothing open. */
function Pin({ needs, offers }: { needs: number; offers: number }) {
  const open = needs + offers
  return (
    <svg className="map-place-ring" viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r="6" fill={needs ? 'var(--need)' : offers ? 'var(--offer)' : 'var(--paper)'}
        stroke={open ? 'var(--paper)' : 'var(--ink-3)'} strokeWidth={open ? 1.5 : 2} />
    </svg>
  )
}

/**
 * Everyone inside a place you tapped (S-144, docs/ALPHA-BRIEFS.md): the organizations that have joined first, each with
 * its pin and what it has open, then everyone else under "Not here yet", A to Z, 50 at a time.
 */
export function MapPlaceList({ title, name, joined, rest, more, onMore, onClear, onClose }: {
  title: string; name: string; joined: PlaceOrg[]; rest: PlaceOrg[]
  /** Another 50 to show, or false when they're all here. */
  more: boolean; onMore: () => void
  onClear: () => void; onClose: () => void
}) {
  const where = (r: PlaceOrg) => [causeOf(r.org.ntee), cap(r.org.city)].filter(Boolean).join(' · ')
  const row = (r: PlaceOrg, isJoined: boolean) => (
    <Link key={r.org.ein} className="map-place-row" to={`/org/${r.org.ein}`}>
      {isJoined ? <Pin needs={r.needs} offers={r.offers} /> : <span className="map-place-ring" aria-hidden />}
      <span className="r-title">{r.org.name}</span>
      <span className="r-meta">
        {isJoined && r.needs + r.offers > 0 ? `${plural(r.needs, 'need')} · ${plural(r.offers, 'offer')} open` : where(r)}
      </span>
    </Link>
  )
  return (
    <div className="card map-card map-open" role="dialog" aria-label={title}>
      <button className="map-card-close" aria-label="Close" onClick={onClose}>×</button>
      {joined.length + rest.length === 0
        ? <p className="m">No organizations in {name} yet. <button className="inline-link" onClick={onClear}>Show all of Washington</button>?</p>
        : <>
          <span className="t">{title}</span>
          <div className="map-card-rows">
            {joined.map(r => row(r, true))}
            {rest.length > 0 && <p className="map-place-sep">Not here yet</p>}
            {rest.map(r => row(r, false))}
            {more && <button className="btn sm map-place-more" onClick={onMore}>Show 50 more</button>}
          </div>
        </>}
    </div>
  )
}
