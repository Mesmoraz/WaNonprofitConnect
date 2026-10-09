import { useState } from 'react'
import { useMapData, useMapPoints, useMe } from '../../api'
import { ThreadMap } from '../../map'
import { MapDetailCard, type MapSelection } from './MapDetailCard'
import { Slow } from '../../shell/Slow'
import './map.css'

/** The Map tab: every WA nonprofit as a faint dot, member orgs as pins, threads as strings. Tap one for its card. */
export function MapScreen() {
  const { data: map, isError, refetch } = useMapData()
  const { data: points, refetch: refetchPoints } = useMapPoints()
  const { data: me } = useMe()
  const [sel, setSel] = useState<MapSelection | null>(null)

  return (
    <div className="map-screen">
      {!map && (
        <div className="map-note">
          {isError
            ? <p className="empty">The map didn’t load. <button className="inline-link" onClick={() => { refetch(); refetchPoints() }}>Try again</button>?</p>
            : <Slow />}
        </div>
      )}
      {map && <ThreadMap data={map} points={points} me={me?.membership?.ein} selected={sel} onSelect={setSel} className="map-fill" />}
      {sel && (
        <div className="map-card-dock">
          <MapDetailCard selection={sel} onClose={() => setSel(null)} />
        </div>
      )}
    </div>
  )
}
