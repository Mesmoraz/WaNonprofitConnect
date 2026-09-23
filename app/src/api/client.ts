import type {
  BoardQuery, Claim, Invite, Listing, ListingDetail, MapData, MapPoint, Me, Message, NewListing, NewThread,
  OrgSummary, Thread, ThreadAction, ThreadDetail,
} from './types'

export const MOCK = import.meta.env.VITE_MOCK === '1'

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

type Method = 'GET' | 'POST'

export type Transport = (method: Method, path: string, body?: unknown) => Promise<unknown>

const httpTransport: Transport = async (method, path, body) => {
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
    throw new ApiError(res.status, parsed, title)
  }
  return parsed
}

// The mock is loaded only when VITE_MOCK=1; in a normal build this branch is dead code and the mock is not bundled.
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

  // Admin
  adminClaims: () => call<Claim[]>('GET', `${V1}/admin/claims`),
  approveClaim: (id: number) => call<Claim>('POST', `${V1}/admin/claims/${id}/approve`),
  rejectClaim: (id: number) => call<Claim>('POST', `${V1}/admin/claims/${id}/reject`),
  adminInvites: () => call<Invite[]>('GET', `${V1}/admin/invites`),
  createInvite: (ein: string, uses: number) => call<Invite>('POST', `${V1}/admin/invites`, { ein, uses }),
}
