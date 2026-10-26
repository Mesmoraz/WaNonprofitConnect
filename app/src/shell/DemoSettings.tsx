import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import { ORG_ROWS } from '../api/mock/names'
import {
  PRESETS, settingsName, THREAD_MAX, WAITING_MAX, YOURS_MAX, type Along, type DemoSettings, type Others,
} from '../api/mock/settings'
import './confirm.css'
import './demo.css'

const ORGS = ORG_ROWS.map(([ein, name]) => ({ ein, name })).sort((a, b) => a.name.localeCompare(b.name))
const COUNT = (max: number) => Array.from({ length: max + 1 }, (_, i) => i)

/** One row of chips, one of them picked. */
function Pick<T extends string | number | boolean>({ id, label, hint, options, value, onPick }: {
  id: string; label: string; hint?: string; options: [T, string][]; value: T; onPick: (v: T) => void
}) {
  return (
    <div className="demo-field">
      <span className="field-label" id={`${id}-label`}>{label}</span>
      {hint && <p className="hint" id={`${id}-hint`}>{hint}</p>}
      <div className="chips" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined}>
        {options.map(([v, text]) => (
          <button key={String(v)} role="radio" aria-checked={value === v} className={`chip${value === v ? ' on' : ''}`} onClick={() => onPick(v)}>{text}</button>
        ))}
      </div>
    </div>
  )
}

/** The demo's settings: a preset to start from, then each setting. Admin's Demo section, and the sheet in the demo. */
export function DemoSettingsPanel({ value, onChange }: { value: DemoSettings; onChange: (s: DemoSettings) => void }) {
  const set = <K extends keyof DemoSettings>(k: K) => (v: DemoSettings[K]) => onChange({ ...value, [k]: v })
  const name = settingsName(value)
  return (
    <div className="demo-panel">
      <span className="field-label" id="demo-preset-label">Start from</span>
      <div className="demo-presets" role="radiogroup" aria-labelledby="demo-preset-label">
        {PRESETS.map(p => {
          const on = p.name === name
          return (
            <button key={p.id} role="radio" aria-checked={on} className={`card tap demo-preset${on ? ' sel' : ''}`} onClick={() => onChange(p.settings)}>
              <span className="t">{p.name}</span>
              <span className="m">{p.hint}</span>
            </button>
          )
        })}
      </div>

      <div className="demo-field">
        <label className="field-label" htmlFor="demo-you">You are</label>
        <select id="demo-you" value={value.you} onChange={e => set('you')(e.target.value)}>
          <option value="new">A new organization, at the invite code</option>
          {ORGS.map(o => <option key={o.ein} value={o.ein}>{o.name}</option>)}
        </select>
      </div>

      <div className="demo-field">
        <label className="field-label" htmlFor="demo-threads">Threads on the map <span className="demo-n">{value.threads} of {THREAD_MAX}</span></label>
        <input id="demo-threads" type="range" min={0} max={THREAD_MAX} value={value.threads} onChange={e => set('threads')(Number(e.target.value))} />
      </div>
      <Pick<Along> id="demo-along" label="How far along" value={value.along} onPick={set('along')}
        options={[['new', 'Mostly new'], ['mix', 'A mix'], ['done', 'Mostly done']]} />
      <Pick<number> id="demo-waiting" label="Waiting on you" hint="Threads someone started with you, with a message you haven't read." value={value.waiting} onPick={set('waiting')}
        options={COUNT(WAITING_MAX).map(n => [n, String(n)])} />
      <Pick<Others> id="demo-others" label="Posts from others" value={value.others} onPick={set('others')}
        options={[['none', 'None'], ['few', 'A few'], ['all', 'All']]} />
      <Pick<number> id="demo-yours" label="Your posts" value={value.yours} onPick={set('yours')}
        options={COUNT(YOURS_MAX).map(n => [n, String(n)])} />
      <Pick<boolean> id="demo-fits" label="Could fit lines on the map" value={value.fits} onPick={set('fits')}
        options={[[false, 'Off'], [true, 'On']]} />
      <Pick<boolean> id="demo-page" label="Your organization page" value={value.page} onPick={set('page')}
        options={[[false, 'Blank'], [true, 'Filled in']]} />
      <Pick<boolean> id="demo-hard" label="Hard cases" hint="Long titles, a declined thread, a closed one, a long message." value={value.hard} onPick={set('hard')}
        options={[[false, 'Off'], [true, 'On']]} />

      <p className="hint">Now: {name}.</p>
    </div>
  )
}

/** In the demo: the same settings over the screen. Nothing changes until Show this demo (S-145); then the demo starts over with them. */
export function DemoSettingsSheet({ value, onChange, onClose }: { value: DemoSettings; onChange: (s: DemoSettings) => void; onClose: () => void }) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState(value)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const show = () => {
    setFailed(false)
    setBusy(true)
    api.demoSettings(draft).then(
      () => { onChange(draft); qc.invalidateQueries(); onClose() },
      () => { setBusy(false); setFailed(true) },
    )
  }
  return (
    <div className="confirm-scrim" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="confirm-box demo-sheet" role="dialog" aria-modal="true" aria-labelledby="demo-title">
        <h2 id="demo-title" className="confirm-title">Demo settings</h2>
        <p className="hint">Pick what to show, then tap Show this demo. What you did in the demo starts over. Only you see this.</p>
        <DemoSettingsPanel value={draft} onChange={setDraft} />
        {failed && <p className="error" role="alert">That didn’t work. Try again.</p>}
        <div className="confirm-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy} onClick={show}>Show this demo</button>
        </div>
      </div>
    </div>
  )
}
