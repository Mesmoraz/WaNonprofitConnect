import { useState } from 'react'
import { useActAs, useAdminClaims, useAdminFeedback, useFeedbackDone, useAdminInvites, useApproveClaim, useCreateInvite, useOrgs, useRejectClaim, type OrgSummary } from '../../api'
import { useNavigate } from 'react-router-dom'
import { cap } from '../../lib/words'
import { Door } from '../../shell/Door'
import { useToast } from '../../shell/Toast'
import './admin.css'

const pretty = (json: string) => { try { return JSON.stringify(JSON.parse(json), null, 2) } catch { return json } }
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

/** Taylor's page (docs/ALPHA-BRIEFS.md, Admin): make invite codes, and approve or turn down claims. */
export function Admin() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<OrgSummary | null>(null)
  const [uses, setUses] = useState('3')
  const [failed, setFailed] = useState(false)
  const term = q.trim()
  const { data: hits = [], isFetching } = useOrgs(term)
  const open = term.length >= 2 && !pick
  const shown = open ? hits.slice(0, 6) : []
  const { data: invites = [] } = useAdminInvites()
  const { data: claims = [] } = useAdminClaims()
  const make = useCreateInvite()
  const { data: feedback = [] } = useAdminFeedback()
  const done = useFeedbackDone()
  const actAs = useActAs()
  const navigate = useNavigate()
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
  const testAs = () => {
    if (!pick) return
    setFailed(false)
    actAs.mutate(pick.ein, {
      onSuccess: me => { toast(`You're now ${me.membership?.orgName ?? pick.name}.`); navigate('/') },
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
      {pick ? (
        <div className="admin-picked">
          <span className="admin-check" aria-hidden>✓</span>
          <span className="admin-picked-text"><span className="t">{pick.name}</span><span className="m">{cap(pick.city)}</span></span>
          <button className="admin-clear" aria-label="Clear" onClick={() => { setPick(null); setQ('') }}>×</button>
        </div>
      ) : (
        <div className="admin-search">
          <span className="search-wrap">
            <input id="adminq" type="search" autoComplete="off" placeholder="Name or EIN" value={q}
              role="combobox" aria-expanded={open} aria-controls="adminq-list" onChange={e => setQ(e.target.value)} />
          </span>
          {open && (
            <div className="admin-drop" id="adminq-list" role="listbox">
              {shown.map(o => (
                <button key={o.ein} role="option" aria-selected={false} className="admin-opt" onClick={() => setPick(o)}>
                  <span className="t">{o.name}</span>
                  <span className="m">{cap(o.city)}</span>
                </button>
              ))}
              {isFetching && !shown.length && <p className="admin-drop-note">Searching</p>}
              {!isFetching && !shown.length && <p className="admin-drop-note">Nothing by that name. Try the EIN.</p>}
            </div>
          )}
        </div>
      )}
      {pick && <button className="btn quiet" disabled={actAs.isPending} onClick={testAs}>Test as this organization</button>}
      <label className="field-label" htmlFor="uses">How many people</label>
      <input id="uses" type="number" inputMode="numeric" min={1} max={50} value={uses} onChange={e => setUses(e.target.value)} />
      {failed && <p className="error" role="alert">That didn’t work. Try again.</p>}

      {invites.map(i => (   // newest first, as the API sends them
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
            <button className="btn primary sm" disabled={approve.isPending} onClick={() => { setFailed(false); approve.mutate(c.id, { onError: () => setFailed(true) }) }}>Approve</button>
            <button className="btn quiet sm" disabled={reject.isPending} onClick={() => { setFailed(false); reject.mutate(c.id, { onError: () => setFailed(true) }) }}>Not this one</button>
          </div>
        </div>
      ))}

      <div className="label">Feedback</div>
      {feedback.length === 0 && <p className="empty">Nothing new.</p>}
      {feedback.map(f => (
        <div key={f.id} className="card fb-card">
          <span className="t">{f.message}</span>
          <span className="m">{[f.name ?? 'Signed out', f.orgName, f.page, day(f.createdAt)].filter(Boolean).join(' · ')}</span>
          {f.hasScreenshot && (
            <a href={`/api/v1/admin/feedback/${f.id}/screenshot`} target="_blank" rel="noreferrer" className="fb-shot">
              <img src={`/api/v1/admin/feedback/${f.id}/screenshot`} alt="The screen when this was sent" loading="lazy" />
            </a>
          )}
          <details className="fb-details"><summary>Details</summary><pre>{pretty(f.context)}</pre></details>
          <div className="admin-actions">
            <button className="btn quiet sm" disabled={done.isPending} onClick={() => done.mutate(f.id)}>Done</button>
          </div>
        </div>
      ))}
    </Door>
  )
}
