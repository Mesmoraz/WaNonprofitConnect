# Helpbook: the next phase

Draft for Taylor, Oct 2. Reorder anything. Approving this pull request approves the order; each story still gets its own brief and pull request. Roadmap ids in brackets; "new" means a story to add.

## 1. Where we are

The alpha is built and live: invite codes, board, post by picking, thread to golden, inbox, map, admin, a staging copy, and acceptance tests on every pull request. No real organization is using it yet, so the Sep 30 target is met on code, not on use. The mission's loop (need, match, golden thread) has not happened once for real.

What is blocking real use right now:

1. **No organizations yet.** Recruiting [S-78] is backlog; the invite message [S-79] is in progress. The biggest blocker by far.
2. **Google sign-in is still in Testing** [S-92], blocked on the privacy and terms wording the co-founder owns [T-53]. It doesn't stop the alpha: up to 100 Google accounts can be added by hand. Friction, not a wall.
3. **Nothing tells anyone something happened** [S-94]. A thread started on Monday sits unseen until someone opens the app. Threads will stall.
4. **The first visit after a quiet hour takes about 50 seconds** [S-90, T-58]. That is the first impression for every invited organization.
5. **33 stories sit in review**, and the real-phone check [S-102] has not been done. Google now accepts the staging address [T-203]; Taylor to confirm sign-in works there.
6. Small gaps the review found: names in all capitals [S-98], blank screens while loading [S-106], closed threads that don't say so [S-104], no map legend [S-105], and "Who they serve" hiding the few alpha posts there are [S-108].

## 2. Phase A: alpha in use (next 2 to 3 weeks)

Goal: 8 to 12 Seattle organizations in two or three clusters, each posting one need and one offer, and the first golden threads. Ordered by impact on those first threads. "Brief" means copy goes to Taylor first; "build" means no new words.

**Before the first invite goes out (this week)**

| # | Story | Why first | Type |
|---|---|---|---|
| 1 | Welcome card: one need, one offer [S-96] | Built, on staging in PR #10; brief approved (PR #6). First place anyone learns what a golden thread is. | Build |
| 2 | A database that doesn't pause [S-90] | About $5 a month. Portal change, no code. | Decision |
| 3 | Names in normal case, acronyms kept [S-98] | Capitals read like a government list. | Build |
| 4 | Who they serve starts empty while the board is small [S-108] | With 10 organizations, filters hide the trades we need. | Build, one-line brief change to the approved filter |
| 5 | Admin list of threads waiting on someone (new) | Lets Taylor nudge by hand from day one, with no email at all. | Build (admin only) |
| 6 | Every screen says something while it loads or fails [S-106] | A blank map on a slow phone looks broken. | Brief |
| 7 | Security headers [T-57], staging in the Google client [T-203], real-phone check [S-102] | Housekeeping before strangers arrive. | Build, Taylor |

**First two weeks of use**

| # | Story | Why | Type |
|---|---|---|---|
| 8 | Email when something waits on you [S-94] | Fixes stalled threads. Azure's email service sends from its own free address, so no domain needed [T-39]. At most one a day. | Brief |
| 9 | After sign-in, go back to the link you opened [S-107] | So a link in that email lands on the thread. | Build |
| 10 | A closed thread says so [S-104] | Declined already has approved words; cancelled needs them. | Brief |
| 11 | Alpha numbers on Admin [S-100] | The measures in section 6, so we learn without asking. | Build (admin only) |
| 12 | Map legend and what a golden thread is [S-105] | The map is the payoff; it needs to explain itself. | Brief |
| 13 | An organization describes itself [S-99] | A line, a website, a contact person. Trust before saying yes. | Brief |
| 14 | Members invite colleagues [S-95] | Recruiting promised up to three people per organization. | Brief |
| 15 | Edit a need or offer [S-97] | Small, expected, and stops delete-and-repost. | Brief |
| 16 | The copy that needs a brief [S-109] | Fold each line into the story above that touches it, then retire S-109. | Brief |

Also in Phase A, not code: **Mario sends the invite** [S-79], **recruiting** [S-78] moves to in progress, and two new research stories:

- New: "Check-in calls mid-October and at the end; what they say becomes stories the same day."
- New: "A review sweep: Taylor checks the 33 in-review stories on staging and each goes to done or back."

Proposed email subject lines for S-94, for the brief: "Ballard Food Bank can help with Laptops", "New message from Ballard Food Bank", "You're in. Post one need and one offer."

## 3. Phase B: beta (after the alpha's lessons)

Nonprofits trading with each other prove the loop; the flywheel turns when the other five kinds bring help. Order:

