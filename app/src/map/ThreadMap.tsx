import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MlMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './map.css'
import { MapboxOverlay } from '@deck.gl/mapbox'
import type { LayersList, PickingInfo } from '@deck.gl/core'
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { PathStyleExtension } from '@deck.gl/extensions'
import { shimTransformForDeck } from './compat'
import { FlowExtension, SoftGlowExtension } from './extensions'
import { MAX_BOUNDS, STYLE_DARK, STYLE_LIGHT, WA_BOUNDS, firstSymbolId, quietStyle } from './basemap'
import { jitter, pointAt, type LonLat } from './geometry'
import {
  DASH_WRAP, buildArcs, buildGlows, buildIndex, buildNodes, degrees, liveThreads, placeLabels, scopeOf,
  type GlowArc, type LabelDatum, type MapNode, type ThreadArc,
} from './model'
import { useMapTheme, useReducedMotion, withAlpha, type MapTheme, type RGBA } from './theme'
import type { ThreadMapProps } from './types'

const FONT = '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif'
const FLOW_PX_PER_S = 24          // dash drift speed; 48 px wrap / 24 = one seamless loop every 2 s
const MOVER_MS = 1700             // one trip along a selected thread, like the prototype's 1.6 s
const PICK_PIN_PX = 6
const HOVER_GROW = 1.45          // a pin under the mouse eases up to this size
const PICK_THREAD_PX = 7          // + the stroke itself ≈ a 16 px wide target

// Shared extension instances: deck compares extensions by identity-ish equality, so keep them stable.
const dashExt = new PathStyleExtension({ dash: true, dashMode: 'path' })
const flowExt = new FlowExtension()
const glowPathExt = new SoftGlowExtension({ shape: 'path' })
const glowPointExt = new SoftGlowExtension({ shape: 'point' })

interface Frame {
  theme: MapTheme
  dots: { length: number; attributes: { getPosition: { value: Float32Array; size: 2 } } } | null
  nodes: MapNode[]
  arcs: ThreadArc[]
  glows: GlowArc[]
  movers: ThreadArc[]
  labels: LabelDatum[]
  counts: { position: LonLat; text: string; color: RGBA }[]
  fontsReady: boolean
  /** Base-map layer our lower layers sit under (the first label layer), when it exists. */
  under?: string
  /** The pin under the mouse: it grows. */
  hover?: string
}

type Mover = { position: LonLat; color: RGBA }
/** @deck.gl/mapbox reads `beforeId` off each layer in interleaved mode. */
type Seat = { beforeId?: string }

