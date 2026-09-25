import { useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { MOCK, useMe, type Me } from './api'
import { AppShell } from './shell/AppShell'
import { Admin } from './screens/admin/Admin'
import { Board } from './screens/board/Board'
import { FindYours } from './screens/find/FindYours'
import { Inbox } from './screens/inbox/Inbox'
import { Invite } from './screens/invite/Invite'
import { ListingScreen } from './screens/listing/ListingScreen'
import { MapScreen } from './screens/map/MapScreen'
import { OrgScreen } from './screens/org/OrgScreen'
import { Privacy, Terms } from './screens/legal/Legal'
import { MapCardPreview } from './screens/map/MapCardPreview'
import { Post } from './screens/post/Post'
import { SignUp } from './screens/signup/SignUp'
import { ThreadScreen } from './screens/thread/ThreadScreen'
import { Waiting } from './screens/waiting/Waiting'

type Stage = 'signedOut' | 'noOrg' | 'pending' | 'confirmed'
const stageOf = (me: Me | null | undefined): Stage =>
  !me ? 'signedOut' : !me.membership ? 'noOrg' : me.membership.status === 'pending' ? 'pending' : 'confirmed'
const HOME: Record<Stage, string> = { signedOut: '/signup', noOrg: '/invite', pending: '/waiting', confirmed: '/' }

/** /me decides where you are: signed out → sign up, no organization → invite code, pending → waiting, confirmed → the app. */
function Only({ stage }: { stage: Stage }) {
  const { data: me } = useMe()
  const s = stageOf(me)
  return s === stage ? <Outlet /> : <Navigate to={HOME[s]} replace />
}

/**
 * While we find out who you are. Usually a blink; after a quiet hour the database wakes first and it can take a
 * minute, which looked like a blank, broken page (Taylor, Sep 24). After 2 seconds, say so.
 */
function Booting() {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSlow(true), 2000); return () => clearTimeout(t) }, [])
  return (
    <div className="boot" aria-busy="true">
      {slow && <p className="empty" role="status">Waking up. The first visit in a while can take a minute.</p>}
    </div>
  )
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
          <Route path="/map" element={<MapScreen />} />
          <Route path="/post" element={<Post />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/listing/:id" element={<ListingScreen />} />
          <Route path="/thread/:id" element={<ThreadScreen />} />
          <Route path="/org/:ein" element={<OrgScreen />} />
          {(import.meta.env.DEV || MOCK) && <Route path="/dev/map-card" element={<MapCardPreview />} />}
        </Route>
      </Route>
      {/* Open to anyone, signed in or not. */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      {me?.account.isAdmin && <Route path="/admin" element={<Admin />} />}
      <Route path="*" element={<Navigate to={HOME[stageOf(me)]} replace />} />
    </Routes>
  )
}
