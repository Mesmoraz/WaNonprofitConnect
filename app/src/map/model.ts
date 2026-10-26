import Supercluster, { type ClusterProperties, type PointFeature } from 'supercluster'
import { curve, type Arc, type LonLat } from './geometry'
import { withAlpha, type MapTheme, type RGBA } from './theme'
import type { MapData, MapFits, MapSelection, MapSuggested, MapThread, OrgSummary } from './types'

// Everything here is plain data in, plain data out: no map, no deck. ThreadMap memoizes each step.

export type ArcState = 'suggested' | 'Proposed' | 'Accepted' | 'Completed'

/** Dash [on, off] in CSS px. Every period divides 48, so one shared 48 px wrap is seamless for all. */
export const DASH: Record<ArcState, [number, number]> = {
  suggested: [2, 6], Proposed: [6, 6], Accepted: [10, 6], Completed: [16, 0],   // golden is solid (S-147)
}

const UNDERWAY = new Set(['Proposed', 'Accepted'])
/**
 * The threads the map draws (S-129, Taylor Oct 20: "threads should only be shown as complete"): every golden thread,
 * and your own that are underway, faintly ("yours should appear maybe as faint lines").
 */
export const shownThreads = (threads: MapThread[], me: string | undefined) =>
  threads.filter(t => t.status === 'Completed' || (!!me && UNDERWAY.has(t.status) && (t.fromEin === me || t.toEin === me)))

/** Open needs and offers by organization: each pin's color. */
export type OpenCounts = Map<string, { needs: number; offers: number }>
export const openCounts = (data: MapData): OpenCounts => new Map((data.open ?? []).map(o => [o.ein, { needs: o.needs, offers: o.offers }]))

export const placed = (o: OrgSummary): o is OrgSummary & { lat: number; lon: number } => o.lat != null && o.lon != null

export function degrees(threads: MapThread[]): Map<string, number> {
  const d = new Map<string, number>()
  for (const t of threads) { d.set(t.fromEin, (d.get(t.fromEin) ?? 0) + 1); d.set(t.toEin, (d.get(t.toEin) ?? 0) + 1) }
  return d
}

// ---- Selection scope: what stays bright while something is selected ----------------------------
export interface Scope { active: boolean; orgs: Set<string>; threads: Set<number>; selectedOrg: string | null; pair?: boolean }

export function scopeOf(sel: MapSelection | null | undefined, threads: MapThread[]): Scope {
  const orgs = new Set<string>(), ids = new Set<number>()
  if (sel?.kind === 'org') {
    orgs.add(sel.id)
    for (const t of threads) if (t.fromEin === sel.id || t.toEin === sel.id) { ids.add(t.id); orgs.add(t.fromEin); orgs.add(t.toEin) }
    return { active: true, orgs, threads: ids, selectedOrg: sel.id }
  }
  if (sel?.kind === 'pair') {
    // Two organizations and everything between them (S-127): a line with a number, tapped.
    const [a, b] = sel.id.split('|')
    orgs.add(a); orgs.add(b)
    for (const t of threads) if ((t.fromEin === a && t.toEin === b) || (t.fromEin === b && t.toEin === a)) ids.add(t.id)
    return { active: true, orgs, threads: ids, selectedOrg: null, pair: true }
  }
  if (sel?.kind === 'thread') {
    const t = threads.find(x => x.id === sel.id)
    if (t) { ids.add(t.id); orgs.add(t.fromEin); orgs.add(t.toEin); return { active: true, orgs, threads: ids, selectedOrg: null } }
  }
  return { active: false, orgs, threads: ids, selectedOrg: null }
}

/** While a toggle is on (S-130): you and every organization that fits stay bright and unclustered; everything else dims. */
export function fitScope(fits: MapFits | null | undefined, me: string | undefined): Scope | null {
  if (!fits || !me) return null
  return { active: true, orgs: new Set([me, ...fits.eins]), threads: new Set(), selectedOrg: null }
}

