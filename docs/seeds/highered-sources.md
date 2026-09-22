# Sources for `highered.json`

Fetched **2026-09-22** (WebFetch / WebSearch / plain HTTPS requests; no browser). Every row in
`highered.json` traces to at least one URL below. Cities are uppercased per the app convention;
`zip` is the 5-digit prefix of what the source publishes; `domain` is a bare host, no scheme and no
`www.`.

`type` is `school` for every row — higher education is the same participant type as K-12 in
`docs/TAXONOMY.md` ("A school or district"). `level` is what separates them: `university` for the
four-year institutions, `college` for the 34 community and technical colleges. `scripts/build-seeds.js`
already reads exactly this shape, so nothing in the app keys off higher education specifically.

`sector` is extra to the brief's shape and is the honest classification: `public four-year`,
`community college`, `technical college`, `private nonprofit`.

## Counts

| sector | rows |
|---|---|
| public four-year | 8 (six institutions; see the UW note below) |
| community college | 29 |
| technical college | 5 |
| private nonprofit | 7 |
| **total** | **49** |

`count.public4yr` in the JSON is **8, not 6**. Washington has six public four-year institutions, but
the brief asked for UW Bothell and UW Tacoma as well, and they are in different cities with their own
websites, so they are their own rows. The six institutions are CWU, EWU, Evergreen, UW, WSU and WWU.

## Addresses and coordinates — all rows

- https://nces.ed.gov/opengis/rest/services/Postsecondary_School_Locations/EDGE_GEOCODE_POSTSECONDARYSCH_2425/MapServer/0
  (2026-09-22) — NCES EDGE geocoded postsecondary school locations, school year 2024-25. Queried
  `where=STATE='WA'`, returning 107 Washington records with `UNITID`, `NAME`, `STREET`, `CITY`, `ZIP`,
  `NMCNTY`, `LAT`, `LON`. Every `city`, `zip`, `lat` and `lon` in `highered.json` comes from this one
  service, except the two Pierce College rows noted below.
- Service directory used to find it: https://nces.ed.gov/opengis/rest/services/Postsecondary_School_Locations?f=json
  (2026-09-22). The 2425 file is the newest of ten years published there.

Because NCES publishes coordinates, **`lat`/`lon` are filled for 48 of the 49 rows**. Only Pierce
College Puyallup is `null` and needs the later geocoding step.

## The six public four-year institutions

- https://www.councilofpresidents.org/ (2026-09-22) — the Council of Presidents is the association of
  Washington's six public four-year institutions and names all six with their founding cities: Central
  Washington University (Ellensburg), Eastern Washington University (Cheney), The Evergreen State
  College (Olympia), University of Washington (Seattle), Washington State University (Pullman),
  Western Washington University (Bellingham).
- Same page, and https://councilofpresidents.org/institutions/ via search snippet (2026-09-22), for the
  multi-campus structure: UW is "a multi-campus research university in Seattle, Tacoma, and Bothell";
  WSU is "located in Pullman, with additional campuses in Everett, Tri-Cities, Spokane, and Vancouver."

Domains, each confirmed by an HTTPS request on 2026-09-22 returning that institution's own homepage:

| row | domain | resolved to | page title |
|---|---|---|---|
| University of Washington | washington.edu | https://www.washington.edu/ | UW Homepage |
| University of Washington Bothell | uwb.edu | https://www.uwb.edu/ | Homepage - The University of Washington Bothell |
| University of Washington Tacoma | tacoma.uw.edu | https://www.tacoma.uw.edu/ | UW Tacoma Home |
| Washington State University | wsu.edu | https://wsu.edu/ | Washington State University |
| Western Washington University | wwu.edu | https://www.wwu.edu/ | Western Washington University |
| Central Washington University | cwu.edu | https://www.cwu.edu/ | Central Washington University |
| Eastern Washington University | ewu.edu | https://www.ewu.edu/ | Eastern Washington University |
| The Evergreen State College | evergreen.edu | https://www.evergreen.edu/ | Home \| The Evergreen State College |

