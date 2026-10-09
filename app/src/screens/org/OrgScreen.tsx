import { useParams } from 'react-router-dom'
import { useOrgPage } from '../../api'
import { causeOf, cap, formatEin } from '../../lib/words'
import { BackLink, Page } from '../../shell/Page'
import { Slow } from '../../shell/Slow'
import { ListingCard } from '../board/ListingCard'
import '../board/board.css'

const count = (n: number, one: string, many: string) => (n ? `${n} ${n === 1 ? one : many}` : '')

/** An organization, from the map: who it is, its thread counts, and its open needs and offers. */
export function OrgScreen() {
  const ein = useParams().ein ?? ''
  const { data: page, isError, refetch } = useOrgPage(ein)

  if (isError && !page) {
    return <Page><BackLink fallback="/map" /><p className="empty">That didn’t work. <button className="inline-link" onClick={() => refetch()}>Try again</button></p></Page>
  }
  if (!page) return <Page><BackLink fallback="/map" /><Slow /></Page>

  const o = page.org
  const threads = [count(page.golden, 'golden thread', 'golden threads'), count(page.live, 'in progress', 'in progress')].filter(Boolean).join(' · ')
  return (
    <Page>
      <BackLink fallback="/map" />
      <h1 className="h">{o.name}</h1>
      <p className="sub">{[cap(o.city), causeOf(o.ntee), `EIN ${formatEin(o.ein)}`].filter(Boolean).join(' · ')}</p>
      {threads && <p className="sub">{threads}</p>}

      <div className="label">Needs and offers</div>
      {page.listings.length
        ? <div className="board-grid">{page.listings.map(l => <ListingCard key={l.id} l={l} />)}</div>
        : <p className="empty">Nothing open right now.</p>}
    </Page>
  )
}
