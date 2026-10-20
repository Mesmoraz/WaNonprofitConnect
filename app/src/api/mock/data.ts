// The one seed for every demo: the app's demo, dev:mock, and the map harness (src/map/dev.tsx). ./settings.ts says
// how much of it to show, and ./world.ts builds it. Organizations are real WA 501(c)(3)s (IRS list, as in the prototype).
// Needs and offers are the nonprofit-to-nonprofit posts from docs/seeds/demo.json and the prototype's seed board,
// with demo.json's retags applied. People, businesses, schools and workforce posts are left out: the alpha is nonprofits only.
import type { Cadence, KindOfHelp, ListingKind, Urgency } from '../types'

export { ORG_ROWS } from './names'

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

export type SeedThread = [id: number, needId: number, offerId: number, startedByEin: string, status: 'Proposed' | 'Accepted' | 'Completed', hoursAgo: number, doneHoursAgo: number | null]

// Threads between the seeded posts, from the prototype's seed. [id, needId, offerId, startedByEin, status, hoursAgo, doneHoursAgo]
export const SEED_THREADS: SeedThread[] = [
  [1, 13, 12, '911546757', 'Completed', 190, 120],
  [2, 14, 15, '237173826', 'Accepted', 50, null],
  [4, 20, 21, '413026773', 'Completed', 690, 600],
  [5, 24, 25, '262465531', 'Completed', 410, 380],
  [8, 26, 27, '237297837', 'Accepted', 1450, null],
]