## The 34 community and technical colleges (SBCTC)

- https://www.sbctc.edu/our-colleges/college-contact-list.aspx (2026-09-22) — SBCTC's own contact list.
  Source of the 34 names and of all 34 website URLs. It lists Pierce College Fort Steilacoom and Pierce
  College Puyallup separately, and Seattle Central / North Seattle / South Seattle separately.
- https://www.sbctc.edu/about/history (2026-09-22) — primary source for two things. The five technical
  colleges: "Today, the VTIs (now called 'technical colleges') are Bates Technical College, Clover Park
  Technical College, Renton Technical College, Lake Washington Institute of Technology and Bellingham
  Technical College." And the count: "Pierce College Puyallup became the system's 34th college when the
  State Board for Community and Technical Colleges granted it college status as part of the Pierce
  District in June 1999."
- https://www.sbctc.edu/about/facts-publications/washingtons-community-technical-colleges (2026-09-22) —
  confirms "Washington's 34 community and technical colleges". Does not break out districts or types.
- https://en.wikipedia.org/wiki/Washington_State_Board_for_Community_and_Technical_Colleges (2026-09-22) —
  used only as a cross-check of the 34 names, cities, and the community/technical split. It agrees with
  the SBCTC pages on all 34. Nothing in `highered.json` rests on Wikipedia alone.
- https://www.sbctc.edu/colleges-staff/colleges-districts/college-links.aspx returned a 404 page on
  2026-09-22; the contact list above replaced it.

The 34 are 34 **colleges** in 30 **districts**. The extra four are the three Seattle colleges in one
district, the two Pierce colleges in one district, and the two Spokane colleges in one district. The
row count in `highered.json` is the college count, matching SBCTC.

### Pierce College — the only rows not from NCES

NCES publishes a single record, "Pierce College District", at 9401 Farwest Dr SW, Lakewood 98498 —
which is the Fort Steilacoom campus address. So:

- **Pierce College Fort Steilacoom** uses the NCES district record's ZIP and coordinates.
- **Pierce College Puyallup** has no NCES record. City and ZIP (Puyallup 98374) come from
  https://www.pierce.ctc.edu/contact (2026-09-22), which publishes both campus addresses:
  "9401 Farwest Drive SW / Lakewood, Washington 98498" and "1601 39th Avenue SE / Puyallup, Washington 98374".
  `lat`/`lon` are `null`.

Both rows carry `domain` `pierce.ctc.edu`, the district's single site — the two campuses do not have
separate hosts.

### CTC domains

All 34 URLs come from the SBCTC contact list. Each was requested over HTTPS on 2026-09-22 and returned
the right college's homepage, with these three caveats, none of which changes the domain:

- `bellevuecollege.edu`, `wwcc.edu` and `whatcom.edu` answered with a Cloudflare / WAF challenge
  (403) rather than the homepage. The hosts are correct; they block scripted requests.
- `olympic.edu` does not answer on the bare host over HTTPS; `www.olympic.edu` returns Olympic
  College's homepage and `olympic.edu` is a DNS alias of it. The bare host is kept, since `domain` is
  used for email-domain matching, not for linking.
- `scc.spokane.edu` and `sfcc.spokane.edu` are subdomains of the Community Colleges of Spokane's
  `spokane.edu`. They are what SBCTC publishes and what each college uses, so they are kept as-is.
  Staff email at both is `@sccd.ctc.edu` / `@scc.spokane.edu` depending on the system — **not verified**,
  see below.

## The seven private nonprofit institutions

501(c)(3) status verified directly against the IRS Exempt Organizations Business Master File extract
already in this repo (`data/raw/eo_wa_20260919.csv`, pulled 2026-09-19 from
https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf).
All seven are `SUBSECTION 03` with `FOUNDATION 11` (a school under 170(b)(1)(A)(ii)):

