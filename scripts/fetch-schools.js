// Fetch every Washington public school from OSPI's public ArcGIS feature service and write a
// normalized seed file. Roadmap S-11 / T-24. See roadmap/SDLC.md ("Keeping designs uncoupled"):
// seeds are generated, never typed, and every row lands in the one shared org shape
// { id, name, city, zip, type, sub, lat, lon } plus source-specific extras.
//
//   node scripts/fetch-schools.js      regenerates docs/seeds/schools.json (idempotent; no npm deps, Node 22+)
//
// Pages through the service with resultOffset until a page comes back short or the server stops
// reporting exceededTransferLimit. Rows without a building lat/lon are skipped and counted.
// Districts are derived from the schools: one row per LEACode, positioned at the mean of its
// schools' coordinates, with city/zip taken from the most common school city/zip in that LEA.
'use strict';
const fs = require('fs');
const path = require('path');

const SERVICE_URL = 'https://services9.arcgis.com/fWunDXKkvCx1CM4b/arcgis/rest/services/Washington_State_Public_Schools/FeatureServer/0';
const OUT_FIELDS = ['SchoolCode', 'School', 'PhysicalAddress', 'LEACode', 'LEAName', 'SchoolCategory', 'GradeCategory',
  'LowestGrade', 'HighestGrade', 'County', 'BldgLatitude', 'BldgLongitude'];
const PAGE_SIZE = 2000;
const OUT_FILE = path.resolve(__dirname, '..', 'docs', 'seeds', 'schools.json');

// OSPI GradeCategory -> app "sub" label. Anything not listed (incl. "PK Only", "Other", null) -> Other.
const SUB_BY_GRADE_CATEGORY = {
  'High School': 'High school',
  'Middle School': 'Middle school',
  'Jr High': 'Middle school',
  'Elementary School': 'Elementary school',
  'K-12': 'K-12',
  'PK-12': 'K-12',
};
const SUB_ORDER = ['High school', 'Middle school', 'Elementary school', 'K-12', 'Other'];

function subFor(gradeCategory) {
  return SUB_BY_GRADE_CATEGORY[(gradeCategory || '').trim()] || 'Other';
}

// "6110 28th Ave NW, Seattle, WA 98107-5314" -> { city: "SEATTLE", zip: "98107" }.
// City is the comma-separated segment immediately before ", WA"; zip is the first 5 digits after "WA".
function parseAddress(addr) {
  const s = (addr || '').trim();
  const m = s.match(/^(.*?),\s*([^,]+?),\s*WA\b[\s,]*(\d{5})?/i);
  if (!m) return { city: '', zip: '', ok: false };
  return { city: m[2].trim().toUpperCase(), zip: m[3] || '', ok: true };
}

async function fetchPage(offset) {
  const qs = new URLSearchParams({
    where: '1=1',
    outFields: OUT_FIELDS.join(','),
    returnGeometry: 'false',
    f: 'json',
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
  });
  const res = await fetch(`${SERVICE_URL}/query?${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching offset ${offset}`);
  const body = await res.json();
  if (body.error) throw new Error(`Service error: ${JSON.stringify(body.error)}`);
  return body;
}

async function fetchAll() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(offset);
    const feats = page.features || [];
    for (const f of feats) rows.push(f.attributes);
    process.stderr.write(`  page @${offset}: ${feats.length} rows\n`);
    if (feats.length < PAGE_SIZE || !page.exceededTransferLimit) break;
  }
  return rows;
}

function mode(values) {
  const counts = new Map();
  for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
  let best = '', n = 0;
  for (const [v, c] of counts) if (c > n) { best = v; n = c; }
  return best;
}

function round6(n) { return Math.round(n * 1e6) / 1e6; }

// Local calendar date as YYYY-MM-DD (toISOString would give UTC, which rolls over in the evening here).
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalize(rows) {
  const schools = [];
  const anomalies = { unparsedAddress: [], noZip: [], noLatLon: [] };
  let skipped = 0;

  for (const r of rows) {
    const lat = r.BldgLatitude, lon = r.BldgLongitude;
    if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) {
      skipped++;
      anomalies.noLatLon.push(`${r.SchoolCode} ${r.School}`);
      continue;
    }
    const a = parseAddress(r.PhysicalAddress);
    if (!a.ok) anomalies.unparsedAddress.push(`${r.SchoolCode} ${r.School}: "${r.PhysicalAddress}"`);
    else if (!a.zip) anomalies.noZip.push(`${r.SchoolCode} ${r.School}: "${r.PhysicalAddress}"`);
    schools.push({
      id: `OSPI-${r.SchoolCode}`,
      name: (r.School || '').trim(),
      city: a.city,
      zip: a.zip,
      type: 'school',
      sub: subFor(r.GradeCategory),
      grades: `${(r.LowestGrade || '').trim()}-${(r.HighestGrade || '').trim()}`,
      lat: round6(lat),
      lon: round6(lon),
      district: `LEA-${r.LEACode}`,
      county: (r.County || '').trim(),
    });
  }

  // Districts: one per LEACode across ALL rows (so an LEA whose schools all lack coordinates still appears),
  // positioned at the mean of its located schools.
  const byLea = new Map();
  for (const r of rows) {
    const key = `LEA-${r.LEACode}`;
    if (!byLea.has(key)) byLea.set(key, { id: key, name: (r.LEAName || '').trim(), county: (r.County || '').trim(), schools: [] });
  }
  for (const s of schools) byLea.get(s.district).schools.push(s);

  const districts = [];
  for (const d of byLea.values()) {
    const n = d.schools.length;
    districts.push({
      id: d.id,
      name: d.name,
      city: mode(d.schools.map(s => s.city)),
      zip: mode(d.schools.map(s => s.zip)),
      type: 'school',
      sub: 'District',
      lat: n ? round6(d.schools.reduce((t, s) => t + s.lat, 0) / n) : null,
      lon: n ? round6(d.schools.reduce((t, s) => t + s.lon, 0) / n) : null,
      county: d.county,
      schools: n,
    });
  }

  const byName = (a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en');
  districts.sort(byName);
  schools.sort(byName);
  return { districts, schools, skipped, anomalies };
}

async function main() {
  process.stderr.write(`Fetching ${SERVICE_URL}\n`);
  const rows = await fetchAll();
  const { districts, schools, skipped, anomalies } = normalize(rows);

  const out = {
    source: 'OSPI, Washington State Public Schools feature service',
    sourceUrl: SERVICE_URL,
    fetched: localDate(),
    count: { districts: districts.length, schools: schools.length },
    skipped,
    districts,
    schools,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n');

  const bySub = Object.fromEntries(SUB_ORDER.map(k => [k, 0]));
  for (const s of schools) bySub[s.sub]++;
  console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  fetched rows : ${rows.length}`);
  console.log(`  districts    : ${districts.length}`);
  console.log(`  schools      : ${schools.length}`);
  for (const k of SUB_ORDER) console.log(`    ${k.padEnd(18)}: ${bySub[k]}`);
  console.log(`  skipped      : ${skipped} (no lat/lon)`);
  const warn = (label, list) => {
    if (!list.length) return;
    console.log(`  ${label} (${list.length}):`);
    for (const x of list.slice(0, 20)) console.log(`    ${x}`);
    if (list.length > 20) console.log(`    ... ${list.length - 20} more`);
  };
  warn('addresses that did not parse', anomalies.unparsedAddress);
  warn('addresses with no ZIP', anomalies.noZip);
  warn('rows skipped for missing coordinates', anomalies.noLatLon);
}

main().catch(err => { console.error(err); process.exit(1); });
