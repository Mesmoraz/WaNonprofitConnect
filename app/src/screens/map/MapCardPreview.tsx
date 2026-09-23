import { useState } from 'react'
import { useMapData, useMe } from '../../api'
import { MapDetailCard, type MapSelection } from './MapDetailCard'

/** Development only (/dev/map-card): the map detail card on real map data, standing in until ThreadMap calls onSelect. */
export function MapCardPreview() {
  const { data: map } = useMapData()
  const { data: me } = useMe()
  const [closed, setClosed] = useState<string[]>([])
  if (!map) return null
  const myEin = me?.membership?.ein
  const mine = map.threads.find(t => t.fromEin === myEin || t.toEin === myEin)
  const other = map.threads.find(t => t !== mine && t.status === 'Completed')
  const busiest = map.members.slice().sort((a, b) =>
    map.threads.filter(t => t.fromEin === b.ein || t.toEin === b.ein).length - map.threads.filter(t => t.fromEin === a.ein || t.toEin === a.ein).length)[0]
  const samples: [string, MapSelection][] = []
  if (busiest) samples.push([`org-${busiest.ein}`, { kind: 'org', id: busiest.ein }])
  if (mine) samples.push([`thread-${mine.id}`, { kind: 'thread', id: mine.id }])
  if (other) samples.push([`thread-${other.id}`, { kind: 'thread', id: other.id }])

  return (
    <div className="screen map-preview">
      <p className="demo">Demo: the map detail card, until the map is in.</p>
      {samples.filter(([k]) => !closed.includes(k)).map(([k, s]) => (
        <MapDetailCard key={k} selection={s} onClose={() => setClosed(c => [...c, k])} />
      ))}
    </div>
  )
}