| row | IRS name on the BMF | EIN | NTEE |
|---|---|---|---|
| Gonzaga University | CORPORATION OF GONZAGA UNIVERSITY | 91-0236600 | B430 |
| Pacific Lutheran University | PACIFIC LUTHERAN UNIVERSITY INC | 91-0565571 | B430 |
| Seattle Pacific University | SEATTLE PACIFIC UNIVERSITY | 91-0565553 | B430 |
| Seattle University | SEATTLE UNIVERSITY | 91-0565006 | (blank) |
| University of Puget Sound | UNIVERSITY OF PUGET SOUND | 91-0564961 | B430 |
| Whitman College | WHITMAN COLLEGE BOARD OF TRUSTEES | 91-0567740 | B420 |
| Whitworth University | WHITWORTH UNIVERSITY | 91-0473310 | B430 |

The EIN is **not** carried in `highered.json` — the file's `id` is `HE-<n>` like the other seed files,
and `scripts/build-seeds.js` passes `id` through as the prototype's `ein` field the same way it does
for OSPI schools and workforce rows. If the backend wants the real EIN for these seven it is in the
table above and in the BMF.

Domains confirmed by HTTPS request on 2026-09-22: `seattleu.edu`, `whitworth.edu`, `plu.edu`,
`pugetsound.edu`, `whitman.edu` returned their own homepages. `gonzaga.edu` and `spu.edu` returned a
Cloudflare / Azure WAF challenge (403) at the correct host.

## Known imperfections

- **`count.public4yr` is 8, not 6.** Explained above. Six institutions, eight campus rows.
- **Yakima Valley College's ZIP is the PO Box ZIP.** NCES reports `98907-2520`, so the row says
  `98907`. https://www.yvcc.edu/ (2026-09-22) gives the Yakima campus as "S. 16th Ave & Nob Hill Blvd,
  Yakima, WA 98902" with mailing address "P.O. Box 22520 Yakima, WA 98907-2520". The `lat`/`lon` in the
  row are the physical campus. Left as NCES publishes it so the whole file comes from one source;
  change to `98902` if the ZIP is ever used for anything but display.
- **`sub` for Whitman College and The Evergreen State College is a bad fit.** The brief fixes `sub` to
  one of four values. Whitman is a liberal arts *college* but is tagged `Private university`, and
  Evergreen is a *college* but is tagged `University`, because both are four-year institutions and
  `level` is what the app groups on. Rename both `sub` values if the label is ever shown to a person.
- **WSU's four branch campuses are not rows.** NCES publishes Vancouver (98686), Tri-Cities/Richland
  (99354), Spokane (99202), Everett (98201) and a Global Campus, all with coordinates, and
  councilofpresidents.org confirms them. The brief named only UW Bothell and Tacoma, so WSU is one row
  at Pullman. Adding the four is a five-minute change against the same NCES query if Taylor wants the
  same treatment for both universities. EWU's Spokane Riverpoint campus and Evergreen's Tacoma program
  are in the same category and are also not rows.
- **Satellite and second campuses of the CTCs are not rows.** Skagit Valley (Whidbey), Yakima Valley
  (Grandview), Peninsula (Forks, Port Townsend), Big Bend, Olympic (Poulsbo, Shelton), Edmonds and
  others run additional sites. Only the main campus is in the file, as the brief asked.
- **Email domains are not verified as email domains.** `domain` is the institution's website host. For
  most of these the staff email domain is the same, but the Spokane colleges, Pierce and the UW branch
  campuses are cases where sign-up domain matching may need a second, different value. Nobody checked
  an actual staff address at any institution.
- **The live SBCTC "Explore colleges" map was not used.** The contact list is a plain HTML page and was
  read directly; no attempt was made to reconcile against a script-rendered map.
- **No enrollment, district, or county fields.** NCES publishes `NMCNTY` for every row and it was
  fetched, but the brief's shape has no county field so it was dropped. Add it from the same query if
  the app ever filters higher education by county the way it does schools.
