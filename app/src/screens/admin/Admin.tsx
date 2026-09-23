import { useState } from 'react'
import { useAdminClaims, useAdminInvites, useApproveClaim, useCreateInvite, useOrgs, useRejectClaim, type OrgSummary } from '../../api'
import { cap } from '../../lib/words'
import { Door } from '../../shell/Door'
import { useToast } from '../../shell/Toast'
import './admin.css'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** Taylor's page (docs/ALPHA-BRIEFS.md, Admin): make invite codes, and approve or turn down claims. */
export function Admin() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<OrgSummary | null>(null)
  const [uses, setUses] = useState('3')
  const [failed, setFailed] = useState(false)
  const term = q.trim()
  const { data: hits = [] } = useOrgs(term)
  const shown = term.length >= 2 && !pick ? hits.slice(0, 5) : []
  const { data: invites = [] } = useAdminInvites()
  const { data: claims = [] } = useAdminClaims()
  const make = useCreateInvite()
  const approve = useApproveClaim()
  const reject = useRejectClaim()
  const n = Math.max(1, Math.min(50, Number(uses) || 0))

  const makeCode = () => {
    if (!pick) return
    setFailed(false)
    make.mutate({ ein: pick.ein, uses: n }, {
      onSuccess: () => { setPick(null); setQ('') },
      onError: () => setFailed(true),
    })
  }
  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => toast('Copied.'), () => {})
  }

  return (
    <Door back="/" who cta={<button className="btn primary" disabled={!pick || make.isPending} onClick={makeCode}>Make code</button>}>
      <h1 className="h">Admin</h1>

      <div className="label">Invite codes</div>
      <label className="field-label" htmlFor="adminq">Find the organization</label>
      <input id="adminq" type="search" autoComplete="off" value={pick ? pick.name : q}
        onChange={e => { setQ(e.target.value); setPick(null) }} />
      {shown.map(o => (
        <button key={o.ein} className="card tap" onClick={() => setPick(o)}>
          <span className="t">{o.name}</span>
          <span className="m">{cap(o.city)}</span>
        </button>
      ))}
      <label className="field-label" htmlFor="uses">How many people</label>
      <input id="uses" type="number" inputMode="numeric" min={1} max={50} value={uses} onChange={e => setUses(e.target.value)} />
      {failed && <p className="error" role="alert">That didn’t work. Try again.</p>}

      {invites.slice().reverse().map(i => (
        <button key={i.code} className="card tap admin-code" onClick={() => copy(i.code)}>
          <span className="code">{i.code}</span>
          <span className="m">{i.orgName} · {i.used} of {i.uses} used</span>
        </button>
      ))}

      <div className="label">Waiting for you</div>
      {claims.length === 0 && <p className="empty">No one is waiting.</p>}
      {claims.map(c => (
        <div key={c.id} className="card">
          <span className="t">{c.name} · {c.email}</span>
          <span className="m">{c.orgName}</span>
          <span className="m">{[cap(c.city), day(c.createdAt)].filter(Boolean).join(' · ')}</span>
          <div className="admin-actions">
            <button className="btn primary sm" disabled={approve.isPending} onClick={() => approve.mutate(c.id)}>Approve</button>
            <button className="btn quiet sm" disabled={reject.isPending} onClick={() => reject.mutate(c.id)}>Not this one</button>
          </div>
        </div>
      ))}
    </Door>
  )
}
