import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './map.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import type { LayersList, PickingInfo } from '@deck.gl/core'
import { PathLayer, ScatterplotLayer, SolidPolygonLayer, TextLayer } from '@deck.gl/layers'
import { PathStyleExtension } from '@deck.gl/extensions'
import { shimTransformForDeck } from './compat'
import { SoftGlowExtension } from './extensions'
import { MAX_BOUNDS, STYLE_DARK, STYLE_LIGHT, WA_BOUNDS, firstSymbolId, quietStyle } from './basemap'
import { jitter, pointAt, type LonLat } from './geometry'
import {
  buildArcs, buildFitArcs, fitScope, buildGlows, buildIndex, buildNodes, degrees, openCounts, placeLabels, scopeOf, shownThreads,
  type GlowArc, type LabelDatum, type MapNode, type ThreadArc,
} from './model'
import { useMapTheme, useReducedMotion, withAlpha, type MapTheme, type RGBA } from './theme'
import type { MapPlace, ThreadMapProps } from './types'

const FONT = '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif'
const CONFETTI_MS = 1400          // a burst at both pins when a thread turns golden while you look (S-127)
const CONFETTI_PER_PIN = 26
const PULSE_MS = 1600             // your pin's pulse while a toggle is on (S-130)
const PICK_PIN_PX = 6
const HOVER_GROW = 1.45          // a pin under the mouse eases up to this size
const PICK_THREAD_PX = 7          // + the stroke itself ≈ a 16 px wide target
const PICK_LABEL_PX = 8           // around a town or neighborhood name (S-144)
/** Base-map labels that name a place you can tap (S-144); states and countries aren't places with a list. */
const NOT_A_PLACE = new Set(['state', 'country', 'continent', 'province'])
/** The fade's outside edge: past anywhere the map can pan to (MAX_BOUNDS). */
const WORLD_RING: LonLat[] = [[-140, 35], [-100, 35], [-100, 60], [-140, 60], [-140, 35]]

// Shared extension instances: deck compares extensions by identity-ish equality, so keep them stable.
const dashExt = new PathStyleExtension({ dash: true, dashMode: 'path' })
const glowPathExt = new SoftGlowExtension({ shape: 'path' })
const glowPointExt = new SoftGlowExtension({ shape: 'point' })

interface Frame {
  theme: MapTheme
  dots: { length: number; attributes: { getPosition: { value: Float32Array; size: 2 } } } | null
  nodes: MapNode[]
  arcs: ThreadArc[]
  glows: GlowArc[]
  confetti: Confetto[]
  /** Your pin while a toggle is on (S-130): a ring swells out from it and fades. */
  pulse: { position: LonLat; radius: number; color: RGBA } | null
  labels: LabelDatum[]
  counts: { position: LonLat; text: string; color: RGBA }[]
  /** A place you tapped (S-144): the land outside it, as one polygon with the place cut out, and its edges. */
  place: { fade: LonLat[][]; edges: LonLat[][] } | null
  fontsReady: boolean
  /** floor(zoom): how the faint dots are drawn. */
  zoom: number
  /** Base-map layer our lower layers sit under (the first label layer), when it exists. */
  under?: string
  /** The pin under the mouse: it grows. */
  hover?: string
}

type Confetto = { position: LonLat; color: RGBA; size: number }
/** One golden moment: where it pops and when. Each piece flies out on its own heading and falls. */
type Burst = { at: LonLat[]; start: number; pieces: { angle: number; speed: number; size: number; color: RGBA }[] }
/** @deck.gl/mapbox reads `beforeId` off each layer in interleaved mode. */
type Seat = { beforeId?: string }

/**
 * How a faint dot is drawn at a zoom. Zoomed out they add up into a light wash where organizations are (S-143); at
 * every zoom they stay in the background, so pins and golden threads lead (S-146: Taylor, "not the focus").
 */
