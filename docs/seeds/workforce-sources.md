# Sources for `workforce.json`

Fetched 2026-09-21 (WebFetch / WebSearch; no browser). Every row in `workforce.json` traces to at least one URL below. Cities are uppercased per the app convention; `lat`/`lon` are null because no source publishes coordinates (a later geocoding step fills them).

The `tier` field on centers is extra to the brief's shape: `comprehensive` (full-service one-stop center), `affiliate`, or `connection`. `sub` stays `WorkSource center` for all rows so screens can key off one value.

## The 12 local boards

Names, websites, and counties for all 12 come from one page on the state Workforce Board site:

- https://wtb.wa.gov/planning-programs/regional-workforce-plans/ (2026-09-21) — lists the 12 local areas with website links and counties; also the source of the WDB-1..12 ordering.
- https://wtb.wa.gov/planning-programs/washington-workforce-system/ (2026-09-21) — confirms "12 Workforce Development Councils" (no names).

Office city/ZIP per board, from the board's own site:

| id | board | URL used for office address | date |
|---|---|---|---|
| WDB-1 | Olympic Workforce Development Council | https://www.kitsap.gov/hs/Pages/OWDC--LANDING-Home.aspx (614 Division St MS-23, Port Orchard 98366). wtb.wa.gov calls it "Olympic Consortium Workforce Development Council"; the board page uses "Olympic Workforce Development Council (OWDC)". Old kitsapgov.com link redirects here. | 2026-09-21 |
| WDB-2 | Pacific Mountain Workforce Development Council | https://pacmtn.org/ and https://pacmtn.org/about/contact/ (201 5th Ave SW Ste 401, Olympia 98501) | 2026-09-21 |
| WDB-3 | Northwest Workforce Council | https://www.nwboard.org/ (101 Prospect St, PO Box 2009, Bellingham 98227 — 98227 is the PO Box ZIP as published; the street address's ZIP is 98225 per the ESD list) | 2026-09-21 |
| WDB-4 | Workforce Snohomish | https://www.workforcesnohomish.org/getinvolved/contact/ (808 134th St SW Ste 105, Everett 98204) | 2026-09-21 |
| WDB-5 | WorkForce Central | https://workforce-central.org/about/contact-us/ (phone only). Address 3640 S Cedar St Ste E, Tacoma 98409 comes from a WebSearch snippet of workforce-central.org pages; not read directly on a fetched page. Weakest board address. | 2026-09-21 |
| WDB-6 | Workforce Development Council of Seattle-King County | https://www.seakingwdc.org/ (450 Alaskan Way S, Seattle 98104) | 2026-09-21 |
| WDB-7 | SkillSource (North Central Workforce Development Council) | https://www.skillsource.org/ (240 N Mission St, Wenatchee 98801). wtb.wa.gov names it "North Central Workforce Development Council"; the site operates as SkillSource. | 2026-09-21 |
| WDB-8 | South Central Workforce Development Council | https://scworkforce.org/ (1205 Ahtanum Ridge Dr Ste B, Union Gap 98903) | 2026-09-21 |
| WDB-9 | Workforce Southwest Washington | https://workforcesw.org/ (805 Broadway St Ste 412, Vancouver 98660) | 2026-09-21 |
| WDB-10 | Eastern Washington Partnership Workforce Development Council | https://www.ewpworkforce.org/ redirects (301) to http://ruralresources.org/eastern-washington-partnership (956 S Main St, Colville 99114); domain recorded as ruralresources.org | 2026-09-21 |
| WDB-11 | Benton-Franklin Workforce Development Council | https://www.bentonfranklinwdc.com/ and https://www.bentonfranklinwdc.com/for-workers (815 N Kellogg St Ste C, Kennewick 99336) | 2026-09-21 |
| WDB-12 | Spokane Workforce Council | https://spokaneworkforce.org/ (legal name "Spokane Area Workforce Development Council DBA Spokane Workforce Council") and https://spokaneworkforce.org/contact-us/ (140 S Arthur St Ste 300A, Spokane 99202) | 2026-09-21 |

## WorkSource centers

### Statewide list (baseline)

