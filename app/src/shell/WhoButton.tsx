import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO, leaveDemo, startDemo, useMe, useSignOut } from '../api'
import { presetById } from '../api/mock/settings'
import { openFeedback } from './Feedback'

/** Your name, with your organization behind it. Opens a small menu: Your organization, Admin, feedback, sign out. */
export function WhoButton() {
  const { data: me } = useMe()
  const signOut = useSignOut()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  if (!me) return null
  const org = me.membership?.orgName
  return (
    <div className="who-wrap" ref={ref}>
      <button className="who" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span className="dot" aria-hidden>{me.account.name.charAt(0).toUpperCase()}</span>
        <span className="name">{org ? `${me.account.name} · ${org}` : me.account.name}</span>
      </button>
      {open && (
        <div className="who-menu" role="menu">
          {me.account.isAdmin && <button role="menuitem" onClick={() => { setOpen(false); navigate('/admin') }}>Admin</button>}
          {!DEMO && me.account.isAdmin && <button role="menuitem" onClick={() => startDemo(me.account.name)}>Start the demo</button>}
          {me.account.isAdmin && <button role="menuitem" onClick={() => startDemo(me.account.name, presetById('new-org')!.settings)}>Try as a new organization</button>}
          {DEMO && <button role="menuitem" onClick={leaveDemo}>Leave the demo</button>}
          {me.membership?.status === 'confirmed' && <button role="menuitem" onClick={() => { setOpen(false); navigate('/org') }}>Your organization</button>}
          <button role="menuitem" onClick={() => { setOpen(false); openFeedback() }}>Send feedback</button>
          {!DEMO && <button role="menuitem" onClick={() => signOut.mutate()} disabled={signOut.isPending}>Sign out</button>}
        </div>
      )}
    </div>
  )
}
