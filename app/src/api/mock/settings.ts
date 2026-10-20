// What the demo shows (Admin, Demo): a preset, then any setting changed on top of it. One seed (./data.ts) and these
// settings make every demo: the app's, dev:mock, and the map harness. Kept small and dependency-free: the main
// bundle reads it for the demo bar, and the Admin link that starts a demo.

export type Along = 'new' | 'mix' | 'done'
export type Others = 'none' | 'few' | 'all'

export interface DemoSettings {
  /** The preset these started from. */
  from: string
  /** Who you are: a sample organization's EIN, or 'new' to start at the invite code. */
  you: string
  /** Threads between organizations, 0 to THREAD_MAX, in the seed's order. */
  threads: number
  /** Of those threads, whether most are just started, a mix (as seeded), or most are done. */
  along: Along
  /** Threads someone else started with you, each with a message you haven't read. */
  waiting: number
  /** Other organizations' open posts on the board. */
  others: Others
  /** Your own open posts. */
  yours: number
  /** Could fit lines on the map. */
  fits: boolean
  /** Your organization's page filled in (about, website, who to ask). */
  page: boolean
  /** Long titles, every kind of help, a declined thread, a closed one, a long message. */
  hard: boolean
}

export const THREAD_MAX = 31
export const WAITING_MAX = 5
export const YOURS_MAX = 5
export const BALLARD = '911428805'

export interface Preset { id: string; name: string; hint: string; settings: DemoSettings }

const base: DemoSettings = { from: 'few', you: BALLARD, threads: 5, along: 'mix', waiting: 1, others: 'all', yours: 2, fits: true, page: false, hard: false }
const preset = (id: string, name: string, hint: string, s: Partial<DemoSettings>): Preset => ({ id, name, hint, settings: { ...base, ...s, from: id } })

export const PRESETS: Preset[] = [
  preset('few', 'A few threads', 'The usual demo. Some threads, 1 waiting on you.', {}),
  preset('new-org', 'A new organization', 'Starts at the invite code. Try RAINIER.', { you: 'new', waiting: 0, yours: 0 }),
  preset('just-joined', 'Just joined', 'Nothing posted and no threads yet.', { threads: 0, waiting: 0, yours: 0 }),
  preset('first-post', 'First post', 'You posted once. No one has answered.', { threads: 0, waiting: 0, yours: 1 }),
  preset('waiting', 'A message is waiting', 'Someone started a thread with you.', { threads: 0 }),
  preset('busy', 'Busy', 'Every thread, 3 waiting on you, a full board.', { threads: THREAD_MAX, waiting: 3, yours: 5, page: true }),
  preset('hard', 'Hard cases', 'Long titles, a declined thread, a closed one.', { hard: true, page: true }),
  preset('empty', 'Empty board', 'Nothing posted anywhere yet.', { threads: 0, waiting: 0, yours: 0, others: 'none', fits: false }),
]
export const DEFAULT_SETTINGS = PRESETS[0].settings
export const presetById = (id: string) => PRESETS.find(p => p.id === id)

const KEYS = ['you', 'threads', 'along', 'waiting', 'others', 'yours', 'fits', 'page', 'hard'] as const
const same = (a: DemoSettings, b: DemoSettings) => KEYS.every(k => a[k] === b[k])

/** What the demo bar calls these settings: the preset's name, or "Busy, changed". */
export function settingsName(s: DemoSettings): string {
  const exact = PRESETS.find(p => same(p.settings, s))
  if (exact) return exact.name
  return `${presetById(s.from)?.name ?? 'Your settings'}, changed`
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(Number.isFinite(n) ? n : 0)))
function clean(s: DemoSettings): DemoSettings {
  return {
    from: presetById(s.from) ? s.from : 'few',
    you: s.you === 'new' || /^\d{9}$/.test(s.you) ? s.you : BALLARD,
    threads: clamp(s.threads, THREAD_MAX),
    along: (['new', 'mix', 'done'] as Along[]).includes(s.along) ? s.along : 'mix',
    waiting: clamp(s.waiting, WAITING_MAX),
    others: (['none', 'few', 'all'] as Others[]).includes(s.others) ? s.others : 'all',
    yours: clamp(s.yours, YOURS_MAX),
    fits: !!s.fits, page: !!s.page, hard: !!s.hard,
  }
}

export const SETTINGS_KEY = 'mock.settings'
export function loadSettings(): DemoSettings {
  try { const raw = localStorage.getItem(SETTINGS_KEY); if (raw) return clean({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }) } catch { /* starts from the default */ }
  return DEFAULT_SETTINGS
}
export function saveSettings(s: DemoSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean(s))) } catch { /* private mode: this visit only */ }
}

/**
 * Settings from a link: ?demo=busy, then any setting on top (?demo=busy&waiting=0&you=911425676).
 * Null when the link names no preset and no setting. Only the mock and an admin's Admin page read these.
 */
export function settingsFromQuery(q: URLSearchParams): DemoSettings | null {
  if (!q.has('demo') && !KEYS.some(k => q.has(k))) return null
  const s: DemoSettings = { ...(presetById(q.get('demo') ?? '')?.settings ?? DEFAULT_SETTINGS) }
  const on = (k: string) => q.get(k) === 'on' || q.get(k) === '1' || q.get(k) === 'true'
  if (q.has('you')) s.you = q.get('you')!
  if (q.has('threads')) s.threads = Number(q.get('threads'))
  if (q.has('along')) s.along = q.get('along') as Along
  if (q.has('waiting')) s.waiting = Number(q.get('waiting'))
  if (q.has('others')) s.others = q.get('others') as Others
  if (q.has('yours')) s.yours = Number(q.get('yours'))
  if (q.has('fits')) s.fits = on('fits')
  if (q.has('page')) s.page = on('page')
  if (q.has('hard')) s.hard = on('hard')
  return clean(s)
}

/** The shortest link query for these settings: the preset, plus whatever differs from it. */
export function settingsToQuery(s: DemoSettings): string {
  const p = presetById(s.from)?.settings ?? DEFAULT_SETTINGS
  const q = new URLSearchParams({ demo: s.from })
  for (const k of KEYS) if (s[k] !== p[k]) q.set(k, typeof s[k] === 'boolean' ? (s[k] ? 'on' : 'off') : String(s[k]))
  return q.toString()
}

/** Drops the demo's keys from the address bar, so a reload doesn't start the demo over. */
export function stripSettingsFromUrl() {
  const u = new URL(window.location.href)
  for (const k of ['demo', ...KEYS]) u.searchParams.delete(k)
  window.history.replaceState(window.history.state, '', u.pathname + (u.search === '?' ? '' : u.search) + u.hash)
}