function dotLook(zoom: number): { radius: number; alpha: number } {
  if (zoom <= 8) return { radius: 1.6, alpha: 0.07 }
  if (zoom <= 11) return { radius: 2, alpha: 0.12 }
  return { radius: 2.6, alpha: 0.22 }
}

function buildLayers(f: Frame, now: number, animate: boolean): LayersList {
  const t = f.theme
  const dot = dotLook(f.zoom)
  const layers: LayersList = [
    f.dots && new ScatterplotLayer<unknown, Seat>({
      // Every WA organization at its IRS address (S-143). Points are street addresses (a ZIP center only when the
      // geocoder missed), spread ~50 m so two at one address part.
      id: 'wm-dots', beforeId: f.under, data: f.dots, pickable: false,
      radiusUnits: 'pixels', getRadius: dot.radius,
      getFillColor: withAlpha(t.dot, dot.alpha),
      updateTriggers: { getFillColor: [t.key, f.zoom] },
    }),
    new ScatterplotLayer<MapNode, Seat>({
      id: 'wm-heat', beforeId: f.under, data: f.nodes, pickable: false,
      radiusUnits: 'pixels', getPosition: d => d.position, getRadius: d => d.heatRadius, getFillColor: d => d.heat,
      extensions: [glowPointExt],
    }),
    // A place you tapped (S-144): the land outside fades a little and its edge is a thin line, both under the town names.
    f.place && new SolidPolygonLayer<LonLat[][], Seat>({
      id: 'wm-place-fade', beforeId: f.under, data: [f.place.fade], pickable: false,
      getPolygon: d => d, getFillColor: t.placeFade, updateTriggers: { getFillColor: t.key },
    }),
    f.place && new PathLayer<LonLat[], Seat>({
      id: 'wm-place-line', beforeId: f.under, data: f.place.edges, pickable: false,
      widthUnits: 'pixels', getPath: d => d, getWidth: 2, getColor: withAlpha(t.placeLine, 0.9),
      jointRounded: true, updateTriggers: { getColor: t.key },
    }),
    new PathLayer<GlowArc, Seat>({
      // Threads and their glow draw above the whole base map, labels included (Taylor, Sep 23: roads and
      // town names were cutting through golden threads). Dots and heat stay under the labels.
      id: 'wm-glow', data: f.glows, pickable: false,
      widthUnits: 'pixels', getPath: d => d.path, getWidth: d => d.width, getColor: d => d.color,
      capRounded: true, jointRounded: true, extensions: [glowPathExt],
    }),
    // Still lines (S-147, Taylor Oct 25: "too many threads and moving pieces"): nothing drifts or runs along them.
    new PathLayer<ThreadArc, Seat & { getDashArray: (d: ThreadArc) => [number, number]; dashUnits: 'pixels'; dashGapPickable: boolean }>({
      id: 'wm-threads', data: f.arcs, pickable: true,
      widthUnits: 'pixels', getPath: d => d.path, getWidth: d => d.width, getColor: d => d.color,
      capRounded: true, jointRounded: true,
      getDashArray: d => d.dash, dashUnits: 'pixels', dashGapPickable: true,
      extensions: [dashExt],
    }),
    f.pulse && animate && new ScatterplotLayer<NonNullable<Frame['pulse']>>({
      id: 'wm-pulse', data: [f.pulse], pickable: false,
      radiusUnits: 'pixels', getPosition: d => d.position, filled: false, stroked: true, lineWidthUnits: 'pixels',
      getRadius: d => d.radius + 18 * ((now % PULSE_MS) / PULSE_MS), getLineWidth: 2.5,
      getLineColor: d => withAlpha(d.color, 0.9 * (1 - (now % PULSE_MS) / PULSE_MS)),
      updateTriggers: { getRadius: now, getLineColor: now },
    }),
    f.confetti.length > 0 && new ScatterplotLayer<Confetto>({
      id: 'wm-confetti', data: f.confetti, pickable: false,
      radiusUnits: 'pixels', getRadius: d => d.size, getPosition: d => d.position, getFillColor: d => d.color,
    }),
    new ScatterplotLayer<MapNode>({
      id: 'wm-pins', data: f.nodes, pickable: true,
      radiusUnits: 'pixels', getPosition: d => d.position, getFillColor: d => d.fill,
      getRadius: d => (d.id === f.hover ? d.radius * HOVER_GROW : d.radius),
      updateTriggers: { getRadius: f.hover }, transitions: { getRadius: { duration: 160 } },
      stroked: true, lineWidthUnits: 'pixels', getLineWidth: d => d.lineWidth, getLineColor: d => d.line,
    }),
  ]
  if (f.fontsReady) {
    layers.push(
      new TextLayer<{ position: LonLat; text: string; color: RGBA }>({
        id: 'wm-counts', data: f.counts, pickable: false,
        getPosition: d => d.position, getText: d => d.text, getSize: 11, sizeUnits: 'pixels',
        getColor: d => d.color, fontFamily: FONT, fontWeight: 700, characterSet: '0123456789+',
        getTextAnchor: 'middle', getAlignmentBaseline: 'center',
      }),
      new TextLayer<LabelDatum>({
        id: 'wm-labels', data: f.labels, pickable: false,
        getPosition: d => d.position, getText: d => d.text, getSize: 12, sizeUnits: 'pixels',
        getColor: d => d.color, getTextAnchor: d => d.anchor, getAlignmentBaseline: 'center', getPixelOffset: d => d.offset,
        fontFamily: FONT, fontWeight: 600, characterSet: 'auto',
        fontSettings: { sdf: true, fontSize: 64, buffer: 10, radius: 16 }, outlineWidth: 9, outlineColor: withAlpha(t.paper, 0.92),
        updateTriggers: { outlineColor: t.key },
      }),
    )
  }
  return layers
}

