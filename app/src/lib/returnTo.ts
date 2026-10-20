/**
 * The link you opened before you were in (S-107): a shared post, an organization, an inbox. The front door
 * (sign in, invite code, find yours, waiting) runs as always; once you're confirmed you land there, not on the board.
 *
 * Kept in sessionStorage, and in localStorage with a timestamp so it survives a closed tab while you wait for
 * approval (which can arrive on a later visit). Expires after 7 days. Only paths inside the app are kept or
 * followed: never an absolute or protocol-relative URL, so it can't be used to send anyone off-site.
 */
const KEY = 'returnTo'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** The front door and the pages open to anyone: nothing to come back to. */
const NOT_KEPT = /^\/(signup|invite|find|waiting|privacy|terms)(\/|\?|#|$)/

/** An in-app path: one leading "/", no scheme, no host, no backslashes or control characters. */
export function isReturnPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length > 2000) return false
  if (!path.startsWith('/') || path.startsWith('//')) return false
  // Browsers treat "\" like "/" ("/\evil.example" is off-site), and control characters can hide either.
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return false
  // Home, with or without a query (a demo link like /?demo=new-org), is where you land anyway.
  if (/^\/([?#]|$)/.test(path) || NOT_KEPT.test(path)) return false
  return true
}

type Saved = { path: string; at: number }

function read(store: () => Storage): Saved | null {
  try {
    const raw = store().getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Saved>
    return isReturnPath(v.path) && typeof v.at === 'number' ? { path: v.path, at: v.at } : null
  } catch { return null }
}

function write(store: () => Storage, value: string | null) {
  try {
    if (value === null) store().removeItem(KEY)
    else store().setItem(KEY, value)
  } catch { /* private mode or storage blocked: you land on the board, as before */ }
}

const session = () => window.sessionStorage
const local = () => window.localStorage

/** Remember where you were going. Ignores anything that isn't an in-app path. */
export function rememberReturn(path: string) {
  if (!isReturnPath(path)) return
  const value = JSON.stringify({ path, at: Date.now() } satisfies Saved)
  write(session, value)
  write(local, value)
}

/** Where you were going, if anywhere: this tab's first, then a recent one from an earlier visit. */
export function peekReturn(): string | null {
  const saved = read(session) ?? read(local)
  if (!saved) return null
  const age = Date.now() - saved.at
  return age >= 0 && age < MAX_AGE_MS ? saved.path : null
}

export function forgetReturn() {
  write(session, null)
  write(local, null)
}
