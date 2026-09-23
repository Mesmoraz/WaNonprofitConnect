import Supercluster, { type ClusterProperties, type PointFeature } from 'supercluster'
import { curve, type Arc, type LonLat } from './geometry'
import { withAlpha, type MapTheme, type RGBA } from './theme'
import type { MapData, MapSelection, MapThread, OrgSummary } from './types'

// Everything here is plain data in, plain data out: no map, no deck. ThreadMap memoizes each step.

export type ArcState = 'suggested' | 'Proposed' | 'Accepted' | 'Completed'

/** Dash [on, off] in CSS px. Every period divides 48, so one shared 48 px wrap is seamless for all. */
export const DASH: Record<ArcState, [number, number]> = {
  suggested: [2, 6], Proposed: [6, 6], Accepted: [10, 6], Completed: [16, 8],
}
export const DASH_WRAP = 48

const LIVE = new Set(['Proposed', 'Accepted', 'Completed'])
export const liveThreads = (threads: MapThread[]) => threads.filter(t => LIVE.has(t.status))

export const placed = (o: OrgSummary): o is OrgSummary & { lat: number; lon: number } => o.lat != null && o.lon != null

export function degrees(threads: MapThread[]): Map<string, number> {
  const d = new Map<string, number>()
  for (const t of threads) { d.set(t.fromEin, (d.get(t.fromEin) ?? 0) + 1); d.set(t.toEin, (d.get(t.toEin) ?? 0) + 1) }
  return d
}

// ---- Selection scope: what stays bright while something is selected ----------------------------
export interface Scope { active: boolean; orgs: Set<string>; threads: Set<number>; selectedOrg: string | null }

export function scopeOf(sel: MapSelection | null | undefined, threads: MapThread[]): Scope {
  const orgs = new Set<string>(), ids = new Set<number>()
  if (sel?.kind === 'org') {
    orgs.add(sel.id)
    for (const t of threads) if (t.fromEin === sel.id || t.toEin === sel.id) { ids.add(t.id); orgs.add(t.fromEin); orgs.add(t.toEin) }
    return { active: true, orgs, threads: ids, selectedOrg: sel.id }
  }
  if (sel?.kind === 'thread') {
    const t = threads.find(x => x.id === sel.id)
    if (t) { ids.add(t.id); orgs.add(t.fromEin); orgs.add(t.toEin); return { active: true, orgs, threads: ids, selectedOrg: null } }
  }
  return { active: false, orgs, threads: ids, selectedOrg: null }
}

// ---- Clustering ----------------------------------------------------------------------------------
type Leaf = { ein: string }
export type Index = { sc: Supercluster<Leaf, Record<string, never>>; byEin: Map<string, OrgSummary & { lat: number; lon: number }>; solo: (OrgSummary & { lat: number; lon: number })[] }

/** Selected orgs and their thread partners never cluster, like the prototype: you always see both ends. */
export function buildIndex(members: OrgSummary[], standalone: Set<string>): Index {
  const byEin = new Map<string, OrgSummary & { lat: number; lon: number }>()
  const solo: (OrgSummary & { lat: number; lon: number })[] = []
  const feats: PointFeature<Leaf>[] = []
  for (const o of members) {
    if (!placed(o)) continue
    byEin.set(o.ein, o)
    if (standalone.has(o.ein)) { solo.push(o); continue }
    feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [o.lon, o.lat] }, properties: { ein: o.ein } })
  }
  const sc = new Supercluster<Leaf, Record<string, never>>({ radius: 42, maxZoom: 14, minPoints: 2 }).load(feats)
  return { sc, byEin, solo }
}

export interface MapNode {
  id: string
  position: LonLat
  members: OrgSummary[]
  clusterId: number | null
  single: boolean
  deg: number
  radius: number
  related: boolean
  selected: boolean
  me: boolean
  // baked visuals
  fill: RGBA; line: RGBA; lineWidth: number; heat: RGBA; heatRadius: number
}

export function pinRadius(single: boolean, deg: number, count: number) {
  return single ? 5.5 + Math.min(4, deg) : Math.min(20, 9 + 3.5 * Math.sqrt(count))
}

