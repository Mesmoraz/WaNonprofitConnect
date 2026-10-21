/** One line's look, as the map draws it: colors are the map's tokens, dashes are DASH in src/map/model.ts. */
function Swatch({ color, dash, glow, faint }: { color: string; dash: string; glow?: boolean; faint?: boolean }) {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      {glow && <line x1="2" y1="6" x2="38" y2="6" stroke="var(--thread-golden-glow)" strokeOpacity="0.55" strokeWidth="9" strokeLinecap="round" />}
      <line x1="2" y1="6" x2="38" y2="6" stroke={color} strokeOpacity={faint ? 0.5 : 1} strokeWidth={glow ? 3 : 1.75} strokeDasharray={dash} strokeLinecap="round" />
    </svg>
  )
}

/** A pin's ring, as the map draws it (S-129). */
function Ring({ color }: { color: string }) {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      <circle cx="20" cy="6" r="4.25" fill="var(--paper)" stroke={color} strokeWidth="3" />
    </svg>
  )
}

/** What the map shows (S-105, rewritten for S-129 in docs/ALPHA-BRIEFS.md): rings for what's open, golden lines for help given. */
export function MapLegend({ onClose }: { onClose: () => void }) {
  return (
    <div className="card map-legend" role="dialog" aria-labelledby="map-legend-h">
      <h2 className="t" id="map-legend-h">What the map shows</h2>
      <ul>
        <li><Ring color="var(--need)" />Amber is open needs.</li>
        <li><Ring color="var(--offer)" />Green is open offers.</li>
        <li><Swatch color="var(--thread-golden)" dash="16 8" glow />A golden thread. Help that was given.</li>
        <li><Swatch color="var(--ink-2)" dash="10 6" faint />Your threads that are underway.</li>
      </ul>
      <p>A bigger pin has more open. A faint dot is any Washington nonprofit.</p>
      <p>A thicker line with a number is several threads between the same two places.</p>
      <button className="btn sm" onClick={onClose}>Close</button>
    </div>
  )
}
