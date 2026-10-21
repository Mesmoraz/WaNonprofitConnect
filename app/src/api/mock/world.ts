// The seed (./data.ts) plus the demo's settings (./settings.ts) make the demo's whole world. Pure: the same settings
// always give the same organizations, posts, threads and messages (times are relative to now). The mock serves it,
// and the map harness draws it.
import type { Invite, Listing, MapData, Message, OrgSummary, SaveMyOrg, ThreadStatus } from '../types'
import {
  HARD_LISTINGS, HARD_THREADS, MAP_LISTINGS, ORG_ROWS, SEED_INVITES, SEED_LISTINGS, SEED_MESSAGES, SEED_PEOPLE, SEED_PROFILES,
  THREAD_POOL, WAITING, YOUR_EXTRA, ZIP, type SeedListing,
} from './data'
import { THREAD_MAX, type DemoSettings } from './settings'

export interface ListingRow extends Omit<Listing, 'org' | 'why'> { ein: string }
export interface ThreadRow { id: number; status: ThreadStatus; needId: number; offerId: number; startedByEin: string; createdAt: string; respondedAt: string | null; completedAt: string | null; readBy: Record<string, string> }
export interface World { orgs: OrgSummary[]; listings: ListingRow[]; threads: ThreadRow[]; messages: Message[]; invites: Invite[]; profiles: Record<string, SaveMyOrg> }

if (THREAD_POOL.length !== THREAD_MAX) console.warn(`THREAD_MAX is ${THREAD_MAX} but the seed has ${THREAD_POOL.length} threads.`)

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString()

// A light copy of the API's MatchScorer: a fit needs the same kind of help AND a word in common
// (stop words dropped, plurals folded), so canned vegetables never "fit" a laptop need.
const STOP = new Set('a an and any are as at be by for from have has in is it need needs needed of on or our some spare surplus extra the to we with looking want wanted offer offering donate donation free please new used good'.split(' '))
const words = (l: { title: string; description: string | null }) => new Set(`${l.title} ${l.description ?? ''}`.toLowerCase().split(/[^a-z0-9]+/)
  .filter(w => w.length >= 3 && !STOP.has(w)).map(w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)))
export const shared = (a: ListingRow, b: ListingRow) => { const wa = words(a); return [...words(b)].filter(w => wa.has(w)).length }
export const fits = (a: ListingRow, b: ListingRow) => a.help === b.help && shared(a, b) > 0

/** A post's status from its thread's, as the API keeps them. */
export const statusFor = (t: ThreadStatus) => t === 'Completed' ? 'Fulfilled' : t === 'Accepted' ? 'Matched' : 'Open'

/** Organizations sharing a ZIP are nudged apart in a small spiral (the prototype's placeOrgs()), so each has its own pin. */
function placeOrgs(): OrgSummary[] {
  const perZip: Record<string, number> = {}
  return ORG_ROWS.map(([ein, name, city, zip, ntee]) => {
    const c = ZIP[zip]
    if (!c) return { ein, name, city, zip5: zip, ntee, lat: null, lon: null, isMember: false }
    const i = (perZip[zip] = (perZip[zip] ?? 0) + 1)
    const a = i * 2.1, r = i === 1 ? 0 : 0.009 + 0.004 * i
    return { ein, name, city, zip5: zip, ntee, lat: c[0] + Math.sin(a) * r * 0.7, lon: c[1] + Math.cos(a) * r, isMember: false }
  })
}

/** How far along a thread is, when the setting isn't "a mix": about 7 in 10 just started (or done), 2 in progress. */
function along(id: number, seeded: ThreadStatus, s: DemoSettings): ThreadStatus {
  if (s.along === 'mix') return seeded
  const b = (id * 7919) % 10
  if (s.along === 'new') return b < 7 ? 'Proposed' : b < 9 ? 'Accepted' : 'Completed'
  return b < 7 ? 'Completed' : b < 9 ? 'Accepted' : 'Proposed'
}

