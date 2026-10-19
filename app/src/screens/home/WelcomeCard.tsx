import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Listing } from '../../api'

const HIDE = (ein: string) => `helpbook.welcome.hidden.${ein}`
const hidden = (ein: string) => { try { return localStorage.getItem(HIDE(ein)) === '1' } catch { return false } }

/**
 * Welcome card (docs/ALPHA-BRIEFS.md, approved in PR #6). On Home (S-126) until your organization has an open need
 * and an open offer. It keys off your posts, so there is nothing to reset. "Not now" hides it on this device.
 * Home has no green button, so both posts are plain buttons here. `otherwise` shows when the card doesn't.
 */
export function WelcomeCard({ ein, mine, otherwise }: { ein: string; mine: Listing[] | undefined; otherwise?: ReactNode }) {
  const [gone, setGone] = useState(() => hidden(ein))
  if (!mine) return null
  const hasNeed = mine.some(l => l.kind === 'Need')
  const hasOffer = mine.some(l => l.kind === 'Offer')
  if (gone || (hasNeed && hasOffer)) return otherwise ?? null

  const notNow = () => { try { localStorage.setItem(HIDE(ein), '1') } catch { /* private mode: this visit only */ } setGone(true) }
  return (
    <section className="card welcome" aria-labelledby="welcome-h">
      <h2 id="welcome-h" className="welcome-h">Start with one need, one offer</h2>
      <p className="welcome-line">
        Post one thing you need and one thing you could give. When another organization helps, it becomes a golden thread on <Link className="inline-link" to="/map">the map</Link>.
      </p>
      <div className="welcome-actions">
        {!hasNeed && <Link className="btn" to="/post">Post a need</Link>}
        {!hasOffer && <Link className="btn" to="/post?kind=Offer">Post an offer</Link>}
      </div>
      <button className="inline-link welcome-later" onClick={notNow}>Not now</button>
    </section>
  )
}
