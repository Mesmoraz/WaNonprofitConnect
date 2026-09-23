import { useEffect, useRef, useState } from 'react'

// The slice of Google Identity Services we use. https://developers.google.com/identity/gsi/web/reference/js-reference
interface GsiCredentialResponse { credential: string }
interface GsiButtonOptions { type?: 'standard' | 'icon'; theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'; shape?: 'rectangular' | 'pill'; width?: number; logo_alignment?: 'left' | 'center' }
interface Gsi {
  accounts: { id: {
    initialize(opts: { client_id: string; callback: (r: GsiCredentialResponse) => void; ux_mode?: 'popup' | 'redirect'; auto_select?: boolean }): void
    renderButton(el: HTMLElement, opts: GsiButtonOptions): void
  } }
}
declare global { interface Window { google?: Gsi } }

const SRC = 'https://accounts.google.com/gsi/client'
let loading: Promise<Gsi> | null = null
function loadGsi(): Promise<Gsi> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SRC; s.async = true; s.defer = true
      s.onload = () => window.google ? resolve(window.google) : reject(new Error('Google sign-in did not load'))
      s.onerror = () => { loading = null; reject(new Error('Google sign-in did not load')) }
      document.head.appendChild(s)
    })
  }
  return loading
}

/** Google's own "Sign in with Google" button (GIS renders it; its words come from Google). Hands the ID token up. */
export function GoogleButton({ clientId, onToken, onError }: { clientId: string; onToken: (idToken: string) => void; onError: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const cb = useRef(onToken); cb.current = onToken
  const err = useRef(onError); err.current = onError

  useEffect(() => {
    let cancelled = false
    loadGsi().then(g => {
      if (cancelled || !ref.current) return
      g.accounts.id.initialize({ client_id: clientId, callback: r => cb.current(r.credential), ux_mode: 'popup' })
      const width = Math.min(400, Math.max(200, Math.round(ref.current.getBoundingClientRect().width)))
      g.accounts.id.renderButton(ref.current, { type: 'standard', theme: 'filled_black', size: 'large', text: 'signin_with', shape: 'rectangular', width, logo_alignment: 'center' })
      setReady(true)
    }).catch(() => { if (!cancelled) err.current() })
    return () => { cancelled = true }
  }, [clientId])

  return <div ref={ref} className="google-btn" data-ready={ready} />
}
