import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBoard, useMapData, useMe, useOrgPage, useThreads, type Listing, type Thread } from '../../api'
import { SMALL_BOARD, passes, servedBy, useServeFilter, type ServeGroup } from '../../lib/serve'
import { cap, causeOf, HELPS, HELP_LABEL } from '../../lib/words'
import { Slow } from '../../shell/Slow'
import { ListingCard } from '../board/ListingCard'
import { NearYou } from './NearYou'
import { WelcomeCard } from './WelcomeCard'
import '../board/board.css'
import './home.css'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/**
 * Home (S-126, docs/ALPHA-BRIEFS.md): a calm place to land. Where you stand, what's waiting on you, who's near,
 * what's new, and the board already filtered. No green button: Post is one tap away in the tabs.
 */
export function Home() {
  const { data: me } = useMe()
  const myEin = me?.membership?.ein ?? ''
  const { data: mine } = useOrgPage(myEin)
  const threads = useThreads()
  const map = useMapData()
  const whole = useBoard()                 // every open post, as the Board starts
  const small = whole.data !== undefined && whole.data.length < SMALL_BOARD
  const serve = useServeFilter(myEin, mine?.org, small)

  const org = mine?.org
  const open = (mine?.listings ?? []).filter(l => l.status === 'Open')
  const needs = open.filter(l => l.kind === 'Need').length
  const offers = open.filter(l => l.kind === 'Offer').length
  const standing = [
    [needs && plural(needs, 'need'), offers && plural(offers, 'offer')].filter(Boolean).join(', ') + (needs || offers ? ' open' : ''),
    mine?.golden ? plural(mine.golden, 'golden thread') : '',
  ].filter(Boolean).join(' · ')

  const [now] = useState(() => Date.now())   // "this week" from when Home opened
  const shown = (l: Listing) => passes(serve.picked, l.org)
  const fresh = (whole.data ?? [])
    .filter(l => now - new Date(l.createdAt).getTime() < WEEK_MS && shown(l))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)

  return (
    <div className="screen home">
      <header className="home-org">
        <h1 className="h">{org?.name ?? me?.membership?.orgName}</h1>
        {org && <p className="sub">{[cap(org.city), causeOf(org.ntee)].filter(Boolean).join(' · ')}</p>}
      </header>
      {myEin && (
        <WelcomeCard key={myEin} ein={myEin} mine={mine?.listings} otherwise={
          <p className="home-standing">{standing && <>{standing} · </>}<Link className="inline-link" to={`/org/${myEin}`}>Your page</Link></p>
        } />
      )}

      <div className="home-grid">
        <section className="home-sec" aria-labelledby="home-waiting">
          <h2 id="home-waiting" className="home-h">Waiting on you</h2>
          {threads.data ? <Waiting threads={threads.data} myEin={myEin} /> : !threads.isError && <Slow />}
          {threads.isError && !threads.data && <p className="hint">That didn’t work. <button className="inline-link" onClick={() => threads.refetch()}>Try again</button></p>}
        </section>

        <section className="home-sec home-near" aria-labelledby="home-near">
          <h2 id="home-near" className="home-h">Near you</h2>
          {map.data && <NearYou data={map.data} me={org} />}
          {!map.data && !map.isError && <Slow />}
          {map.isError && !map.data && <p className="hint">That didn’t work. <button className="inline-link" onClick={() => map.refetch()}>Try again</button></p>}
        </section>

        <section className="home-sec home-new" aria-labelledby="home-new">
          <h2 id="home-new" className="home-h">New this week</h2>
          {!whole.data && !whole.isError && <Slow />}
          {whole.isError && !whole.data && <p className="hint">That didn’t work. <button className="inline-link" onClick={() => whole.refetch()}>Try again</button></p>}
          {whole.data && (fresh.length ? <>
            <div className="home-cards">{fresh.map(l => <ListingCard key={l.id} l={l} />)}</div>
            <Link className="inline-link home-more" to="/board">See the whole board</Link>
          </> : <p className="hint home-none">Nothing new this week. <Link className="inline-link" to="/board">See the whole board</Link>?</p>)}
        </section>

        {whole.data && <OnTheBoard all={whole.data} shown={shown} myEin={myEin} myOrg={org} picked={serve.picked} meet={map.data?.suggested} />}
      </div>
    </div>
  )
}

