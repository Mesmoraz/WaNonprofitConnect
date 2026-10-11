import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { MOCK, useMe, type Me } from './api'
import { forgetReturn, peekReturn, rememberReturn } from './lib/returnTo'
import { AppShell } from './shell/AppShell'
import { Slow } from './shell/Slow'
import { Admin } from './screens/admin/Admin'
import { Board } from './screens/board/Board'
import { FindYours } from './screens/find/FindYours'
import { Inbox } from './screens/inbox/Inbox'
import { Invite } from './screens/invite/Invite'
import { ListingScreen } from './screens/listing/ListingScreen'
import { OrgScreen } from './screens/org/OrgScreen'
import { YourOrg } from './screens/org/YourOrg'
import { Privacy, Terms } from './screens/legal/Legal'
import { Post } from './screens/post/Post'
import { SignUp } from './screens/signup/SignUp'
import { ThreadScreen } from './screens/thread/ThreadScreen'
import { Waiting } from './screens/waiting/Waiting'

// The map (MapLibre and deck.gl, about 2 MB) loads when you open it, not before the sign-in screen.
const MapScreen = lazy(() => import('./screens/map/MapScreen').then(m => ({ default: m.MapScreen })))
const MapCardPreview = lazy(() => import('./screens/map/MapCardPreview').then(m => ({ default: m.MapCardPreview })))

type Stage = 'signedOut' | 'noOrg' | 'pending' | 'confirmed'
const stageOf = (me: Me | null | undefined): Stage =>
  !me ? 'signedOut' : !me.membership ? 'noOrg' : me.membership.status === 'pending' ? 'pending' : 'confirmed'
const HOME: Record<Stage, string> = { signedOut: '/signup', noOrg: '/invite', pending: '/waiting', confirmed: '/' }

/**
 * /me decides where you are: signed out → sign up, no organization → invite code, pending → waiting, confirmed → the app.
 * A link into the app opened before you're in (a shared post, an organization) is remembered on the way to the front
 * door, and once you're confirmed you land there instead of the board (S-107, src/lib/returnTo.ts).
 */
function Only({ stage }: { stage: Stage }) {
  const { data: me } = useMe()
  const s = stageOf(me)
  const { pathname, search } = useLocation()
  const turnedAway = s !== stage && stage === 'confirmed'
  useEffect(() => { if (turnedAway) rememberReturn(pathname + search) }, [turnedAway, pathname, search])

  if (s !== stage) return <Navigate to={HOME[s]} replace />
  if (stage === 'confirmed' && pathname === '/') {
    const back = peekReturn()
    if (back) return <ReturnTo to={back} />
  }
  return <Outlet />
}

/** Go to the remembered link, once. */
function ReturnTo({ to }: { to: string }) {
  useEffect(() => { forgetReturn() }, [to])
  return <Navigate to={to} replace />
}

/** Anywhere else goes home for your stage. /admin is remembered too: an admin who signs in first lands back there. */
function Elsewhere({ stage }: { stage: Stage }) {
  const { pathname, search } = useLocation()
  const admin = stage !== 'confirmed' && pathname === '/admin'
  useEffect(() => { if (admin) rememberReturn(pathname + search) }, [admin, pathname, search])
  return <Navigate to={HOME[stage]} replace />
}

/** While we find out who you are. */
function Booting() {
  return <div className="boot" aria-busy="true"><Slow /></div>
}

export function App() {
  const { data: me, isPending, isError, refetch } = useMe()

  if (isPending) return <Booting />
  if (isError && me === undefined) {
    return (
      <div className="boot">
        {/* Not in the briefs: needs approval */}
        <p className="empty">That didn’t work. <button className="inline-link" onClick={() => refetch()}>Try again</button></p>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Only stage="signedOut" />}>
        <Route path="/signup" element={<SignUp />} />
      </Route>
      <Route element={<Only stage="noOrg" />}>
        <Route path="/invite" element={<Invite />} />
        <Route path="/find" element={<FindYours />} />
      </Route>
      <Route element={<Only stage="pending" />}>
        <Route path="/waiting" element={<Waiting />} />
      </Route>
      <Route element={<Only stage="confirmed" />}>
        <Route element={<AppShell />}>
          <Route index element={<Board />} />
          <Route path="/map" element={<Suspense fallback={<Booting />}><MapScreen /></Suspense>} />
          <Route path="/post" element={<Post />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/listing/:id" element={<ListingScreen />} />
          <Route path="/thread/:id" element={<ThreadScreen />} />
          <Route path="/org/:ein" element={<OrgScreen />} />
          <Route path="/org" element={<YourOrg />} />
          {(import.meta.env.DEV || MOCK) && <Route path="/dev/map-card" element={<Suspense fallback={null}><MapCardPreview /></Suspense>} />}
        </Route>
      </Route>
      {/* Open to anyone, signed in or not. */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      {me?.account.isAdmin && <Route path="/admin" element={<Admin />} />}
      <Route path="*" element={<Elsewhere stage={stageOf(me)} />} />
    </Routes>
  )
}
