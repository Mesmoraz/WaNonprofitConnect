import { noteFailedCall } from '../lib/telemetry'
import { ORG_NAMES } from './mock/names'
import { loadSettings, saveSettings, SETTINGS_KEY, type DemoSettings } from './mock/settings'
import type {
  BoardQuery, Claim, FeedbackItem, Filters, Invite, Listing, ListingDetail, ListingEdit, MapData, MapPoint, Me, Message, NewListing, NewThread,
  MyOrg, OrgPage, OrgSummary, SaveMyOrg, Thread, ThreadAction, ThreadDetail, WaitingThread,
} from './types'

const DEMO_KEY = 'helpbook.demo'
const readDemo = () => { try { return localStorage.getItem(DEMO_KEY) === '1' } catch { return false } }
/** The demo: sample organizations, posts and threads that live only in this browser. Started from the name menu. */
export const DEMO = import.meta.env.VITE_MOCK !== '1' && readDemo()
/** True when the app talks to the in-memory fake instead of the API: `npm run dev:mock`, or the demo. */
export const MOCK = import.meta.env.VITE_MOCK === '1' || DEMO

/**
 * Start the demo as `name`, from the beginning each time, with these settings (Admin, Demo). By default the ones it
 * last used. When `settings.you` is 'new' you're signed in with no organization yet, so you walk the invite code (or
 * find yours and approve your own claim in Admin) like a newly invited organization. Otherwise you start confirmed
 * at that sample organization. Both reload.
 */
export function startDemo(name: string, settings: DemoSettings = loadSettings()) {
  const org = settings.you === 'new' ? null : ORG_NAMES[settings.you]
  try {
    localStorage.setItem(DEMO_KEY, '1')
    localStorage.removeItem(DEMO_STATE_KEY)
    saveSettings(settings)
    localStorage.setItem('mock.session', JSON.stringify({
      account: { id: 'acct-demo', email: 'demo@example.org', name, isAdmin: true },
      membership: org ? { ein: settings.you, orgName: org, status: 'confirmed' } : null,
    }))
  } catch { return }
  window.location.assign('/')
}
export function leaveDemo() {
  try { for (const k of [DEMO_KEY, DEMO_STATE_KEY, SETTINGS_KEY, 'mock.session']) localStorage.removeItem(k) } catch { /* private mode */ }
  window.location.assign('/')
}
/** What the demo's organizations have posted and said, kept in this browser until you leave the demo. */
export const DEMO_STATE_KEY = 'mock.state'

/** Any non-2xx answer from the API. `status` is the HTTP status; `body` is the parsed problem, if any. */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isNotFound() { return this.status === 404 }
}

type Method = 'GET' | 'POST' | 'PUT'

export type Transport = (method: Method, path: string, body?: unknown) => Promise<unknown>

export const httpTransport: Transport = async (method, path, body) => {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let parsed: unknown = undefined
  if (text) { try { parsed = JSON.parse(text) } catch { parsed = text } }
  if (!res.ok) {
    const title = typeof parsed === 'object' && parsed && 'title' in parsed ? String((parsed as { title: unknown }).title) : undefined
    noteFailedCall(method, path, res.status, title)
    throw new ApiError(res.status, parsed, title)
  }
  return parsed
}

// The mock is loaded only for `npm run dev:mock` or the demo, as its own chunk, so ordinary visits never download it.
let transportPromise: Promise<Transport> | null = null
function transport(): Promise<Transport> {
  if (!transportPromise) {
    transportPromise = MOCK ? import('./mock').then(m => m.mockTransport) : Promise.resolve(httpTransport)
  }
  return transportPromise
}

async function call<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const t = await transport()
  return (await t(method, path, body)) as T
}

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

const V1 = '/api/v1'

