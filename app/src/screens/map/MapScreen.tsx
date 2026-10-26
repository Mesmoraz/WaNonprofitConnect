import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMapData, useMapFits, useMapOpen, useMapPoints, useMe, type KindOfHelp, type Listing, type MapFitsFor } from '../../api'
import { ThreadMap, type MapView } from '../../map'
import { HELPS, HELP_LABEL } from '../../lib/words'
import { MapDetailCard, type MapSelection } from './MapDetailCard'
import { MapFitsCard } from './MapFitsCard'
import { MapLegend } from './MapLegend'
import { MapOpenList } from './MapOpenList'
import { Slow } from '../../shell/Slow'
import './map.css'

const LEGEND_SEEN = 'helpbook.mapLegendSeen'
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`

/** Is a post's organization inside what the map shows? */
const inside = (l: Listing, v: MapView) =>
  l.org.lat != null && l.org.lon != null && l.org.lat >= v.south && l.org.lat <= v.north && l.org.lon >= v.west && l.org.lon <= v.east
/** Squared distance from the middle of the map, good enough to sort by at city scale. */
const far = (l: Listing, [lon, lat]: [number, number]) => ((l.org.lat ?? 0) - lat) ** 2 + (((l.org.lon ?? 0) - lon) * Math.cos((lat * Math.PI) / 180)) ** 2

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
  const toggle = (f: MapFitsFor) => { setSel(null); setLegend(false); setList(false); setFitsFor(on => (on === f ? null : f)) }
  const fitLines = useMemo(() => (fitsFor && fits ? { kind: fitsFor === 'needs' ? 'offers' as const : 'needs' as const, eins: fits.map(f => f.post.org.ein) } : null), [fitsFor, fits])
  const navigate = useNavigate()
  // A line tapped: that organization's best fit.
  const openFit = (ein: string) => { const f = fits?.find(x => x.post.org.ein === ein); if (f) navigate(`/listing/${f.post.id}`) }

  // What's open in view (S-131): a count at the top, a list under it, and chips for one kind of help at a time.
  const { data: openPosts } = useMapOpen()
  const [help, setHelp] = useState<KindOfHelp | null>(null)
  const [seen, setSeen] = useState<MapView | null>(null)
  const [list, setList] = useState(false)
  const shown = useMemo(() => (openPosts ?? []).filter(l => !help || l.help === help), [openPosts, help])
  const inView = useMemo(() => (seen ? shown.filter(l => inside(l, seen)).sort((a, b) => far(a, seen.center) - far(b, seen.center)) : []), [shown, seen])
  const needs = inView.filter(l => l.kind === 'Need').length
  const strip = `${plural(needs, 'need')} · ${plural(inView.length - needs, 'offer')} in view`
  // The faint dots in view (S-143): every WA organization, at its IRS address.
  const dotsInView = useMemo(() => (seen && points ? points.filter(([, lat, lon]) => lat >= seen.south && lat <= seen.north && lon >= seen.west && lon <= seen.east).length : null), [points, seen])
  // With a kind of help picked, the pins' rings count only that kind.
  const mapData = useMemo(() => {
    if (!map || !help || !openPosts) return map
    const counts = new Map<string, { ein: string; needs: number; offers: number }>()
    for (const l of shown) {
      const c = counts.get(l.org.ein) ?? { ein: l.org.ein, needs: 0, offers: 0 }
      if (l.kind === 'Need') c.needs++; else c.offers++
      counts.set(l.org.ein, c)
    }
    return { ...map, open: [...counts.values()] }
  }, [map, help, openPosts, shown])
  const openList = () => { setSel(null); setLegend(false); setFitsFor(null); setList(o => !o) }

  return (
    <div className="map-screen">
      {mapData && <ThreadMap data={mapData} points={points} me={me?.membership?.ein} selected={sel} onSelect={select} fits={fitLines} onFitTap={openFit} onViewChange={setSeen} initialView={view} className="map-fill" />}
      <button className="map-help" aria-label="What the map shows" aria-expanded={legend} onClick={() => { setSel(null); setFitsFor(null); setList(false); setLegend(o => !o) }}>?</button>
      {map && seen && openPosts && (
        <div className="map-top">
          <button className="map-strip" aria-expanded={list} onClick={openList}>{strip}</button>
          <div className="map-chips" role="group" aria-label="Kind of help">
            <button className="map-chip" aria-pressed={!help} onClick={() => setHelp(null)}>All</button>
            {HELPS.map(h => <button key={h} className="map-chip" aria-pressed={help === h} onClick={() => setHelp(on => (on === h ? null : h))}>{HELP_LABEL[h]}</button>)}
          </div>
          {dotsInView != null && <p className="map-dots-line"><span className="map-dot-swatch" aria-hidden />{plural(dotsInView, 'organization')} in view · IRS addresses</p>}
        </div>
      )}
      {/* Once the map is there: before, it would cover "The map didn't load. Try again?" */}
      {map && (mine?.needs || mine?.offers || legend || sel || fitsFor || list) ? (
        <div className="map-card-dock">
          {!sel && !legend && !list && (mine?.needs || mine?.offers) ? (
            <div className="map-toggles">
              {!!mine?.needs && <button className="map-toggle" aria-pressed={fitsFor === 'needs'} onClick={() => toggle('needs')}>Offers for your needs</button>}
              {!!mine?.offers && <button className="map-toggle" aria-pressed={fitsFor === 'offers'} onClick={() => toggle('offers')}>Needs you can help with</button>}
            </div>
          ) : null}
          {sel ? <MapDetailCard selection={sel} onClose={() => setSel(null)} onSelect={select} />
            : legend ? <MapLegend onClose={() => setLegend(false)} />
            : fitsFor ? <MapFitsCard forWhat={fitsFor} fits={fits} myOrg={map.members.find(o => o.ein === myEin)} onClose={() => setFitsFor(null)} />
            : list ? <MapOpenList title={strip} posts={inView} onClose={() => setList(false)} />
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
