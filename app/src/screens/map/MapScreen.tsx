import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMapData, useMapFits, useMapPoints, useMe, type MapFitsFor } from '../../api'
import { ThreadMap } from '../../map'
import { MapDetailCard, type MapSelection } from './MapDetailCard'
import { MapFitsCard } from './MapFitsCard'
import { MapLegend } from './MapLegend'
import { Slow } from '../../shell/Slow'
import './map.css'

const LEGEND_SEEN = 'helpbook.mapLegendSeen'

/** "?at=lat,lon,zoom" opens the map there (Home's "Near you", S-126). Anything else opens on the whole state. */
function viewFrom(at: string | null): { center: [number, number]; zoom: number } | undefined {
  const [lat, lon, zoom] = (at ?? '').split(',').map(Number)
  if (![lat, lon, zoom].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || zoom < 4 || zoom > 16) return undefined
  return { center: [lon, lat], zoom }
}

/** The Map tab: every WA nonprofit as a faint dot, member orgs as pins, threads as strings. Tap one for its card. */
export function MapScreen() {
  const { data: map, isError, refetch } = useMapData()
  const { data: points, refetch: refetchPoints } = useMapPoints()
  const { data: me } = useMe()
  const [params] = useSearchParams()
  const [view] = useState(() => viewFrom(params.get('at')))   // read once, as the map reads its view
  const [sel, setSel] = useState<MapSelection | null>(null)
  // The legend opens by itself the first time you open the map on this device (S-105).
  const [legend, setLegend] = useState(() => { try { return !localStorage.getItem(LEGEND_SEEN) } catch { return false } })
  useEffect(() => { if (legend) try { localStorage.setItem(LEGEND_SEEN, '1') } catch { /* private window */ } }, [legend])
  const select = (s: MapSelection | null) => { setSel(s); if (s) setLegend(false) }

  // The toggles (S-130): what fits your needs, or what your offers could help with. One on at a time, only for you.
  const [fitsFor, setFitsFor] = useState<MapFitsFor | null>(null)
  const { data: fits } = useMapFits(fitsFor)
  const myEin = me?.membership?.status === 'confirmed' ? me.membership.ein : undefined
  const mine = map?.open?.find(o => o.ein === myEin)
  const toggle = (f: MapFitsFor) => { setSel(null); setLegend(false); setFitsFor(on => (on === f ? null : f)) }
  const fitLines = useMemo(() => (fitsFor && fits ? { kind: fitsFor === 'needs' ? 'offers' as const : 'needs' as const, eins: fits.map(f => f.post.org.ein) } : null), [fitsFor, fits])
  const navigate = useNavigate()
  // A line tapped: that organization's best fit.
  const openFit = (ein: string) => { const f = fits?.find(x => x.post.org.ein === ein); if (f) navigate(`/listing/${f.post.id}`) }

  return (
    <div className="map-screen">
      {map && <ThreadMap data={map} points={points} me={me?.membership?.ein} selected={sel} onSelect={select} fits={fitLines} onFitTap={openFit} initialView={view} className="map-fill" />}
      <button className="map-help" aria-label="What the map shows" aria-expanded={legend} onClick={() => { setSel(null); setFitsFor(null); setLegend(o => !o) }}>?</button>
      {/* Once the map is there: before, it would cover "The map didn't load. Try again?" */}
      {map && (mine?.needs || mine?.offers || legend || sel || fitsFor) ? (
        <div className="map-card-dock">
          {!sel && !legend && (mine?.needs || mine?.offers) ? (
            <div className="map-toggles">
              {!!mine?.needs && <button className="map-toggle" aria-pressed={fitsFor === 'needs'} onClick={() => toggle('needs')}>Offers for your needs</button>}
              {!!mine?.offers && <button className="map-toggle" aria-pressed={fitsFor === 'offers'} onClick={() => toggle('offers')}>Needs you can help with</button>}
            </div>
          ) : null}
          {sel ? <MapDetailCard selection={sel} onClose={() => setSel(null)} onSelect={select} />
            : legend ? <MapLegend onClose={() => setLegend(false)} />
            : fitsFor ? <MapFitsCard forWhat={fitsFor} fits={fits} myOrg={map.members.find(o => o.ein === myEin)} onClose={() => setFitsFor(null)} />
            : null}
        </div>
      ) : null}
      {!map && (
        <div className="map-note">
          {isError
            ? <p className="empty">The map didn’t load. <button className="inline-link" onClick={() => { refetch(); refetchPoints() }}>Try again</button>?</p>
            : <Slow />}
        </div>
      )}
    </div>
  )
}
