import { useEffect, useState } from 'react'
import { useMapData, useMapPoints, useMe } from '../../api'
import { ThreadMap } from '../../map'
import { MapDetailCard, type MapSelection } from './MapDetailCard'
import { MapLegend } from './MapLegend'
import { Slow } from '../../shell/Slow'
import './map.css'

const LEGEND_SEEN = 'helpbook.mapLegendSeen'

/** The Map tab: every WA nonprofit as a faint dot, member orgs as pins, threads as strings. Tap one for its card. */
export function MapScreen() {
  const { data: map, isError, refetch } = useMapData()
  const { data: points, refetch: refetchPoints } = useMapPoints()
  const { data: me } = useMe()
  const [sel, setSel] = useState<MapSelection | null>(null)
  // The legend opens by itself the first time you open the map on this device (S-105).
  const [legend, setLegend] = useState(() => { try { return !localStorage.getItem(LEGEND_SEEN) } catch { return false } })
  useEffect(() => { if (legend) try { localStorage.setItem(LEGEND_SEEN, '1') } catch { /* private window */ } }, [legend])
  const select = (s: MapSelection | null) => { setSel(s); if (s) setLegend(false) }

  return (
    <div className="map-screen">
      {map && <ThreadMap data={map} points={points} me={me?.membership?.ein} selected={sel} onSelect={select} className="map-fill" />}
      <button className="map-help" aria-label="What the map shows" aria-expanded={legend} onClick={() => { setSel(null); setLegend(o => !o) }}>?</button>
      {legend && !sel && <div className="map-card-dock"><MapLegend onClose={() => setLegend(false)} /></div>}
      {!map && (
        <div className="map-note">
          {isError
            ? <p className="empty">The map didn’t load. <button className="inline-link" onClick={() => { refetch(); refetchPoints() }}>Try again</button>?</p>
            : <Slow />}
        </div>
      )}
      {sel && (
        <div className="map-card-dock">
          <MapDetailCard selection={sel} onClose={() => setSel(null)} />
        </div>
      )}
    </div>
  )
}
