import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBoard, useMapData, useMe, useOrgPage, useOrgs, type KindOfHelp, type ListingKind } from '../../api'
import { BRAND } from '../../brand'
import { SERVE_GROUPS, passes, useServeFilter } from '../../lib/serve'
import { cap, HELPS, HELP_LABEL } from '../../lib/words'
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
  const [q, setQ] = useState(params.get('q') ?? '')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const term = useDebounced(q.trim(), 200)
  const searching = q.trim().length >= 2

  const set = (k: string, v: string) => setParams(p => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n }, { replace: true })
  useEffect(() => { set('q', term.length >= 2 ? term : '') }, [term]) // eslint-disable-line react-hooks/exhaustive-deps

  const board = useBoard({ help: help || undefined, kind: kind || undefined })
  const map = useMapData()
  const orgs = useOrgs(searching ? term : '')
  const done = map.data?.threads.filter(t => t.status === 'Completed').length
  const { data: me } = useMe()
  const myEin = me?.membership?.ein ?? ''
  const { data: mine } = useOrgPage(myEin)   // your cause code, to start "Who they serve" from
  const serve = useServeFilter(myEin || undefined, mine?.org.ntee)
  const [showAll, setShowAll] = useState(false)
  const all = board.data ?? []
  const listings = showAll ? all : all.filter(l => passes(serve.picked, l.org.ntee))
  const hidden = all.length - listings.length
  const filterCount = (kind ? 1 : 0) + serve.picked.length
  const clearFilters = () => { set('kind', ''); serve.clear() }

  return (
    <div className="screen board">
      <label className="visually-hidden" htmlFor="boardq">Search everyone here</label>
      <span className="search-wrap">
        <input id="boardq" type="search" placeholder="Search everyone here" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} />
      </span>

      {searching ? (
        orgs.data && term.length >= 2 && (orgs.data.length ? orgs.data.map(o => (
          <div key={o.ein} className="card">
            <span className="t">{o.name}</span>
            <span className="m">
              {[cap(o.city), 'Nonprofit'].filter(Boolean).join(' · ')}
              {o.isMember && <> · <span className="verified">on {BRAND.name}</span></>}
            </span>
          </div>
        )) : <p className="empty">No one by that name. Try an EIN.</p>)
      ) : <>
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
                const on = serve.picked.includes(g)
                return <button key={g} className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => { setShowAll(false); serve.toggle(g) }}>{g}</button>
              })}
            </div>
            <p className="hint">Set from your organization’s cause code. Tap to change.</p>
            {filterCount > 0 && <button className="btn sm quiet" onClick={clearFilters}>Clear filters</button>}
          </div>
        )}

        {board.isError && !board.data && (
          <p className="empty">That didn’t work. <button className="inline-link" onClick={() => board.refetch()}>Try again</button></p>
        )}

        {listings.length > 0 && <div className="board-grid">{listings.map(l => <ListingCard key={l.id} l={l} />)}</div>}

        {board.data && !listings.length && !hidden && (help
          ? <p className="empty">Nothing under {HELP_LABEL[help]} yet. <Link className="inline-link" to="/post">Post the first one?</Link></p>
          : <p className="empty">Nothing here with those filters. <button className="inline-link" onClick={clearFilters}>Clear them?</button></p>)}

        {hidden > 0 && <p className="hint board-hidden">{hidden} more outside your filters. <button className="inline-link" onClick={() => setShowAll(true)}>Show them</button></p>}

        {board.data && <p className="hint">Urgent first, then whoever’s been seen least.</p>}
      </>}
    </div>
  )
}
