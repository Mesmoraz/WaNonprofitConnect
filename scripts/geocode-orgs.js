// Place every Washington 501(c)(3) at its street address instead of its ZIP's center.
// Sends the IRS addresses to the Census Bureau's free geocoder (no key), a few at a time, and writes
// data/geo/wa-orgs-geo.csv: ein,lat,lon for every match. The API reads that file.
// (The Census batch endpoint exists but was returning 502s on Sep 23, even for 2 rows; one-line lookups work.)
//
//   node scripts/geocode-orgs.js [path/to/eo_wa.csv]   (Node 22+, no npm deps)
//
// Rows the geocoder can't match (PO boxes, typos) are left out; the API falls back to the ZIP center.
// Idempotent: rows already in the output file are kept and not sent again, so a rerun only fills gaps.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'data', 'raw');
const IN_FILE = process.argv[2] || path.join(RAW, fs.readdirSync(RAW).filter(f => /^eo_wa_\d+\.csv$/.test(f)).sort().pop());
const OUT_FILE = path.join(ROOT, 'data', 'geo', 'wa-orgs-geo.csv');
const URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
const WORKERS = 6;
const SAVE_EVERY = 500;

function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else if (c === '"') q = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur);
  return out;
}

async function geocode(r) {
  const q = new URLSearchParams({ address: `${r.street}, ${r.city}, WA ${r.zip}`, benchmark: 'Public_AR_Current', format: 'json' });
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${URL}?${q}`, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const m = (await res.json()).result?.addressMatches?.[0]?.coordinates;
      return m ? [m.y.toFixed(5), m.x.toFixed(5)] : null;
    } catch (e) {
      if (attempt >= 4) return undefined;   // gave up: not placed this run, tried again next run
      await new Promise(res => setTimeout(res, 2000 * attempt));
    }
  }
}

(async () => {
  const lines = fs.readFileSync(IN_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
  const head = parseCsvLine(lines[0]);
  const ix = n => head.indexOf(n);
  const [iEin, iStreet, iCity, iZip, iSub] = ['EIN', 'STREET', 'CITY', 'ZIP', 'SUBSECTION'].map(ix);
  const rows = lines.slice(1).map(parseCsvLine)
    .filter(c => c[iSub] === '03' && c[iStreet] && c[iStreet].trim())
    .map(c => ({ ein: c[iEin], street: c[iStreet].trim(), city: c[iCity].trim(), zip: (c[iZip] || '').slice(0, 5) }));

  const done = new Map();
  if (fs.existsSync(OUT_FILE)) for (const l of fs.readFileSync(OUT_FILE, 'utf8').split(/\r?\n/).slice(1).filter(Boolean)) { const [e, la, lo] = l.split(','); done.set(e, [la, lo]) }
  const todo = rows.filter(r => !done.has(r.ein));
  console.log(`${rows.length} 501(c)(3)s with a street address; ${done.size} already placed; ${todo.length} to send.`);

  const save = () => {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    const out = ['ein,lat,lon', ...[...done].sort((a, b) => a[0].localeCompare(b[0])).map(([e, [la, lo]]) => `${e},${la},${lo}`)];
    fs.writeFileSync(OUT_FILE, out.join('\n') + '\n');
  };
  let next = 0, sent = 0, matched = 0, failed = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    while (next < todo.length) {
      const r = todo[next++];
      const at = await geocode(r);
      sent++;
      if (at) { done.set(r.ein, at); matched++ } else if (at === undefined) failed++;
      if (sent % SAVE_EVERY === 0) {
        save();
        const mins = (Date.now() - t0) / 60000;
        console.log(`  ${sent} of ${todo.length}: ${matched} matched, ${failed} errors, ~${Math.round(mins / sent * (todo.length - sent))} min left`);
      }
    }
  }));
  save();
  console.log(`${done.size} of ${rows.length} placed at their street address. Wrote ${path.relative(ROOT, OUT_FILE)}.`);
})().catch(e => { console.error(e); process.exit(1) });
