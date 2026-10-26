// Map harness: npm run dev, then open /map-dev.html. Not part of the app.
// It draws the demo's own world (src/api/mock/world.ts): the same organizations, pins and threads as the app's demo.
import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/tokens.css'
import { DEFAULT_SETTINGS, PRESETS, presetById, settingsFromQuery } from '../api/mock/settings'
import { buildWorld, mapOf } from '../api/mock/world'
import { ThreadMap, type MapSelection } from './index'
import { samplePoints } from './sample'

type Theme = 'system' | 'light' | 'dark'

// Optional query: the demo's settings (?demo=busy&threads=12, as in an /admin?demo= link), and
// ?theme=light|dark&sel=golden|progress|me&view=seattle|sound|spokane, for screenshots.
const q = new URLSearchParams(location.search)
const initialTheme = (['light', 'dark'].includes(q.get('theme') ?? '') ? q.get('theme') : 'system') as Theme
if (initialTheme !== 'system') document.documentElement.setAttribute('data-theme', initialTheme)
const initialSettings = settingsFromQuery(q) ?? DEFAULT_SETTINGS

const VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  seattle: { center: [-122.33, 47.6], zoom: 10.5 }, sound: { center: [-122.5, 47.4], zoom: 8.2 }, spokane: { center: [-117.4, 47.66], zoom: 11 },
}
const initialView = VIEWS[q.get('view') ?? '']

function Harness() {
  const points = useMemo(() => samplePoints(), [])
  const [settings, setSettings] = useState(initialSettings)
  const data = useMemo(() => mapOf(buildWorld(settings), settings.fits), [settings])
  const me = settings.you === 'new' ? undefined : settings.you
  const golden = data.threads.find(t => t.status === 'Completed')?.id
  const progress = data.threads.find(t => t.status === 'Accepted')?.id
  const [sel, setSel] = useState<MapSelection | null>(() => {
    const s = q.get('sel')
    if (s === 'golden' && golden) return { kind: 'thread', id: golden }
    if (s === 'progress' && progress) return { kind: 'thread', id: progress }
    if (s === 'me' && me) return { kind: 'org', id: me }
    return null
  })
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const applyTheme = (t: Theme) => {
    setTheme(t)
    if (t === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', t)
  }
  const thread = sel?.kind === 'thread' ? data.threads.find(t => t.id === sel.id) : undefined
  const label = !sel ? 'Nothing selected'
    : sel.kind === 'org' ? data.members.find(o => o.ein === sel.id)?.name
    : thread ? `${thread.title} (${thread.status})` : 'Nothing selected'
  const btn = (on: boolean) => ({
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12, fontWeight: 600,
    background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink)',
  })
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <ThreadMap initialView={initialView} data={data} points={points} me={me} selected={sel} onSelect={setSel} />
      <div style={{ position: 'absolute', top: 'calc(8px + var(--safe-top))', left: 8, right: 8, display: 'flex', flexWrap: 'wrap', gap: 6, pointerEvents: 'none' }}>
        <select aria-label="Demo" style={{ ...btn(false), pointerEvents: 'auto' }} value={settings.from}
          onChange={e => { setSel(null); setSettings(presetById(e.target.value)!.settings) }}>
          {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(['system', 'light', 'dark'] as Theme[]).map(t => (
          <button key={t} style={{ ...btn(theme === t), pointerEvents: 'auto' }} onClick={() => applyTheme(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
        {golden && <button style={{ ...btn(sel?.kind === 'thread' && sel.id === golden), pointerEvents: 'auto' }} onClick={() => setSel({ kind: 'thread', id: golden })}>Golden thread</button>}
        {progress && <button style={{ ...btn(sel?.kind === 'thread' && sel.id === progress), pointerEvents: 'auto' }} onClick={() => setSel({ kind: 'thread', id: progress })}>In progress</button>}
        {me && <button style={{ ...btn(sel?.kind === 'org' && sel.id === me), pointerEvents: 'auto' }} onClick={() => setSel({ kind: 'org', id: me })}>My org</button>}
        <button style={{ ...btn(false), pointerEvents: 'auto' }} onClick={() => setSel(null)}>Clear</button>
        <span style={{ ...btn(false), fontWeight: 400, color: 'var(--ink-2)' }}>{data.threads.length} threads · {label}</span>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Harness /></StrictMode>)