export function buildNodes(index: Index, zoom: number, deg: Map<string, number>, scope: Scope, me: string | undefined, theme: MapTheme) {
  const nodes: MapNode[] = [], nodeOf = new Map<string, MapNode>()
  const make = (id: string, position: LonLat, members: OrgSummary[], clusterId: number | null) => {
    const single = members.length === 1
    const d = members.reduce((a, o) => a + (deg.get(o.ein) ?? 0), 0)
    const related = scope.active && members.some(o => scope.orgs.has(o.ein))
    const selected = single && scope.selectedOrg === members[0].ein
    const isMe = !!me && members.some(o => o.ein === me)
    const dim = scope.active && !related
    const memberish = members.some(o => o.isMember)
    const radius = pinRadius(single, d, members.length)
    const fillA = (dim ? 0.4 : 1) * (memberish ? 1 : 0.7)
    const n: MapNode = {
      id, position, members, clusterId, single, deg: d, radius, related, selected, me: isMe,
      fill: withAlpha(theme.offer, fillA),
      line: selected ? theme.ink : isMe ? theme.need : withAlpha(theme.paper, dim ? 0.5 : 1),
      lineWidth: selected || isMe ? 3 : 1.5,
      heat: withAlpha(theme.offer, (d >= 3 ? 0.6 : 0.38) * (dim ? 0.25 : 1) * (d > 0 || !single ? 1 : 0)),
      heatRadius: radius + Math.min(22, 8 + 3.5 * Math.sqrt(d + members.length)),
    }
    nodes.push(n)
    for (const o of members) nodeOf.set(o.ein, n)
  }
  for (const f of index.sc.getClusters([-180, -85, 180, 85], zoom)) {
    const [lon, lat] = f.geometry.coordinates as LonLat
    const p = f.properties as Partial<ClusterProperties> & Partial<Leaf>
    if (p.cluster && p.cluster_id != null) {
      const leaves = index.sc.getLeaves(p.cluster_id, Infinity).map(l => index.byEin.get(l.properties.ein)!).filter(Boolean)
      make(`c:${p.cluster_id}`, [lon, lat], leaves, p.cluster_id)
    } else if (p.ein) {
      const o = index.byEin.get(p.ein)
      if (o) make(`o:${o.ein}`, [o.lon, o.lat], [o], null)
    }
  }
  for (const o of index.solo) make(`o:${o.ein}`, [o.lon, o.lat], [o], null)
  // Draw order: quiet first, busy and selected last (on top).
  nodes.sort((a, b) => (+a.related - +b.related) || (+a.me - +b.me) || (+a.selected - +b.selected) || (a.deg - b.deg))
  return { nodes, nodeOf }
}

// ---- Threads as arcs between nodes ---------------------------------------------------------------
export interface ThreadArc extends Arc {
  key: string
  id: number | null          // null for suggested
  state: ArcState
  fromEin: string; toEin: string; title: string
  related: boolean
  color: RGBA; width: number; dash: [number, number]
}

const BASE_W: Record<ArcState, number> = { suggested: 1.5, Proposed: 2, Accepted: 2.25, Completed: 3 }
const BASE_A: Record<ArcState, number> = { suggested: 0.5, Proposed: 0.85, Accepted: 0.85, Completed: 1 }

export function stateColor(state: ArcState, theme: MapTheme): RGBA {
  return state === 'Completed' ? theme.golden : state === 'Accepted' ? theme.offer : state === 'Proposed' ? theme.need : theme.ink3
}

