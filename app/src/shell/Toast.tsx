import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const ToastContext = createContext<(text: string) => void>(() => {})

/** One short line at the bottom that clears itself after a few seconds, or when tapped. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null)
  const show = useCallback((t: string) => setText(t), [])
  useEffect(() => {
    if (!text) return
    const timer = setTimeout(() => setText(null), 4000)
    return () => clearTimeout(timer)
  }, [text])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {text && <div className="toast" role="status" onClick={() => setText(null)}>{text}</div>}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
