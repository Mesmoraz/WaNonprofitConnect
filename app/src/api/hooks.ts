import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { BoardQuery, ListingEdit, MapFitsFor, Me, NewListing, NewThread, ThreadAction } from './types'

/** Query keys in one place so the SignalR hook and mutations invalidate the same things. */
export const keys = {
  me: ['me'] as const,
  orgs: (q: string) => ['orgs', q] as const,
  board: (query: BoardQuery = {}) => ['board', query] as const,
  boardAll: ['board'] as const,
  listing: (id: number) => ['listing', id] as const,
  threads: ['threads'] as const,
  thread: (id: number) => ['thread', id] as const,
  map: ['map'] as const,
  mapPoints: ['mapPoints'] as const,
  mapFits: (forWhat: MapFitsFor) => ['map', 'fits', forWhat] as const,
  mapOpen: ['map', 'open'] as const,
  places: ['places'] as const,
  placeOrgs: (id: string) => ['placeOrgs', id] as const,
  orgPage: (ein: string) => ['orgPage', ein] as const,
  myOrg: (ein: string) => ['myOrg', ein] as const,
  adminClaims: ['admin', 'claims'] as const,
  adminNumbers: ['admin', 'numbers'] as const,
  adminWaiting: ['admin', 'waiting'] as const,
  adminInvites: ['admin', 'invites'] as const,
  filters: (ein: string) => ['filters', ein] as const,
  adminFeedback: ['admin', 'feedback'] as const,
}

// ---- Reads ------------------------------------------------------------------

/** The signed-in person. `data` is null when signed out. */
export const useMe = (opts: { refetchInterval?: number; fresh?: boolean } = {}) =>
  useQuery({ queryKey: keys.me, queryFn: api.me, staleTime: 60_000, refetchInterval: opts.refetchInterval, refetchOnMount: opts.fresh ? 'always' : true })

export const useOrgs = (q: string) => {
  const term = q.trim()
  return useQuery({ queryKey: keys.orgs(term), queryFn: () => api.orgs(term), enabled: term.length >= 2, placeholderData: keepPreviousData, staleTime: 5 * 60_000 })
}

export const useBoard = (query: BoardQuery = {}) =>
  useQuery({ queryKey: keys.board(query), queryFn: () => api.board(query), placeholderData: keepPreviousData, staleTime: 30_000 })

export const useListing = (id: number) =>
  useQuery({ queryKey: keys.listing(id), queryFn: () => api.listing(id), enabled: Number.isFinite(id) })

export const useThreads = (enabled = true) => useQuery({ queryKey: keys.threads, queryFn: api.threads, enabled })

/** Opening a thread marks it read on the server, so the inbox and its badge are refetched after each load. */
export function useThread(id: number) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: keys.thread(id),
    queryFn: async () => { const t = await api.thread(id); qc.invalidateQueries({ queryKey: keys.threads }); return t },
    enabled: Number.isFinite(id),
  })
}

export const useMapData = (enabled = true) => useQuery({ queryKey: keys.map, queryFn: api.map, enabled, staleTime: 60_000 })
/** Every open need and offer with its place (S-131): what's open in view. Under the map's key, so it refreshes with it. */
export const useMapOpen = (enabled = true) => useQuery({ queryKey: keys.mapOpen, queryFn: api.mapOpen, enabled, staleTime: 60_000 })
/** The map's toggles (S-130): what fits your needs, or your offers. Off (null) fetches nothing. Under the map's key, so it refreshes with it. */
export const useMapFits = (forWhat: MapFitsFor | null) =>
  useQuery({ queryKey: keys.mapFits(forWhat ?? 'needs'), queryFn: () => api.mapFits(forWhat!), enabled: !!forWhat, staleTime: 60_000 })

/** Your organization's saved filters, per organization (switching organization switches them). */
export const useFilters = (ein: string) => useQuery({ queryKey: keys.filters(ein), queryFn: api.filters, enabled: !!ein, staleTime: 5 * 60_000 })
export function useSaveFilters(ein: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.saveFilters,
    onMutate: serve => { qc.setQueryData(keys.filters(ein), { serve }) },   // the chips answer at once
    onSuccess: saved => { qc.setQueryData(keys.filters(ein), saved) },
    onError: () => { qc.invalidateQueries({ queryKey: keys.filters(ein) }) },
  })
}

export const useOrgPage = (ein: string) => useQuery({ queryKey: keys.orgPage(ein), queryFn: () => api.orgPage(ein), enabled: !!ein })

/** Your organization (S-99): what it says about itself, and the people here. Per organization, like the filters. */
export const useMyOrg = (ein: string) => useQuery({ queryKey: keys.myOrg(ein), queryFn: api.myOrg, enabled: !!ein })
export function useSaveMyOrg(ein: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.saveMyOrg,
    onSuccess: saved => { qc.setQueryData(keys.myOrg(ein), saved); qc.invalidateQueries({ queryKey: keys.orgPage(ein) }) },
  })
}
/** Invite someone (S-95): a one-use code for a colleague. Places left changes, so Your organization reloads. */
export function useMakeOrgCode(ein: string) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.makeOrgCode, onSettled: () => qc.invalidateQueries({ queryKey: keys.myOrg(ein) }) })
}

