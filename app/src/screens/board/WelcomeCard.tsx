import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Listing } from '../../api'

const HIDE = (ein: string) => `helpbook.welcome.hidden.${ein}`
const hidden = (ein: string) => { try { return localStorage.getItem(HIDE(ein)) === '1' } catch { return false } }

/**
 * Welcome card (docs/ALPHA-BRIEFS.md, approved in PR #6). Top of the board until your organization has an open need
 * and an open offer. It keys off your posts, so there is nothing to reset. "Not now" hides it on this device.
 */
export function WelcomeCard({ ein, mine }: { ein: string; mine: Listing[] | undefined }) {
  const [gone, setGone] = useState(() => hidden(ein))
  if (!mine || gone) return null
  const hasNeed = mine.some(l => l.kind === 'Need')
  const hasOffer = mine.some(l => l.kind === 'Offer')
  if (hasNeed && hasOffer) return null

  const notNow = () => { try { localStorage.setItem(HIDE(ein), '1') } catch { /* private mode: this visit only */ } setGone(true) }
  return (
    <section className="card welcome" aria-labelledby="welcome-h">
      <h2 id="welcome-h" className="welcome-h">Start with one need, one offer</h2>
      <p className="welcome-line">
        Post one thing you need and one thing you could give. When another organization helps, it becomes a golden thread on <Link className="inline-link" to="/map">the map</Link>.
      </p>
      <div className="welcome-actions">
        {!hasNeed && <Link className="btn primary" to="/post">Post a need</Link>}
        {!hasOffer && <Link className={`btn${hasNeed ? ' primary' : ''}`} to="/post?kind=Offer">Post an offer</Link>}
      </div>
      <button className="inline-link welcome-later" onClick={notNow}>Not now</button>
    </section>
  )
}