- https://media.multisites.wa.gov/media/WPC/adm/monitoring/eo-compliance/1b-13-list-of-worksource-centers-and-affiliate-sites.pdf (2026-09-21) — ESD Workforce Professionals Center copy of the worksourcewa.com office locator, grouped by area with Center / Affiliate / Connection tiers, counties served, and addresses. It is undated and mentions COVID-era service changes, so it is a few years old; every region below was cross-checked against a 2025-2026 source and rows were updated where a center moved. It is linked from https://wpc.wa.gov/wswa/worksource-system (2026-09-21).
- The live locator (https://seeker.worksourcewa.com/microsite/content.aspx?appid=MGSWAOFFLOC&pagetype=simple&seo=officelocator and the worksourcewa.com / www variants) returned HTTP 404 to WebFetch on 2026-09-21; it is script-rendered. Rows are therefore verified from the ESD PDF plus the regional pages below, not from the live locator.

### Per-region verification

| board | rows | current source(s) | date | notes |
|---|---|---|---|---|
| WDB-1 Olympic | WS-1, WS-2 | https://www.kitsap.gov/das/Documents/2026-023%20OSO%20RFP-FINAL.pdf ("two certified one-stop centers ... one each located in Clallam and Kitsap counties", contract from Oct 2026); addresses from the ESD PDF, matching OWDC meeting packets on kitsap.gov surfaced by WebSearch | 2026-09-21 | Kitsap Community Resources affiliate (Port Orchard) appears only in the ESD PDF; omitted. |
| WDB-2 Pacific Mountain | WS-3 to WS-6 | https://esd.wa.gov/about-us/news-release/2026/worksource-thurston-county-now-open-new-location-lacey (2026-06-02: 670 Woodland Square Loop SE Ste 100, Lacey); https://esd.wa.gov/about-us/news-release/2026/worksource-grays-harbor-opens-doors-new-employment-center-grays-harbor-college (2026-03-17: 1620 Edward P. Smith Dr, Room 2315, Aberdeen); https://opportunitybeginshere.org/job-seeker/resources-to-help-you-get-started/get-connected-to-worksource/ (PacMtn's job-seeker site, linked from pacmtn.org; lists Thurston 98503, Grays Harbor 98520, Mason, Lewis, Pacific) | 2026-09-21 | Lewis and Mason street addresses match the ESD PDF, which supplies their ZIPs and suites. Tier for Grays Harbor/Lewis/Mason taken from the ESD PDF (affiliate). "WorkSource Pacific" is now listed by PacMtn at the Aberdeen address while the ESD PDF lists a Long Beach connection site; neither could be confirmed as a distinct site, so no Pacific County row. |
| WDB-3 Northwest | WS-7 to WS-9 | https://www.nwboard.org/ (Bellingham 101 Prospect St; Oak Harbor 265 NE Kettle St Ste 102; Mount Vernon 2005 E College Way) matching the ESD PDF | 2026-09-21 | nwboard.org also lists a San Juan County office (540 Guard St Ste 160, Friday Harbor 98250) that the ESD list does not name as a WorkSource site; omitted. |
| WDB-4 Snohomish | WS-10 | https://esd.wa.gov/about-us/news-release/2025/worksource-everett-relocating-offers-interim-virtual-services (2025-03-11: 728 134th St SW Ste 102, Everett); https://www.workforcesnohomish.org/job-seekers/snohomish-county-worksource/ (ZIP 98204; SnoCo Connect youth site co-located); https://worksourceonline.com/ | 2026-09-21 | ESD PDF's 3201 Smith Ave address is superseded. The PDF's separate "SnoCo Connect" center is co-located and not a separate row. |
| WDB-5 Pierce | WS-11 to WS-13 | https://workforce-central.org/2022/08/30/new-worksource-site-coming-to-south-hill-mall/ (South Hill Mall site); WebSearch snippets of workforce-central.org pages for 2121 S State St Tacoma 98405 and JBLM Bud Hawk Transition Center 11577 41st Division Dr 98433; addresses/tiers from the ESD PDF | 2026-09-21 | South Hill Mall ZIP 98373 and JBLM room/suite are from the ESD PDF only. |
| WDB-6 Seattle-King | WS-14 to WS-16 | https://www.worksourceskc.org/locations/ ; https://www.seakingwdc.org/latest-news/2026/6/8/worksource-seattle-king-county-service-update-effective-june-30-2026 (after 2026-06-30 full service is at Auburn, North Seattle, Rainier only) | 2026-09-21 | ESD PDF's Downtown Seattle and South Seattle affiliates are excluded: South Seattle College closed 2026-06-30 and YWCA Downtown became a connection site. Rainier is an affiliate per seakingwdc.org (worksourceskc.org calls it a full-service center). |
| WDB-7 North Central | WS-17 to WS-20 | https://esd.wa.gov/about-us/news-release/2026/worksource-wenatchee-valley-relocating-new-location (2026-07-22: from 2026-08-03 at 234 North Mission St, Wenatchee, same building as SkillSource); https://skillsource.org/worksource-wenatchee-valley-co-located-at-skillsource/ (Aug 2026; buildings at 234 and 240 N Mission, Wenatchee 98801); https://skillsource.org/centers/ (Wenatchee 233 N Chelan Ave 98801; Moses Lake 309 E 5th Ave Ste B 98837; Omak 126 S Main St 98841; Othello); https://www.dshs.wa.gov/node/31302 (WorkSource Okanogan 126 S Main St, Omak 98841) | 2026-09-21 | ESD PDF's East Wenatchee address (270 Ninth St) is superseded. The PDF's "233 N. Chelan St., 98001" for SkillSource Wenatchee is a typo; skillsource.org's "233 N Chelan Ave, 98801" is used. SkillSource's Othello center is not on the WorkSource list; omitted. |
| WDB-8 South Central | WS-21 to WS-27 | https://scworkforce.org/wp-content/uploads/2026/03/WS-Policy-300-Attachment-B-List-of-Certified-WS-Centers-R3-3.20.26.pdf (board's certified-site list, last reviewed 2026-03-20: Union Gap comprehensive; Ellensburg, Goldendale, Sunnyside, White Salmon affiliate; Stevenson, Valley Mall connection) | 2026-09-21 | Addresses match the ESD PDF. |
| WDB-9 Southwest | WS-28, WS-29 | https://worksourceswwa.com/ (Vancouver 204 SE Stonemill Dr Ste 215, 98684; Kelso 305 S Pacific Ave Ste 101, 98626) | 2026-09-21 | Tiers from the ESD PDF. |
| WDB-10 Eastern | WS-30 to WS-32 | http://ruralresources.org/eastern-washington-partnership (Colville 956 S Main St 99114 is also the board office); https://www.dshs.wa.gov/node/31306 (WorkSource Walla Walla 1530 Stevens St 99362); Pullman from the ESD PDF only | 2026-09-21 | WorkSource Pullman is verified only on the undated ESD list. Blue Mountain Action Council (Walla Walla) and Rural Resources Clarkston affiliates and the Newport/Republic/Clarkston/WWCC connection sites appear only in the ESD PDF; omitted. |
| WDB-11 Benton-Franklin | WS-33 | https://www.dshs.wa.gov/node/31300 (WorkSource Columbia Basin 815 N Kellogg St Ste D, Kennewick 99336) matching the ESD PDF; board site links only to worksourcewa.com | 2026-09-21 | |
| WDB-12 Spokane | WS-34, WS-35 | https://worksourcespokane.com/about-us/affiliated-offices/ (130 S Arthur St 99202; Next Generation Zone 901 E Second Ave 99202, plus library/college connection sites) | 2026-09-21 | Library, college, Goodwill, YWCA and Fairchild AFB connection sites omitted. |

### Domains

`worksourcewa.com` is the statewide default. Regional WorkSource sites verified above and used as `domain`: `worksourceskc.org` (King), `worksourceonline.com` (Snohomish), `worksourceswwa.com` (Clark/Cowlitz/Wahkiakum), `worksourcespokane.com` (Spokane), `skillsource.org` (SkillSource Wenatchee).

### Not verified / left out

- The live worksourcewa.com locator could not be read (404 to WebFetch), so tiers for regions without a 2025-2026 board list (Olympic, Northwest, Pierce, Eastern, Benton-Franklin, Southwest, North Central except Wenatchee) rest on the undated ESD PDF.
- Library, college, and community-organization connection sites (roughly 100 statewide in the ESD PDF) are intentionally omitted; only WorkSource-branded sites plus the JBLM and SkillSource Wenatchee affiliates are included.
- WorkForce Central's board street address (WDB-5) was seen only in search snippets of its site.
- careeronestop.org's American Job Center list (a federal cross-check) returned HTTP 403.
