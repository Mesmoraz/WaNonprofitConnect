import { Link } from 'react-router-dom'
import { useBoard, useMapData, useMe, type KindOfHelp, type ThreadStatus } from '../../api'
import { HELP_LABEL, cap } from '../../lib/words'
import './map.css'

/** Same shape as src/map's MapSelection (ThreadMap's onSelect), declared here so the two folders stay uncoupled. */
export type MapSelection = { kind: 'org'; id: string } | { kind: 'thread'; id: number } | { kind: 'pair'; id: string }

// The map's four thread states in plain words. "In progress" and "Golden" come from the briefs; "Started" does not.
const STATE: Partial<Record<ThreadStatus, string>> = { Proposed: 'Started', Accepted: 'In progress', Completed: 'Golden' }
// A line that carries several, listed (S-127, approved Oct 19). Furthest along first.
const PAIR_STATE: Partial<Record<ThreadStatus, string>> = { Completed: 'Golden', Accepted: 'In progress', Proposed: 'Waiting for a yes' }
const PAIR_RANK: Partial<Record<ThreadStatus, number>> = { Completed: 0, Accepted: 1, Proposed: 2 }

/**
 * Map detail card (docs/ALPHA-BRIEFS.md): an organization, a thread, or two organizations and every thread between
 * them. Reads the same /api/v1/map data the map draws.
 */
export function MapDetailCard({ selection, onClose, onSelect }: { selection: MapSelection; onClose?: () => void; onSelect?: (s: MapSelection) => void }) {
  const { data: map } = useMapData()
  const { data: me } = useMe()
  const { data: board } = useBoard()   // a "Could fit" row's title: the need's, from the open posts
  if (!map) return null
  const myEin = me?.membership?.ein
  const name = (ein: string) => map.members.find(o => o.ein === ein)?.name ?? ein

  const orgLink = (ein: string) => <Link className="map-card-org" to={`/org/${ein}`}>{name(ein)}</Link>

  let body
  if (selection.kind === 'org') {
    const o = map.members.find(m => m.ein === selection.id)
    if (!o) return null
    const n = map.threads.filter(t => t.fromEin === o.ein || t.toEin === o.ein).length
    body = <>
      <span className="t">{o.name}</span>
      <span className="m">{[cap(o.city), `${n} thread${n === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</span>
      <Link className="btn primary map-card-open" to={`/org/${o.ein}`}>See their needs and offers</Link>
    </>
  } else if (selection.kind === 'pair') {
    const [a, b] = selection.id.split('|')
    const between = (from: string, to: string) => (from === a && to === b) || (from === b && to === a)
    const threads = map.threads.filter(t => between(t.fromEin, t.toEin) && PAIR_STATE[t.status])
      .sort((x, y) => (PAIR_RANK[x.status] ?? 9) - (PAIR_RANK[y.status] ?? 9))
    const fits = map.suggested.filter(s => between(s.fromEin, s.toEin))
    body = <>
      <span className="t">{name(a)} and {name(b)}</span>
      <div className="map-card-rows">
        {threads.map(t => (
          <button key={t.id} className="map-card-row" onClick={() => onSelect?.({ kind: 'thread', id: t.id })}>
            <span className="r-title">{t.title}</span><span className="r-state">{PAIR_STATE[t.status]}</span>
          </button>
        ))}
        {fits.map(s => (
          <Link key={`${s.needId}:${s.offerId}`} className="map-card-row" to={`/listing/${s.needId}`}>
            <span className="r-title">{board?.find(l => l.id === s.needId)?.title ?? ''}</span><span className="r-state">Could fit</span>
          </Link>
        ))}
      </div>
    </>
  } else {
    const t = map.threads.find(x => x.id === selection.id)
    if (!t) return null
    const mine = !!myEin && (t.fromEin === myEin || t.toEin === myEin)
    body = <>
      <span className="t">{orgLink(t.fromEin)} → {orgLink(t.toEin)}</span>
      <span className="m">{[HELP_LABEL[t.help as KindOfHelp], STATE[t.status]].filter(Boolean).join(' · ')}</span>
      {t.needId > 0 && <Link className="map-card-post" to={`/listing/${t.needId}`}><span className="k">Need</span>{t.title}</Link>}
      {t.offerId > 0 && <Link className="map-card-post" to={`/listing/${t.offerId}`}><span className="k">Offer</span>{t.offerTitle ?? t.title}</Link>}
      {mine && <Link className="btn primary map-card-open" to={`/thread/${t.id}`}>Open thread</Link>}
    </>
  }

  return (
    <div className="card map-card" role="dialog" aria-label="Details">
      {onClose && <button className="map-card-close" aria-label="Close" onClick={onClose}>×</button>}
      {body}
    </div>
  )
}
