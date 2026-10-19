/** One line's look, as the map draws it: colors are the map's tokens, dashes are DASH in src/map/model.ts. */
function Swatch({ color, dash, glow }: { color: string; dash: string; glow?: boolean }) {
  return (
    <svg className="map-legend-swatch" viewBox="0 0 40 12" aria-hidden>
      {glow && <line x1="2" y1="6" x2="38" y2="6" stroke="var(--thread-golden-glow)" strokeOpacity="0.55" strokeWidth="9" strokeLinecap="round" />}
      <line x1="2" y1="6" x2="38" y2="6" stroke={color} strokeWidth={glow ? 3 : 2.25} strokeDasharray={dash} strokeLinecap="round" />
    </svg>
  )
}

const ROWS: [string, string, boolean, string][] = [
  ['var(--thread-golden)', '16 8', true, 'Golden thread. Help that was given.'],
  ['var(--offer)', '10 6', false, 'In progress. They’re working it out.'],
  ['var(--need)', '6 6', false, 'Started. Waiting for a yes.'],
  ['var(--ink-3)', '2 6', false, 'Could fit. A need and an offer that might go together.'],
]

/** What the map shows (S-105, docs/ALPHA-BRIEFS.md): the four kinds of line, which way they run, pins and dots. */
export function MapLegend({ onClose }: { onClose: () => void }) {
  return (
    <div className="card map-legend" role="dialog" aria-labelledby="map-legend-h">
      <h2 className="t" id="map-legend-h">What the map shows</h2>
      <ul>
        {ROWS.map(([color, dash, glow, words]) => <li key={words}><Swatch color={color} dash={dash} glow={glow} />{words}</li>)}
      </ul>
      <p>The dashes run from the one giving to the one receiving.</p>
      <p>A pin is an organization here. A faint dot is any Washington nonprofit.</p>
      <p>A thicker line with a number is several threads between the same two places.</p>
      <button className="btn sm" onClick={onClose}>Close</button>
    </div>
  )
}
