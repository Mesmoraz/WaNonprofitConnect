import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../brand'
import { WhoButton } from './WhoButton'
import './shell.css'

interface Props {
  /** Where "← Back" goes. With no back, the top bar shows the name. */
  back?: string
  /** Show your name at the right (signed in, not yet confirmed), so you can sign out. */
  who?: boolean
  /** The one green button, pinned to the bottom. */
  cta?: ReactNode
  children: ReactNode
}

/** The front-door frame: a top bar, the screen, and the pinned action. */
export function Door({ back, who, cta, children }: Props) {
  return (
    <div className="door">
      <div className="door-top">
        {back ? <Link className="back" to={back}>← Back</Link> : <span className="logo">{BRAND.name}</span>}
        {who && <WhoButton />}
      </div>
      <div className="door-body">{children}</div>
      {cta && <div className="cta-bar">{cta}</div>}
    </div>
  )
}
