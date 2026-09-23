// In-memory fake of the /api/v1 contract, for `npm run dev:mock`. Same routes, same shapes, same errors.
// The signed-in person survives a reload (localStorage); everything else resets to the seed.
import { ApiError, DEMO, httpTransport, type Transport } from '../client'
import type {
  Claim, Invite, Listing, ListingDetail, MapData, MapPoint, Me, Message, NewListing, NewThread, OrgSummary,
  Thread, ThreadAction, ThreadDetail, ThreadStatus,
} from '../types'
import { ORG_ROWS, SEED_INVITES, SEED_LISTINGS, SEED_MESSAGES, SEED_THREADS, ZIP } from './data'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString()
const now = () => new Date().toISOString()

// ---- State ------------------------------------------------------------------

interface ListingRow extends Omit<Listing, 'org' | 'why'> { ein: string }
interface ThreadRow { id: number; status: ThreadStatus; needId: number; offerId: number; startedByEin: string; createdAt: string; respondedAt: string | null; completedAt: string | null; readBy: Record<string, string> }

const orgs: OrgSummary[] = ORG_ROWS.map(([ein, name, city, zip, ntee]) => {
  const c = ZIP[zip]
  return { ein, name, city, zip5: zip, ntee, lat: c ? c[0] : null, lon: c ? c[1] : null, isMember: false }
})
const orgByEin = (ein: string) => orgs.find(o => o.ein === ein)

const listings: ListingRow[] = SEED_LISTINGS.map(s => ({
  id: s.id, kind: s.kind, help: s.help, title: s.title, description: s.desc || null, quantity: s.qty, unit: s.unit,
  urgency: s.urgency, cadence: s.cadence, status: 'Open', ein: s.ein, createdAt: hoursAgo(s.hoursAgo), views: (s.id * 7) % 11,
}))

const threads: ThreadRow[] = SEED_THREADS.map(([id, needId, offerId, by, status, h, done]) => {
  const st = status === 'Completed' ? 'Fulfilled' : status === 'Accepted' ? 'Matched' : 'Open'
  for (const lid of [needId, offerId]) { const l = listings.find(x => x.id === lid); if (l) l.status = st }
  return { id, status, needId, offerId, startedByEin: by, createdAt: hoursAgo(h), respondedAt: status === 'Proposed' ? null : hoursAgo(h - 1), completedAt: done === null ? null : hoursAgo(done), readBy: {} }
})

const messages: Message[] = SEED_MESSAGES.map(([threadId, senderEin, senderName, body, h], i) => ({ id: i + 1, threadId, senderEin, senderName, body, sentAt: hoursAgo(h) }))

// Organizations with a thread or a confirmed person count as members.
for (const t of threads) for (const lid of [t.needId, t.offerId]) { const l = listings.find(x => x.id === lid); const o = l && orgByEin(l.ein); if (o) o.isMember = true }

const invites: Invite[] = Object.entries(SEED_INVITES).map(([code, ein]) => ({ code, ein, orgName: orgByEin(ein)?.name ?? ein, uses: 5, used: 0 }))
const claims: Claim[] = []

let nextId = 1000
const id = () => ++nextId

const SESSION_KEY = 'mock.session'
function loadSession(): Me | null {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) as Me : null } catch { return null }
}
function saveSession(me: Me | null) {
  try { if (me) localStorage.setItem(SESSION_KEY, JSON.stringify(me)); else localStorage.removeItem(SESSION_KEY) } catch { /* private mode */ }
}
let session: Me | null = loadSession()

// ---- Helpers ----------------------------------------------------------------

const fail = (status: number, title: string): never => { throw new ApiError(status, { status, title }, title) }
const requireMe = (): Me => session ?? fail(401, 'Sign in first.')
/** Me as the API returns it: membership carries urgentLeft (2 Urgent needs per 30 days). */
function meOut(me: Me): Me {
  if (!me.membership) return me
  const since = Date.now() - 30 * 864e5
  const used = listings.filter(l => l.ein === me.membership!.ein && l.kind === 'Need' && l.urgency === 'Critical' && new Date(l.createdAt).getTime() > since).length
  return { ...me, membership: { ...me.membership, urgentLeft: Math.max(0, 2 - used) } }
}
const requireOrg = (): string => {
  const me = requireMe()
  if (!me.membership || me.membership.status !== 'confirmed') fail(403, 'Your organization is not confirmed yet.')
  return me.membership!.ein
}

function toListing(l: ListingRow, why = ''): Listing {
  const { ein, ...rest } = l
  return { ...rest, org: orgByEin(ein)!, why }
}
const listingById = (lid: number) => listings.find(l => l.id === lid) ?? fail(404, 'Not found.')

