// Sample data for the map harness only. Orgs, ZIPs and centroids are the prototype's
// (docs/helpbook-prototype.html, ORG_ROWS and ZIP). Threads and faint points are made up.
import type { MapData, MapPoint, MapThread, OrgSummary } from './types'

const ZIP: Record<string, [number, number]> = {
  '98107': [47.668, -122.378], '98126': [47.530, -122.375], '98118': [47.540, -122.270], '98102': [47.632, -122.322], '98144': [47.585, -122.300],
  '98101': [47.611, -122.335], '98104': [47.602, -122.328], '98124': [47.598, -122.332], '98115': [47.685, -122.300], '98103': [47.660, -122.340],
  '98112': [47.630, -122.290], '98106': [47.545, -122.355], '98108': [47.541, -122.312], '98134': [47.575, -122.335], '98127': [47.612, -122.335],
  '98409': [47.213, -122.480], '98421': [47.262, -122.400], '98405': [47.252, -122.462], '98188': [47.470, -122.270], '98057': [47.480, -122.220],
  '98225': [48.745, -122.490], '98226': [48.780, -122.440], '98501': [47.030, -122.890], '98506': [47.060, -122.860], '98507': [47.040, -122.900],
  '99217': [47.700, -117.350], '99202': [47.655, -117.390], '99220': [47.660, -117.420], '98052': [47.670, -122.120], '98948': [46.380, -120.310],
  '98532': [46.660, -122.960], '99163': [46.730, -117.180],
}

// [ein, name, city, zip, ntee]
const ROWS: [string, string, string, string, string][] = [
  ['911428805', 'Ballard Food Bank', 'SEATTLE', '98107', 'K31'],
  ['822888626', 'Computers 4 People in Need', 'BELLINGHAM', '98225', 'T50'],
  ['581735531', 'Tacoma-Pierce Habitat for Humanity', 'TACOMA', '98409', 'L20Z'],
  ['911606330', 'Rebuilding Together Seattle', 'TUKWILA', '98188', 'Z99Z'],
  ['465378620', 'Southeast Seattle Tool Library', 'SEATTLE', '98108', 'S99'],
  ['811434757', 'West Seattle Tool Library', 'SEATTLE', '98106', 'S20'],
  ['911464412', 'West Seattle Food Bank', 'SEATTLE', '98126', 'K31Z'],
  ['911500768', 'Rainier Valley Food Bank', 'SEATTLE', '98118', 'Z99Z'],
  ['910826037', 'Northwest Harvest', 'SEATTLE', '98102', 'K31'],
  ['237297837', 'Thurston County Food Bank', 'OLYMPIA', '98501', 'K31Z'],
  ['237173826', 'Second Harvest Inland Northwest', 'SPOKANE', '99202', 'K31'],
  ['911425676', 'Treehouse', 'SEATTLE', '98144', 'O500'],
  ['910982116', 'Hopelink', 'REDMOND', '98052', 'P20'],
  ['911546757', 'FareStart', 'SEATTLE', '98101', 'J220'],
  ['223939593', 'NW Furniture Bank', 'TACOMA', '98421', 'P20'],
  ['237421892', 'Solid Ground Washington', 'SEATTLE', '98103', 'L40Z'],
  ['910565011', 'Spokane Humane Society', 'SPOKANE', '99217', 'D200'],
  ['910677564', 'Whatcom Humane Society', 'BELLINGHAM', '98226', 'D200'],
  ['263482643', 'Boys & Girls Club of Lewis County', 'CHEHALIS', '98532', 'O50'],
  ['455497267', 'Family Promise of the Palouse', 'PULLMAN', '99163', 'P85'],
  ['910565555', 'United Way of King County', 'SEATTLE', '98104', 'T700'],
  ['010852888', 'Team Read', 'SEATTLE', '98124', 'B92'],
  ['043602577', 'Northwest Education Access', 'SEATTLE', '98115', 'B90'],
  ['061652679', 'Seattle Children’s PlayGarden', 'SEATTLE', '98144', 'O52'],
  ['061764737', 'Habitat for Humanity Spokane', 'SPOKANE', '99220', 'L20Z'],
  ['237139744', 'Environmental Works', 'SEATTLE', '98112', 'L190'],
  ['237438529', 'Chinese Information and Service Center', 'SEATTLE', '98104', 'P84Z'],
  ['260779977', 'Belong Partners', 'SEATTLE', '98134', 'O50'],
  ['261620304', 'Blessings Under the Bridge', 'SPOKANE', '99202', 'P85'],
  ['262465531', 'New Family Traditions', 'SEATTLE', '98106', 'P20'],
  ['208845738', 'Partners in Prevention Education', 'OLYMPIA', '98506', 'P40'],
  ['413026773', 'Computer Upcycle Project', 'OLYMPIA', '98501', 'S43'],
]