export function buildArcs(data: MapData, threads: MapThread[], nodeOf: Map<string, MapNode>, scope: Scope, theme: MapTheme): ThreadArc[] {
  const out: ThreadArc[] = []
  const pairCount = new Map<string, number>()
  const add = (key: string, id: number | null, state: ArcState, fromEin: string, toEin: string, title: string, related: boolean) => {
    const a = nodeOf.get(fromEin), b = nodeOf.get(toEin)
    if (!a || !b || a === b) return           // both ends in one cluster: nothing to draw yet
    const pair = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`
    const k = pairCount.get(pair) ?? 0
    pairCount.set(pair, k + 1)
    const arc = curve(a.position, b.position, 0.16 + 0.09 * k)   // fan out repeats between the same two places
    const dim = scope.active && !related
    const alpha = dim ? (state === 'suggested' ? 0.06 : 0.12) : scope.active ? (state === 'suggested' ? 0.75 : 1) : BASE_A[state]
    out.push({
      ...arc, key, id, state, fromEin, toEin, title, related,
      color: withAlpha(stateColor(state, theme), alpha),
      width: BASE_W[state] + (scope.active && related ? 1.25 : 0),
      dash: DASH[state],
    })
  }
  for (const s of data.suggested) {
    const rel = scope.active && (scope.orgs.has(s.fromEin) && scope.orgs.has(s.toEin)) && (scope.selectedOrg === s.fromEin || scope.selectedOrg === s.toEin)
    add(`s:${s.needId}:${s.offerId}`, null, 'suggested', s.fromEin, s.toEin, '', rel)
  }
  for (const t of threads) add(`t:${t.id}`, t.id, t.status as ArcState, t.fromEin, t.toEin, t.title, scope.threads.has(t.id))
  const rank: Record<ArcState, number> = { suggested: 0, Proposed: 1, Accepted: 2, Completed: 3 }
  out.sort((x, y) => (+x.related - +y.related) || (rank[x.state] - rank[y.state]))
  return out
}

export interface GlowArc { path: LonLat[]; color: RGBA; width: number }

/** Golden threads always glow. Selected in-progress threads glow a little too, like the prototype. */
export function buildGlows(arcs: ThreadArc[], scope: Scope, theme: MapTheme): GlowArc[] {
  const out: GlowArc[] = []
  for (const a of arcs) {
    const dim = scope.active && !a.related
    if (a.state === 'Completed') out.push({ path: a.path, color: withAlpha(theme.goldenGlow, dim ? 0.08 : a.related ? 0.8 : 0.55), width: a.related ? 18 : 12 })
    else if (a.related && a.state === 'Accepted') out.push({ path: a.path, color: withAlpha(theme.offer, 0.45), width: 12 })
  }
  return out
}

// ---- Labels ----------------------------------------------------------------------------------------
/** "Second Harvest Inland Northwest" → "Second Harvest Inland…" until you're zoomed well in. */
export function shortName(name: string, zoom: number) {
  const n = name.replace(/ \(.*\)$/, '')
  if (zoom >= 11 || n.length <= 22) return n
  const cut = n.slice(0, 21).replace(/\s+\S*$/, '')
  return (cut.length >= 10 ? cut : n.slice(0, 20)) + '…'
}

export interface LabelDatum { position: LonLat; text: string; anchor: 'start' | 'end'; offset: [number, number]; color: RGBA }

type Project = (p: LonLat) => { x: number; y: number }

/** Greedy placement by priority; a label that would overlap a pin or another label waits for zoom. */
export function placeLabels(nodes: MapNode[], zoom: number, project: Project, viewW: number, viewH: number, scope: Scope, theme: MapTheme): LabelDatum[] {
  const FONT = 12, H = FONT + 4
  const boxes: { x1: number; y1: number; x2: number; y2: number }[] = []
  const screen = new Map<MapNode, { x: number; y: number }>()
  for (const n of nodes) {
    const p = project(n.position)
    screen.set(n, p)
    if (scope.active && !n.related) continue   // dimmed pins don't block the names that matter
    boxes.push({ x1: p.x - n.radius, y1: p.y - n.radius, x2: p.x + n.radius, y2: p.y + n.radius })
  }
  const want = nodes.filter(n => n.single && (scope.active ? n.related : zoom >= 8.5 || n.me))
  want.sort((a, b) => (+b.selected - +a.selected) || (+b.related - +a.related) || (+b.me - +a.me) || (b.deg - a.deg))
  const out: LabelDatum[] = []
  for (const n of want) {
    const p = screen.get(n)!
    if (p.x < -50 || p.y < -20 || p.x > viewW + 50 || p.y > viewH + 20) continue
    const text = shortName(n.members[0].name, zoom)
    const w = text.length * FONT * 0.56 + 6, gap = n.radius + 5
    const right = p.x + gap + w <= viewW || p.x - gap - w < 0
    const box = right ? { x1: p.x + gap, y1: p.y - H / 2, x2: p.x + gap + w, y2: p.y + H / 2 } : { x1: p.x - gap - w, y1: p.y - H / 2, x2: p.x - gap, y2: p.y + H / 2 }
    if (!n.selected && boxes.some(b => !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2))) continue
    boxes.push(box)
    out.push({ position: n.position, text, anchor: right ? 'start' : 'end', offset: [right ? gap : -gap, 0], color: n.selected ? theme.ink : withAlpha(theme.ink, 0.88) })
  }
  return out
}