1. **Sign-in for everyone.** Buy a domain [S-82], sign in by email [S-85, T-40, T-41], Microsoft sign-in [S-83]. Every new kind needs a way in that isn't Google. The domain also gives the privacy page its contact email and the email notices a proper sender.
2. **Real trust.** Pub 78 and the revocation list so "active" is true [S-36], confirm methods per kind [S-50, merged with S-40], a separate email-domain field [S-64], reporting and a review queue for posts [S-52]. Each kind below leans on this.
3. **Schools and districts, the For schools thread.** Taylor chose schools next [T-34]. OSPI's list is loaded [S-11, S-35, S-62]; district email domains [T-25] give an automatic confirm. Nonprofits already post For schools offers, so threads can start the first week. Includes relabeling non-district LEAs [S-59] and the WSU question [S-63].
4. **Workforce programs, the Jobs and mentoring thread.** The list exists [S-12]; load it in the backend [S-37]. Most are nonprofits, so they confirm like one. Cheap to add right after schools.
5. **Businesses: Partnership, Skills, Time, Things.** The biggest supply of help. Needs the UBI check [S-38] and answers to T-35 to T-38 (offers only? map on the office? how confirmed?), then the company screens [S-86]. The paid tier [S-89] waits until businesses are actually here.
6. **People ("Just me"): the Volunteer and Skills threads.** Lightest confirm (email and phone), so it comes after reporting and rate limits are real. Grants stay hidden from people.
7. **Foundations and Grant Discovery.** Flag foundations in the IRS list [S-13], the grant model with the eight filters and a hand-off link [S-47], the screen [S-21], gated to confirmed organizations [S-51], a funder's words quoted, not ours [S-60]. Discovery only: Helpbook never writes or submits an application; "Apply" leaves to the funder, Benevity, or another authorized site. Validated users only.
8. **Together, the Community Impact thread.** A thread with many ends [S-27], with pin colors for six kinds [S-26].
9. **Store apps** through Capacitor, after an Apple developer account [S-81]. New: "Notices on your phone when the app is installed."
10. **Integrations**, Benevity first [S-58], subject to their APIs and an agreement. Helpbook stays the connection layer.

Why: sign-in and trust unblock every kind; schools and workforce reuse loaded data and add needs where nonprofits already have offers; businesses and people bring the help; grants wait for real validation, as the mission requires. Standing agreements [S-43] wait until the alpha shows whether trades repeat.

## 4. Phase C: the organization behind it

- **Form the 501(c)(3)** [S-56]. Washington nonprofit corporation (check the name there too), bylaws, a board, an EIN, then IRS Form 1023, or 1023-EZ if eligible. Register for charitable solicitation before asking for money. A fiscal sponsor is the fallback if a grant arrives before the IRS letter.
- **Funding.** Nonprofits get everything free (Sep 24 decision). Early money from foundation grants, sponsorships, and gifts. The business tier [S-89] comes later, framed as sponsorship or a program fee, with a CPA's read on unrelated business income before it is priced.
- **Privacy and terms with a lawyer** [S-77, T-53]. Interim facts now so S-92 can leave Testing; a lawyer reads both pages and the liability line before anything public.
- **The name** [S-55] stays Name TBD in public until the corporation and domain are settled.

## 5. Decisions for Taylor

1. **Don't wait on Google leaving Testing.** Add each invited person's Google account by hand (limit 100). *Recommend: yes.*
2. **Privacy and terms facts.** Give the co-founder until Oct 9 for T-53, then fill the 5 placeholders with interim values yourself. *Recommend: yes; lawyer's read before any public launch.*
3. **$5 a month for a database that doesn't pause** [S-90]. *Recommend: yes, now.*
4. **Notices.** Hand nudges from the new Admin list this week, then email from Azure's free sender address [T-39]. *Recommend: both; don't wait for a domain.*
5. **Buy a domain now** [S-82]. Buying doesn't make the name public. *Recommend: yes, this month.*
6. **Recruiting dates.** Mario's first list by Oct 7, invites out by Oct 9, first calls Oct 20. *Recommend: set them with Mario.*
7. **Beta order:** sign-in and trust, schools, workforce, businesses, people, grants, Together. *Recommend as listed (it follows your Sep 24 answer). Alternative: businesses before schools if the alpha shows offers are scarce.*
8. **Grants as discovery only, validated users only, after trust.** *Recommend: confirm the mission's line holds; no grant writing ever.*
9. **Retire the stale items below.** *Recommend: approve in one roadmap pull request.*
10. **501(c)(3) path.** *Recommend: incorporate in Washington now, file 1023-EZ if eligible, fiscal sponsor only if needed.*

**Stale and duplicate items to retire or merge**

- Done by alpha stories, move to done in the review sweep: S-17, S-39, S-41, S-42, S-44, S-45.
- Frozen prototype, retire: S-22, S-24, S-25, S-28, S-29, S-30, S-31, S-32, S-33.
- Merge: S-40 into S-50 (both are confirm by kind). S-46 splits: alerts into S-94, capability tags stay. S-109 folds into the stories it touches.
- Park until Beta: S-61 (900+ organizations), S-87 (map search), T-45 (second inbox).
- Fix: S-78 should be in progress, not backlog.

## 6. How we'll know it's working

All six come from data we already keep; S-100 puts them on Admin.

1. **Golden threads per month.** The mission's one number. Alpha target: 3 by Oct 31.
2. **Share of posts that get a thread within 14 days.** Target: 1 in 3. Low usually means the wrong mix of organizations.
3. **Time to first message on a new thread.** Target: under a day, median. This is the notification test.
4. **Share of started threads that become golden.** Target: half. Shows whether threads stall after "I can help".
5. **Organizations that post both a need and an offer in their first week.** Target: 8 in 10. The welcome card's test.
6. **Organizations that have both given and received.** The flywheel itself: help moving both ways, not one-way charity.
