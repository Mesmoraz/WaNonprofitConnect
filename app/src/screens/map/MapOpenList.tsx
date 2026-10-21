import { Link } from 'react-router-dom'
import type { Listing } from '../../api'
import { HELP_LABEL, cap } from '../../lib/words'
import './map.css'

/**
 * What's open in view, as a list (S-131, docs/ALPHA-BRIEFS.md): one row per open post, nearest the middle of the map first.
 * Each row: its kind of help (amber for a need, green for an offer, like the pins), its title, who and where.
 */
export function MapOpenList({ title, posts, onClose }: { title: string; posts: Listing[]; onClose: () => void }) {
  return (
    <div className="card map-card map-open" role="dialog" aria-label="Open in view">
      <button className="map-card-close" aria-label="Close" onClick={onClose}>×</button>
      {posts.length === 0
        ? <p className="m">Nothing open in view. Move the map to see more.</p>
        : <>
          <span className="t">{title}</span>
          <div className="map-card-rows">
            {posts.map(l => (
              <Link key={l.id} className="map-open-row" to={`/listing/${l.id}`}>
                <span className={`map-help-chip ${l.kind === 'Need' ? 'need' : 'offer'}`}>{HELP_LABEL[l.help]}</span>
                <span className="r-title">{l.title}</span>
                <span className="r-meta">{[l.org.name, cap(l.org.city)].filter(Boolean).join(' · ')}</span>
              </Link>
            ))}
          </div>
        </>}
    </div>
  )
}