// ---- Clustering ----------------------------------------------------------------------------------
type Leaf = { ein: string }
export type Index = { sc: Supercluster<Leaf, Record<string, never>>; byEin: Map<string, OrgSummary & { lat: number; lon: number }>; solo: (OrgSummary & { lat: number; lon: number })[] }

/** Selected orgs and their thread partners never cluster, like the prototype: you always see both ends. */
const SPREAD_M = 40   // organizations at one spot fan out on a ring this wide (in meters), so each can be told apart and tapped

/**
 * Organizations at the very same point (one building, or two falling back to one ZIP center) would draw as one pin:
 * the label names one and a tap hits the other (Taylor, Sep 24: Treehouse and Seattle Children's PlayGarden).
 * Give each a place on a small ring around the shared point, in a fixed order, so they part as you zoom in.
 */
function spreadStacked<T extends { ein: string; lat: number; lon: number }>(orgs: T[]): T[] {
  const at = new Map<string, T[]>()
  for (const o of orgs) {
    const k = `${o.lat.toFixed(5)},${o.lon.toFixed(5)}`
    at.set(k, [...(at.get(k) ?? []), o])
  }
  const out: T[] = []
  for (const group of at.values()) {
    if (group.length === 1) { out.push(group[0]); continue }
    group.sort((a, b) => a.ein.localeCompare(b.ein))
    const r = SPREAD_M / 2 / 111_320
    group.forEach((o, i) => {
      const a = (2 * Math.PI * i) / group.length
      out.push({ ...o, lat: o.lat + r * Math.sin(a), lon: o.lon + (r * Math.cos(a)) / Math.cos((o.lat * Math.PI) / 180) })
    })
  }
  return out
}

