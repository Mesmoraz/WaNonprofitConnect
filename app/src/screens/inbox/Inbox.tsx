import { Link } from 'react-router-dom'
import { useMe, useThreads, type Thread } from '../../api'
import { inboxStatus, quantityLine, shortAgo } from '../../lib/words'
import { Slow } from '../../shell/Slow'
import './inbox.css'

/** B8, Inbox. Waiting on you first, then newest activity. Copy: docs/ALPHA-BRIEFS.md. */
export function Inbox() {
  const { data: threads, isError, refetch } = useThreads()
  const { data: me } = useMe()
  const myEin = me?.membership?.ein
  const activity = (t: Thread) => t.lastMessageAt ?? t.respondedAt ?? t.createdAt
  const waitingOnMe = (t: Thread) => t.status === 'Proposed' && t.startedByEin !== myEin
  const sorted = (threads ?? []).slice().sort((a, b) =>
    Number(waitingOnMe(b)) - Number(waitingOnMe(a)) || activity(b).localeCompare(activity(a)))

  return (
    <div className="screen inbox">
      <h1 className="h">Inbox</h1>
      {!threads && !isError && <Slow />}
      {isError && !threads && <p className="empty">That didn’t work. <button className="inline-link" onClick={() => refetch()}>Try again</button></p>}
      {threads && !threads.length && (
        <p className="empty">No threads yet. Find a need on <Link className="inline-link" to="/">the board</Link> you can help with.</p>
      )}
      {sorted.map(t => {
        const mineIsNeed = t.need.org.ein === myEin
        const theirs = mineIsNeed ? t.offer : t.need
        // What it is first, then how many when there's more than one (S-119): "Laptops · 12 laptops", never just "1 unit".
        const what = [theirs.title, (theirs.quantity ?? 0) > 1 ? quantityLine(theirs) : ''].filter(Boolean).join(' · ')
        const status = inboxStatus(t, myEin)
        return (
          <Link key={t.id} to={`/thread/${t.id}`} className={`card tap inbox-row${t.unread ? ' unread' : ''}`}>
            <span className="inbox-main">
              <span className="t">{theirs.org.name}</span>
              <span className="m">{mineIsNeed ? 'Their offer' : 'Their need'} · {what}</span>
              {status && <span className={`inbox-status${status === 'Waiting on you' ? ' you' : status === 'Golden' ? ' golden' : ''}`}>{status}</span>}
            </span>
            <span className="inbox-side">
              <span className="inbox-time">{shortAgo(activity(t))}</span>
              {t.unread > 0 && <span className="unread-dot" aria-label={`${t.unread} unread`} />}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
