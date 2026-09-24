import { Component, type ReactNode } from 'react'
import { reportError } from '../lib/report'
import { openFeedback } from './Feedback'

/** If a screen crashes, say so and offer a reload, instead of a blank page. The error goes to the server log. */
export class Crashed extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { reportError('crash', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="boot">
        <p className="empty">That didn’t work. <button className="inline-link" onClick={() => window.location.reload()}>Reload the page</button> or <button className="inline-link" onClick={openFeedback}>tell us what happened</button>.</p>
      </div>
    )
  }
}
