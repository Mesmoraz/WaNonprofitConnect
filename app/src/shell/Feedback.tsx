import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toJpeg } from 'html-to-image'
import { DEMO, useMe } from '../api'
import { notePage, snapshot } from '../lib/telemetry'
import { useToast } from './Toast'
import './confirm.css'

const OPEN = 'helpbook:feedback'
/** Open "Send feedback" from anywhere: the name menu, the crash screen. */
export const openFeedback = () => window.dispatchEvent(new Event(OPEN))

/** Remembers the pages visited, for the feedback note's context. Mount once, inside the router. */
export function PageTrail() {
  const { pathname } = useLocation()
  useEffect(() => { notePage(pathname) }, [pathname])
  return null
}

/**
 * "Send feedback" (S-93). Takes a picture of the screen first (so the box isn't in it), then asks for a note.
 * Sends to the real server even in the demo, where the person's real sign-in still identifies them.
 */
export function FeedbackHost() {
  const [open, setOpen] = useState(false)
  const [picture, setPicture] = useState<string | null>(null)
  const [withPicture, setWithPicture] = useState(true)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)
  const toast = useToast()
  const { data: me } = useMe()

  useEffect(() => {
    const start = async () => {
      setPicture(null); setFailed(false); setWithPicture(true)
      try {
        // At most 4 seconds: a slow or stuck capture must never stand between someone and sending a note.
        const shot = toJpeg(document.body, { quality: 0.7, pixelRatio: 1, skipFonts: true, backgroundColor: getComputedStyle(document.body).backgroundColor })
        setPicture(await Promise.race([shot, new Promise<null>(done => setTimeout(() => done(null), 4000))]))
      } catch { setPicture(null) }   // a picture is a bonus; the note still goes
      setOpen(true)
    }
    window.addEventListener(OPEN, start)
    return () => window.removeEventListener(OPEN, start)
  }, [])
  useEffect(() => { if (open) box.current?.focus() }, [open])
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  if (!open) return null

  const send = async () => {
    if (!note.trim()) return
    setSending(true); setFailed(false)
    try {
      const res = await fetch('/api/v1/feedback', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: note.trim(),
          screenshot: withPicture ? picture : null,
          context: snapshot({ demo: DEMO, signedInAs: me ? { name: me.account.name, org: me.membership?.orgName ?? null } : null }),
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setOpen(false); setNote('')
      toast('Sent. Thanks for telling us.')
    } catch { setFailed(true) } finally { setSending(false) }
  }

  return (
    <div className="confirm-scrim" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="confirm-box feedback-box" role="dialog" aria-modal="true" aria-labelledby="fb-title">
        <h2 id="fb-title" className="confirm-title">Send feedback</h2>
        <label className="field-label" htmlFor="fb-note">What happened, or what would you change?</label>
        <textarea id="fb-note" ref={box} rows={4} value={note} onChange={e => setNote(e.target.value)} />
        {picture && (
          <label className="feedback-pic" htmlFor="fb-pic">
            <input id="fb-pic" type="checkbox" checked={withPicture} onChange={e => setWithPicture(e.target.checked)} />
            <span>Include a picture of this screen</span>
            <img src={picture} alt="" />
          </label>
        )}
        {failed && <p className="error" role="alert">That didn’t send. Try again.</p>}
        <div className="confirm-actions">
          <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn primary" onClick={send} disabled={!note.trim() || sending}>Send</button>
        </div>
      </div>
    </div>
  )
}
