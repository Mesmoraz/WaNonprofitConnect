/** One line's look, as the map draws it: colors are the map's tokens, dashes are DASH in src/map/model.ts. */
function Swatch({ color, dash, glow, faint }: { color: string; dash: string; glow?: boolean; faint?: boolean }) {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      {glow && <line x1="2" y1="6" x2="38" y2="6" stroke="var(--thread-golden-glow)" strokeOpacity="0.55" strokeWidth="9" strokeLinecap="round" />}
      <line x1="2" y1="6" x2="38" y2="6" stroke={color} strokeOpacity={faint ? 0.5 : 1} strokeWidth={glow ? 3 : 1.75} strokeDasharray={dash} strokeLinecap="round" />
    </svg>
  )
}

/** A pin, as the map draws it (S-147): a solid color with a white edge. */
function Pin({ color }: { color: string }) {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      <circle cx="20" cy="6" r="5" fill={color} stroke="var(--paper)" strokeWidth="1.5" />
    </svg>
  )
}

/** Several organizations close together: a grey bubble with how many (S-147). */
function Cluster() {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      <circle cx="20" cy="6" r="6" fill="var(--ink-3)" />
      <text x="20" y="6" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="700" fill="#fff">3</text>
    </svg>
  )
}

/** Faint dots on a scrap of the map's land, since the map is always light and the card may not be (S-146). */
function Dot() {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      <rect x="6" y="0" width="28" height="12" rx="3" fill="var(--map-land)" />
      {[[13, 4], [20, 8], [27, 5]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="2" fill="var(--map-dot)" fillOpacity="0.45" />)}
    </svg>
  )
}

/** What the map shows (S-105, rewritten for S-147 in docs/ALPHA-BRIEFS.md): one meaning per symbol, shortest words first. */
export function MapLegend({ onClose }: { onClose: () => void }) {
  return (
    <div className="card map-legend" role="dialog" aria-labelledby="map-legend-h">
      <h2 className="t" id="map-legend-h">What the map shows</h2>
      <ul>
        <li><Pin color="var(--need)" />Needs help.</li>
        <li><Pin color="var(--offer)" />Offers help.</li>
        <li><Cluster />Several organizations close together.</li>
        <li><Swatch color="var(--thread-golden)" dash="" />Help that was given.</li>
        <li><Swatch color="var(--ink-2)" dash="10 6" faint />Your threads that are underway.</li>
        <li><Dot />Faint dots are Washington nonprofits that haven’t joined yet.</li>
      </ul>
      <button className="btn sm" onClick={onClose}>Close</button>
    </div>
  )
}