const title = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

// Orgs sharing a ZIP get nudged apart in a small spiral, as in the prototype's placeOrgs().
const perZip: Record<string, number> = {}
export const SAMPLE_ORGS: OrgSummary[] = ROWS.map(([ein, name, city, zip5, ntee], k) => {
  const [lat0, lon0] = ZIP[zip5]
  const i = (perZip[zip5] = (perZip[zip5] ?? 0) + 1)
  const a = i * 2.1, r = i === 1 ? 0 : 0.009 + 0.004 * i
  return { ein, name, city: title(city), zip5, ntee, lat: lat0 + Math.sin(a) * r * 0.7, lon: lon0 + Math.cos(a) * r, isMember: k !== 17 && k !== 25 }
})

export const SAMPLE_ME = '911428805'   // Ballard Food Bank

// [id, status, help, from (giver), to (receiver), title]
const T: [number, MapThread['status'], MapThread['help'], string, string, string][] = [
  [101, 'Completed', 'Things', '822888626', '911428805', '12 laptops'],
  [102, 'Accepted', 'Things', '822888626', '911425676', '8 laptops for teens'],
  [103, 'Completed', 'Things', '822888626', '043602577', '20 refurbished laptops'],
  [104, 'Proposed', 'Things', '822888626', '010852888', 'Tablets for reading groups'],
  [105, 'Completed', 'Things', '413026773', '208845738', '15 refurbished PCs'],
  [106, 'Accepted', 'Things', '413026773', '263482643', 'Laptops for homework club'],
  [107, 'Proposed', 'Things', '413026773', '237438529', 'Laptops for ESL classes'],
  [108, 'Completed', 'Things', '581735531', '911606330', 'Plywood, 40 sheets'],
  [109, 'Accepted', 'Things', '581735531', '061652679', 'Lumber for raised beds'],
  [110, 'Completed', 'Things', '581735531', '465378620', 'Lumber offcuts'],
  [111, 'Proposed', 'Things', '061764737', '455497267', 'Cabinets for the family house'],
  [112, 'Completed', 'Things', '910826037', '237297837', '30 pallets'],
  [113, 'Accepted', 'Things', '910826037', '911464412', 'Canned food, 2 tons'],
  [114, 'Completed', 'Things', '911428805', '911546757', 'Surplus produce, weekly'],
  [115, 'Completed', 'Things', '223939593', '237421892', 'Office chairs and desks'],
  [116, 'Accepted', 'Things', '223939593', '910982116', 'Furniture for new tenants'],
  [117, 'Proposed', 'Things', '223939593', '262465531', 'Cribs and dressers'],
  [118, 'Completed', 'Things', '237173826', '261620304', 'Canned food for winter kits'],
  [119, 'Accepted', 'Things', '237173826', '455497267', 'Food boxes, monthly'],
  [120, 'Proposed', 'Time', '811434757', '911606330', 'Tool loans for repair days'],
  [121, 'Proposed', 'Skills', '910565011', '910677564', 'Volunteer training'],
  [122, 'Accepted', 'Time', '910565555', '260779977', 'Volunteers for Saturday league'],
  [123, 'Completed', 'Time', '910565555', '010852888', 'Reading volunteers'],
  [124, 'Proposed', 'Skills', '237139744', '911500768', 'Design help for the new pantry'],
  [125, 'Completed', 'Things', '911425676', '262465531', 'Kids clothing'],
  [126, 'Accepted', 'Things', '911546757', '911428805', 'Prepared meals'],
  [127, 'Declined', 'Things', '465378620', '911500768', 'Shelving'],
  [128, 'Cancelled', 'Things', '237421892', '911464412', 'Desks'],
]

