import { Link } from 'react-router-dom'
import type { Listing } from '../../api'
import { listingFacts, URGENCY_MARK } from '../../lib/words'

/**
 * The B5.1 card: the NEED or OFFER pill (plus Urgent or This week on needs that are), then three lines:
 * title, the organization, one grey line of facts. The ranking reason shows only when it says something the pill doesn't.
 */
export function ListingCard({ l }: { l: Listing }) {
  const mark = l.kind === 'Need' ? URGENCY_MARK[l.urgency] : ''
  const why = l.why && l.why !== mark ? l.why : ''
  return (
    <Link to={`/listing/${l.id}`} className="card tap listing-card">
      <span className="pills">
        <span className={`pill kind ${l.kind === 'Need' ? 'need' : 'offer'}`}>{l.kind}</span>
        {mark && <span className={`pill ${l.urgency === 'Critical' ? 'p0' : 'p1'}`}>{mark}</span>}
        {l.status !== 'Open' && <span className="pill grey">{l.status}</span>}
      </span>
      <span className="t">{l.title}</span>
      <span className="who-line">{l.org.name}</span>
      <span className="m">{listingFacts(l)}</span>
      {why && <span className="why">{why}</span>}
    </Link>
  )
}
