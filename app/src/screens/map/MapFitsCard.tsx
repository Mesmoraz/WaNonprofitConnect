import { Link } from 'react-router-dom'
import type { MapFit, MapFitsFor, OrgSummary } from '../../api'
import { cap } from '../../lib/words'
import './map.css'

/** Miles between two places, rounded; null when either has no place. */
function miles(a: OrgSummary | undefined, b: OrgSummary | undefined): number | null {
  if (a?.lat == null || a.lon == null || b?.lat == null || b.lon == null) return null
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2
  return Math.round(3958.8 * 2 * Math.asin(Math.sqrt(h)))
}

/**
 * What fits you, as a list (S-130, docs/ALPHA-BRIEFS.md): one row per fit, their post's title, who and how far, and which
 * of your posts it fits. A row opens their post, where "I can help" or "I need this" starts a thread.
 */
export function MapFitsCard({ forWhat, fits, myOrg, onClose }: { forWhat: MapFitsFor; fits: MapFit[] | undefined; myOrg: OrgSummary | undefined; onClose: () => void }) {
  const n = fits?.length ?? 0
  const title = forWhat === 'needs'
    ? `${n} ${n === 1 ? 'offer' : 'offers'} could fit your needs`
    : `${n} ${n === 1 ? 'need' : 'needs'} you could help with`
  return (
    <div className="card map-card map-fits" role="dialog" aria-label="What fits you">
      <button className="map-card-close" aria-label="Close" onClick={onClose}>×</button>
      {!fits ? null : n === 0 ? (
        <p className="m">
          {forWhat === 'needs' ? 'Nothing fits your needs yet.' : 'Nothing you can help with yet.'}{' '}
          <Link className="inline-link" to="/board">Check the board</Link>?
        </p>
      ) : <>
        <span className="t">{title}</span>
        <div className="map-card-rows">
          {fits.map(f => {
            const mi = miles(myOrg, f.post.org)
            return (
              <Link key={f.post.id} className="map-fit-row" to={`/listing/${f.post.id}`}>
                <span className="r-title">{f.post.title}</span>
                <span className="r-meta">{[f.post.org.name, cap(f.post.org.city), mi != null ? `${mi} mi` : ''].filter(Boolean).join(' · ')}</span>
                <span className="r-for">For your: {f.myTitle}</span>
              </Link>
            )
          })}
        </div>
      </>}
    </div>
  )
}
