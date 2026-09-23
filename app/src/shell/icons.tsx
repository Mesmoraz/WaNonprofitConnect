// Tab icons. Stroke uses currentColor so they take the tab's token color.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export const BoardIcon = () => (
  <svg {...base}><rect x="4" y="4" width="16" height="16" rx="2" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>
)
export const MapIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>
)
export const PlusIcon = () => (
  <svg {...base} strokeWidth={2.4}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
export const InboxIcon = () => (
  <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></svg>
)
