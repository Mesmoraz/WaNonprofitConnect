# Helpbook taxonomy

Approved 2026-09-21 (round A1). The participant types, the kinds of help, and the words the app uses for them. Every screen is built with these. Public-facing copy says "Name TBD" until Taylor says otherwise.

## Who's here

The six cards on the Role screen, in this order.

| # | Card | Line under it | Confirmed by | List comes from |
|---|---|---|---|---|
| 1 | A nonprofit | I work or volunteer at a 501(c)(3) or other tax-exempt organization. | Email domain matches the IRS record, or IRS letter, mailed code, member invite | IRS Business Master File (35,361 in WA), already loaded |
| 2 | A school or district | I work at a public or private school, or a district office. | District email domain, or a mailed code to the school | OSPI's public list of WA districts and schools; private schools are usually 501(c)(3)s and can come in as #1 |
| 3 | A workforce program | I work at a job-training or workforce development program. | As #1 if a nonprofit; agency email if government | WA Workforce Board councils and WorkSource centers, plus the IRS list |
| 4 | A business | We have goods, services, skills, or people to give. | Work email domain plus WA business license (UBI) lookup | Self-registered; UBI checked against WA Dept. of Revenue |
| 5 | A foundation | We fund organizations. | As #1 (foundations are in the IRS list with a foundation code) | IRS list, already loaded |
| 6 | Just me | I have time or skills to give. | Email and phone. Lighter; Grants stay hidden. | Nobody; people just sign up |

Individuals post like everyone else. The only thing they can't see is Grants.

## Threads (the eight kinds of help)

Everything anyone posts is a **need** or an **offer**, and each is one kind of help. A need and an offer put together is a **thread**. A thread that's done is a **golden thread**. The map draws exactly that.

| # | Mission name | In the app | A need sounds like | An offer sounds like | Usually needs | Usually offers |
|---|---|---|---|---|---|---|
| 1 | Volunteer | Time | Drivers, Saturday mornings, 4-hour shifts. | I have Saturday mornings free. | Nonprofits, schools, programs | People, businesses |
| 2 | Skills & Expertise | Skills | Bookkeeping, a few hours a month. | I'm a CPA. A few hours a month. | Nonprofits, schools, programs | People, businesses |
| 3 | Donation & Resource | Things | Laptops for client intake. | Refurbished laptops. | Nonprofits, schools, programs | Businesses, people, nonprofits |
| 4 | Corporate Partnership | Partnership | A sponsor for our summer meals program. | Our staff can volunteer one day a quarter. | Nonprofits, schools, programs | Businesses |
| 5 | Education | For schools | Guest speakers for career day. | We'll host a field trip to our shop. | Schools | Businesses, people, nonprofits |
| 6 | Workforce | Jobs and mentoring | Mock interviewers for 20 trainees. | We're hiring 3 apprentices this fall. | Workforce programs | Businesses, people |
| 7 | Grant Discovery | Grants | (organizations don't post these) | $10k to $25k for food security in King County, due Nov 15. | Confirmed organizations, searching | Foundations |
| 8 | Community Impact | Together | A winter coat drive across South Seattle. Who's in? | We'll be the drop-off point. | Several organizations at once | Several organizations at once |

Kinds 1 to 6 share one need/offer/thread flow with a "kind of help" field. Grants is its own screen; "Apply" leaves to the funder's site. Together is shown as a seeded example only, for now.

## How soon something is needed

Needs carry one of four levels. Only the two most urgent are marked on a card; the rest show nothing, so a mark means something.

| Level | On a card | In full |
|---|---|---|
| Critical | **Urgent** | Can't operate without it |
| High | **This week** | Needed this week |
| Normal | nothing | Needed this month |
| Low | nothing | Whenever it works |

Urgent stays capped at 2 a month per organization.

## Decisions

- **Money** stays off the app except through Grants. No cash offers as Things.
- **Grants are one-directional.** Foundations list; organizations search. Organizations do not post funding needs.
- **Together** is a seeded example, not a built flow, until after the prototype.

## Words-list changes (added to VOICE.md)

| Use | Not | Change |
|---|---|---|
| thread (a need and an offer, matched, in progress) | connection, match | replaces "connection" |
| golden thread (a thread that's done) | completed connection, fulfilled | new |
| start a thread (the verb, when you say "I can help" or "I need this") | propose, connect | new |
| kind of help (Time, Skills, Things, Partnership, For schools, Jobs and mentoring, Grants, Together) | category, thread type | replaces "category"; old categories become tags under Things |
| organization | | now means any of #1 to #5 above |
| people (for individuals) | supporters, community members, users | new |
| everyone here (all six) | members, participants | new |
| Helpbook in docs and the repo; Name TBD on anything public | | |
