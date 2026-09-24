// What the app knew recently, for "Send feedback" (S-93): the last pages visited, the last errors, and the last
// server calls that failed. Kept in memory only, for this page load; nothing is sent until someone sends feedback.
const MAX = 10
const pages: { at: string; page: string }[] = []
const errors: { at: string; kind: string; message: string }[] = []
const failed: { at: string; method: string; path: string; status: number; title?: string }[] = []
const now = () => new Date().toISOString()
const push = <T,>(list: T[], item: T) => { list.push(item); if (list.length > MAX) list.shift() }

export const notePage = (page: string) => push(pages, { at: now(), page })
export const noteError = (kind: string, message: string) => push(errors, { at: now(), kind, message: message.slice(0, 500) })
export const noteFailedCall = (method: string, path: string, status: number, title?: string) =>
  push(failed, { at: now(), method, path: path.replace(/\?.*$/, ''), status, title })

/** Everything we attach to a feedback note, besides the note and the picture. */
export function snapshot(extra: Record<string, unknown>) {
  const theme = document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark (system)' : 'light (system)')
  return {
    page: location.pathname + location.search,
    build: document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')?.src.split('/').pop() ?? 'dev',
    viewport: `${innerWidth}x${innerHeight}`,
    pixelRatio: devicePixelRatio,
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine,
    theme,
    at: now(),
    recentPages: [...pages],
    recentErrors: [...errors],
    failedCalls: [...failed],
    ...extra,
  }
}
