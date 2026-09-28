import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useMe, useSendMessage, useThread, useThreadAction, type ThreadAction } from '../../api'
import { errorLine } from '../../lib/errors'
import { shortAgo } from '../../lib/words'
import { BackLink } from '../../shell/Page'
import './thread.css'

/**
 * B8, Thread. Copy: docs/ALPHA-BRIEFS.md. New messages arrive over SignalR: the hub's messageAdded
 * invalidates this thread's query (src/api/realtime.ts), so they show without a reload.
 */
export function ThreadScreen() {
  const id = Number(useParams().id)
  const { data: t, isError, refetch } = useThread(id)
  const { data: me } = useMe()
  const act = useThreadAction(id)
  const send = useSendMessage(id)
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const count = t?.messages.length ?? 0

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [count])

  if (!t) {
    return (
      <div className="screen thread">
        <BackLink fallback="/inbox" />
        {isError && <p className="empty">That didn’t work. <button className="inline-link" onClick={() => refetch()}>Try again</button></p>}
      </div>
    )
  }

  const myEin = me?.membership?.ein
  const other = t.need.org.ein === myEin ? t.offer.org : t.need.org
  const iStarted = t.startedByEin === myEin
  const run = (a: ThreadAction) => { setFailed(null); act.mutate(a, { onSuccess: () => setConfirming(false), onError: e => setFailed(errorLine(e)) }) }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setFailed(null)
    send.mutate(text, { onSuccess: () => setBody(''), onError: e => setFailed(errorLine(e)) })
  }

  let status: ReactNode = null
  if (t.status === 'Proposed' && iStarted) status = <p className="thread-status">Waiting for {other.name} to accept.</p>
  else if (t.status === 'Proposed') status = (
    <div className="thread-actions">
      <button className="btn primary" onClick={() => run('accept')} disabled={act.isPending}>Accept</button>
      <button className="btn" onClick={() => run('decline')} disabled={act.isPending}>Not this time</button>
    </div>
  )
  else if (t.status === 'Accepted') status = <>
    <p className="thread-status">You’re on. Work out the details here.</p>
    {confirming ? (
      <div className="thread-confirm">
        <p>Mark this done? Both posts close.</p>
        <div className="thread-actions">
          <button className="btn primary" onClick={() => run('complete')} disabled={act.isPending}>Mark done</button>
          <button className="btn" onClick={() => setConfirming(false)}>Not yet</button>
        </div>
      </div>
    ) : <button className="btn primary" onClick={() => setConfirming(true)}>Mark done</button>}
  </>
  else if (t.status === 'Completed') status = <p className="thread-status golden">Done. This is a golden thread.</p>
  else if (t.status === 'Declined' && iStarted) status = <p className="thread-status">{other.name} said not this time. Your post stays on the board.</p>

  const closed = t.status === 'Declined' || t.status === 'Cancelled'

  return (
    <div className="thread-page">
      <div className="screen thread">
        <BackLink fallback="/inbox" />
        <h1 className="h">{other.name}</h1>
        <div className="thread-pair">
          <p>Need: {t.need.title} · {t.need.org.name}</p>
          <p>Offer: {t.offer.title} · {t.offer.org.name}</p>
        </div>
        {status}
        {failed && <p className="error" role="alert">{failed}</p>}

        <div className="msgs" aria-live="polite">
          {t.messages.length === 0 && <p className="hint center">No messages yet. Say hello.</p>}
          {t.messages.map(m => (
            <div key={m.id} className={`msg${m.senderEin === myEin ? ' me' : ''}`}>
              {m.body}
              <small>{m.senderName} · {shortAgo(m.sentAt)}</small>
            </div>
          ))}
          <div ref={end} />
        </div>
      </div>

      {!closed && (
        <form className="cta-bar composer" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="composer">Write a message</label>
          <input id="composer" placeholder="Write a message" value={body} onChange={e => setBody(e.target.value)} autoComplete="off" enterKeyHint="send" />
          <button className="btn" type="submit" disabled={!body.trim() || send.isPending}>Send</button>
        </form>
      )}
    </div>
  )
}