export const api = {
  // Auth
  googleSignIn: (idToken: string) => call<Me>('POST', `${V1}/auth/google`, { idToken }),
  devSignIn: (email: string, name: string) => call<Me>('POST', `${V1}/auth/dev`, { email, name }),
  signOut: () => call<void>('POST', `${V1}/auth/signout`),
  /** The signed-in person, or null when signed out (the API answers 401). */
  me: async (): Promise<Me | null> => {
    try { return await call<Me>('GET', `${V1}/me`) }
    catch (e) { if (e instanceof ApiError && e.isUnauthorized) return null; throw e }
  },

  // Joining an organization
  redeemInvite: (code: string) => call<Me>('POST', `${V1}/invites/redeem`, { code }),
  orgs: (q: string, limit = 20) => call<OrgSummary[]>('GET', `${V1}/orgs${qs({ q, limit })}`),
  claim: (ein: string) => call<Me>('POST', `${V1}/claims`, { ein }),

  // Board and listings
  board: (query: BoardQuery = {}) => call<Listing[]>('GET', `${V1}/board${qs({ help: query.help, kind: query.kind, q: query.q })}`),
  listing: (id: number) => call<ListingDetail>('GET', `${V1}/listings/${id}`),
  createListing: (body: NewListing) => call<Listing>('POST', `${V1}/listings`, body),
  updateListing: (id: number, body: ListingEdit) => call<Listing>('PUT', `${V1}/listings/${id}`, body),
  closeListing: (id: number) => call<void>('POST', `${V1}/listings/${id}/close`),

  // Threads
  threads: () => call<Thread[]>('GET', `${V1}/threads`),
  thread: (id: number) => call<ThreadDetail>('GET', `${V1}/threads/${id}`),
  startThread: (body: NewThread) => call<Thread>('POST', `${V1}/threads`, body),
  sendMessage: (threadId: number, body: string) => call<Message>('POST', `${V1}/threads/${threadId}/messages`, { body }),
  threadAction: (threadId: number, action: ThreadAction) => call<Thread>('POST', `${V1}/threads/${threadId}/${action}`),

  // Map
  map: () => call<MapData>('GET', `${V1}/map`),
  mapPoints: () => call<MapPoint[]>('GET', `${V1}/map/points`),
  filters: () => call<Filters>('GET', `${V1}/filters`),
  saveFilters: (serve: string[]) => call<Filters>('PUT', `${V1}/filters`, { serve }),
  orgPage: (ein: string) => call<OrgPage>('GET', `${V1}/orgs/${encodeURIComponent(ein)}/page`),
  myOrg: () => call<MyOrg>('GET', `${V1}/org`),
  saveMyOrg: (v: SaveMyOrg) => call<MyOrg>('PUT', `${V1}/org`, v),
  makeOrgCode: () => call<Invite>('POST', `${V1}/org/invites`),

  // Admin
  adminWaiting: () => call<WaitingThread[]>('GET', `${V1}/admin/waiting`),
  adminClaims: () => call<Claim[]>('GET', `${V1}/admin/claims`),
  approveClaim: (id: number) => call<Claim>('POST', `${V1}/admin/claims/${id}/approve`),
  rejectClaim: (id: number) => call<Claim>('POST', `${V1}/admin/claims/${id}/reject`),
  adminInvites: () => call<Invite[]>('GET', `${V1}/admin/invites`),
  createInvite: (ein: string, uses: number) => call<Invite>('POST', `${V1}/admin/invites`, { ein, uses }),
  // Feedback always goes to the real server, even in the demo (it's how people report what they saw there).
  adminFeedback: () => httpTransport('GET', `${V1}/admin/feedback`) as Promise<FeedbackItem[]>,
  feedbackDone: (id: number) => httpTransport('POST', `${V1}/admin/feedback/${id}/done`) as Promise<void>,
  actAs: (ein: string) => call<Me>('POST', `${V1}/admin/act-as`, { ein }),
  /** The demo only (the mock answers it): start the demo over with these settings. */
  demoSettings: (s: DemoSettings) => call<Me>('POST', `${V1}/demo/settings`, s),
}
