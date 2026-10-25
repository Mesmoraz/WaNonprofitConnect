import { useEffect, useState, type RefObject } from 'react'

// Colors come from src/styles/tokens.css at runtime, so light, dark and a forced data-theme all work.
export type RGBA = [number, number, number, number]

export interface MapTheme {
  dark: boolean
  ground: RGBA; paper: RGBA; ink: RGBA; ink2: RGBA; ink3: RGBA
  need: RGBA; offer: RGBA; golden: RGBA; goldenGlow: RGBA
  /** The base map's own colors: land, water, parks and woods, region dots. */
  land: RGBA; water: RGBA; park: RGBA; dot: RGBA
  /** Stable string, handy as a memo key. */
  key: string
}

const FALLBACK: Record<string, string> = {
  '--ground': '#E9ECE6', '--paper': '#FFFFFF', '--ink': '#1B2430', '--ink-2': '#4B5563', '--ink-3': '#7C8794',
  '--need': '#B8741A', '--offer': '#2E6B4E', '--thread-golden': '#D9A12B', '--thread-golden-glow': '#F2C14E',
  '--map-land': '#F4F1EA', '--map-water': '#CFE0E3', '--map-park': '#E3EBDD', '--map-dot': '#5E6B78',
}

export function parseColor(input: string): RGBA | null {
  const s = input.trim()
  let m = /^#([0-9a-f]{3,8})$/i.exec(s)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('')
    if (h.length !== 6 && h.length !== 8) return null
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
    return [n(0), n(2), n(4), h.length === 8 ? n(6) : 255]
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(s)
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    if (p.length < 3 || p.some(Number.isNaN)) return null
    return [p[0], p[1], p[2], p.length > 3 ? Math.round((p[3] <= 1 ? p[3] : p[3] / 100) * 255) : 255]
  }
  return null
}

const luminance = ([r, g, b]: RGBA) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

export function readTheme(el: Element = document.documentElement): MapTheme {
  const cs = getComputedStyle(el)
  const get = (name: string): RGBA => parseColor(cs.getPropertyValue(name)) ?? parseColor(FALLBACK[name])!
  const t = {
    ground: get('--ground'), paper: get('--paper'), ink: get('--ink'), ink2: get('--ink-2'), ink3: get('--ink-3'),
    need: get('--need'), offer: get('--offer'), golden: get('--thread-golden'), goldenGlow: get('--thread-golden-glow'),
    land: get('--map-land'), water: get('--map-water'), park: get('--map-park'), dot: get('--map-dot'),
  }
  const dark = luminance(t.land) < 0.35
  return { ...t, dark, key: JSON.stringify(t) }
}

/** Re-reads the tokens when the OS scheme flips or someone sets data-theme / class / style on <html>. */
export function useMapTheme(ref: RefObject<Element | null>): MapTheme {
  const [theme, setTheme] = useState<MapTheme>(() => readTheme())
  useEffect(() => {
    const update = () => {
      const next = readTheme(ref.current ?? document.documentElement)
      setTheme(prev => (prev.key === next.key ? prev : next))
    }
    update()
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })
    return () => { mq.removeEventListener('change', update); mo.disconnect() }
  }, [ref])
  return theme
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export const withAlpha = (c: RGBA, a: number): RGBA => [c[0], c[1], c[2], Math.round(Math.max(0, Math.min(1, a)) * 255)]
