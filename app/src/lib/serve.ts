import { useFilters, useSaveFilters } from '../api'

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

// About 1 in 5 WA charities has no cause code (the real Ballard Food Bank among them), and many more have one that
// none of the 12 groups cover. For those, the name is the
// best clue we have. Only plain, unambiguous words; a wrong guess is one tap to switch off.
const BY_NAME: [RegExp, ServeGroup][] = [
  [/\bFOOD (BANK|PANTRY|SHARE|LIFELINE)|\bMEALS?\b/, 'Food'],
  [/\bHOUSING\b|\bHABITAT FOR HUMANITY|\bSHELTER\b|\bHOMELESS/, 'Housing'],
  [/\bPTS?A\b|\bPTO\b|\bSCHOOLS?\b|\bACADEMY\b|\bLIBRARY FOUNDATION|\bSCHOLARSHIP/, 'Education'],
  [/\bYOUTH\b|\bKIDS?\b|\bCHILDREN'?S?\b|\bBOYS (&|AND) GIRLS|\bLITTLE LEAGUE|\bSCOUTS?\b/, 'Children and youth'],
  [/\bVETERANS?\b|\bVFW\b|\bAMERICAN LEGION/, 'Veterans'],
  [/\bSENIORS?\b|\bELDERS?\b|\bAGING\b/, 'The elderly'],
  [/\bHUMANE\b|\bANIMALS?\b|\bSPCA\b|\bPETS?\b|\bRESCUE\b|\bWILDLIFE\b/, 'Animals'],
  [/\bARTS?\b|\bMUSEUM\b|\bTHEAT(RE|ER)\b|\bSYMPHONY\b|\bCHOIR\b|\bOPERA\b|\bBALLET\b/, 'Arts and culture'],
  [/\bCONSERVA(NCY|TION)\b|\bWATERSHED\b|\bENVIRONMENT|\bLAND TRUST|\bSALMON\b/, 'Environment'],
  [/\bCLINIC\b|\b(COMMUNITY|MENTAL|PUBLIC|FREE) HEALTH\b|\bHEALTH (CENTER|CLINIC|CARE)\b|\bHOSPICE\b|\bHOSPITAL\b/, 'Health'],
  [/\bFAMILY (SERVICES|SUPPORT|CENTER|RESOURCES?|PROMISE)\b|\bFAMILIES\b|\bPARENTS?\b/, 'Families'],  // not "FAMILY FOUNDATION": that's a private funder
  [/\bIMMIGRANTS?\b|\bREFUGEES?\b|\bCIVIL RIGHTS\b|\bTRIBAL\b|\bINDIGENOUS\b/, 'Communities facing barriers'],
]

/**
 * The groups an organization serves: from its cause code (a major group letter, or a few specific codes like
 * P30 and W30), or, when the code gives none, from words in its name.
 */
export function servedBy(ntee: string | null | undefined, name?: string | null): ServeGroup[] {
  const fromCode = servedByCode((ntee ?? '').toUpperCase())
  if (fromCode.length) return fromCode
  // No code, or one none of the 12 cover (Auburn Food Bank is filed as T70, federated giving): use the name.
  const n = (name ?? '').toUpperCase()
  return n ? BY_NAME.filter(([re]) => re.test(n)).map(([, g]) => g) : []
}

function servedByCode(code: string): ServeGroup[] {
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
export const passes = (picked: ServeGroup[], org: { ntee: string | null; name: string }) =>
  !picked.length || servedBy(org.ntee, org.name).some(g => picked.includes(g))

/**
 * Below this many open posts the board is small (S-108, Taylor, Oct 4): with 10 organizations, picks from the cause
 * code hid most of what the alpha needs them to see, so "Who they serve" starts with nothing picked.
 */
export const SMALL_BOARD = 30

/**
 * Your organization's picks, saved to it so everyone there shares them (an admin can set them too).
 * Until someone saves, they start from your organization's cause code, or from nothing while the board is small.
 */
export function useServeFilter(myEin: string, myOrg: { ntee: string | null; name: string } | undefined, small: boolean) {
  const { data } = useFilters(myEin)
  const save = useSaveFilters(myEin)
  const picked = (data?.serve ?? (small ? [] : servedBy(myOrg?.ntee, myOrg?.name))).filter((g): g is ServeGroup => (SERVE_GROUPS as readonly string[]).includes(g))
  return {
    picked,
    toggle: (g: ServeGroup) => save.mutate(picked.includes(g) ? picked.filter(x => x !== g) : [...picked, g]),
    clear: () => save.mutate([]),
  }
}