/** `yourName` signs the messages you sent in the seed. */
export function buildWorld(s: DemoSettings, yourName = 'You'): World {
  const you = s.you === 'new' ? null : s.you
  const orgs = placeOrgs()
  const seed = new Map([...SEED_LISTINGS, ...MAP_LISTINGS].map(l => [l.id, l]))
  const listings: ListingRow[] = [], threads: ThreadRow[] = [], messages: Message[] = []
  const used = new Set<number>()

  const add = (l: SeedListing): ListingRow => {
    const row: ListingRow = {
      id: l.id, kind: l.kind, help: l.help, title: l.title, description: l.desc || null, quantity: l.qty, unit: l.unit,
      urgency: l.urgency, cadence: l.cadence, status: 'Open', ein: l.ein, createdAt: hoursAgo(l.hoursAgo), views: (l.id * 7) % 11,
    }
    used.add(l.id); listings.push(row)
    return row
  }
  const say = (threadId: number, senderEin: string, senderName: string, body: string, h: number) =>
    messages.push({ id: messages.length + 1, threadId, senderEin, senderName, body, sentAt: hoursAgo(h) })
  const thread = (id: number, need: ListingRow, offer: ListingRow, by: string, status: ThreadStatus, h: number, done: number | null) => {
    need.status = offer.status = statusFor(status)
    threads.push({
      id, status, needId: need.id, offerId: offer.id, startedByEin: by, createdAt: hoursAgo(h),
      respondedAt: status === 'Proposed' ? null : hoursAgo(h - 1),
      completedAt: status === 'Completed' ? hoursAgo(done ?? h - 24) : null, readBy: {},
    })
  }

  // Threads between organizations, the first `threads` of the pool.
  for (const [id, needId, offerId, by, seeded, h, done] of THREAD_POOL.slice(0, s.threads)) {
    thread(id, add(seed.get(needId)!), add(seed.get(offerId)!), by, along(id, seeded, s), h, done)
  }
  for (const [threadId, ein, name, body, h] of SEED_MESSAGES) if (threads.some(t => t.id === threadId)) say(threadId, ein, name, body, h)

  if (you) {
    // Waiting on you: someone else offers what you need, and writes first.
    let n = 0, k = 0
    for (const w of WAITING) {
      if (n >= s.waiting) break
      k++
      if (w.offerEin === you) continue
      const offerSeed = w.offerSeedId !== undefined && !used.has(w.offerSeedId) ? seed.get(w.offerSeedId)! : { ...w.offer, id: 4100 + k, ein: w.offerEin }
      const offer = add(offerSeed)
      const mine = SEED_LISTINGS.find(l => l.ein === you && l.kind === 'Need' && !used.has(l.id) && l.help === offer.help
        && shared(offer, { ...offer, title: l.title, description: l.desc || null }) > 0)
      const need = add(mine ?? { ...w.need, id: 4000 + k, ein: you })
      const id = 8 + k, h = 5 + n * 6
      thread(id, need, offer, w.offerEin, 'Proposed', h, null)
      say(id, w.offerEin, w.sender, w.body, h)
      n++
    }
  }

  if (s.hard) {
    for (const l of HARD_LISTINGS) add(l)
    if (you) for (const [i, h] of HARD_THREADS.entries()) {
      const them = h.theirEin === you ? h.altEin : h.theirEin
      const theirs = add({ ...h.theirs, id: 4400 + i * 2, ein: them }), yours = add({ ...h.yours, id: 4401 + i * 2, ein: you })
      const [need, offer] = theirs.kind === 'Need' ? [theirs, yours] : [yours, theirs]
      thread(h.id, need, offer, h.startedByYou ? you : them, h.status, h.messages[0][3] + 1, null)
      // Declined and cancelled threads put both posts back on the board, as the API does; a closed post stays closed.
      if (h.status !== 'Accepted') { theirs.status = 'Open'; yours.status = h.yoursClosed ? 'Closed' : 'Open' }
      for (const [fromThem, name, body, at] of h.messages) say(h.id, fromThem ? them : you, fromThem ? name : yourName, body, at)
    }
  }

  // Your open posts: your own seed posts first, then the extras.
  if (you) {
    const own = SEED_LISTINGS.filter(l => l.ein === you && !used.has(l.id)).slice(0, s.yours)
    for (const l of own) add(l)
    for (const [i, x] of YOUR_EXTRA.slice(0, s.yours - own.length).entries()) add({ ...x, id: 4200 + i, ein: you })
  }

  // Everyone else's open posts.
  const others = SEED_LISTINGS.filter(l => l.ein !== you && !used.has(l.id))
  for (const l of s.others === 'all' ? others : s.others === 'few' ? others.slice(0, 6) : []) add(l)

  // Organizations with a thread, or you, count as members.
  const byEin = new Map(orgs.map(o => [o.ein, o]))
  const listingEin = new Map(listings.map(l => [l.id, l.ein]))
  for (const t of threads) for (const lid of [t.needId, t.offerId]) { const o = byEin.get(listingEin.get(lid)!); if (o) o.isMember = true }
  if (you) { const o = byEin.get(you); if (o) o.isMember = true }

  const profiles: Record<string, SaveMyOrg> = { ...SEED_PROFILES }
  if (you) {
    if (s.page) {
      const o = byEin.get(you)
      profiles[you] = {
        about: SEED_PROFILES[you]?.about ?? `We help neighbors in ${o?.city ? o.city.charAt(0) + o.city.slice(1).toLowerCase() : 'our area'} get what they need.`,
        website: SEED_PROFILES[you]?.website ?? 'https://example.org',
        contactAccountId: SEED_PROFILES[you]?.contactAccountId ?? SEED_PEOPLE[you]?.[0]?.[0] ?? null,
      }
    } else delete profiles[you]
  }

  const invites: Invite[] = Object.entries(SEED_INVITES).map(([code, ein]) => ({ code, ein, orgName: byEin.get(ein)?.name ?? ein, uses: 5, used: 0 }))
  return { orgs, listings, threads, messages, invites, profiles }
}

