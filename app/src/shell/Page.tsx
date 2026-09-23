import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/** A screen inside the shell with its one action pinned to the bottom of the content area. */
export function Page({ cta, className, children }: { cta?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={`page${className ? ` ${className}` : ''}`}>
      <div className="screen page-body">{children}</div>
      {cta && <div className="cta-bar page-cta">{cta}</div>}
    </div>
  )
}

/** "← Back": the previous screen if there is one in this visit, otherwise `fallback`. */
export function BackLink({ fallback = '/' }: { fallback?: string }) {
  const navigate = useNavigate()
  const canGoBack = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0
  return (
    <a className="back" href={fallback} onClick={e => { e.preventDefault(); if (canGoBack) navigate(-1); else navigate(fallback) }}>← Back</a>
  )
}
