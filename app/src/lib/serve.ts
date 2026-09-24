import { useCallback, useState } from 'react'

// "Who they serve" (S-88, approved by Taylor Sep 24): 12 groups, read from the IRS cause code (NTEE).
// Strict (Taylor, Sep 24: laptops showed under Food): with groups picked, only organizations serving one of them
// show. The rest, including ones with no code, wait behind "{n} more outside your filters. Show them".
export const SERVE_GROUPS = [
  'Children and youth', 'Education', 'Food', 'Housing', 'Health', 'Families', 'The elderly', 'Veterans',
  'Communities facing barriers', 'Environment', 'Animals', 'Arts and culture',
] as const
export type ServeGroup = typeof SERVE_GROUPS[number]

const BY_MAJOR: Partial<Record<string, ServeGroup>> = {
  O: 'Children and youth', B: 'Education', K: 'Food', L: 'Housing', E: 'Health', F: 'Health', G: 'Health', H: 'Health',
  R: 'Communities facing barriers', C: 'Environment', D: 'Animals', A: 'Arts and culture',
}

/** The groups an organization serves, from its cause code: a major group letter, or a few specific codes (P30, W30...). */
export function servedBy(ntee: string | null | undefined): ServeGroup[] {
  const code = (ntee ?? '').toUpperCase()
  if (!code) return []
  const out = new Set<ServeGroup>()
  const major = BY_MAJOR[code[0]]
  if (major) out.add(major)
  const three = code.slice(0, 3)
  if (/^P3[0-3]$/.test(three)) out.add('Children and youth')
  if (/^P4[0-6]$/.test(three)) out.add('Families')
  if (three === 'P75' || three === 'P81') out.add('The elderly')
  if (three === 'W30') out.add('Veterans')
  if (three === 'P84') out.add('Communities facing barriers')
  return [...out]
}

/** A post shows if you picked nothing, or its organization serves a group you picked. */
export const passes = (picked: ServeGroup[], ntee: string | null | undefined) =>
  !picked.length || servedBy(ntee).some(g => picked.includes(g))

/**
 * Your picks, remembered on this device per organization (not yet on your account: that needs a database change).
 * Until you change them, they start from your own organization's cause code.
 */
export function useServeFilter(myEin: string | undefined, myNtee: string | null | undefined) {
  const key = myEin ? `helpbook.serve.${myEin}` : ''
  const read = (): ServeGroup[] | null => {
    if (!key) return null
    try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as ServeGroup[]).filter(g => SERVE_GROUPS.includes(g)) : null } catch { return null }
  }
  const [stored, setStored] = useState<ServeGroup[] | null>(read)
  const picked = stored ?? servedBy(myNtee)
  const save = useCallback((next: ServeGroup[]) => {
    setStored(next)
    try { if (key) localStorage.setItem(key, JSON.stringify(next)) } catch { /* private mode: this visit only */ }
  }, [key])
  return {
    picked,
    toggle: (g: ServeGroup) => save(picked.includes(g) ? picked.filter(x => x !== g) : [...picked, g]),
    clear: () => save([]),
  }
}
