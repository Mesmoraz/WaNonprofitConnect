import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBoard, useMapData, useMe, useOrgPage, useThreads, type Listing, type Thread } from '../../api'
import { SMALL_BOARD, passes, useServeFilter } from '../../lib/serve'
import { cap, causeOf, shortAgo } from '../../lib/words'
import { Slow } from '../../shell/Slow'
import { NearYou } from './NearYou'
import { WelcomeCard } from './WelcomeCard'
import '../board/board.css'
import './home.css'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/**
 * Home (S-126, S-140, docs/ALPHA-BRIEFS.md): a calm place to land, the map first. Then what's waiting on you (only when
 * something is), where you stand, and what's new. No green button: Post is one tap away in the tabs.
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
  const fresh = (whole.data ?? [])
    .filter(l => now - new Date(l.createdAt).getTime() < WEEK_MS && passes(serve.picked, l.org))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 2)
  const waiting = threads.data ? waitingOn(threads.data, myEin) : []

  return (
    <div className="screen home">
      <header className="home-org">
        <h1 className="h">{org?.name ?? me?.membership?.orgName}</h1>
        {org && <p className="sub">{[cap(org.city), causeOf(org.ntee)].filter(Boolean).join(' · ')}</p>}
      </header>

      <section className="home-sec home-near" aria-label="Near you">
        {map.data && <NearYou data={map.data} me={org} />}
        {!map.data && !map.isError && <Slow />}
        {map.isError && !map.data && <p className="hint">That didn’t work. <button className="inline-link" onClick={() => map.refetch()}>Try again</button></p>}
      </section>

      <div className="home-grid">
        {(waiting.length > 0 || (threads.isError && !threads.data)) && (
          <section className="home-sec home-waiting" aria-labelledby="home-waiting">
            <h2 id="home-waiting" className="home-h">Waiting on you</h2>
            {waiting.length > 0 && <Waiting threads={waiting} myEin={myEin} />}
            {threads.isError && !threads.data && <p className="hint">That didn’t work. <button className="inline-link" onClick={() => threads.refetch()}>Try again</button></p>}
          </section>
        )}

        {myEin && (
          <WelcomeCard key={myEin} ein={myEin} mine={mine?.listings} otherwise={
            <p className="home-standing">{standing && <>{standing} · </>}<Link className="inline-link" to={`/org/${myEin}`}>Your page</Link></p>
          } />
        )}

        <section className="home-sec home-new" aria-labelledby="home-new">
          <h2 id="home-new" className="home-h">New this week</h2>
          {!whole.data && !whole.isError && <Slow />}
          {whole.isError && !whole.data && <p className="hint">That didn’t work. <button className="inline-link" onClick={() => whole.refetch()}>Try again</button></p>}
          {whole.data && (fresh.length ? <>
            <div className="home-cards">{fresh.map(l => <PostRow key={l.id} l={l} />)}</div>
            <Link className="inline-link home-more" to="/board">See the whole board</Link>
          </> : <p className="hint home-none">Nothing new this week. <Link className="inline-link" to="/board">See the whole board</Link>?</p>)}
        </section>
      </div>
    </div>
  )
}

/** Up to 3 threads where the next step is yours: they started it and it waits on your answer, or there's a new message. */
function waitingOn(threads: Thread[], myEin: string) {
  const activity = (t: Thread) => t.lastMessageAt ?? t.respondedAt ?? t.createdAt
  return threads
    .filter(t => startedBy(t, myEin) || ((t.status === 'Proposed' || t.status === 'Accepted') && t.unread > 0))
    .sort((a, b) => activity(b).localeCompare(activity(a)))
    .slice(0, 3)
}
const startedBy = (t: Thread, myEin: string) => t.status === 'Proposed' && t.startedByEin !== myEin

function Waiting({ threads, myEin }: { threads: Thread[]; myEin: string }) {
  return (
    <div className="home-cards">
      {threads.map(t => {
        const other = t.need.org.ein === myEin ? t.offer.org : t.need.org
        return (
          <Link key={t.id} to={`/thread/${t.id}`} className="card tap home-thread">
            <span className="t">{t.need.title}</span>
            <span className="m">{startedBy(t, myEin) ? `${other.name} started a thread` : `${plural(t.unread, 'new message')}`}</span>
          </Link>
        )
      })}
    </div>
  )
}

/** A post on Home (S-140): two lines, the title, then "Offer · Northwest Harvest · 8h". The Board keeps the full card. */
function PostRow({ l }: { l: Listing }) {
  return (
    <Link to={`/listing/${l.id}`} className="card tap home-post">
      <span className="t">{l.title}</span>
      <span className="m">{[l.kind, l.org.name, shortAgo(l.createdAt)].join(' · ')}</span>
    </Link>
  )
}
