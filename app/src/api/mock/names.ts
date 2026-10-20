// The demo's sample organizations, on their own so the main bundle can name them (Admin's You are, the demo bar)
// without loading the rest of the seed.

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

export const ORG_NAMES: Record<string, string> = Object.fromEntries(ORG_ROWS.map(([ein, name]) => [ein, name]))