/** The map as GET /map returns it: members, live and done threads, and could-fit pairs among open posts. */
export function mapOf(w: Pick<World, 'orgs' | 'listings' | 'threads'>, couldFit = true): MapData {
  const byId = new Map(w.listings.map(l => [l.id, l]))
  const withPosts = new Set(w.listings.map(l => l.ein))
  const members = w.orgs.filter(o => o.isMember || withPosts.has(o.ein))
  const threads = w.threads.filter(t => t.status !== 'Declined' && t.status !== 'Cancelled').map(t => {
    const need = byId.get(t.needId)!, offer = byId.get(t.offerId)!
    return { id: t.id, status: t.status, help: need.help, fromEin: offer.ein, toEin: need.ein, title: need.title, needId: need.id, offerId: offer.id, offerTitle: offer.title }
  })
  const open = w.listings.filter(l => l.status === 'Open')
  const suggested = !couldFit ? [] : open.filter(n => n.kind === 'Need').flatMap(n => open
    .filter(o => o.kind === 'Offer' && o.ein !== n.ein && fits(n, o))
    .map(o => ({ needId: n.id, offerId: o.id, fromEin: o.ein, toEin: n.ein })))
  const counts = new Map<string, { ein: string; needs: number; offers: number }>()
  for (const l of open) {
    const c = counts.get(l.ein) ?? { ein: l.ein, needs: 0, offers: 0 }
    if (l.kind === 'Need') c.needs++; else c.offers++
    counts.set(l.ein, c)
  }
  return { members, threads, suggested, open: [...counts.values()] }
}
