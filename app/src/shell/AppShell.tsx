import { NavLink, Outlet } from 'react-router-dom'
import { DEMO, leaveDemo, useExchangeHub, useMe, useThreads } from '../api'
import { BRAND } from '../brand'
import { BoardIcon, InboxIcon, MapIcon, PlusIcon } from './icons'
import { WhoButton } from './WhoButton'
import './shell.css'

/** The signed-in, confirmed app: top bar and bottom tabs on a phone, a left rail from 900px. Alpha tabs only; no Grants. */
export function AppShell() {
  const { data: me } = useMe()
  useExchangeHub(true, me?.membership?.ein)
  const { data: threads } = useThreads()
  const unread = threads?.reduce((n, t) => n + t.unread, 0) ?? 0
  const cls = ({ isActive }: { isActive: boolean }) => `tab${isActive ? ' active' : ''}`

  return (
    <div className="app">
      <div className="app-brand"><NavLink to="/" className="logo">{BRAND.name}</NavLink></div>
      <div className="app-who"><WhoButton /></div>
      <main className="app-content" id="content">
        {DEMO && <p className="demo demo-bar">Demo: sample organizations. Nothing here is saved. <button className="inline-link" onClick={leaveDemo}>Leave the demo</button></p>}
        <Outlet />
      </main>
      <nav className="tabs" aria-label="Main">
        <NavLink to="/" end className={cls}><span className="ic"><BoardIcon /></span>Board</NavLink>
        <NavLink to="/map" className={cls}><span className="ic"><MapIcon /></span>Map</NavLink>
        <NavLink to="/post" className={p => `${cls(p)} plus`}><span className="ic"><PlusIcon /></span>Post</NavLink>
        <NavLink to="/inbox" className={cls}>
          <span className="ic"><InboxIcon /></span>Inbox
          {unread > 0 && <span className="badge" aria-label={`${unread} unread`}>{unread}</span>}
        </NavLink>
      </nav>
    </div>
  )
}
