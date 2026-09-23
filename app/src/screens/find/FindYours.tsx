import { useState } from 'react'
import { MOCK, useClaim, useOrgs, type OrgSummary } from '../../api'
import { BRAND } from '../../brand'
import { cap, causeOf, formatEin } from '../../lib/words'
import { Door } from '../../shell/Door'

/** Screen 3, Find yours (prototype B2), nonprofit copy. Claiming sends you to the waiting screen. */
export function FindYours() {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<OrgSummary | null>(null)
  const [failed, setFailed] = useState(false)
  const term = q.trim()
  const { data: hits = [], isFetching } = useOrgs(term)
  const shown = term.length >= 2 ? hits.slice(0, 6) : []
  const claim = useClaim()

  const line2 = (o: OrgSummary) => [cap(o.city), /^\d{9}$/.test(o.ein) ? `EIN ${formatEin(o.ein)}` : '', causeOf(o.ntee)].filter(Boolean).join(' · ')

  return (
    <Door back="/invite" who cta={
      <button className="btn primary" disabled={!pick || claim.isPending}
        onClick={() => { if (!pick) return; setFailed(false); claim.mutate(pick.ein, { onError: () => setFailed(true) }) }}>
        {pick ? `Join as ${pick.name}` : 'Pick your organization'}
      </button>
    }>
      <h1 className="h">Which organization are you with?</h1>
      <p className="sub">Every Washington 501(c)(3) is already here, straight from the IRS.</p>
      <label className="visually-hidden" htmlFor="claimq">Organization name or EIN</label>
      <span className="search-wrap">
        <input id="claimq" type="search" placeholder="Organization name or EIN" autoComplete="off" value={q}
          onChange={e => { setQ(e.target.value); setPick(null) }} />
      </span>

      {shown.map(o => (
        <button key={o.ein} className={`card tap${pick?.ein === o.ein ? ' sel' : ''}`} aria-pressed={pick?.ein === o.ein} onClick={() => setPick(o)}>
          <span className="t">{o.name}</span>
          <span className="m">{line2(o)}</span>
          {o.isMember && <span className="m verified">Already on {BRAND.name}. Ask a member to invite you.</span>}
        </button>
      ))}

      {term.length >= 2 && !isFetching && !shown.length && <>
        <p className="empty">Nothing by that name. Try the EIN instead.</p>
        {MOCK && <p className="demo">Demo: only a few of Washington’s 35,361 organizations are loaded.</p>}
      </>}
      {!term && MOCK && <p className="demo">Demo: try "Ballard Food".</p>}
      {failed && <p className="error" role="alert">That didn’t work. Try again.</p>}
    </Door>
  )
}
