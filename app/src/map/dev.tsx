// Map harness: npm run dev, then open /map-dev.html. Not part of the app.
import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/tokens.css'
import { ThreadMap, type MapSelection } from './index'
import { SAMPLE_ACCEPTED_ID, SAMPLE_DATA, SAMPLE_GOLDEN_ID, SAMPLE_ME, samplePoints } from './sample'

type Theme = 'system' | 'light' | 'dark'

// Optional query: ?theme=light|dark&sel=golden|progress|me, for screenshots.
const q = new URLSearchParams(location.search)
const initialTheme = (['light', 'dark'].includes(q.get('theme') ?? '') ? q.get('theme') : 'system') as Theme
if (initialTheme !== 'system') document.documentElement.setAttribute('data-theme', initialTheme)
const initialSel: MapSelection | null = ({
  golden: { kind: 'thread', id: SAMPLE_GOLDEN_ID }, progress: { kind: 'thread', id: SAMPLE_ACCEPTED_ID }, me: { kind: 'org', id: SAMPLE_ME },
} as Record<string, MapSelection>)[q.get('sel') ?? ''] ?? null

const VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  seattle: { center: [-122.33, 47.6], zoom: 10.5 }, sound: { center: [-122.5, 47.4], zoom: 8.2 }, spokane: { center: [-117.4, 47.66], zoom: 11 },
}
const initialView = VIEWS[q.get('view') ?? '']

function Harness() {
  const points = useMemo(() => samplePoints(), [])
  const [sel, setSel] = useState<MapSelection | null>(initialSel)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const applyTheme = (t: Theme) => {
    setTheme(t)
    if (t === 'system') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', t)
  }
  const label = sel
    ? sel.kind === 'org' ? SAMPLE_DATA.members.find(o => o.ein === sel.id)?.name
    : `${SAMPLE_DATA.threads.find(t => t.id === sel.id)?.title} (${SAMPLE_DATA.threads.find(t => t.id === sel.id)?.status})`
    : 'Nothing selected'
  const btn = (on: boolean) => ({
    padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12, fontWeight: 600,
    background: on ? 'var(--ink)' : 'var(--paper)', color: on ? 'var(--paper)' : 'var(--ink)',
  })
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <ThreadMap initialView={initialView} data={SAMPLE_DATA} points={points} me={SAMPLE_ME} selected={sel} onSelect={setSel} />
      <div style={{ position: 'absolute', top: 'calc(8px + var(--safe-top))', left: 8, right: 8, display: 'flex', flexWrap: 'wrap', gap: 6, pointerEvents: 'none' }}>
        {(['system', 'light', 'dark'] as Theme[]).map(t => (
          <button key={t} style={{ ...btn(theme === t), pointerEvents: 'auto' }} onClick={() => applyTheme(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
        <button style={{ ...btn(sel?.kind === 'thread' && sel.id === SAMPLE_GOLDEN_ID), pointerEvents: 'auto' }} onClick={() => setSel({ kind: 'thread', id: SAMPLE_GOLDEN_ID })}>Golden thread</button>
        <button style={{ ...btn(sel?.kind === 'thread' && sel.id === SAMPLE_ACCEPTED_ID), pointerEvents: 'auto' }} onClick={() => setSel({ kind: 'thread', id: SAMPLE_ACCEPTED_ID })}>In progress</button>
        <button style={{ ...btn(sel?.kind === 'org' && sel.id === SAMPLE_ME), pointerEvents: 'auto' }} onClick={() => setSel({ kind: 'org', id: SAMPLE_ME })}>My org</button>
        <button style={{ ...btn(false), pointerEvents: 'auto' }} onClick={() => setSel(null)}>Clear</button>
        <span style={{ ...btn(false), fontWeight: 400, color: 'var(--ink-2)' }}>{label}</span>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Harness /></StrictMode>)
