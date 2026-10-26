// Fetch the outlines of every Washington city and town, and Seattle's neighborhoods, into one GeoJSON seed file.
// Roadmap S-144 ("Tap a place, see who's there", docs/ALPHA-BRIEFS.md). Seeds are generated, never typed (roadmap/SDLC.md).
//
//   node scripts/fetch-places.js      regenerates data/geo/wa-places.geojson (idempotent; no npm deps, Node 22+)
//
// Sources, both public domain:
//   - U.S. Census Bureau TIGERweb: incorporated places (cities, towns) and census designated places, state 53.
//   - City of Seattle Neighborhood Map Atlas (PDDL): its 20 districts (Ballard, Capitol Hill) and the neighborhoods inside
//     them (Fremont, Loyal Heights). A neighborhood with a district's name ("Ballard" is both) is left out: the district wins.
// Both services simplify on their side (maxAllowableOffset, in degrees), so the file stays small enough for a phone.
// Each feature: { id, name, kind: city | cdp | district | neighborhood, bbox: [w, s, e, n] }, polygon or multipolygon.
'use strict';
const fs = require('fs');
const path = require('path');

const TIGER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer';
const SEATTLE = 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services';
const OUT_FILE = path.resolve(__dirname, '..', 'data', 'geo', 'wa-places.geojson');
const PAGE_SIZE = 500;

async function query(layerUrl, { where, outFields, offset, precision = 4 }) {
  const features = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const qs = new URLSearchParams({
      where, outFields, f: 'geojson', outSR: '4326', returnGeometry: 'true',
      maxAllowableOffset: String(offset), geometryPrecision: String(precision),
      resultOffset: String(start), resultRecordCount: String(PAGE_SIZE), orderByFields: 'OBJECTID',
    });
    const res = await fetch(`${layerUrl}/query?${qs}`);
    if (!res.ok) throw new Error(`${layerUrl}: HTTP ${res.status}`);
    const page = await res.json();
    if (page.error) throw new Error(`${layerUrl}: ${JSON.stringify(page.error)}`);
    features.push(...page.features);
    if (page.features.length < PAGE_SIZE) return features;
  }
}

function bboxOf(geometry) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const poly of polys) for (const ring of poly) for (const [x, y] of ring) {
    if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y;
  }
  return [w, s, e, n].map(v => Math.round(v * 1e5) / 1e5);
}

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function place(id, name, kind, geometry) {
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return null;
  return { type: 'Feature', id, properties: { id, name, kind, bbox: bboxOf(geometry) }, geometry };
}

async function main() {
  const cities = await query(`${TIGER}/4`, { where: "STATE='53'", outFields: 'GEOID,BASENAME', offset: 0.0004 });
  const cdps = await query(`${TIGER}/5`, { where: "STATE='53'", outFields: 'GEOID,BASENAME', offset: 0.0004 });
  const districts = await query(`${SEATTLE}/nma_nhoods_main/FeatureServer/0`, { where: '1=1', outFields: 'OBJECTID,L_HOOD', offset: 0.0001, precision: 5 });
  const hoods = await query(`${SEATTLE}/nma_nhoods_sub/FeatureServer/0`, { where: '1=1', outFields: 'OBJECTID,S_HOOD', offset: 0.0001, precision: 5 });

  const districtNames = new Set(districts.map(f => f.properties.L_HOOD.trim().toLowerCase()));
  const out = [
    ...cities.map(f => place(`p${f.properties.GEOID}`, f.properties.BASENAME, 'city', f.geometry)),
    ...cdps.map(f => place(`p${f.properties.GEOID}`, f.properties.BASENAME, 'cdp', f.geometry)),
    ...districts.map(f => place(`sea-${slug(f.properties.L_HOOD)}`, f.properties.L_HOOD.trim(), 'district', f.geometry)),
    ...hoods.filter(f => !districtNames.has(f.properties.S_HOOD.trim().toLowerCase()))
      .map(f => place(`sea-${slug(f.properties.S_HOOD)}`, f.properties.S_HOOD.trim(), 'neighborhood', f.geometry)),
  ].filter(Boolean);

  const ids = new Set();
  for (const f of out) { if (ids.has(f.id)) throw new Error(`duplicate place id ${f.id}`); ids.add(f.id); }
  out.sort((a, b) => a.id.localeCompare(b.id));

  const fc = {
    type: 'FeatureCollection',
    source: 'U.S. Census Bureau TIGERweb places (public domain); City of Seattle Neighborhood Map Atlas (PDDL). scripts/fetch-places.js',
    features: out,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(fc) + '\n');
  const count = k => out.filter(f => f.properties.kind === k).length;
  console.log(`${out.length} places (${count('city')} cities and towns, ${count('cdp')} census places, ${count('district')} Seattle districts, ${count('neighborhood')} Seattle neighborhoods)`);
  console.log(`${path.relative(process.cwd(), OUT_FILE)}: ${(fs.statSync(OUT_FILE).size / 1024).toFixed(0)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
