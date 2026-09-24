import { useEffect, useRef } from 'react'
import './confirm.css'

interface Props {
  title: string
  body: string
  confirm: string
  cancel: string
  /** Red confirm button, for something that can't be undone. */
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** A confirmation box over the screen. Escape or a tap outside cancels; focus starts on the safe choice. */
export function Confirm({ title, body, confirm, cancel, danger, busy, onConfirm, onCancel }: Props) {
  const safe = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef(onCancel)
  cancelRef.current = onCancel
  useEffect(() => {
    safe.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelRef.current() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [])

  return (
    <div className="confirm-scrim" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body">
        <h2 id="confirm-title" className="confirm-title">{title}</h2>
        <p id="confirm-body" className="confirm-body">{body}</p>
        <div className="confirm-actions">
          <button ref={safe} className="btn" onClick={onCancel}>{cancel}</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} disabled={busy}>{confirm}</button>
        </div>
      </div>
    </div>
  )
}
