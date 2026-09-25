import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MOCK, useDevSignIn, useGoogleSignIn } from '../../api'
import { BRAND } from '../../brand'
import { Door } from '../../shell/Door'
import { GoogleButton } from './GoogleButton'
import './signup.css'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
/** Development only: with no Google client id, sign in by email through POST /api/v1/auth/dev. */
const DEV_FORM = !CLIENT_ID && (import.meta.env.DEV || MOCK)

/** Screen 1, Sign up. Approved copy from the prototype; nonprofits only in the alpha, so no role picker. */
export function SignUp() {
  const google = useGoogleSignIn()
  const dev = useDevSignIn()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [failed, setFailed] = useState(false)

  const submitDev = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setFailed(false)
    dev.mutate({ email: email.trim(), name: name.trim() }, { onError: () => setFailed(true) })
  }

  return (
    <Door cta={DEV_FORM ? <button className="btn primary" type="submit" form="dev-signin" disabled={!email.trim() || dev.isPending}>Sign in</button> : undefined}>
      <div className="door-space" />
      <h1 className="h center">Join {BRAND.name}</h1>
      <p className="sub center">{BRAND.tagline}</p>
      <div className="signup-gap" />

      {CLIENT_ID && (
        <GoogleButton
          clientId={CLIENT_ID}
          onToken={t => { setFailed(false); google.mutate(t, { onError: () => setFailed(true) }) }}
          onError={() => setFailed(true)}
        />
      )}

      {DEV_FORM && (
        <form id="dev-signin" className="dev-form" onSubmit={submitDev}>
          <p className="demo">Demo: sign in as</p>
          <label className="visually-hidden" htmlFor="dev-email">Email</label>
          <input id="dev-email" type="email" placeholder="you@yourorganization.org" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label className="visually-hidden" htmlFor="dev-name">Your name</label>
          <input id="dev-name" placeholder="Your name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
        </form>
      )}

      {failed && <p className="error center" role="alert">That didn’t work. Try again.</p>}
      <p className="hint center signup-free">Free. No forms. Your organization is already here.</p>
      <p className="hint center signup-legal">By signing in you agree to <Link to="/terms">the terms</Link> and <Link to="/privacy">the privacy page</Link>.</p>
    </Door>
  )
}
