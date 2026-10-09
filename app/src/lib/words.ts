// How contract values read on screen. Words follow docs/VOICE.md and docs/TAXONOMY.md.
import type { Cadence, KindOfHelp, Listing, Urgency } from '../api/types'

/** Kinds of help in the order the board shows them (prototype B5, minus Together and Grants for the alpha). */
export const HELPS: KindOfHelp[] = ['Things', 'Time', 'Skills', 'ForSchools', 'JobsAndMentoring', 'Partnership']

export const HELP_LABEL: Record<KindOfHelp, string> = {
  Time: 'Time', Skills: 'Skills', Things: 'Things', Partnership: 'Partnership', ForSchools: 'For schools', JobsAndMentoring: 'Jobs and mentoring',
}

/** Only the two most urgent levels are marked on a card. */
export const URGENCY_MARK: Record<Urgency, string> = { Critical: 'Urgent', High: 'This week', Normal: '', Low: '' }

const CADENCE_WORD: Record<Cadence, string> = { OneTime: '', Weekly: 'weekly', Monthly: 'monthly', Quarterly: 'quarterly', Ongoing: 'ongoing' }

/** SEATTLE -> Seattle */
export const cap = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

export function shortAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  return m < 60 ? `${Math.max(1, m)}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`
}

/** The grey facts line on a card: city · how many · how often · how long ago. */
export function listingFacts(l: Listing) {
  return [cap(l.org.city), quantityLine(l), CADENCE_WORD[l.cadence], shortAgo(l.createdAt)]
    .filter(Boolean).join(' · ')
}

export const formatEin = (ein: string) => /^\d{9}$/.test(ein) ? `${ein.slice(0, 2)}-${ein.slice(2)}` : ein

// NTEE major groups, in sentence case and the words the "Who they serve" chips use (VOICE.md rule 7).
const CAUSES: Record<string, string> = {
  A: 'Arts and culture', B: 'Education', C: 'Environment', D: 'Animals', E: 'Health', F: 'Mental health', G: 'Health', H: 'Medical research',
  I: 'Legal help', J: 'Jobs', K: 'Food', L: 'Housing', M: 'Public safety', N: 'Recreation', O: 'Youth',
  P: 'Human services', Q: 'International', R: 'Civil rights', S: 'Community', T: 'Giving', U: 'Science', V: 'Social science',
  W: 'Public benefit', X: 'Religion', Y: 'Mutual benefit', Z: '',
}
export const causeOf = (ntee: string | null) => (ntee ? CAUSES[ntee[0].toUpperCase()] : undefined) ?? ''

/** B6 and B7: how often, in full. Nothing for one-time on B6; "Once" is the B7 choice. */
export const CADENCE_FULL: Record<Cadence, string> = { OneTime: '', Weekly: 'Every week', Monthly: 'Every month', Quarterly: 'Every quarter', Ongoing: 'Ongoing' }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "Posted 2 days ago", and a date (Sep 21) once it's more than 30 days old. */
export function postedAgo(iso: string) {
  const d = new Date(iso)
  const m = Math.round((Date.now() - d.getTime()) / 60000)
  const n = (v: number, unit: string) => `${v} ${unit}${v === 1 ? '' : 's'}`
  if (m < 1) return 'Posted just now'
  if (m < 60) return `Posted ${n(m, 'minute')} ago`
  if (m < 1440) return `Posted ${n(Math.round(m / 60), 'hour')} ago`
  const days = Math.round(m / 1440)
  if (days <= 30) return `Posted ${n(days, 'day')} ago`
  return `Posted ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

/** "12 laptops" on older posts that named a unit; otherwise "12 needed" or "12 to give" (the Post screen no longer asks "Of what"). */
export function quantityLine(l: Pick<Listing, 'quantity' | 'unit' | 'kind'>) {
  if (!l.quantity) return ''
  return l.unit ? `${l.quantity} ${l.unit}` : `${l.quantity} ${l.kind === 'Need' ? 'needed' : 'to give'}`
}

/** A post that isn't open any more, in the words list's words: done, closed, or in a thread. */
export const STATUS_WORD: Record<string, string> = { Matched: 'In a thread', Fulfilled: 'Done', Expired: 'Closed', Closed: 'Closed' }

/** B8 Inbox status word, from where you stand. Declined and cancelled threads are both "Closed" (S-104). */
export function inboxStatus(t: { status: string; startedByEin: string }, myEin: string | undefined) {
  switch (t.status) {
    case 'Proposed': return t.startedByEin === myEin ? 'Waiting on them' : 'Waiting on you'
    case 'Accepted': return 'In progress'
    case 'Completed': return 'Golden'
    case 'Declined': case 'Cancelled': return 'Closed'
    default: return ''
  }
}