/** The base map's place name under a tap, if there is one (S-144): its name, class, and where the label sits. */
function labelAt(map: MlMap, x: number, y: number) {
  const layers = (map.getStyle()?.layers ?? []).filter(l => 'source-layer' in l && l['source-layer'] === 'place').map(l => l.id)
  if (!layers.length) return null
  const hit = map.queryRenderedFeatures([[x - PICK_LABEL_PX, y - PICK_LABEL_PX], [x + PICK_LABEL_PX, y + PICK_LABEL_PX]], { layers })
    .find(f => f.geometry.type === 'Point' && !NOT_A_PLACE.has(String(f.properties?.class)))
  if (!hit || hit.geometry.type !== 'Point') return null
  const name = String(hit.properties?.['name:latin'] ?? hit.properties?.name ?? '')
  const [lon, lat] = hit.geometry.coordinates
  return name ? { name, kind: String(hit.properties?.class ?? ''), lon, lat } : null
}

/** A place's fade (the world with the place cut out) and its edges, for deck. */
function placeShapes(place: MapPlace): NonNullable<Frame['place']> {
  const polygons = place.geometry.type === 'Polygon' ? [place.geometry.coordinates] : place.geometry.coordinates
  const ring = (r: number[][]) => r.map(([x, y]) => [x, y] as LonLat)
  return { fade: [WORLD_RING, ...polygons.map(p => ring(p[0]))], edges: polygons.flatMap(p => p.map(ring)) }
}