export const SAMPLE_DATA: MapData = {
  members: SAMPLE_ORGS,
  threads: T.map(([id, status, help, fromEin, toEin, t]) => ({ id, status, help, fromEin, toEin, title: t })),
  suggested: [
    { needId: 201, offerId: 301, fromEin: '413026773', toEin: '911428805' },
    { needId: 202, offerId: 302, fromEin: '910826037', toEin: '237173826' },
    { needId: 203, offerId: 303, fromEin: '581735531', toEin: '061764737' },
    { needId: 204, offerId: 304, fromEin: '223939593', toEin: '455497267' },
    { needId: 205, offerId: 305, fromEin: '822888626', toEin: '910982116' },
    { needId: 206, offerId: 306, fromEin: '811434757', toEin: '061652679' },
    { needId: 207, offerId: 307, fromEin: '911428805', toEin: '911500768' },
    { needId: 208, offerId: 308, fromEin: '910565555', toEin: '263482643' },
  ],
}

export const SAMPLE_GOLDEN_ID = 101
export const SAMPLE_ACCEPTED_ID = 102

// ---- ~3000 faint points around WA population centers, snapped to a ZIP-ish grid --------------------
const CENTERS: [number, number, number, number][] = [   // lat, lon, count, spread (deg)
  [47.61, -122.33, 820, 0.07], [47.25, -122.44, 260, 0.06], [47.66, -117.41, 300, 0.07], [47.61, -122.18, 200, 0.06],
  [47.98, -122.20, 150, 0.06], [45.64, -122.60, 170, 0.07], [47.04, -122.90, 130, 0.05], [48.75, -122.48, 120, 0.05],
  [46.60, -120.51, 100, 0.05], [46.23, -119.18, 100, 0.07], [47.42, -120.31, 55, 0.04], [46.06, -118.34, 45, 0.03],
  [46.73, -117.18, 35, 0.03], [48.12, -123.44, 30, 0.04], [46.98, -123.81, 30, 0.04], [46.14, -122.94, 35, 0.04],
  [48.42, -122.33, 50, 0.05], [46.99, -120.55, 30, 0.03], [47.13, -119.28, 25, 0.04], [47.38, -122.23, 120, 0.05],
  [46.66, -122.96, 25, 0.04], [48.41, -119.52, 15, 0.04], [48.55, -117.90, 15, 0.04], [48.12, -122.76, 25, 0.03],
  [48.29, -122.64, 25, 0.03], [47.21, -123.10, 20, 0.03], [47.57, -122.63, 60, 0.05], [48.05, -122.18, 50, 0.04],
]

function rng(seed: number) {   // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function samplePoints(): MapPoint[] {
  const r = rng(20260923), out: MapPoint[] = []
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r())
  const snap = (v: number) => Math.round(v / 0.025) * 0.025
  let n = 0
  for (const [lat, lon, count, s] of CENTERS)
    for (let i = 0; i < count; i++) out.push([`9${String(n++).padStart(8, '0')}`, snap(lat + gauss() * s * 0.7), snap(lon + gauss() * s)])
  for (let i = 0; i < 150; i++) out.push([`9${String(n++).padStart(8, '0')}`, snap(46.1 + r() * 2.8), snap(-122.4 + r() * 5.2)])
  return out
}
