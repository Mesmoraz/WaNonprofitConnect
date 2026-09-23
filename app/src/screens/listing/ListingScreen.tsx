import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCloseListing, useListing, useMe, useStartThread, useThreads, type Listing } from '../../api'
import { CADENCE_FULL, HELP_LABEL, URGENCY_MARK, cap, listingFacts, postedAgo, quantityLine } from '../../lib/words'
import { BackLink, Page } from '../../shell/Page'
import { useToast } from '../../shell/Toast'
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
  const [failed, setFailed] = useState(false)

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
  const existing = threads?.find(t => (t.need.id === l.id || t.offer.id === l.id) && t.status !== 'Declined' && t.status !== 'Cancelled')
  const qty = quantityLine(l)
  const open = l.status === 'Open'

  const startThread = () => {
    setFailed(false)
    start.mutate({ listingId: l.id, myListingId: pick ?? undefined, message: message.trim() }, {
      onSuccess: t => { toast(`Thread started. ${l.org.name} will see it in their inbox.`); navigate(`/thread/${t.id}`) },
      onError: () => setFailed(true),
    })
  }
  const closePost = () => {
    setFailed(false)
    close.mutate(l.id, { onSuccess: () => navigate('/', { replace: true }), onError: () => setFailed(true) })
  }

  const cta = own
    ? open && <button className="btn" onClick={closePost} disabled={close.isPending}>{isNeed ? 'Close this need' : 'Close this offer'}</button>
    : existing
      ? <Link className="btn primary" to={`/thread/${existing.id}`}>Open your thread</Link>
      : open && <button className="btn primary" onClick={startThread} disabled={start.isPending}>{isNeed ? 'I can help' : 'I need this'}</button>

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
        {open && <p className="hint">Closed posts leave the board.</p>}
        {l.fits.length > 0 && <>
          <div className="label">Could fit</div>
          {l.fits.map(f => <FitCard key={f.id} l={f} to={`/listing/${f.id}`} />)}
        </>}
      </> : !existing && open && <>
        <div className="label">Yours that fit</div>
        {l.fits.length
          ? l.fits.map(f => <FitCard key={f.id} l={f} selected={pick === f.id} onPick={() => setPick(p => p === f.id ? null : f.id)} />)
          : <p className="hint">Nothing of yours fits yet. You can still help.</p>}
        <label className="field-label listing-msg-label" htmlFor="msg">Message to {l.org.name}</label>
        <textarea id="msg" rows={3} placeholder="Say what you can do and when." value={message} onChange={e => setMessage(e.target.value)} />
      </>}

      {failed && <p className="error" role="alert">That didn’t work. Try again.</p>}
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
