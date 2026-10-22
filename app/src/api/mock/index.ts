// In-memory fake of the /api/v1 contract, for `npm run dev:mock`. Same routes, same shapes, same errors.
// The signed-in person survives a reload (localStorage); everything else is built from the seed and the demo's settings.
import { ApiError, DEMO, DEMO_STATE_KEY, httpTransport, type Transport } from '../client'
import type {
  Claim, Invite, Listing, ListingDetail, ListingEdit, MapData, MapFit, MapPoint, Me, Message, MyOrg, NewListing, NewThread, OrgPage, OrgSummary, SaveMyOrg,
  Thread, ThreadAction, ThreadDetail, ThreadStatus,
} from '../types'
import { SEED_PEOPLE } from './data'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, settingsFromQuery, settingsToQuery, stripSettingsFromUrl, type DemoSettings } from './settings'
import { buildWorld, fits, mapOf, shared, type ListingRow, type ThreadRow } from './world'

const now = () => new Date().toISOString()

// ---- State ------------------------------------------------------------------

// The world the demo's settings build (./world.ts). Rebuilt in place when an admin changes the settings.
const settings: DemoSettings = { ...DEFAULT_SETTINGS }
const orgs: OrgSummary[] = []
const listings: ListingRow[] = []
const threads: ThreadRow[] = []
const messages: Message[] = []
const invites: Invite[] = []
const claims: Claim[] = []
const filters: Record<string, string[]> = {}
const profiles: Record<string, SaveMyOrg> = {}
/** Codes members made (S-95): each holds one of the organization's 3 places until it's used. */
const memberCodes: string[] = []
const orgByEin = (ein: string) => orgs.find(o => o.ein === ein)

let nextId = 10000
const id = () => ++nextId

function build(s: DemoSettings) {
  Object.assign(settings, s)
  const w = buildWorld(s, session?.account.name)
  orgs.splice(0, orgs.length, ...w.orgs); listings.splice(0, listings.length, ...w.listings)
  threads.splice(0, threads.length, ...w.threads); messages.splice(0, messages.length, ...w.messages)
  invites.splice(0, invites.length, ...w.invites); claims.splice(0); memberCodes.splice(0)
  for (const k of Object.keys(filters)) delete filters[k]
  for (const k of Object.keys(profiles)) delete profiles[k]
  Object.assign(profiles, w.profiles)
  nextId = 10000
}
/** You, as these settings say: confirmed at the sample organization, or with no organization yet ('new'). */
function placeSession(s: DemoSettings) {
  if (!session) return
  const o = s.you === 'new' ? null : orgByEin(s.you)
  session = { ...session, membership: o ? { ein: o.ein, orgName: o.name, status: 'confirmed' } : null }
  saveSession(session)
}

// In the demo, everything done survives a reload until you leave it (dev:mock starts fresh every time).
interface Saved { listings: ListingRow[]; threads: ThreadRow[]; messages: Message[]; invites: Invite[]; claims: Claim[]; filters: Record<string, string[]>; nextId: number; members: string[]; profiles?: Record<string, SaveMyOrg>; memberCodes?: string[] }
function restore() {
  if (!DEMO) return
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY); if (!raw) return
    const s = JSON.parse(raw) as Saved
    listings.splice(0, listings.length, ...s.listings); threads.splice(0, threads.length, ...s.threads)
    messages.splice(0, messages.length, ...s.messages); invites.splice(0, invites.length, ...s.invites)
    claims.splice(0, claims.length, ...s.claims); Object.assign(filters, s.filters); Object.assign(profiles, s.profiles ?? {}); memberCodes.splice(0, memberCodes.length, ...(s.memberCodes ?? [])); nextId = s.nextId
    for (const o of orgs) o.isMember = s.members.includes(o.ein)
  } catch { /* a bad save starts the demo over */ }
}
function persist() {
  if (!DEMO) return
  const s: Saved = { listings, threads, messages, invites, claims, filters, profiles, memberCodes, nextId, members: orgs.filter(o => o.isMember).map(o => o.ein) }
  try { localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(s)) } catch { /* private mode: this visit only */ }
}