function toThread(t: ThreadRow, viewerEin: string): Thread {
  const msgs = messages.filter(m => m.threadId === t.id)
  const last = msgs.length ? msgs[msgs.length - 1].sentAt : null
  const seen = t.readBy[viewerEin]
  const unread = msgs.filter(m => m.senderEin !== viewerEin && (!seen || m.sentAt > seen)).length
  return {
    id: t.id, status: t.status, need: toListing(listingById(t.needId)), offer: toListing(listingById(t.offerId)),
    startedByEin: t.startedByEin, createdAt: t.createdAt, respondedAt: t.respondedAt, completedAt: t.completedAt,
    lastMessageAt: last, unread,
  }
}
const threadEins = (t: ThreadRow) => [listingById(t.needId).ein, listingById(t.offerId).ein]

/** Fair ranking as in ALPHA.md: urgent first, then least seen, at most 2 per org in the top 6. */
function rank(open: ListingRow[]): Listing[] {
  const band = (l: ListingRow) => l.kind === 'Need' ? ['Low', 'Normal', 'High', 'Critical'].indexOf(l.urgency) : 1
  const sorted = open.slice().sort((a, b) => band(b) - band(a) || a.views - b.views || b.createdAt.localeCompare(a.createdAt))
  const out: ListingRow[] = [], deferred: ListingRow[] = [], perOrg: Record<string, number> = {}
  for (const l of sorted) {
    const c = perOrg[l.ein] ?? 0
    if (out.length < 6 && c >= 2) { deferred.push(l); continue }
    perOrg[l.ein] = c + 1
    out.push(l)
  }
  const all = out.concat(deferred)
  const leastSeen = open.slice().sort((a, b) => a.views - b.views || a.createdAt.localeCompare(b.createdAt))[0]
  return all.map(l => toListing(l,
    l.kind === 'Need' && l.urgency === 'Critical' ? 'Urgent' : l === leastSeen ? 'Seen least' : ''))
}

const delay = () => new Promise(r => setTimeout(r, 120 + Math.random() * 180))

