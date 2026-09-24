import { noteError } from './telemetry'
// Browser errors go to the server log (POST /api/v1/client-errors), so a broken screen on someone's phone reaches us
// without them having to tell us. At most 5 per page load, each distinct message once. Never throws.
const BUILD = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src.split('/').pop() ?? 'dev'
const seen = new Set<string>()

export function reportError(kind: string, err: unknown) {
  try {
    const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err))
    noteError(kind, e.message)
    const key = `${kind}:${e.message}`
    if (seen.has(key) || seen.size >= 5) return
    seen.add(key)
    const body = JSON.stringify({ kind, message: e.message, stack: e.stack ?? '', url: location.pathname, build: BUILD })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/v1/client-errors', blob)) {
      fetch('/api/v1/client-errors', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
    }
  } catch { /* reporting must never break the app */ }
}

/** Script errors and unhandled promise rejections anywhere on the page. */
export function watchForErrors() {
  window.addEventListener('error', e => reportError('error', e.error ?? e.message))
  window.addEventListener('unhandledrejection', e => reportError('rejection', e.reason))
}
