// Seed data for mock mode. Organizations are real WA 501(c)(3)s (IRS list, as in the prototype).
// Needs and offers are the nonprofit-to-nonprofit posts from docs/seeds/demo.json and the prototype's seed board,
// with demo.json's retags applied. People, businesses, schools and workforce posts are left out: the alpha is nonprofits only.
import type { Cadence, KindOfHelp, ListingKind, Urgency } from '../types'

// [ein, name, city, zip, ntee]
export const ORG_ROWS: [string, string, string, string, string][] = [
  ['911428805', 'Ballard Food Bank', 'SEATTLE', '98107', 'K31'],
  ['822888626', 'Computers 4 People in Need', 'BELLINGHAM', '98225', 'T50'],
  ['581735531', 'Tacoma-Pierce Habitat for Humanity', 'TACOMA', '98409', 'L20Z'],
  ['911606330', 'Rebuilding Together Seattle', 'TUKWILA', '98188', 'L99Z'],
  ['465378620', 'Southeast Seattle Tool Library', 'SEATTLE', '98108', 'S99'],
  ['811434757', 'West Seattle Tool Library', 'SEATTLE', '98106', 'S20'],
  ['911464412', 'West Seattle Food Bank', 'SEATTLE', '98126', 'K31Z'],
  ['911500768', 'Rainier Valley Food Bank', 'SEATTLE', '98118', 'K31'],
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

/** Approximate ZIP centroids, from the prototype. */
export const ZIP: Record<string, [number, number]> = {
  '98107': [47.668, -122.378], '98126': [47.530, -122.375], '98118': [47.540, -122.270], '98102': [47.632, -122.322], '98144': [47.585, -122.300],
  '98101': [47.611, -122.335], '98104': [47.602, -122.328], '98124': [47.598, -122.332], '98115': [47.685, -122.300], '98103': [47.660, -122.340],
  '98112': [47.630, -122.290], '98106': [47.545, -122.355], '98108': [47.541, -122.312], '98134': [47.575, -122.335],
  '98409': [47.213, -122.480], '98421': [47.262, -122.400], '98188': [47.470, -122.270],
  '98225': [48.745, -122.490], '98226': [48.780, -122.440], '98501': [47.030, -122.890], '98506': [47.060, -122.860],
  '99217': [47.700, -117.350], '99202': [47.655, -117.390], '99220': [47.660, -117.420], '98052': [47.670, -122.120],
  '98532': [46.660, -122.960], '99163': [46.730, -117.180],
}

export interface SeedListing {
  id: number; kind: ListingKind; ein: string; help: KindOfHelp; title: string; desc: string
  qty: number | null; unit: string | null; urgency: Urgency; cadence: Cadence; hoursAgo: number
}

const L = (id: number, kind: ListingKind, ein: string, title: string, desc: string, qty: number, unit: string,
  urgency: Urgency, hoursAgo: number, cadence: Cadence = 'OneTime', help: KindOfHelp = 'Things'): SeedListing =>
  ({ id, kind, ein, help, title, desc, qty, unit, urgency, cadence, hoursAgo })

// Urgency and kind of help already carry demo.json's retags (2, 9, 45 Normal; 3, 11, 23 Low; 5, 43 High; 7 Time; 28 Skills).
export const SEED_LISTINGS: SeedListing[] = [
  L(1, 'Offer', '581735531', '40 sheets of ¾" plywood left over from a build', 'Full sheets, dry, stored indoors. Pickup in Tacoma weekdays.', 40, 'sheets', 'Normal', 30),
  L(2, 'Need', '911606330', 'Plywood for wheelchair ramps', 'Building 6 accessibility ramps for seniors this month; need ~25 sheets ¾" exterior plywood.', 25, 'sheets', 'Normal', 26),
  L(3, 'Need', '465378620', 'Lumber and plywood for workshop benches', '', 10, 'sheets', 'Low', 50),
  L(4, 'Offer', '822888626', '15 refurbished laptops (Win 11, 8 GB)', 'Wiped and reimaged. Can ship anywhere in WA.', 15, 'laptops', 'Normal', 20),
  L(5, 'Need', '911428805', 'Walk-in cooler or commercial refrigerator', 'For fresh produce storage.', 1, 'unit', 'High', 70),
  L(6, 'Offer', '811434757', 'Used 2-door commercial refrigerator', 'Works, needs a new gasket.', 1, 'unit', 'Normal', 12),
  L(7, 'Need', '223939593', 'Box truck drivers, Saturday mornings', 'CDL not required. 4-hour shifts, Tacoma.', 4, 'volunteers', 'Normal', 90, 'Weekly', 'Time'),
  L(8, 'Offer', '910826037', '6 pallets of canned vegetables', 'Best-by dates 6+ months out. Must take full pallets.', 6, 'pallets', 'High', 8),
  L(9, 'Need', '911425676', 'Backpacks and school supplies for 200 students', 'Fall enrollment. New or like-new.', 200, 'backpacks', 'Normal', 40),
  L(10, 'Offer', '911546757', 'Commercial kitchen time, Sunday afternoons', 'Licensed kitchen, 12 burners, walk-in access.', 1, 'kitchen', 'Normal', 100, 'Weekly'),
  L(11, 'Need', '237297837', 'Pallet jack', 'Manual is fine. Olympia.', 1, 'unit', 'Low', 60),
  L(12, 'Offer', '237421892', '20 office chairs, good condition', 'Office downsizing. Pickup in Fremont.', 20, 'chairs', 'Low', 15),
  L(13, 'Need', '911546757', 'Chairs for the job-training classroom', '', 18, 'chairs', 'Normal', 200),
  L(14, 'Need', '910565011', 'Dog and cat food', 'Shelter is at capacity.', 600, 'lbs', 'High', 80),
  L(15, 'Offer', '237173826', 'Pallet of pet food from a grocery donation', '', 900, 'lbs', 'Normal', 60),
  L(20, 'Need', '910982116', 'Laptops for job-search lab', '', 10, 'laptops', 'Normal', 700),
  L(21, 'Offer', '413026773', 'Refurbished laptops, Win 11', '', 12, 'laptops', 'Normal', 720),
  L(22, 'Need', '237438529', 'Printer toner for community office', '', 12, 'cartridges', 'Normal', 30),
  L(23, 'Need', '061652679', 'Folding tables for outdoor programs', '', 4, 'tables', 'Low', 12),
  L(24, 'Need', '262465531', 'Cribs and toddler beds', '', 6, 'cribs', 'High', 400),
  L(25, 'Offer', '223939593', 'Cribs (new, donated overstock)', '', 10, 'cribs', 'Normal', 420),
  L(26, 'Need', '237297837', 'Fresh produce for weekly distribution', 'About 800 lbs a month.', 800, 'lbs', 'High', 1500, 'Monthly'),
  L(27, 'Offer', '910826037', 'Surplus produce, monthly pallet', 'Mixed produce from grocery partners.', 900, 'lbs', 'Normal', 1520, 'Monthly'),
  L(28, 'Need', '911425676', 'Bookkeeping, a few hours a month', 'QuickBooks; remote is fine.', 4, 'hours', 'Normal', 300, 'Monthly', 'Skills'),
  // Invented for the mock, from Ballard Food Bank's "have" tags in the prototype, so the demo org has an offer of its own.
  L(30, 'Offer', '911428805', 'Flattened cardboard boxes', 'Clean, flattened and bundled. Pickup in Ballard.', 200, 'boxes', 'Normal', 34, 'Weekly'),
  // docs/seeds/demo.json, nonprofit posts only
  L(43, 'Need', '237438529', 'Interpreters for intake appointments', 'Cantonese and Vietnamese, two mornings a week.', 2, 'interpreters', 'High', 20, 'Weekly', 'Skills'),
  L(45, 'Need', '911428805', 'A sponsor for our summer meals program', 'Eight weeks of lunches for kids out of school. Looking for one business to anchor it.', 1, 'sponsor', 'Normal', 44, 'OneTime', 'Partnership'),
]

// Threads between the seeded posts, from the prototype's seed. [id, needId, offerId, startedByEin, status, hoursAgo, doneHoursAgo]
export const SEED_THREADS: [number, number, number, string, 'Proposed' | 'Accepted' | 'Completed', number, number | null][] = [
  [1, 13, 12, '911546757', 'Completed', 190, 120],
  [2, 14, 15, '237173826', 'Accepted', 50, null],
  [4, 20, 21, '413026773', 'Completed', 690, 600],
  [5, 24, 25, '262465531', 'Completed', 410, 380],
  [8, 26, 27, '237297837', 'Accepted', 1450, null],
  // Waiting in Ballard Food Bank's inbox, so the demo org has something to answer.
  [9, 5, 6, '811434757', 'Proposed', 5, null],
]

// [threadId, senderEin, senderName, body, hoursAgo]
export const SEED_MESSAGES: [number, string, string, string, number][] = [
  [1, '911546757', 'Alex', 'Can we pick up Friday?', 180],
  [1, '237421892', 'Priya', 'Friday works. Ask for the dock on 34th.', 170],
  [2, '237173826', 'Sam', 'We can deliver with Tuesday’s route.', 40],
  [9, '811434757', 'Robin', 'Ours works, it just needs a new gasket. Want to come see it?', 5],
]

/** Invite codes the mock accepts. Each is tied to one organization, as in the alpha. */
export const SEED_INVITES: Record<string, string> = {
  BALLARD: '911428805',
  TREEHOUSE: '911425676',
  HARVEST: '910826037',
  // Nothing posted yet: the demo's "new organization" starts here.
  RAINIER: '911500768',
}

/** Other people at an organization, besides whoever is signed in: [accountId, name, email]. Names match the seed messages. */
export const SEED_PEOPLE: Record<string, [string, string, string][]> = {
  '911428805': [['acct-maria', 'Maria Lopez', 'maria@example.org']],
  '811434757': [['acct-robin', 'Robin Park', 'robin@example.org']],
  '237173826': [['acct-sam', 'Sam Ortiz', 'sam@example.org']],
}

/** What some organizations already say about themselves (S-99). The rest have said nothing, so their pages show nothing new. */
export const SEED_PROFILES: Record<string, { about: string | null; website: string | null; contactAccountId: string | null }> = {
  '811434757': { about: 'We lend tools to West Seattle neighbors and groups, free.', website: null, contactAccountId: 'acct-robin' },
  '237173826': { about: 'We get food to food banks across the Inland Northwest.', website: null, contactAccountId: 'acct-sam' },
}