// ---- Routes -----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (m: RegExpMatchArray, body: any, query: URLSearchParams) => unknown
const routes: [string, RegExp, Handler][] = [
  ['POST', /^\/auth\/google$/, () => fail(400, 'Google sign-in is not available in mock mode.')],
  ['POST', /^\/auth\/dev$/, (_m, b: { email?: string; name?: string }) => {
    const email = (b.email ?? '').trim()
    if (!email.includes('@')) fail(400, 'Enter an email.')
    const name = (b.name ?? '').trim() || email.split('@')[0]
    session = { account: { id: `acct-${email.toLowerCase()}`, email, name, isAdmin: email.toLowerCase().startsWith('taylor') }, membership: null }
    saveSession(session)
    return meOut(session)
  }],
  ['POST', /^\/auth\/signout$/, () => { session = null; saveSession(null); return undefined }],
  ['GET', /^\/me$/, () => meOut(requireMe())],

  ['POST', /^\/invites\/redeem$/, (_m, b: { code?: string }) => {
    const me = requireMe()
    const inv = invites.find(i => i.code.toLowerCase() === (b.code ?? '').trim().toLowerCase())
    if (!inv || inv.used >= inv.uses) return fail(404, 'That code didn’t work.')
    inv.used++
    const o = orgByEin(inv.ein)!
    o.isMember = true
    session = { ...me, membership: { ein: o.ein, orgName: o.name, status: 'confirmed' } }
    saveSession(session)
    return meOut(session)
  }],
  ['GET', /^\/orgs$/, (_m, _b, q) => {
    const term = (q.get('q') ?? '').trim().toLowerCase(); const limit = Number(q.get('limit') ?? 20)
    const digits = term.replace(/\D/g, '')
    if (term.length < 2) return []
    return orgs.filter(o => o.name.toLowerCase().includes(term) || (digits.length >= 2 && o.ein.includes(digits))).slice(0, limit)
  }],
  ['POST', /^\/claims$/, (_m, b: { ein?: string }) => {
    const me = requireMe()
    const o = orgByEin(b.ein ?? '') ?? fail(404, 'Not found.')
    claims.push({ id: id(), ein: o.ein, orgName: o.name, city: o.city, accountId: me.account.id, email: me.account.email, name: me.account.name, status: 'pending', createdAt: now(), decidedAt: null })
    session = { ...me, membership: { ein: o.ein, orgName: o.name, status: 'pending' } }
    saveSession(session)
    return meOut(session)
  }],

  ['GET', /^\/board$/, (_m, _b, q) => {
    requireOrg()
    const help = q.get('help'), kind = q.get('kind'), term = (q.get('q') ?? '').trim().toLowerCase()
    const open = listings.filter(l => l.status === 'Open' && (!help || l.help === help) && (!kind || l.kind === kind)
      && (!term || l.title.toLowerCase().includes(term) || (l.description ?? '').toLowerCase().includes(term) || orgByEin(l.ein)!.name.toLowerCase().includes(term)))
    const ranked = rank(open)
    for (const l of ranked.slice(0, 12)) listingById(l.id).views++
    return ranked
  }],
  ['GET', /^\/listings\/(\d+)$/, m => {
    const ein = requireOrg()
    const l = listingById(Number(m[1]))
    // Someone else's post: your open posts of the other kind with the same kind of help.
    // Your own post: other organizations' posts that could fit it (the B6 "Could fit" list).
    const own = l.ein === ein
    const fits = listings.filter(x => x.status === 'Open' && x.kind !== l.kind && x.help === l.help && (own ? x.ein !== ein : x.ein === ein))
      .sort((a, b) => Number(b.unit === l.unit) - Number(a.unit === l.unit) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(x => toListing(x))
    return { ...toListing(l), fits } satisfies ListingDetail
  }],
  ['POST', /^\/listings$/, (_m, b: NewListing) => {
    const ein = requireOrg()
    if (!b.title?.trim()) fail(400, 'Add a title.')
    if (b.kind === 'Need' && b.urgency === 'Critical' && meOut(requireMe()).membership!.urgentLeft === 0) fail(409, 'No Urgent needs left this month.')
    const row: ListingRow = { id: id(), kind: b.kind, help: b.help, title: b.title.trim(), description: b.description ?? null, quantity: b.quantity ?? null, unit: b.unit ?? null, urgency: b.urgency, cadence: b.cadence, status: 'Open', ein, createdAt: now(), views: 0 }
    listings.push(row)
    return toListing(row)
  }],
  ['POST', /^\/listings\/(\d+)\/close$/, m => {
    const ein = requireOrg(); const l = listingById(Number(m[1]))
    if (l.ein !== ein) fail(403, 'Not yours.')
    l.status = 'Closed'
    return undefined
  }],

  ['GET', /^\/threads$/, () => {
    const ein = requireOrg()
    return threads.filter(t => threadEins(t).includes(ein)).map(t => toThread(t, ein))
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt))
  }],
  ['GET', /^\/threads\/(\d+)$/, m => {
    const ein = requireOrg()
    const t = threads.find(x => x.id === Number(m[1])) ?? fail(404, 'Not found.')
    if (!threadEins(t).includes(ein)) fail(403, 'Not yours.')
    t.readBy[ein] = now()
    return { ...toThread(t, ein), messages: messages.filter(x => x.threadId === t.id) } satisfies ThreadDetail
  }],
  ['POST', /^\/threads$/, (_m, b: NewThread) => {
    const ein = requireOrg(); const me = requireMe()
    const theirs = listingById(b.listingId)
    let mine: ListingRow
    if (b.myListingId) mine = listingById(b.myListingId)
    else {
      mine = { id: id(), kind: theirs.kind === 'Need' ? 'Offer' : 'Need', help: theirs.help, title: theirs.title, description: null, quantity: theirs.quantity, unit: theirs.unit, urgency: 'Normal', cadence: theirs.cadence, status: 'Open', ein, createdAt: now(), views: 0 }
      listings.push(mine)
    }
    const [need, offer] = theirs.kind === 'Need' ? [theirs, mine] : [mine, theirs]
    const t: ThreadRow = { id: id(), status: 'Proposed', needId: need.id, offerId: offer.id, startedByEin: ein, createdAt: now(), respondedAt: null, completedAt: null, readBy: { [ein]: now() } }
    threads.push(t)
    if (b.message?.trim()) messages.push({ id: id(), threadId: t.id, senderEin: ein, senderName: me.account.name, body: b.message.trim(), sentAt: now() })
    return toThread(t, ein)
  }],
  ['POST', /^\/threads\/(\d+)\/messages$/, (m, b: { body?: string }) => {
    const ein = requireOrg(); const me = requireMe()
    const t = threads.find(x => x.id === Number(m[1])) ?? fail(404, 'Not found.')
    if (!threadEins(t).includes(ein)) fail(403, 'Not yours.')
    if (!b.body?.trim()) fail(400, 'Write a message.')
    const msg: Message = { id: id(), threadId: t.id, senderEin: ein, senderName: me.account.name, body: (b.body ?? '').trim(), sentAt: now() }
    messages.push(msg); t.readBy[ein] = msg.sentAt
    return msg
  }],
  ['POST', /^\/threads\/(\d+)\/(accept|decline|complete|cancel)$/, m => {
    const ein = requireOrg()
    const t = threads.find(x => x.id === Number(m[1])) ?? fail(404, 'Not found.')
    if (!threadEins(t).includes(ein)) fail(403, 'Not yours.')
    const action = m[2] as ThreadAction
    const next: Record<ThreadAction, ThreadStatus> = { accept: 'Accepted', decline: 'Declined', complete: 'Completed', cancel: 'Cancelled' }
    t.status = next[action]
    if (action === 'accept' || action === 'decline') t.respondedAt = now()
    if (action === 'complete') t.completedAt = now()
    const st = t.status === 'Completed' ? 'Fulfilled' : t.status === 'Accepted' ? 'Matched' : 'Open'
    listingById(t.needId).status = st; listingById(t.offerId).status = st
    return toThread(t, ein)
  }],

  ['GET', /^\/map$/, () => {
    requireOrg()
    const memberEins = new Set(listings.map(l => l.ein))
    const members = orgs.filter(o => o.isMember || memberEins.has(o.ein))
    const mapThreads = threads.filter(t => t.status !== 'Declined' && t.status !== 'Cancelled').map(t => {
      const need = listingById(t.needId), offer = listingById(t.offerId)
      return { id: t.id, status: t.status, help: need.help, fromEin: offer.ein, toEin: need.ein, title: need.title }
    })
    const open = listings.filter(l => l.status === 'Open')
    const suggested = open.filter(n => n.kind === 'Need').flatMap(n => open
      .filter(o => o.kind === 'Offer' && o.help === n.help && o.ein !== n.ein && o.unit === n.unit)
      .map(o => ({ needId: n.id, offerId: o.id, fromEin: o.ein, toEin: n.ein })))
    return { members, threads: mapThreads, suggested } satisfies MapData
  }],
  // The demo shows the real faint dots (public data) so the whole state looks alive; dev:mock stays offline.
  ['GET', /^\/map\/points$/, () => DEMO ? httpTransport('GET', '/api/v1/map/points') : orgs.filter(o => o.lat !== null).map(o => [o.ein, o.lat!, o.lon!] as MapPoint)],
  ['POST', /^\/admin\/act-as$/, (_m, b: { ein?: string }) => {
    const me = requireMe(); if (!me.account.isAdmin) fail(403, 'Admins only.')
    const o = orgByEin(b.ein ?? '') ?? fail(404, 'Not found.')
    session = { ...me, membership: { ein: o.ein, orgName: o.name, status: 'confirmed' } }; saveSession(session)
    return meOut(session)
  }],

  ['GET', /^\/admin\/claims$/, () => { if (!requireMe().account.isAdmin) fail(403, 'Admins only.'); return claims.map(({ accountId: _a, ...c }) => c) }],
  ['POST', /^\/admin\/claims\/(\d+)\/(approve|reject)$/, m => {
    if (!requireMe().account.isAdmin) fail(403, 'Admins only.')
    const i = claims.findIndex(c => c.id === Number(m[1])); if (i < 0) fail(404, 'Not found.')
    const [c] = claims.splice(i, 1)
    // The mock has one person at a time; approving your own claim confirms you.
    if (m[2] === 'approve' && session?.account.id === c.accountId) { session = { ...session, membership: { ein: c.ein, orgName: c.orgName, status: 'confirmed' } }; saveSession(session) }
    return undefined
  }],
  ['GET', /^\/admin\/invites$/, () => { if (!requireMe().account.isAdmin) fail(403, 'Admins only.'); return invites }],
  ['POST', /^\/admin\/invites$/, (_m, b: { ein?: string; uses?: number }) => {
    if (!requireMe().account.isAdmin) fail(403, 'Admins only.')
    const o = orgByEin(b.ein ?? '') ?? fail(404, 'Not found.')
    const inv: Invite = { code: Math.random().toString(36).slice(2, 8).toUpperCase(), ein: o.ein, orgName: o.name, uses: b.uses ?? 1, used: 0 }
    invites.push(inv)
    return inv
  }],
]

export const mockTransport: Transport = async (method, path, body) => {
  await delay()
  const url = new URL(path, 'http://mock')
  const sub = url.pathname.replace(/^\/api\/v1/, '')
  for (const [m, re, handler] of routes) {
    if (m !== method) continue
    const match = sub.match(re)
    if (match) return structuredClone(await handler(match, body ?? {}, url.searchParams))
  }
  return fail(404, `No mock route for ${method} ${url.pathname}`)
}

// Handy while poking at the mock from the console: window.__mock.approve() confirms a pending claim,
// which moves the waiting screen on (it checks every 30 seconds, or on reload).
if (typeof window !== 'undefined') {
  (window as unknown as { __mock: unknown }).__mock = {
    approve: () => {
      claims.splice(0)
      if (session?.membership?.status === 'pending') { session = { ...session, membership: { ...session.membership, status: 'confirmed' } }; saveSession(session) }
      return session
    },
  }
}
