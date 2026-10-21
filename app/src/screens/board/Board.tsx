import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBoard, useMapData, useMe, useOrgPage, useOrgs, type KindOfHelp, type ListingKind } from '../../api'
import { BRAND } from '../../brand'
import { SERVE_GROUPS, SMALL_BOARD, passes, useServeFilter, type ServeGroup } from '../../lib/serve'
import { cap, causeOf, HELPS, HELP_LABEL } from '../../lib/words'
import { Slow } from '../../shell/Slow'
import { ListingCard } from './ListingCard'
import './board.css'

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

const KINDS: [ListingKind | '', string][] = [['', 'Needs + offers'], ['Need', 'Needs'], ['Offer', 'Offers']]

/** Screen 6, Board (prototype B5 and B5.1). Kinds of help as navigation, grouped filters, directory search on top. */
export function Board() {
  const [params, setParams] = useSearchParams()
  const help = (params.get('help') ?? '') as KindOfHelp | ''
  const kind = (params.get('kind') ?? '') as ListingKind | ''
  // From Home's "Go to" chips (S-126): urgent needs, needs your open offers could meet, one group under "Who they serve".
  const urgent = params.get('urgent') === '1'
  const fits = params.get('fits') === '1'
  const serveParam = (SERVE_GROUPS as readonly string[]).includes(params.get('serve') ?? '') ? params.get('serve') as ServeGroup : null
  const [q, setQ] = useState(params.get('q') ?? '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const term = useDebounced(q.trim(), 200)
  const searching = q.trim().length >= 2

  const set = (k: string, v: string) => setParams(p => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n }, { replace: true })
  useEffect(() => { set('q', term.length >= 2 ? term : '') }, [term]) // eslint-disable-line react-hooks/exhaustive-deps

  const board = useBoard({ help: help || undefined, kind: kind || undefined })
  const map = useMapData()
  const orgs = useOrgs(searching ? term : '')
  // Search finds needs and offers too (S-132, Taylor Oct 21), so Home's "Looking for something specific?" lands somewhere.
  const found = useBoard({ q: term }, searching && term.length >= 2)
  const done = map.data?.threads.filter(t => t.status === 'Completed').length
  const { data: me } = useMe()
  const myEin = me?.membership?.ein ?? ''
  const { data: mine } = useOrgPage(myEin)   // your cause code, to start "Who they serve" from
  const whole = useBoard()                    // every open post, whatever tab you're on, to tell if the board is small
  const small = whole.data !== undefined && whole.data.length < SMALL_BOARD
  const serve = useServeFilter(myEin, mine?.org, small)
  const picked = serveParam ? [serveParam] : serve.picked
  const toggleServe = (g: ServeGroup) => { if (serveParam) set('serve', ''); serve.toggle(g) }
  const [showAll, setShowAll] = useState(false)
  const meet = new Set(map.data?.suggested.filter(s => s.fromEin === myEin).map(s => s.needId))
  const all = (board.data ?? []).filter(l => (!urgent || (l.kind === 'Need' && l.urgency === 'Critical')) && (!fits || meet.has(l.id)))
  const listings = showAll ? all : all.filter(l => passes(picked, l.org))
  const hidden = all.length - listings.length
  const filterCount = (kind ? 1 : 0) + (urgent ? 1 : 0) + (fits ? 1 : 0) + picked.length
  const clearFilters = () => {
    setParams(p => { const n = new URLSearchParams(p); for (const k of ['kind', 'urgent', 'fits', 'serve']) n.delete(k); return n }, { replace: true })
    serve.clear()
  }

  return (
    <div className="screen board">
      <label className="visually-hidden" htmlFor="boardq">Search everyone here</label>
      <span className="search-wrap">
        <input id="boardq" type="search" placeholder="Search everyone here" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} />
      </span>

      {searching ? term.length >= 2 && <>
        <div className="label">Needs and offers</div>
        {found.data && (found.data.length
          ? <div className="board-grid">{found.data.map(l => <ListingCard key={l.id} l={l} />)}</div>
          : <p className="hint">Nothing posted with that word yet.</p>)}
        <div className="label">Organizations</div>
        {orgs.data && (orgs.data.length ? orgs.data.map(o => (
          <Link key={o.ein} to={`/org/${o.ein}`} className="card tap">
            <span className="t">{o.name}</span>
            <span className="m">
              {[cap(o.city), causeOf(o.ntee)].filter(Boolean).join(' · ')}
              {o.isMember && <> · <span className="verified">on {BRAND.name}</span></>}
            </span>
          </Link>
        )) : <p className="empty">No one by that name. Try an EIN.</p>)}
      </> : <>
        <div className="seg" role="tablist" aria-label="Kind of help">
          {([''] as (KindOfHelp | '')[]).concat(HELPS).map(h => (
            <button key={h || 'all'} role="tab" aria-selected={help === h} className={`seg-item${help === h ? ' on' : ''}`} onClick={() => set('help', h)}>
              {h ? HELP_LABEL[h] : 'All'}
            </button>
          ))}
        </div>

        <div className="flt-head">
          <span>{board.data ? `${listings.length} open${done !== undefined ? ` · ${done} done` : ''}` : ''}</span>
          <button className="flt-toggle" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(o => !o)}>Filters{filterCount ? ` · ${filterCount}` : ''}</button>
        </div>

        {filtersOpen && (
          <div className="flt">
            <div className="label">What</div>
            <div className="chips">
              {KINDS.map(([v, t]) => <button key={t} className={`chip${kind === v ? ' on' : ''}`} aria-pressed={kind === v} onClick={() => set('kind', v)}>{t}</button>)}
            </div>
            <div className="label">Who they serve</div>
            <div className="chips">
              {SERVE_GROUPS.map(g => {
                const on = picked.includes(g)
                return <button key={g} className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => { setShowAll(false); toggleServe(g) }}>{g}</button>
              })}
            </div>
            <p className="hint">{small && !picked.length
              ? 'Showing everyone while the board is small. Tap to narrow it.'
              : 'Set from your organization’s cause code. Tap to change.'}</p>
            {filterCount > 0 && <button className="btn sm quiet" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}

        {!board.data && !board.isError && <Slow />}
        {board.isError && !board.data && (
          <p className="empty">That didn’t work. <button className="inline-link" onClick={() => board.refetch()}>Try again</button></p>
        )}

        {listings.length > 0 && <div className="board-grid">{listings.map(l => <ListingCard key={l.id} l={l} />)}</div>}

        {board.data && !listings.length && !hidden && (help
          ? <p className="empty">Nothing under {HELP_LABEL[help]} yet. <Link className="inline-link" to="/post">Post the first one?</Link></p>
          // Only "What" (needs or offers) filters on the server. "Who they serve" can't empty a board that has
          // posts (those show as "{n} more outside your filters"), so with no posts at all, say so.
          : kind || urgent || fits
            ? <p className="empty">Nothing here with those filters. <button className="inline-link" onClick={clearFilters}>Clear them?</button></p>
            : <p className="empty">Nothing here yet. <Link className="inline-link" to="/post">Post the first one?</Link></p>)}

        {hidden > 0 && <p className="hint board-hidden">{hidden} more outside your filters. <button className="inline-link" onClick={() => setShowAll(true)}>Show them</button></p>}

        {listings.length > 0 && <p className="hint">Urgent first, then whoever’s been seen least.</p>}
      </>}
    </div>
  )
}