const SESSION_KEY = 'mock.session'
function loadSession(): Me | null {
  try { const s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) as Me : null } catch { return null }
}
function saveSession(me: Me | null) {
  try { if (me) localStorage.setItem(SESSION_KEY, JSON.stringify(me)); else localStorage.removeItem(SESSION_KEY) } catch { /* private mode */ }
}
let session: Me | null = loadSession()

// A link with demo settings (?demo=busy&waiting=0) starts that demo over; otherwise the saved settings, and what
// was done in the demo since, come back.
{
  const fromLink = typeof window === 'undefined' ? null : settingsFromQuery(new URLSearchParams(window.location.search))
  if (fromLink) {
    saveSettings(fromLink); stripSettingsFromUrl()
    try { localStorage.removeItem(DEMO_STATE_KEY) } catch { /* private mode */ }
  }
  build(fromLink ?? loadSettings())
  if (fromLink) placeSession(fromLink)
  restore()
}

// ---- Helpers ----------------------------------------------------------------

const fail = (status: number, title: string): never => { throw new ApiError(status, { status, title }, title) }
const requireMe = (): Me => session ?? fail(401, 'Sign in first.')
const URGENT_WINDOW = 30 * 864e5
/** When each of an organization's needs became urgent in the last 30 days, oldest first (as UrgentCap counts them). */
function urgentUses(ein: string, except?: number) {
  const since = Date.now() - URGENT_WINDOW
  return listings.filter(l => l.ein === ein && l.kind === 'Need' && l.id !== except)
    .map(l => l.urgentSince ?? (l.urgency === 'Critical' ? l.createdAt : null))
    .filter((d): d is string => !!d && new Date(d).getTime() > since)
    .sort()
}
/** Me as the API returns it: membership carries urgentLeft (2 Urgent needs per 30 days) and, with none left, urgentAgainOn. */
function meOut(me: Me): Me {
  if (!me.membership) return me
  const used = urgentUses(me.membership.ein)
  const urgentAgainOn = used.length >= 2 ? new Date(new Date(used[used.length - 2]).getTime() + URGENT_WINDOW).toISOString() : null
  return { ...me, membership: { ...me.membership, urgentLeft: Math.max(0, 2 - used.length), urgentAgainOn } }
}
/** Your organization's people (S-99): you, plus the seeded colleagues. */
function peopleAt(ein: string, me: Me | null) {
  const seeded = (SEED_PEOPLE[ein] ?? []).map(([accountId, name, email]) => ({ accountId, name, email, isYou: false }))
  return me ? [{ accountId: me.account.id, name: me.account.name, email: me.account.email, isYou: true }, ...seeded.filter(p => p.accountId !== me.account.id)] : seeded
}
const firstName = (name: string | undefined) => name?.trim().split(/\s+/)[0] || null
/** The same rules as the API: trimmed, a bare host gets https://, only http and https. */
function cleanWebsite(raw: string | null | undefined): string | null {
  let s = (raw ?? '').trim(); if (!s) return null
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`
  try { const u = new URL(s); if ((u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.') && s.length <= 200) return s } catch { /* falls through */ }
  return fail(400, 'Enter a website like yourorganization.org.')
}
/** 3 places, the first person included: the people here and the unused codes members made (S-95). */
const placesLeft = (ein: string, me: Me) =>
  Math.max(0, 3 - peopleAt(ein, me).length - invites.filter(i => i.ein === ein && memberCodes.includes(i.code) && i.used < i.uses).length)
function myOrg(): MyOrg {
  const ein = requireOrg(), me = requireMe(), p = profiles[ein]
  return { org: orgByEin(ein)!, about: p?.about ?? null, website: p?.website ?? null, contactAccountId: p?.contactAccountId ?? null, people: peopleAt(ein, me), placesLeft: placesLeft(ein, me) }
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
    const fitting = listings.filter(x => x.status === 'Open' && x.kind !== l.kind && fits(l, x) && (own ? x.ein !== ein : x.ein === ein))
      .sort((a, b) => shared(l, b) - shared(l, a) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(x => toListing(x))
    const openThreads = own ? threads.filter(t => (t.needId === l.id || t.offerId === l.id) && (t.status === 'Proposed' || t.status === 'Accepted')).length : undefined
    return { ...toListing(l), fits: fitting, openThreads } satisfies ListingDetail
  }],
  ['POST', /^\/listings$/, (_m, b: NewListing) => {
    const ein = requireOrg()
    if (!b.title?.trim()) fail(400, 'Add a title.')
    if (b.kind === 'Need' && b.urgency === 'Critical' && meOut(requireMe()).membership!.urgentLeft === 0) fail(409, 'Urgent is 2 a month. Pick This week instead.')
    const at = now()
    const row: ListingRow = { id: id(), kind: b.kind, help: b.help, title: b.title.trim(), description: b.description ?? null, quantity: b.quantity ?? null, unit: b.unit ?? null, urgency: b.kind === 'Need' ? b.urgency : 'Normal', cadence: b.cadence, status: 'Open', ein, createdAt: at, views: 0, urgentSince: b.kind === 'Need' && b.urgency === 'Critical' ? at : undefined }
    listings.push(row)
    return toListing(row)
  }],
  // Edit your post (S-97), with the API's rules: not a closed or done one, and making a need urgent counts once.
  ['PUT', /^\/listings\/(\d+)$/, (m, b: ListingEdit) => {
    const ein = requireOrg(); const l = listingById(Number(m[1]))
    if (l.ein !== ein) fail(403, 'Only the organization that posted this can change it.')
    if (l.status !== 'Open' && l.status !== 'Matched') fail(409, 'That post isn’t open any more.')
    if (!b.title?.trim()) fail(400, 'Say what it is.')
    const urgency = l.kind === 'Need' ? b.urgency : 'Normal'
    if (urgency === 'Critical' && l.urgency !== 'Critical') {
      const counted = !!l.urgentSince && Date.now() - new Date(l.urgentSince).getTime() < URGENT_WINDOW
      if (!counted) {
        if (urgentUses(ein, l.id).length >= 2) fail(409, 'Urgent is 2 a month. Pick This week instead.')
        l.urgentSince = now()
      }
    }
    Object.assign(l, { help: b.help, title: b.title.trim(), description: b.description ?? null, quantity: b.quantity ?? null, unit: b.unit ?? null, urgency, cadence: b.cadence, editedAt: now() })
    return toListing(l)
  }],
  ['POST', /^\/listings\/(\d+)\/close$/, m => {
    const ein = requireOrg(); const l = listingById(Number(m[1]))
    if (l.ein !== ein) fail(403, 'Not yours.')
    l.status = 'Closed'
    // Its live threads close too, and a post one of them held goes back on the board (S-104, as the API does).
    for (const t of threads.filter(x => (x.needId === l.id || x.offerId === l.id) && (x.status === 'Proposed' || x.status === 'Accepted'))) {
      t.status = 'Cancelled'; t.respondedAt ??= now()
      const theirs = listingById(t.needId === l.id ? t.offerId : t.needId)
      if (theirs.status === 'Matched') theirs.status = 'Open'
    }
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

  ['GET', /^\/map$/, () => { requireOrg(); return mapOf({ orgs, listings, threads }, settings.fits) satisfies MapData }],
  // Every open post with its place (S-131), newest first.
  ['GET', /^\/map\/open$/, () => listings.filter(l => l.status === 'Open').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(l => toListing(l)) satisfies Listing[]],
  // What fits your organization (S-130): their open posts that fit one of yours, each once, not already in a thread with it.
  ['GET', /^\/map\/fits$/, (_m, _b, q) => {
    const ein = requireOrg(), forNeeds = q.get('for') === 'needs'
    const mineKind = forNeeds ? 'Need' : 'Offer'
    const mine = listings.filter(l => l.ein === ein && l.status === 'Open' && l.kind === mineKind)
    const paired = new Set(threads.map(t => `${t.needId}:${t.offerId}`))
    return listings.filter(l => l.ein !== ein && l.status === 'Open' && l.kind !== mineKind).flatMap(t => {
      const m = mine.find(x => fits(x, t) && !paired.has(forNeeds ? `${x.id}:${t.id}` : `${t.id}:${x.id}`))
      return m ? [{ myId: m.id, myTitle: m.title, post: toListing(t) }] : []
    }).slice(0, 12) satisfies MapFit[]
  }],
  // An admin changes the demo's settings (Admin, Demo; or the demo bar's Settings). The demo starts over with them.
  ['POST', /^\/demo\/settings$/, (_m, b: DemoSettings) => {
    requireMe()
    const s = settingsFromQuery(new URLSearchParams(settingsToQuery({ ...DEFAULT_SETTINGS, ...b }))) ?? DEFAULT_SETTINGS
    saveSettings(s); build(s); placeSession(s)
    return meOut(requireMe())
  }],
  // The demo shows the real faint dots (public data) so the whole state looks alive; dev:mock stays offline.
  ['GET', /^\/filters$/, () => ({ serve: filters[requireOrg()] ?? null })],
  ['PUT', /^\/filters$/, (_m, b: { serve?: string[] }) => { const ein = requireOrg(); filters[ein] = b.serve ?? []; return { serve: filters[ein] } }],
  ['GET', /^\/org$/, () => myOrg()],
  ['POST', /^\/org\/invites$/, () => {
    const ein = requireOrg()
    if (placesLeft(ein, requireMe()) <= 0) fail(409, 'All 3 places are taken.')
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let code = ''
    do { code = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('') } while (invites.some(i => i.code === code))
    const invite: Invite = { code, ein, orgName: orgByEin(ein)!.name, uses: 1, used: 0 }
    invites.push(invite); memberCodes.push(code)
    return invite
  }],
  ['PUT', /^\/org$/, (_m, b: Partial<SaveMyOrg>) => {
    const ein = requireOrg()
    const about = (b.about ?? '').trim() || null
    if (about && about.length > 140) fail(400, 'Keep it to one line, 140 characters at most.')
    const website = cleanWebsite(b.website)
    const contact = b.contactAccountId ?? null
    if (contact && !peopleAt(ein, session).some(p => p.accountId === contact)) fail(400, 'Pick someone at your organization.')
    profiles[ein] = { about, website, contactAccountId: contact }
    return myOrg()
  }],
  ['GET', /^\/orgs\/(\d+)\/page$/, m => {
    requireMe()
    const o = orgByEin(m[1]) ?? fail(404, 'Not found.')
    const mine = threads.filter(t => listingById(t.needId).ein === o.ein || listingById(t.offerId).ein === o.ein)
    return {
      org: o,
      listings: listings.filter(l => l.ein === o.ein && l.status === 'Open').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(l => toListing(l)),
      golden: mine.filter(t => t.status === 'Completed').length,
      live: mine.filter(t => t.status === 'Proposed' || t.status === 'Accepted').length,
      about: profiles[o.ein]?.about ?? null,
      website: profiles[o.ein]?.website ?? null,
      askFor: firstName(peopleAt(o.ein, session?.membership?.ein === o.ein ? session : null).find(x => x.accountId === profiles[o.ein]?.contactAccountId)?.name),
    } satisfies OrgPage
  }],
  ['GET', /^\/map\/points$/, () => DEMO ? httpTransport('GET', '/api/v1/map/points') : orgs.filter(o => o.lat !== null).map(o => [o.ein, o.lat!, o.lon!] as MapPoint)],
  ['POST', /^\/admin\/act-as$/, (_m, b: { ein?: string }) => {
    const me = requireMe(); if (!me.account.isAdmin) fail(403, 'Admins only.')
    const o = orgByEin(b.ein ?? '') ?? fail(404, 'Not found.')
    session = { ...me, membership: { ein: o.ein, orgName: o.name, status: 'confirmed' } }; saveSession(session)
    return meOut(session)
  }],

  ['GET', /^\/admin\/waiting$/, () => { if (!requireMe().account.isAdmin) fail(403, 'Admins only.'); return [] }],   // the demo's threads are all moving
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
    if (match) { const out = structuredClone(await handler(match, body ?? {}, url.searchParams)); persist(); return out }
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