export function ThreadMap({ data, points, me, selected, onSelect, fits, onFitTap, onLabelTap, place, onViewChange, initialView, still, className, style }: ThreadMapProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const frameRef = useRef<Frame | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onFitTapRef = useRef(onFitTap)
  onFitTapRef.current = onFitTap
  const onLabelTapRef = useRef(onLabelTap)
  onLabelTapRef.current = onLabelTap
  const onViewRef = useRef(onViewChange)
  onViewRef.current = onViewChange
  const indexRef = useRef<ReturnType<typeof buildIndex> | null>(null)
  const underRef = useRef<string | undefined>(undefined)
  const swappingRef = useRef(true)   // true until a real style has loaded
  const hoverRef = useRef<{ pin?: string; hit: boolean }>({ hit: false })

  const theme = useMapTheme(boxRef)
  const reduced = useReducedMotion()
  const [zoomLevel, setZoomLevel] = useState(6)       // floor(zoom): what supercluster works in
  const [viewTick, setViewTick] = useState(0)         // bumps at moveend so labels re-place
  const [fontsReady, setFontsReady] = useState(false)

  // ---- Map and overlay, once ----------------------------------------------------------------------
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const map = new MlMap({
      container: box,
      // A plain ground until the real style arrives (the theme effect below sets it).
      style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': `rgb(${theme.land.slice(0, 3).join(',')})` } }] },
      ...(initialView ? { center: initialView.center, zoom: initialView.zoom } : { bounds: WA_BOUNDS, fitBoundsOptions: { padding: 24 } }),
      maxBounds: MAX_BOUNDS,
      minZoom: 4, maxZoom: 16,
      dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0,
      interactive: !still,
      renderWorldCopies: false,
      // Default attribution: full line on wide screens, the (i) button, open at first, on narrow ones.
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),   // cheap phones with 3x screens stay smooth
      // Keep the last frame readable, so "Send feedback" can include the map in its picture of the screen.
      canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
    })
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    shimTransformForDeck(map)
    // deck owns the cursor: it sets one every frame, so setting it on the canvas ourselves made it flicker.
    const overlay = new MapboxOverlay({
      interleaved: true, layers: [],
      getCursor: ({ isDragging }) => (isDragging ? 'grabbing' : hoverRef.current.hit ? 'pointer' : 'grab'),
    })
    map.addControl(overlay)
    mapRef.current = map
    // For the acceptance tests (app/e2e/map.spec.ts): where a pin is drawn, so a test can tap it like a person.
    ;(box as HTMLDivElement & { __map?: MlMap }).__map = map
    overlayRef.current = overlay
    setZoomLevel(Math.floor(map.getZoom()))

    map.on('zoom', () => { const z = Math.floor(map.getZoom()); setZoomLevel(prev => (prev === z ? prev : z)) })
    const tellView = () => {
      const b = map.getBounds(), c = map.getCenter()
      onViewRef.current?.({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth(), center: [c.lng, c.lat] })
    }
    map.on('load', tellView)
    map.on('moveend', () => { setViewTick(v => v + 1); tellView() })
    map.on('style.load', () => { swappingRef.current = false; setViewTick(v => v + 1) })   // re-seat our layers under the new labels

    const pick = (x: number, y: number, radius: number, layerId: string): PickingInfo | null =>
      overlay.pickObject({ x, y, radius, layerIds: [layerId] })

    map.on('click', e => {
      const { x, y } = e.point
      const pin = pick(x, y, PICK_PIN_PX, 'wm-pins')?.object as MapNode | undefined
      if (pin) {
        if (pin.single) { onSelectRef.current({ kind: 'org', id: pin.members[0].ein }); return }
        const sc = indexRef.current?.sc
        if (sc && pin.clusterId != null) {
          const z = Math.min(sc.getClusterExpansionZoom(pin.clusterId) + 0.05, 15)
          map.flyTo({ center: pin.position, zoom: Math.max(z, map.getZoom() + 1), speed: 1.4 })
        }
        return
      }
      const arc = pick(x, y, PICK_THREAD_PX, 'wm-threads')?.object as ThreadArc | undefined
      if (arc?.fit) { onFitTapRef.current?.(arc.fit); return }
      if (arc && arc.id != null) { onSelectRef.current({ kind: 'thread', id: arc.id }); return }
      if (arc && arc.count > 1) {
        // A line that carries several: between two organizations, their card lists them; to a cluster, open the cluster.
        if (arc.pair) { onSelectRef.current({ kind: 'pair', id: arc.pair.join('|') }); return }
        const sc = indexRef.current?.sc
        if (sc && arc.cluster) {
          const z = Math.min(sc.getClusterExpansionZoom(arc.cluster.clusterId) + 0.05, 15)
          map.flyTo({ center: arc.cluster.position, zoom: Math.max(z, map.getZoom() + 1), speed: 1.4 })
        }
        return
      }
      const label = onLabelTapRef.current && labelAt(map, x, y)
      if (label) { onLabelTapRef.current!(label); return }
      onSelectRef.current(null)
    })

    // Pointer cursor on hover, mouse only (touch has no hover and picking costs a GPU read).
    let hoverQueued = false
    map.on('mouseout', () => { hoverRef.current = { hit: false }; if (frameRef.current) frameRef.current.hover = undefined })
    map.on('mousemove', e => {
      if (hoverQueued) return
      hoverQueued = true
      requestAnimationFrame(() => {
        hoverQueued = false
        const { x, y } = e.point
        const pin = pick(x, y, PICK_PIN_PX, 'wm-pins')?.object as MapNode | undefined
        const line = pick(x, y, PICK_THREAD_PX, 'wm-threads')?.object as ThreadArc | undefined
        const hit = !!pin || (!!line && (line.id != null || line.count > 1 || !!line.fit)) || (!!onLabelTapRef.current && !!labelAt(map, x, y))
        const was = hoverRef.current.pin
        hoverRef.current = { pin: pin?.id, hit }
        if (was !== pin?.id && frameRef.current) {
          frameRef.current.hover = pin?.id
          overlay.setProps({ layers: buildLayers(frameRef.current, performance.now(), true) })
        }
      })
    })

    return () => {
      overlayRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  // ---- Base style follows the theme ---------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // While styles swap, our layers must not name a label layer as their anchor: deck re-adds them
    // to the incoming style, which may not have it. They go on top until the new style has loaded.
    swappingRef.current = true
    const overlay = overlayRef.current
    if (overlay && frameRef.current) overlay.setProps({ layers: buildLayers({ ...frameRef.current, under: undefined }, performance.now(), true) })
    map.setStyle(theme.dark ? STYLE_DARK : STYLE_LIGHT, {
      diff: false,
      transformStyle: (_prev, next) => {
        const quiet = quietStyle(next as StyleSpecification, theme)
        underRef.current = firstSymbolId(quiet)
        return quiet
      },
    })
  }, [theme])

  // ---- Fonts for the labels: wait for Plex so the glyph atlas isn't built from a fallback ---------
  useEffect(() => {
    let live = true
    const done = () => { if (live) setFontsReady(true) }
    if (document.fonts?.load) document.fonts.load(`600 12px "IBM Plex Sans"`).then(done, done)
    else done()
    const t = setTimeout(done, 2500)
    return () => { live = false; clearTimeout(t) }
  }, [])

  // ---- Derived data, memoized step by step --------------------------------------------------------
  const threads = useMemo(() => shownThreads(data.threads, me), [data.threads, me])
  const deg = useMemo(() => degrees(threads.filter(t => t.status === 'Completed')), [threads])
  const open = useMemo(() => openCounts(data), [data])
  // A toggle's fits (S-130), by value: the screen hands a new object each render.
  const fitKey = fits ? `${fits.kind}:${fits.eins.join(',')}` : ''
  const fitsNow = useMemo(() => fits ?? null, [fitKey]) // eslint-disable-line react-hooks/exhaustive-deps
  // Something selected wins; otherwise a toggle's fits; otherwise nothing.
  const scope = useMemo(() => (selected ? scopeOf(selected, threads) : fitScope(fitsNow, me) ?? scopeOf(null, threads)),
    [selected?.kind, selected?.id, threads, fitsNow, me]) // eslint-disable-line react-hooks/exhaustive-deps
  const standaloneKey = [...scope.orgs].sort().join(',')
  const index = useMemo(() => buildIndex(data.members, scope.orgs), [data.members, standaloneKey])
  indexRef.current = index
  const { nodes, nodeOf } = useMemo(() => buildNodes(index, zoomLevel, deg, open, scope, me, theme), [index, zoomLevel, deg, open, scope, me, theme])
  // No "Could fit" lines for everyone (S-129); S-130's toggles will draw them for you alone.
  const arcs = useMemo(() => [...buildArcs([], threads, nodeOf, scope, theme), ...(selected ? [] : buildFitArcs(fitsNow, me, nodeOf, theme))],
    [threads, nodeOf, scope, theme, fitsNow, me, selected])
  const pulse = useMemo(() => {
    const n = fitsNow && !selected && me ? nodeOf.get(me) : undefined
    return n ? { position: n.position, radius: n.radius, color: fitsNow!.kind === 'offers' ? theme.offer : theme.need } : null
  }, [fitsNow, selected, me, nodeOf, theme])
  const glows = useMemo(() => buildGlows(arcs, theme), [arcs, theme])
  // For the acceptance tests (app/e2e/map-threads.spec.ts): where each line's middle is, so a test can tap it like a person.
  useEffect(() => {
    const box = boxRef.current as (HTMLDivElement & { __lines?: unknown; __linesZoom?: number }) | null
    if (box) { box.__lines = arcs.map(a => ({ pair: a.pair, count: a.count, fit: a.fit ?? null, middle: pointAt(a, 0.5) })); box.__linesZoom = zoomLevel }
  }, [arcs]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Confetti when a thread turns golden while you're looking (S-127) ----------------------------
  const burstsRef = useRef<Burst[]>([])
  const goldenRef = useRef<Set<number> | null>(null)
  useEffect(() => {
    const now = new Set(threads.filter(t => t.status === 'Completed').map(t => t.id))
    const before = goldenRef.current
    goldenRef.current = now
    if (!before || reduced) return                          // the first look isn't a moment; reduced motion skips it
    const fresh = threads.filter(t => t.status === 'Completed' && !before.has(t.id))
    if (!fresh.length) return
    const colors = [theme.golden, theme.goldenGlow, theme.offer, theme.need, theme.paper]
    for (const t of fresh) {
      const at = [nodeOf.get(t.fromEin)?.position, nodeOf.get(t.toEin)?.position].filter((p): p is LonLat => !!p)
      if (!at.length) continue
      const pieces = Array.from({ length: CONFETTI_PER_PIN }, (_, i) => ({
        angle: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4,   // mostly up, then gravity brings them down
        speed: 140 + Math.random() * 160,
        size: 2 + Math.random() * 2.5,
        color: colors[i % colors.length],
      }))
      burstsRef.current.push({ at, start: performance.now(), pieces })
      const box = boxRef.current as (HTMLDivElement & { __bursts?: number }) | null
      if (box) box.__bursts = (box.__bursts ?? 0) + 1        // for the acceptance tests
    }
  }, [threads]) // eslint-disable-line react-hooks/exhaustive-deps

  const confettiNow = (now: number): Confetto[] => {
    const map = mapRef.current
    burstsRef.current = burstsRef.current.filter(b => now - b.start < CONFETTI_MS)
    if (!map || !burstsRef.current.length) return []
    const out: Confetto[] = []
    for (const b of burstsRef.current) {
      const s = (now - b.start) / 1000, fade = 1 - (now - b.start) / CONFETTI_MS
      for (const origin of b.at) {
        const o = map.project(origin)
        for (const p of b.pieces) {
          const x = o.x + Math.cos(p.angle) * p.speed * s
          const y = o.y + Math.sin(p.angle) * p.speed * s + 0.5 * 520 * s * s
          const ll = map.unproject([x, y])
          out.push({ position: [ll.lng, ll.lat], color: withAlpha(p.color, Math.max(0, fade)), size: p.size })
        }
      }
    }
    return out
  }
  const counts = useMemo(() => nodes.filter(n => !n.single).map(n => ({
    position: n.position, text: String(n.members.length), color: n.countColor,
  })), [nodes])
  const dots = useMemo(() => {
    if (!points?.length) return null
    const value = new Float32Array(points.length * 2)
    points.forEach(([ein, lat, lon], i) => { const [x, y] = jitter(ein, lat, lon, 0.0005); value[i * 2] = x; value[i * 2 + 1] = y })
    return { length: points.length, attributes: { getPosition: { value, size: 2 as const } } }
  }, [points])
  const labels = useMemo(() => {
    const map = mapRef.current
    if (!map) return []
    const c = map.getCanvas()
    return placeLabels(nodes, map.getZoom(), p => map.project(p), c.clientWidth, c.clientHeight, scope, theme)
  }, [nodes, scope, theme, viewTick])

  const placeKey = place?.id ?? ''
  const shapes = useMemo(() => (place ? placeShapes(place) : null), [placeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const under = () => {
    const id = underRef.current, map = mapRef.current
    return !swappingRef.current && id && map?.getLayer(id) ? id : undefined
  }
  frameRef.current = { theme, dots, nodes, arcs, glows, confetti: [], pulse: reduced ? null : pulse, labels, counts, place: shapes, fontsReady, zoom: zoomLevel, under: under(), hover: hoverRef.current.pin }

  // ---- Drawing: static redraw on change, plus a light animation loop when motion is allowed --------
  useEffect(() => {
    const overlay = overlayRef.current
    if (overlay && frameRef.current) { frameRef.current.under = under(); overlay.setProps({ layers: buildLayers(frameRef.current, performance.now(), true) }) }
  })

  useEffect(() => {
    // The dash drift always runs: it is slow, and it is how you read which way help flows (Taylor, Sep 23).
    // Reduced motion still drops the movers racing along a selected thread (see `movers`).
    let raf = 0, last = 0, slowFrames = 0, minGap = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = now - last
      if (dt < minGap) return
      // If the phone can't keep up (frames > 28 ms for a couple of seconds), settle at ~30 fps.
      if (last && dt > 28) { if (++slowFrames > 90) minGap = 32 } else slowFrames = Math.max(0, slowFrames - 1)
      last = now
      const overlay = overlayRef.current, f = frameRef.current
      if (f) f.confetti = confettiNow(now)
      if (overlay && f && (f.confetti.length || f.pulse)) { f.under = under(); overlay.setProps({ layers: buildLayers(f, now, true) }) }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ---- Selection set from outside: bring both ends into view if they aren't -----------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !scope.active) return
    const pts = [...scope.orgs].map(e => index.byEin.get(e)).filter(Boolean).map(o => [o!.lon, o!.lat] as LonLat)
    if (!pts.length) return
    // A toggle turned on (S-130) always frames you and what fits, above its card; a selection only moves the map if it must.
    const framing = !selected && !!fitsNow?.eins.length
    const b = map.getBounds()
    if (!framing && pts.every(p => b.contains(p))) return
    const lons = pts.map(p => p[0]), lats = pts.map(p => p[1])
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
      { padding: { top: 80, bottom: framing ? 340 : 200, left: 60, right: 60 }, maxZoom: framing ? 13 : 12 })
  }, [selected?.kind, selected?.id, fitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- A place tapped (S-144): frame it, under the strip and chips at the top ------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !place) return
    const [w, s, e, n] = place.bbox
    map.fitBounds([[w, s], [e, n]], { padding: { top: 130, bottom: 40, left: 24, right: 24 }, maxZoom: 14, duration: 900 })
  }, [placeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={boxRef} className={className ? `wm-root ${className}` : 'wm-root'} style={{ position: 'relative', width: '100%', height: '100%', ...style }} />
}