export const useMapPoints = () => useQuery({ queryKey: keys.mapPoints, queryFn: api.mapPoints, staleTime: 3600_000 })
/** The outlines you can tap (S-144): about 220 KB, so only fetched once something asks (the first tap on a place name). */
export const usePlaces = (enabled: boolean) => useQuery({ queryKey: keys.places, queryFn: api.places, enabled, staleTime: Infinity, gcTime: Infinity })
/** The same outlines, for an event handler: fetched the first time, from the cache after. */
export function useLoadPlaces() {
  const qc = useQueryClient()
  return () => qc.fetchQuery({ queryKey: keys.places, queryFn: api.places, staleTime: Infinity, gcTime: Infinity })
}
/** Everyone inside a place, 50 at a time, joined first. Off (null) fetches nothing. */
export const usePlaceOrgs = (id: string | null) => useInfiniteQuery({
  queryKey: keys.placeOrgs(id ?? ''), enabled: !!id, staleTime: 5 * 60_000,
  queryFn: ({ pageParam }) => api.placeOrgs(id!, pageParam),
  initialPageParam: 0,
  getNextPageParam: (last, pages) => { const seen = pages.reduce((n, p) => n + p.orgs.length, 0); return seen < last.total ? seen : undefined },
})

export const useAdminNumbers = () => useQuery({ queryKey: keys.adminNumbers, queryFn: api.adminNumbers })
export const useAdminWaiting = () => useQuery({ queryKey: keys.adminWaiting, queryFn: api.adminWaiting })
export const useAdminClaims = () => useQuery({ queryKey: keys.adminClaims, queryFn: api.adminClaims })
export const useAdminInvites = () => useQuery({ queryKey: keys.adminInvites, queryFn: api.adminInvites })

// ---- Writes -----------------------------------------------------------------

/** Anything that returns Me replaces the cached Me, so the route guard moves on at once. */
const setMe = (qc: QueryClient) => (me: Me) => { qc.setQueryData(keys.me, me) }

export function useGoogleSignIn() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.googleSignIn, onSuccess: setMe(qc) })
}
export function useDevSignIn() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (v: { email: string; name: string }) => api.devSignIn(v.email, v.name), onSuccess: setMe(qc) })
}
export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.signOut, onSuccess: () => {
    // Set Me first so the route guard sends you to sign up, then drop everything else. (clear() would detach the Me observer.)
    qc.setQueryData(keys.me, null)
    qc.removeQueries({ predicate: q => q.queryKey[0] !== keys.me[0] })
  } })
}
export function useRedeemInvite() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.redeemInvite, onSuccess: setMe(qc) })
}
export function useClaim() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.claim, onSuccess: setMe(qc) })
}

export function useCreateListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: NewListing) => api.createListing(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.boardAll }); qc.invalidateQueries({ queryKey: keys.map }); qc.invalidateQueries({ queryKey: keys.me }); qc.invalidateQueries({ queryKey: ['orgPage'] }) },
  })
}
/** Edit your post (S-97). Its threads change with it, so those are refetched too. */
export function useUpdateListing(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ListingEdit) => api.updateListing(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.boardAll }); qc.invalidateQueries({ queryKey: keys.listing(id) }); qc.invalidateQueries({ queryKey: keys.threads })
      qc.invalidateQueries({ queryKey: keys.map }); qc.invalidateQueries({ queryKey: keys.me }); qc.invalidateQueries({ queryKey: ['orgPage'] })
    },
  })
}
export function useCloseListing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.closeListing,
    onSuccess: (_v, id) => { qc.invalidateQueries({ queryKey: keys.boardAll }); qc.invalidateQueries({ queryKey: keys.listing(id) }); qc.invalidateQueries({ queryKey: keys.map }); qc.invalidateQueries({ queryKey: ['orgPage'] }) },
  })
}
export function useStartThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: NewThread) => api.startThread(body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.threads }); qc.invalidateQueries({ queryKey: keys.boardAll }); qc.invalidateQueries({ queryKey: keys.map }) },
  })
}
export function useSendMessage(threadId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.sendMessage(threadId, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.thread(threadId) }); qc.invalidateQueries({ queryKey: keys.threads }) },
  })
}
export function useThreadAction(threadId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: ThreadAction) => api.threadAction(threadId, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.thread(threadId) }); qc.invalidateQueries({ queryKey: keys.threads })
      qc.invalidateQueries({ queryKey: keys.boardAll }); qc.invalidateQueries({ queryKey: keys.map })
    },
  })
}

export function useApproveClaim() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.approveClaim, onSuccess: () => qc.invalidateQueries({ queryKey: keys.adminClaims }) })
}
export function useRejectClaim() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.rejectClaim, onSuccess: () => qc.invalidateQueries({ queryKey: keys.adminClaims }) })
}
/** Admins only: become any organization at once, to test both sides of a thread. Everything org-specific refetches. */
export function useActAs() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.actAs, onSuccess: (me: Me) => { qc.setQueryData(keys.me, me); qc.invalidateQueries({ predicate: q => q.queryKey !== keys.me }) } })
}
/** From the real server even in the demo, so a 401 here doesn't mean the demo's session ended (main.tsx). */
export const useAdminFeedback = () => useQuery({ queryKey: keys.adminFeedback, queryFn: api.adminFeedback, refetchInterval: 60_000, meta: { realServer: true } })
export function useFeedbackDone() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.feedbackDone, onSuccess: () => qc.invalidateQueries({ queryKey: keys.adminFeedback }) })
}
export function useCreateInvite() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (v: { ein: string; uses: number }) => api.createInvite(v.ein, v.uses), onSuccess: () => qc.invalidateQueries({ queryKey: keys.adminInvites }) })
}
