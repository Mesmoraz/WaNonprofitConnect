import { useState } from 'react'
import { useMapData, useMapPoints, useMe } from '../../api'
import { ThreadMap } from '../../map'
import { MapDetailCard, type MapSelection } from './MapDetailCard'
import './map.css'

/** The Map tab: every WA nonprofit as a faint dot, member orgs as pins, threads as strings. Tap one for its card. */
export function MapScreen() {
  const { data: map } = useMapData()
  const { data: points } = useMapPoints()
  const { data: me } = useMe()
  const [sel, setSel] = useState<MapSelection | null>(null)

  return (
    <div className="map-screen">
      {map && <ThreadMap data={map} points={points} me={me?.membership?.ein} selected={sel} onSelect={setSel} className="map-fill" />}
      {sel && (
        <div className="map-card-dock">
          <MapDetailCard selection={sel} onClose={() => setSel(null)} />
        </div>
      )}
    </div>
  )
}
