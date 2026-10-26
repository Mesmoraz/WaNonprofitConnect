import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, MOCK, useRedeemInvite } from '../../api'
import { Door } from '../../shell/Door'
import { useToast } from '../../shell/Toast'

// Copy: docs/ALPHA-BRIEFS.md, Invite code.
export function Invite() {
  // In the demo the sample code is already filled in (S-145): a real code doesn't work there.
  const [code, setCode] = useState(MOCK ? 'RAINIER' : '')
  const redeem = useRedeemInvite()
  const navigate = useNavigate()
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setError(null)
    redeem.mutate(code.trim(), {
      onSuccess: me => {
        // Approved in the prototype: the welcome line after confirming.
        if (me.membership) toast(`You’re in. Welcome, ${me.membership.orgName.replace(/\.$/, '')}.`)
        navigate('/', { replace: true })
      },
      onError: err => setError(err instanceof ApiError && err.status < 500
        ? 'That code didn’t work. Check it and try again.'   // Not in the briefs: needs approval
        : 'That didn’t work. Try again.'),                   // Not in the briefs: needs approval
    })
  }

  return (
    <Door who cta={<button className="btn primary" type="submit" form="invite" disabled={!code.trim() || redeem.isPending}>Join</button>}>
      <h1 className="h">Your invite code</h1>
      <p className="sub">It came in the message that invited you.</p>
      <form id="invite" onSubmit={submit}>
        <label className="field-label" htmlFor="invite-code">Invite code</label>
        <input id="invite-code" value={code} onChange={e => setCode(e.target.value)} autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} enterKeyHint="go" />
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {MOCK && <p className="demo">Demo: try RAINIER.</p>}
      <Link className="link block" to="/find">No code? Find your organization</Link>
    </Door>
  )
}