export function buildIndex(members: OrgSummary[], standalone: Set<string>): Index {
  const byEin = new Map<string, OrgSummary & { lat: number; lon: number }>()
  const solo: (OrgSummary & { lat: number; lon: number })[] = []
  const feats: PointFeature<Leaf>[] = []
  for (const o of spreadStacked(members.filter(placed))) {
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
  /** Open needs and offers here (a cluster: everyone inside it). */
  needs: number; offers: number
  // baked visuals
  fill: RGBA; line: RGBA; lineWidth: number; heat: RGBA; heatRadius: number
  /** The count on a cluster: how many organizations it holds, light on its grey. */
  countColor: RGBA
}

export const MOST_OPEN = 6                    // past 6 open posts a pin stops growing

/** A pin grows a little with what it has open; a cluster with how many it holds. Nothing open: a small pin. */
export function pinRadius(single: boolean, open: number, count: number) {
  if (!single) return Math.min(18, 9 + 3 * Math.sqrt(count))
  return open === 0 ? 5 : 6 + (Math.min(open, MOST_OPEN) - 1)
}

/** deg: golden threads per organization (their warmth). */
export function buildNodes(index: Index, zoom: number, deg: Map<string, number>, open: OpenCounts, scope: Scope, me: string | undefined, theme: MapTheme) {
  const nodes: MapNode[] = [], nodeOf = new Map<string, MapNode>()
  const make = (id: string, position: LonLat, members: OrgSummary[], clusterId: number | null) => {
    const single = members.length === 1
    const d = members.reduce((a, o) => a + (deg.get(o.ein) ?? 0), 0)
    const related = scope.active && members.some(o => scope.orgs.has(o.ein))
    const selected = single && scope.selectedOrg === members[0].ein
    const isMe = !!me && members.some(o => o.ein === me)
    const dim = scope.active && !related
    let needs = 0, offers = 0
    for (const o of members) { const c = open.get(o.ein); if (c) { needs += c.needs; offers += c.offers } }
    const total = needs + offers
    const radius = pinRadius(single, total, members.length)
    const a = dim ? 0.35 : 1
    // One meaning per symbol (S-147): an organization is amber when it has needs, green when it only has offers, and a
    // small white pin with a grey edge when nothing is open. Several close together are one grey bubble with a count.
    const color = !single ? theme.ink3 : needs ? theme.need : offers ? theme.offer : theme.paper
    const n: MapNode = {
      id, position, members, clusterId, single, deg: d, radius, related, selected, me: isMe, needs, offers,
      fill: withAlpha(color, a * (single ? 1 : 0.92)),
      line: selected || isMe ? withAlpha(theme.ink, a) : single && !total ? withAlpha(theme.ink3, a) : withAlpha(theme.paper, dim ? 0.5 : 1),
      lineWidth: selected ? 3 : isMe ? 2.5 : single && !total ? 2 : 1.5,
      // Golden warmth only around the places you tapped, so the map stays calm until you ask.
      heat: withAlpha(theme.goldenGlow, related && d > 0 ? 0.5 : 0),
      heatRadius: radius + Math.min(24, 10 + 4 * Math.sqrt(d)),
      countColor: [255, 255, 255, dim ? 110 : 255] as RGBA,
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
/**
 * One line per pair of places (S-127, Taylor Oct 19: "instead of adding MORE lines, make the lines look different").
 * Every thread and suggestion between the same two pins is one curve: the color of the furthest along, a little
 * thicker with each one. Still, with no number on it (S-147): it lights up when you tap one of its ends.
 */
export interface ThreadArc extends Arc {
  key: string
  id: number | null          // a lone thread's id; null for a lone suggestion or a line that carries several
  state: ArcState
  fromEin: string; toEin: string; title: string
  related: boolean
  color: RGBA; width: number; dash: [number, number]
  /** How many threads and suggestions the line carries, and how many of those are golden. */
  count: number; golden: number
  /** Both ends' organizations when each end is a single pin; null when either end is a cluster. */
  pair: [string, string] | null
  /** Otherwise the end that is a cluster: tapping the line opens it, as tapping the cluster would. */
  cluster: { position: LonLat; clusterId: number } | null
  /** A toggle's line (S-130): the organization at the far end from you. */
  fit?: string
}

// Started and in progress are only ever your own now (S-129), and drawn faint.
const BASE_W: Record<ArcState, number> = { suggested: 1.5, Proposed: 1.5, Accepted: 1.75, Completed: 2 }
const BASE_A: Record<ArcState, number> = { suggested: 0.5, Proposed: 0.4, Accepted: 0.5, Completed: 0.85 }
const RANK: Record<ArcState, number> = { suggested: 0, Proposed: 1, Accepted: 2, Completed: 3 }
export const FULLEST = 5                     // past 5 a line stops getting thicker
const PER_MORE_W = 0.6                       // px added for each thread after the first

export function stateColor(state: ArcState, theme: MapTheme): RGBA {
  return state === 'Completed' ? theme.golden : state === 'suggested' ? theme.ink3 : theme.ink2
}

type Item = { key: string; id: number | null; state: ArcState; fromEin: string; toEin: string; title: string; related: boolean; from: MapNode; to: MapNode }

export function buildArcs(suggested: MapSuggested[], threads: MapThread[], nodeOf: Map<string, MapNode>, scope: Scope, theme: MapTheme): ThreadArc[] {
  const groups = new Map<string, Item[]>()
  const add = (key: string, id: number | null, state: ArcState, fromEin: string, toEin: string, title: string, related: boolean) => {
    const from = nodeOf.get(fromEin), to = nodeOf.get(toEin)
    if (!from || !to || from === to) return           // both ends in one cluster: nothing to draw yet
    const pair = from.id < to.id ? `${from.id}|${to.id}` : `${to.id}|${from.id}`
    const list = groups.get(pair) ?? []
    list.push({ key, id, state, fromEin, toEin, title, related, from, to })
    groups.set(pair, list)
  }
  for (const s of suggested) {
    const rel = scope.active && (scope.orgs.has(s.fromEin) && scope.orgs.has(s.toEin)) && (!!scope.pair || scope.selectedOrg === s.fromEin || scope.selectedOrg === s.toEin)
    add(`s:${s.needId}:${s.offerId}`, null, 'suggested', s.fromEin, s.toEin, '', rel)
  }
  for (const t of threads) add(`t:${t.id}`, t.id, t.status as ArcState, t.fromEin, t.toEin, t.title, scope.threads.has(t.id))

  const out: ThreadArc[] = []
  for (const [pairKey, items] of groups) {
    // The line runs the way its furthest-along thread gives, and takes that thread's look.
    const lead = items.reduce((a, b) => (RANK[b.state] > RANK[a.state] ? b : a))
    const state = lead.state
    const related = items.some(i => i.related)
    const count = items.length
    const fuller = Math.min(count, FULLEST) - 1
    const dim = scope.active && !related
    const alpha = dim ? (state === 'Completed' ? 0.12 : state === 'suggested' ? 0.06 : 0.18) : scope.active ? (state === 'Completed' ? 1 : 0.75) : BASE_A[state]
    out.push({
      ...curve(lead.from.position, lead.to.position, 0.16),
      key: count === 1 ? lead.key : `p:${pairKey}`,
      id: count === 1 ? lead.id : null,
      state, fromEin: lead.fromEin, toEin: lead.toEin, title: lead.title, related,
      color: withAlpha(stateColor(state, theme), alpha),
      width: BASE_W[state] + (state === 'Completed' ? PER_MORE_W * fuller : 0) + (scope.active && related ? 1.25 : 0),
      dash: DASH[state],
      count, golden: items.filter(i => i.state === 'Completed').length,
      pair: lead.from.single && lead.to.single ? [lead.from.members[0].ein, lead.to.members[0].ein] : null,
      cluster: [lead.to, lead.from].filter(n => !n.single && n.clusterId != null).map(n => ({ position: n.position, clusterId: n.clusterId! }))[0] ?? null,
    })
  }
  out.sort((x, y) => (+x.related - +y.related) || (RANK[x.state] - RANK[y.state]))
  return out
}

const FIT_DASH: [number, number] = [6, 6]

/** A toggle's lines (S-130): from your pin to each organization that fits, the way the help would go. */
export function buildFitArcs(fits: MapFits | null | undefined, me: string | undefined, nodeOf: Map<string, MapNode>, theme: MapTheme): ThreadArc[] {
  const mine = me ? nodeOf.get(me) : undefined
  if (!fits || !mine) return []
  const color = fits.kind === 'offers' ? theme.offer : theme.need
  const out: ThreadArc[] = []
  for (const ein of new Set(fits.eins)) {
    const them = nodeOf.get(ein)
    if (!them || them === mine) continue
    const [from, to] = fits.kind === 'offers' ? [them, mine] : [mine, them]   // an offer comes to you; your help goes to their need
    out.push({
      ...curve(from.position, to.position, 0.16),
      key: `f:${ein}`, id: null, state: 'suggested', fromEin: from.members[0].ein, toEin: to.members[0].ein, title: '', related: true,
      color: withAlpha(color, 0.95), width: 2.5, dash: FIT_DASH, count: 1, golden: 0, pair: null, cluster: null, fit: ein,
    })
  }
  return out
}

export interface GlowArc { path: LonLat[]; color: RGBA; width: number }

/** A golden thread glows only when you've tapped one of its ends (S-147): the rest of the map stays still and plain. */
export function buildGlows(arcs: ThreadArc[], theme: MapTheme): GlowArc[] {
  const out: GlowArc[] = []
  for (const a of arcs) {
    const more = Math.max(0, Math.min(a.golden, FULLEST) - 1)
    if (a.state === 'Completed' && a.related) out.push({ path: a.path, color: withAlpha(theme.goldenGlow, Math.min(0.95, 0.8 + 0.05 * more)), width: 16 + 2 * more })
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
