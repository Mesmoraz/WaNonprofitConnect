import { Link } from 'react-router-dom'
import { useMapData, useMe, type KindOfHelp, type ThreadStatus } from '../../api'
import { HELP_LABEL, cap } from '../../lib/words'
import './map.css'

/** Same shape as src/map's MapSelection (ThreadMap's onSelect), declared here so the two folders stay uncoupled. */
export type MapSelection = { kind: 'org'; id: string } | { kind: 'thread'; id: number }

// The map's four thread states in plain words. "In progress" and "Golden" come from the briefs; "Started" does not.
const STATE: Partial<Record<ThreadStatus, string>> = { Proposed: 'Started', Accepted: 'In progress', Completed: 'Golden' }

/** Map detail card (docs/ALPHA-BRIEFS.md): an organization, or a thread. Reads the same /api/v1/map data the map draws. */
export function MapDetailCard({ selection, onClose }: { selection: MapSelection; onClose?: () => void }) {
  const { data: map } = useMapData()
  const { data: me } = useMe()
  if (!map) return null
  const myEin = me?.membership?.ein
  const name = (ein: string) => map.members.find(o => o.ein === ein)?.name ?? ein

  let body
  if (selection.kind === 'org') {
    const o = map.members.find(m => m.ein === selection.id)
    if (!o) return null
    const n = map.threads.filter(t => t.fromEin === o.ein || t.toEin === o.ein).length
    body = <>
      <span className="t">{o.name}</span>
      <span className="m">{[cap(o.city), `${n} thread${n === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}</span>
    </>
  } else {
    const t = map.threads.find(x => x.id === selection.id)
    if (!t) return null
    const mine = !!myEin && (t.fromEin === myEin || t.toEin === myEin)
    body = <>
      <span className="t">{name(t.fromEin)} → {name(t.toEin)}</span>
      <span className="m">{[HELP_LABEL[t.help as KindOfHelp], STATE[t.status]].filter(Boolean).join(' · ')}</span>
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
