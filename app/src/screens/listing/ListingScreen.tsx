import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCloseListing, useListing, useMe, useStartThread, useThreads, type Listing } from '../../api'
import { CADENCE_FULL, HELP_LABEL, URGENCY_MARK, cap, listingFacts, postedAgo, quantityLine } from '../../lib/words'
import { Confirm } from '../../shell/Confirm'
import { BackLink, Page } from '../../shell/Page'
import { useToast } from '../../shell/Toast'
import { errorLine } from '../../lib/errors'
import './listing.css'

/** B6, a need or offer. Copy: docs/ALPHA-BRIEFS.md. */
export function ListingScreen() {
  const id = Number(useParams().id)
  const { data: l, isError, refetch } = useListing(id)
  const { data: me } = useMe()
  const { data: threads } = useThreads()
  const start = useStartThread()
  const close = useCloseListing()
  const toast = useToast()
  const navigate = useNavigate()
  const [pick, setPick] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)

  if (!l) {
    return (
      <Page>
        <BackLink />
        {isError && <p className="empty">That didn’t work. <button className="inline-link" onClick={() => refetch()}>Try again</button></p>}
      </Page>
    )
  }

  const myEin = me?.membership?.ein
  const own = l.org.ein === myEin
  const isNeed = l.kind === 'Need'
  const mark = isNeed ? URGENCY_MARK[l.urgency] : ''
  const top = [l.kind, HELP_LABEL[l.help], mark, CADENCE_FULL[l.cadence]].filter(Boolean).join(' · ')
  // The post says if you already have a live thread on it; the inbox list is a fallback and may not have loaded yet.
  const existingId = l.myThreadId ?? threads?.find(t => (t.need.id === l.id || t.offer.id === l.id) && t.status !== 'Declined' && t.status !== 'Cancelled')?.id
  const qty = quantityLine(l)
  const open = l.status === 'Open'

  const startThread = () => {
    setFailed(null)
    start.mutate({ listingId: l.id, myListingId: pick ?? undefined, message: message.trim() }, {
      onSuccess: t => { toast(`Thread started. ${l.org.name} will see it in their inbox.`); navigate(`/thread/${t.id}`) },
      onError: e => setFailed(errorLine(e)),
    })
  }
  const closePost = () => {
    setFailed(null)
    close.mutate(l.id, {
      onSuccess: () => { toast('Closed. It’s off the board.'); navigate('/', { replace: true }) },
      onError: e => { setConfirmClose(false); setFailed(errorLine(e)) },
    })
  }

  const cta = own
    ? open && <button className="btn danger-outline" onClick={() => setConfirmClose(true)}><span className="x" aria-hidden>×</span>{isNeed ? 'Close this need' : 'Close this offer'}</button>
    : existingId
      ? <Link className="btn primary" to={`/thread/${existingId}`}>Open your thread</Link>
      : open && <button className="btn primary" onClick={startThread} disabled={start.isPending || (!pick && !message.trim())}>{isNeed ? 'I can help' : 'I need this'}</button>

  return (
    <Page cta={cta || undefined} className="listing">
      <BackLink />
      <p className={`listing-top ${isNeed ? 'need' : 'offer'}`}>{top}</p>
      <h1 className="h">{l.title}</h1>
      <div>
        <p className="listing-org">{l.org.name}</p>
        <p className="sub">{[cap(l.org.city), postedAgo(l.createdAt)].filter(Boolean).join(' · ')}</p>
      </div>
      {qty && <p className="listing-qty">{qty}</p>}
      {l.description && <p className="listing-desc">{l.description}</p>}

      {own ? <>
        {/* Your own post: what could answer it. Labelled for what it is (Taylor, Sep 24: "I don't understand this page"). */}
        {open && <>
          <div className="label">{isNeed ? 'Offers that could fit' : 'Needs that could fit'}</div>
          {l.fits.length
            ? <><p className="hint">Open one to start a thread.</p>{l.fits.map(f => <FitCard key={f.id} l={f} to={`/listing/${f.id}`} />)}</>
            : <p className="hint">Nothing fits yet. It’s on the board, so anyone can find it.</p>}
          <p className="hint listing-close-hint">Closed posts leave the board.</p>
        </>}
      </> : !existingId && open && <>
        <div className="label">Yours that fit</div>
        {l.fits.length
          ? l.fits.map(f => <FitCard key={f.id} l={f} selected={pick === f.id} onPick={() => setPick(p => p === f.id ? null : f.id)} />)
          : <p className="hint">{`Nothing of yours fits yet. You can still ${l.kind === 'Offer' ? 'ask' : 'help'}.`}</p>}
        <label className="field-label listing-msg-label" htmlFor="msg">Message to {l.org.name}</label>
        <textarea id="msg" rows={3} placeholder="Say what you can do and when." value={message} onChange={e => setMessage(e.target.value)} />
      </>}

      {failed && <p className="error" role="alert">{failed}</p>}
      {confirmClose && (
        <Confirm danger busy={close.isPending}
          title={isNeed ? 'Close this need?' : 'Close this offer?'}
          body="It comes off the board, and you can’t open it again."
          confirm={isNeed ? 'Close need' : 'Close offer'} cancel="Keep it"
          onConfirm={closePost} onCancel={() => setConfirmClose(false)} />
      )}
    </Page>
  )
}

function FitCard({ l, selected, onPick, to }: { l: Listing; selected?: boolean; onPick?: () => void; to?: string }) {
  const body = <>
    <span className="pills"><span className={`pill kind ${l.kind === 'Need' ? 'need' : 'offer'}`}>{l.kind}</span></span>
    <span className="t">{l.title}</span>
    <span className="m">{to ? `${l.org.name} · ${listingFacts(l)}` : listingFacts(l)}</span>
  </>
  return to
    ? <Link className="card tap fit-card" to={to}>{body}</Link>
    : <button className={`card tap fit-card${selected ? ' sel' : ''}`} aria-pressed={selected} onClick={onPick}>{body}</button>
}