function buildLayers(f: Frame, now: number, animate: boolean): LayersList {
  const t = f.theme
  const shift = animate ? ((now / 1000) * FLOW_PX_PER_S) % DASH_WRAP : 0
  const movers: Mover[] = animate
    ? f.movers.map((a, i) => ({
        position: pointAt(a, ((now / MOVER_MS) + i * 0.29) % 1),
        color: a.state === 'Completed' ? t.goldenGlow : a.state === 'Accepted' ? t.offer : t.need,
      }))
    : []
  const layers: LayersList = [
    f.dots && new ScatterplotLayer<unknown, Seat>({
      id: 'wm-dots', beforeId: f.under, data: f.dots, pickable: false,
      // Points are street addresses now (a ZIP center only when the geocoder missed), so the spread is ~50 m:
      // enough to part two at one address, not the old 1.3 km cloud.
      radiusUnits: 'meters', getRadius: 60, radiusMinPixels: 1, radiusMaxPixels: 3,
      getFillColor: withAlpha(t.ink3, t.dark ? 0.3 : 0.36),
      updateTriggers: { getFillColor: t.key },
    }),
    new ScatterplotLayer<MapNode, Seat>({
      id: 'wm-heat', beforeId: f.under, data: f.nodes, pickable: false,
      radiusUnits: 'pixels', getPosition: d => d.position, getRadius: d => d.heatRadius, getFillColor: d => d.heat,
      extensions: [glowPointExt],
    }),
    new PathLayer<GlowArc, Seat>({
      // Threads and their glow draw above the whole base map, labels included (Taylor, Sep 23: roads and
      // town names were cutting through golden threads). Dots and heat stay under the labels.
      id: 'wm-glow', data: f.glows, pickable: false,
      widthUnits: 'pixels', getPath: d => d.path, getWidth: d => d.width, getColor: d => d.color,
      capRounded: true, jointRounded: true, extensions: [glowPathExt],
    }),
    new PathLayer<ThreadArc, Seat & { flowShift: number; getDashArray: (d: ThreadArc) => [number, number]; dashUnits: 'pixels'; dashGapPickable: boolean }>({
      id: 'wm-threads', data: f.arcs, pickable: true,
      widthUnits: 'pixels', getPath: d => d.path, getWidth: d => d.width, getColor: d => d.color,
      capRounded: true, jointRounded: true,
      getDashArray: d => d.dash, dashUnits: 'pixels', dashGapPickable: true,
      flowShift: shift,
      extensions: [dashExt, flowExt],
    }),
    movers.length > 0 && new ScatterplotLayer<Mover>({
      id: 'wm-movers', data: movers, pickable: false,
      radiusUnits: 'pixels', getRadius: 3.6, getPosition: d => d.position, getFillColor: d => d.color,
      stroked: true, lineWidthUnits: 'pixels', getLineWidth: 1, getLineColor: withAlpha(t.paper, 0.9),
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

export function ThreadMap({ data, points, me, selected, onSelect, initialView, className, style }: ThreadMapProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)
  const frameRef = useRef<Frame | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
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
      style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': `rgb(${theme.ground.slice(0, 3).join(',')})` } }] },
      ...(initialView ? { center: initialView.center, zoom: initialView.zoom } : { bounds: WA_BOUNDS, fitBoundsOptions: { padding: 24 } }),
      maxBounds: MAX_BOUNDS,
      minZoom: 4, maxZoom: 16,
      dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0,
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
    overlayRef.current = overlay
    setZoomLevel(Math.floor(map.getZoom()))

    map.on('zoom', () => { const z = Math.floor(map.getZoom()); setZoomLevel(prev => (prev === z ? prev : z)) })
    map.on('moveend', () => setViewTick(v => v + 1))
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
      if (arc && arc.id != null) { onSelectRef.current({ kind: 'thread', id: arc.id }); return }
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
        const hit = !!pin || (pick(x, y, PICK_THREAD_PX, 'wm-threads')?.object as ThreadArc | undefined)?.id != null
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
  const threads = useMemo(() => liveThreads(data.threads), [data.threads])
  const deg = useMemo(() => degrees(threads), [threads])
  const scope = useMemo(() => scopeOf(selected, threads), [selected?.kind, selected?.id, threads])
  const standaloneKey = [...scope.orgs].sort().join(',')
  const index = useMemo(() => buildIndex(data.members, scope.orgs), [data.members, standaloneKey])
  indexRef.current = index
  const { nodes, nodeOf } = useMemo(() => buildNodes(index, zoomLevel, deg, scope, me, theme), [index, zoomLevel, deg, scope, me, theme])
  const arcs = useMemo(() => buildArcs(data, threads, nodeOf, scope, theme), [data, threads, nodeOf, scope, theme])
  const glows = useMemo(() => buildGlows(arcs, scope, theme), [arcs, scope, theme])
  const movers = useMemo(() => (reduced ? [] : arcs.filter(a => a.related && a.state !== 'suggested')), [arcs, reduced])
  const counts = useMemo(() => nodes.filter(n => !n.single).map(n => ({
    position: n.position, text: String(n.members.length), color: [255, 255, 255, scope.active && !n.related ? 110 : 255] as RGBA,
  })), [nodes, scope])
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

  const under = () => {
    const id = underRef.current, map = mapRef.current
    return !swappingRef.current && id && map?.getLayer(id) ? id : undefined
  }
  frameRef.current = { theme, dots, nodes, arcs, glows, movers, labels, counts, fontsReady, under: under(), hover: hoverRef.current.pin }

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
      if (overlay && f && (f.arcs.length || f.movers.length)) { f.under = under(); overlay.setProps({ layers: buildLayers(f, now, true) }) }
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
    const b = map.getBounds()
    if (pts.every(p => b.contains(p))) return
    const lons = pts.map(p => p[0]), lats = pts.map(p => p[1])
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: { top: 80, bottom: 200, left: 60, right: 60 }, maxZoom: 12 })
  }, [selected?.kind, selected?.id])

  return <div ref={boxRef} className={className ? `wm-root ${className}` : 'wm-root'} style={{ position: 'relative', width: '100%', height: '100%', ...style }} />
}
