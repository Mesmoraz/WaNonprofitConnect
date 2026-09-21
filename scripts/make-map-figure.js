// Renders a static SVG of the Puget Sound region with the Computers 4 People → Ballard Food Bank thread,
// using the same outline/projection as the prototype. Output: docs/map-figure.svg (inlined into how-it-works).
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'helpbook-prototype.html'), 'utf8');
const grab = name => { const m = html.match(new RegExp('const ' + name + ' = (\\[\\[[^;]*\\]\\]);')); if (!m) throw new Error(name); return JSON.parse(m[1]); };
const WA = grab('WA_OUTLINE');
const PX = lon => (lon + 124.95) / (124.95 - 116.75) * 620, PY = lat => (49.1 - lat) / (49.1 - 45.45) * 400;
// crop: Puget Sound, Olympia to Bellingham
const x0 = PX(-123.55), x1 = PX(-121.75), y0 = PY(48.95), y1 = PY(47.0);
const W = 560, H = 420, k = Math.min(W / (x1 - x0), H / (y1 - y0)); const ox = (W - (x1 - x0) * k) / 2 - x0 * k, oy = (H - (y1 - y0) * k) / 2 - y0 * k;
const X = lon => (PX(lon) * k + ox).toFixed(1), Y = lat => (PY(lat) * k + oy).toFixed(1);
const land = 'M' + WA.map(([lon, lat]) => `${X(lon)},${Y(lat)}`).join(' L') + ' Z';
const orgs = [
  { n: 'Computers 4 People in Need', lat: 48.745, lon: -122.49, t: 'np', label: 'r' },
  { n: 'Whatcom Humane Society', lat: 48.78, lon: -122.44, t: 'np' },
  { n: 'Ballard Food Bank', lat: 47.668, lon: -122.378, t: 'np', label: 'r' },
  { n: 'Solid Ground', lat: 47.66, lon: -122.34, t: 'np' },
  { n: 'Northwest Harvest', lat: 47.632, lon: -122.322, t: 'np' },
  { n: 'Treehouse', lat: 47.585, lon: -122.30, t: 'np' },
  { n: 'West Seattle Food Bank', lat: 47.53, lon: -122.375, t: 'np' },
  { n: 'Puget Sound Office Supply', lat: 47.575, lon: -122.335, t: 'biz' },
  { n: 'Dana M.', lat: 47.685, lon: -122.30, t: 'person' },
  { n: 'Hopelink', lat: 47.67, lon: -122.12, t: 'np' },
  { n: 'Tacoma-Pierce Habitat', lat: 47.213, lon: -122.48, t: 'np' },
  { n: 'NW Furniture Bank', lat: 47.262, lon: -122.40, t: 'np' },
  { n: 'Thurston County Food Bank', lat: 47.03, lon: -122.89, t: 'np' },
];
const col = { np: '#74B894', biz: '#3B5BA9', person: '#7A5CA8' };
const a = orgs[0], b = orgs[2];
const ax = +X(a.lon), ay = +Y(a.lat), bx = +X(b.lon), by = +Y(b.lat), dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
const cx = (ax + bx) / 2 - dy / d * Math.min(d * 0.16, 36), cy = (ay + by) / 2 + dx / d * Math.min(d * 0.16, 36);
const thread = `M${ax},${ay} Q${cx.toFixed(1)},${cy.toFixed(1)} ${bx},${by}`;
const cities = [['Bellingham', 48.75, -122.48], ['Seattle', 47.61, -122.33], ['Tacoma', 47.25, -122.44], ['Olympia', 47.04, -122.90], ['Redmond', 47.67, -122.12]];
const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of Puget Sound with a golden thread from Computers 4 People in Need in Bellingham to Ballard Food Bank in Seattle" style="width:100%;height:auto;display:block;border-radius:14px;border:1px solid var(--line)">
  <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
  <rect width="${W}" height="${H}" fill="#101619"/>
  <path d="${land}" fill="#1B2329" stroke="#2E3A40" stroke-width="1.2"/>
  ${cities.map(([n, lat, lon]) => `<text x="${(+X(lon) + 9).toFixed(1)}" y="${(+Y(lat) - 9).toFixed(1)}" font-family="IBM Plex Sans, sans-serif" font-size="11" fill="#8A938C">${n}</text>`).join('\n  ')}
  <circle cx="${ax}" cy="${ay}" r="22" fill="#74B894" opacity="0.18" filter="url(#glow)"/>
  <circle cx="${bx}" cy="${by}" r="26" fill="#74B894" opacity="0.2" filter="url(#glow)"/>
  ${orgs.filter(o => o !== a && o !== b).map(o => `<circle cx="${X(o.lon)}" cy="${Y(o.lat)}" r="5.5" fill="${col[o.t]}" stroke="#1B2329" stroke-width="1.5" opacity="0.6"/>`).join('\n  ')}
  <path d="${thread}" fill="none" stroke="#D9A12B" stroke-width="3" stroke-linecap="round" stroke-dasharray="14 7" opacity="0.95" style="filter:drop-shadow(0 0 4px rgba(217,161,43,0.9))"/>
  <circle r="4" fill="#F2C14E"><animateMotion dur="1.8s" repeatCount="indefinite" path="${thread}"/></circle>
  <circle cx="${ax}" cy="${ay}" r="8" fill="#74B894" stroke="#E7EAE4" stroke-width="2"/>
  <circle cx="${bx}" cy="${by}" r="9" fill="#74B894" stroke="#E0A04B" stroke-width="3"/>
  <text x="${(ax + 14).toFixed(1)}" y="${(ay + 5).toFixed(1)}" font-family="IBM Plex Sans, sans-serif" font-size="13" font-weight="600" fill="#E7EAE4" stroke="#101619" stroke-width="3" paint-order="stroke">Computers 4 People in Need</text>
  <text x="${(bx + 15).toFixed(1)}" y="${(by + 5).toFixed(1)}" font-family="IBM Plex Sans, sans-serif" font-size="13" font-weight="600" fill="#E7EAE4" stroke="#101619" stroke-width="3" paint-order="stroke">Ballard Food Bank</text>
  <g transform="translate(${W - 190} ${H - 64})"><rect width="178" height="52" rx="8" fill="#1B2329" stroke="#2E3A40"/>
    <text x="10" y="18" font-family="IBM Plex Sans, sans-serif" font-size="11" fill="#B6BDB6">15 refurbished laptops, given</text>
    <text x="10" y="34" font-family="IBM Plex Sans, sans-serif" font-size="11" fill="#B6BDB6">Bellingham → Seattle · 79 mi</text>
    <text x="10" y="47" font-family="IBM Plex Sans, sans-serif" font-size="10" fill="#8A938C">the dot moves from giver to receiver</text></g>
</svg>`;
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'map-figure.svg'), svg);
console.log('map figure written');