/** Up to 3 threads where the next step is yours: they started it and it waits on your answer, or there's a new message. */
function Waiting({ threads, myEin }: { threads: Thread[]; myEin: string }) {
  const started = (t: Thread) => t.status === 'Proposed' && t.startedByEin !== myEin
  const activity = (t: Thread) => t.lastMessageAt ?? t.respondedAt ?? t.createdAt
  const yours = threads
    .filter(t => started(t) || ((t.status === 'Proposed' || t.status === 'Accepted') && t.unread > 0))
    .sort((a, b) => activity(b).localeCompare(activity(a)))
    .slice(0, 3)
  if (!yours.length) return <p className="hint home-none">Nothing waiting on you.</p>
  return (
    <div className="home-cards">
      {yours.map(t => {
        const other = t.need.org.ein === myEin ? t.offer.org : t.need.org
        return (
          <Link key={t.id} to={`/thread/${t.id}`} className="card tap home-thread">
            <span className="t">{t.need.title}</span>
            <span className="m">{started(t) ? `${other.name} started a thread` : `${plural(t.unread, 'new message')}`}</span>
          </Link>
        )
      })}
    </div>
  )
}

type Row = { label: string; n: number; to: string }

// "78 posts from food organizations": the groups that read as a kind of organization; the rest read "organizations serving …".
const AS_KIND: Partial<Record<ServeGroup, string>> = {
  Food: 'food', Housing: 'housing', Health: 'health', Education: 'education', Environment: 'environment', Animals: 'animal', 'Arts and culture': 'arts and culture',
}
const fromGroup = (g: ServeGroup) => AS_KIND[g] ? `from ${AS_KIND[g]} organizations` : `from organizations serving ${g.toLowerCase()}`

/**
 * "On the board" (S-126, Taylor Oct 19: "Go to: Food / Things" was unclear). Rows that open the Board already filtered,
 * the count first, the same count the Board will show. A row with nothing behind it doesn't show. At most 5: needs your
 * offers could meet, your cause, the busiest kinds of help, urgent needs, posts that match your filters.
 */
function OnTheBoard({ all, shown, myEin, myOrg, picked, meet }: {
  all: Listing[]; shown: (l: Listing) => boolean; myEin: string; myOrg: { ntee: string | null; name: string } | undefined
  picked: ServeGroup[]; meet: { needId: number; fromEin: string }[] | undefined
}) {
  const visible = all.filter(shown)
  const mineMeets = new Set((meet ?? []).filter(s => s.fromEin === myEin).map(s => s.needId))
  const cause = myOrg ? servedBy(myOrg.ntee, myOrg.name)[0] : undefined
  const row = (n: number, label: (n: number) => string, to: string): Row => ({ n, label: label(n), to })

  const fits = row(visible.filter(l => mineMeets.has(l.id)).length, n => `${plural(n, 'need')} you could meet`, '/board?fits=1')
  const yourCause = cause ? row(all.filter(l => passes([cause], l.org)).length, n => `${plural(n, 'post')} ${fromGroup(cause)}`, `/board?serve=${encodeURIComponent(cause)}`) : null
  const urgent = row(visible.filter(l => l.kind === 'Need' && l.urgency === 'Critical').length, n => plural(n, 'urgent need'), '/board?urgent=1')
  const sameAsCause = picked.length === 1 && picked[0] === cause
  const yours = picked.length && !sameAsCause ? row(visible.length, n => `${n === 1 ? '1 post that matches' : `${n} posts that match`} your filters`, '/board') : null
  const kinds = HELPS
    .map(h => row(visible.filter(l => l.help === h).length, n => `${plural(n, 'post')} under ${HELP_LABEL[h]}`, `/board?help=${h}`))
    .filter(r => r.n > 0)
    .sort((a, b) => b.n - a.n)

  const some = (r: Row | null): r is Row => !!r && r.n > 0
  const fixed = [fits, yourCause, urgent, yours].filter(some)
  const busiest = kinds.slice(0, Math.max(1, 5 - fixed.length))
  const rows = [fits, yourCause, ...busiest, urgent, yours].filter(some).slice(0, 5)
  if (!rows.length) return null

  return (
    <section className="home-sec home-go" aria-labelledby="home-go">
      <h2 id="home-go" className="home-h">On the board</h2>
      <div className="home-rows">
        {rows.map(r => <Link key={r.to} className="home-row" to={r.to}>{r.label}</Link>)}
      </div>
    </section>
  )
}