// [threadId, senderEin, senderName, body, hoursAgo]
export const SEED_MESSAGES: [number, string, string, string, number][] = [
  [1, '911546757', 'Alex', 'Can we pick up Friday?', 180],
  [1, '237421892', 'Priya', 'Friday works. Ask for the dock on 34th.', 170],
  [2, '237173826', 'Sam', 'We can deliver with Tuesday’s route.', 40],
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

// ---- The busier map, for the demo's Threads setting ---------------------------------------------------------
// These were the map harness's own sample (src/map/sample.ts) and are now part of the one seed. Each gets a need
// from the receiver and an offer from the giver, so a line tapped on the map opens a real thread.
// [id, status, help, giver, receiver, title]
const MAP_T: [number, 'Proposed' | 'Accepted' | 'Completed', KindOfHelp, string, string, string][] = [
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
]
const mapAge = (id: number) => 24 * (2 + (id % 9))
const ML = (id: number, kind: ListingKind, ein: string, help: KindOfHelp, title: string, h: number): SeedListing =>
  ({ id, kind, ein, help, title, desc: '', qty: null, unit: null, urgency: 'Normal', cadence: 'OneTime', hoursAgo: h })
/** The map threads' needs (2000 + id) and offers (3000 + id). They exist only while their thread does. */
export const MAP_LISTINGS: SeedListing[] = MAP_T.flatMap(([id, , help, giver, receiver, title]) =>
  [ML(2000 + id, 'Need', receiver, help, title, mapAge(id) + 24), ML(3000 + id, 'Offer', giver, help, title, mapAge(id) + 30)])
/** Every thread the Threads setting can show, in the order it adds them: the prototype's first, then the map's. */
export const THREAD_POOL: SeedThread[] = [
  ...SEED_THREADS,
  ...MAP_T.map(([id, status, , giver]): SeedThread => [id, 2000 + id, 3000 + id, giver, status, mapAge(id), status === 'Completed' ? mapAge(id) - 24 : null]),
]

// ---- Waiting on you -----------------------------------------------------------------------------------------
// Someone else offers what you need and writes first. Your matching seed need is used when you have one (Ballard's
// cooler, for the first), otherwise `need` is posted for you. A template from your own organization is skipped.
type Post = Omit<SeedListing, 'id' | 'ein'>
export interface WaitingTemplate { offerEin: string; offerSeedId?: number; offer: Post; need: Post; sender: string; body: string }
const P = (kind: ListingKind, help: KindOfHelp, title: string, desc: string, qty: number, unit: string, hoursAgo: number,
  cadence: Cadence = 'OneTime', urgency: Urgency = 'Normal'): Post => ({ kind, help, title, desc, qty, unit, urgency, cadence, hoursAgo })
export const WAITING: WaitingTemplate[] = [
  { offerEin: '811434757', offerSeedId: 6, offer: P('Offer', 'Things', 'Used 2-door commercial refrigerator', 'Works, needs a new gasket.', 1, 'unit', 12),
    need: P('Need', 'Things', 'A refrigerator for the produce room', '', 1, 'unit', 30), sender: 'Robin', body: 'Ours works, it just needs a new gasket. Want to come see it?' },
  { offerEin: '822888626', offerSeedId: 4, offer: P('Offer', 'Things', '15 refurbished laptops (Win 11, 8 GB)', '', 15, 'laptops', 20),
    need: P('Need', 'Things', 'Laptops for the front desk', '', 3, 'laptops', 48), sender: 'Jordan', body: 'We have a few laptops left from the last batch. Want 3?' },
  { offerEin: '223939593', offer: P('Offer', 'Things', 'Folding tables, 6', 'Sturdy, 6 ft.', 6, 'tables', 26),
    need: P('Need', 'Things', 'Folding tables for distribution day', '', 4, 'tables', 52), sender: 'Lee', body: 'We can bring the tables Thursday morning.' },
  { offerEin: '910565555', offer: P('Offer', 'Time', 'Volunteers for Saturday shifts', 'A corporate group, 8 people.', 8, 'volunteers', 30, 'Weekly'),
    need: P('Need', 'Time', 'Volunteers for Saturday mornings', '', 6, 'volunteers', 60, 'Weekly'), sender: 'Dana', body: 'Our corporate group can send 8 volunteers on Saturday.' },
  { offerEin: '237139744', offer: P('Offer', 'Skills', 'Design help, a few hours', 'Flyers, signs, a logo touch-up.', 4, 'hours', 34),
    need: P('Need', 'Skills', 'Design help with a new flyer', '', 2, 'hours', 70), sender: 'Kai', body: 'One of our designers has a free afternoon next week.' },
  { offerEin: '581735531', offerSeedId: 1, offer: P('Offer', 'Things', '40 sheets of ¾" plywood left over from a build', '', 40, 'sheets', 30),
    need: P('Need', 'Things', 'Plywood for pantry shelving', '', 6, 'sheets', 80), sender: 'Morgan', body: 'We still have most of the plywood. How many sheets?' },
]

// ---- Your posts ---------------------------------------------------------------------------------------------
/** Your organization's own seed posts come first. These fill in when it has fewer than the Your posts setting. */
export const YOUR_EXTRA: Post[] = [
  P('Need', 'Time', 'Volunteers to sort donations', 'Two hours on a weekday afternoon.', 6, 'volunteers', 18, 'Weekly'),
  P('Offer', 'Things', 'Spare folding chairs', 'About 30, some scuffed.', 30, 'chairs', 40),
  P('Need', 'Things', 'Hand trucks or dollies', '', 2, 'units', 75),
  P('Offer', 'Skills', 'Grant writing help, a few hours', 'Our development lead can read a draft.', 3, 'hours', 120),
  P('Need', 'Things', 'Storage shelving', '', 4, 'units', 160, 'OneTime', 'Low'),
]

// ---- Hard cases ---------------------------------------------------------------------------------------------
/** Posts that stretch the screens: very long titles and descriptions, and the kinds of help the seed lacks. */
export const HARD_LISTINGS: SeedListing[] = [
  { id: 4301, ein: '910677564', ...P('Need', 'Things', 'Blankets, towels, and washable bedding for the cats and dogs coming in from the county shelter this winter',
    'We take anything clean: old towels, fleece, crib sheets, pillowcases. No feather pillows. We can pick up anywhere in Whatcom County on Tuesdays and Fridays, and we will take as much as you have, because the county is sending us more animals than we planned for this year.',
    300, 'blankets', 3, 'Ongoing', 'Critical') },
  { id: 4302, ein: '260779977', ...P('Offer', 'Partnership', 'Two passenger vans with wheelchair lifts, free on weekends for groups getting people to appointments', 'Drivers come with them.', 2, 'vans', 9, 'Weekly') },
  { id: 4303, ein: '010852888', ...P('Need', 'ForSchools', 'Books for second graders', 'Early readers, new or gently used.', 120, 'books', 14) },
  { id: 4304, ein: '911546757', ...P('Offer', 'JobsAndMentoring', 'Kitchen job training spots for adults', '16 weeks, paid.', 4, 'spots', 22, 'Quarterly') },
]

/** Threads with you that stretch the inbox: one they turned down, one closed with your post, one with a long message. */
export interface HardThread {
  id: number; status: 'Declined' | 'Cancelled' | 'Accepted'; theirEin: string; altEin: string; startedByYou: boolean
  theirs: Post; yours: Post; yoursClosed?: boolean
  messages: [fromThem: boolean, name: string, body: string, hoursAgo: number][]
}
export const HARD_THREADS: HardThread[] = [
  { id: 20, status: 'Declined', theirEin: '465378620', altEin: '811434757', startedByYou: true,
    theirs: P('Need', 'Things', 'Shelving for the tool room', '', 6, 'units', 60), yours: P('Offer', 'Things', 'Metal shelving units', '', 4, 'units', 58),
    messages: [[false, '', 'We have 4 units. Would those help?', 57], [true, 'Avery', 'Thanks, we found some closer to us.', 50]] },
  { id: 21, status: 'Cancelled', theirEin: '237421892', altEin: '223939593', startedByYou: false, yoursClosed: true,
    theirs: P('Offer', 'Things', 'Rolling carts, 3', '', 3, 'carts', 90), yours: P('Need', 'Things', 'Rolling carts for the pantry', '', 2, 'carts', 95),
    messages: [[true, 'Priya', 'We have 3 carts if you still need them.', 85]] },
  { id: 22, status: 'Accepted', theirEin: '910826037', altEin: '237173826', startedByYou: false,
    theirs: P('Offer', 'Things', 'Weekly bread pickup', '', 40, 'loaves', 30, 'Weekly'), yours: P('Need', 'Things', 'Bread for weekly distribution', '', 40, 'loaves', 32, 'Weekly'),
    messages: [
      [true, 'Jamie', 'Our bakery partner has bread every Monday, usually 30 to 50 loaves, sometimes rolls and buns too. It has to be picked up from the dock on Airport Way before 10 in the morning, because they close the dock after that and anything left goes to compost. Bring a vehicle with room for 6 trays. If Mondays don’t work, tell us which day does and we’ll ask them. We can also hold it in our cooler for a day if you’re running late, but please call first so someone is there to let you in.', 28],
      [false, '', 'Mondays work. We’ll be there at 9.', 26],
    ] },
]
