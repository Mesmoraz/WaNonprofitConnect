import { useEffect, useState } from 'react'

/**
 * Shown while a screen is still loading. Usually a blink; after a quiet hour the database wakes first and it can
 * take a minute, which looked like a blank, broken page (Taylor, Sep 24). After 2 seconds, say so (S-106).
 */
export function Slow() {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSlow(true), 2000); return () => clearTimeout(t) }, [])
  return slow ? <p className="empty" role="status">Waking up. The first visit in a while can take a minute.</p> : null
}
