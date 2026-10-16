# Helpbook alpha: technical plan for what's left

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to carry out one round at a time. Steps use checkbox (`- [ ]`) syntax. **The repo's process wins over any Superpowers default:** one story in progress per lane, brief → approve → build → check → ship, a branch and a pull request per round (never `main`), a change log file per round, the roadmap moved in the same round, and Taylor merges.

Written Oct 10 with the Superpowers writing-plans skill. Internal doc: the real name is fine here. The public roadmap still says Name TBD.

**Goal:** finish the alpha so 8 to 12 Seattle organizations can join, find each other, and make the first golden threads. That means the four stories whose briefs are approved, the go-live gates, and email notices once there's a way to send them for free.

**Architecture:** no new architecture. Every round is the existing pattern. An EF Core entity or column plus a migration in `WaNonprofitConnect.Data`. A service method that takes an explicit `now`/`asOf` so it can be tested. A thin controller in `WaNonprofitConnect.Api`. A typed client method, a React Query hook and a matching fake in `app/src/api/mock` (the demo runs on the fake, so it needs every new call). A screen in `app/src/screens`. An xUnit test per rule and a Playwright test per story named `[S-n]`.

**Tech stack:** .NET 10, EF Core on SQL Server (SQLite in unit tests), SignalR. React + TypeScript (Vite), React Query, Playwright. Azure App Service B1 and Azure SQL free serverless, both already paid for or free.

**Spec:** `docs/ALPHA.md` (scope, contract), `docs/ALPHA-BRIEFS.md` (every word, approved), `docs/PLAN.md` (the order and the six measures), `roadmap/SDLC.md` (process).

## Global constraints

- Copy: only words approved in `docs/ALPHA-BRIEFS.md`. A sentence a person can see that isn't there (a new error, a new empty state) goes to Taylor before it's built. Check against `docs/VOICE.md`.
- No new paid Azure resources or services until Mario confirms (Taylor, Oct 7). Free first. S-90 and the Azure email path of S-94 stay blocked.
- A branch from an up-to-date `origin/main` in its own worktree, one pull request per round on `Mesmoraz/WaNonprofitConnect`, title says what a person will notice. Claude never merges unless Taylor asks in chat.
- Each round: `node scripts/roadmap.js set <id> in-progress` at the start, `review` when the PR opens. One file in `roadmap/changelog/`. Never commit `roadmap/README.md` or `roadmap/CHANGELOG.md`.
- Every endpoint that acts for an organization uses the signed-in person's confirmed membership. No email address ever reaches a screen outside your own organization or Admin.
- Every new call is added to the contract in `docs/ALPHA.md` (Backend notes) in the same round.
- `npm run lint`, `npm run build`, `dotnet test`, and `npm run test:e2e:local` pass before the PR opens. A screen PR gets the `staging` label.

## Review focus

The five things most likely to hurt a real person that no single round's happy path covers. Each has a test in the round that owns it.

1. **An email address leaks onto a public page.** The org page shows "Ask for {first name}", never the email (Round 1, `Org_page_shows_first_name_never_email`).
2. **Taylor's "Test as this organization" takes one of an organization's 3 places**, or counts in the numbers (Round 2, `Admin_test_membership_does_not_take_a_place`. Round 4, depending on T-237).
3. **Editing a post to Urgent gets around 2 a month**, or editing an urgent post uses another one up (Round 3, `Editing_to_urgent_counts_once`).
4. **An edit leaves the old words in search and in "could fit".** `SearchText` must be rebuilt (Round 3, `Edit_rebuilds_search_text`).
5. **"Golden threads in October" counts by UTC.** A thread done at 9pm on Oct 31 in Seattle belongs to October (Round 4, `Month_is_counted_in_Pacific_time`).

---

## Where things stand (Oct 10)

- **Built and merged:** everything in ALPHA.md's "What's in", plus Phase A's welcome card, names in normal case, return to link, who they serve while small, waiting on someone, loading and error lines, closed threads, the map legend, security hardening, .NET 10.
- **Ready (briefs approved by merging #26 and #28):** S-99, S-95, S-97, S-109, S-100.
- **Blocked on money:** S-94 (email), S-90 (a database that doesn't pause), S-81, S-82.
- **Blocked on Mario:** T-53 privacy and terms wording, which blocks S-92 (Google sign-in out of Testing). S-79 invite message.
- **In review:** 36 stories, waiting on Taylor's check on staging.
- Fixed in this PR: S-98 and S-107 were merged (#18, #16) but still said backlog. Both are now done.

## The rounds, in order

| Round | Story | Lane | Depends on | Why this order |
|---|---|---|---|---|
| 0 | Review sweep and roadmap tidy (not code) | process | none | 36 in review is noise; retire the frozen prototype items PLAN.md listed. |
| 1 | S-99 Your organization: about you | app | none | Trust before saying yes to a stranger. It also builds the screen Round 2 adds to. |
| 2 | S-95 Invite someone + S-109's "Find yours" line | app | Round 1 (the screen, `GET /org`) | The alpha promised 3 people per organization. Only Taylor can add them today. |
| 3 | S-97 Edit a post + the rest of S-109 | app | none (can swap with 1 or 2) | Stops close-and-repost, which loses threads. Closes S-109. |
| 4 | S-100 Admin numbers | app | answers to the brief's 3 questions and T-237 | Useful from the first real post. Admin only, so it can slip a few days without anyone noticing. |
| 5 | Go-live gate: S-102 phone check, production deploy, first invites | research | Rounds 1 to 4 merged | The first invites go out on a build that's been on a real phone. |
| 6 | S-94 Email when something waits on you | backend + app | T-236 (how to send for free), Taylor's OK on new lines | Threads stall without it. Until then, Admin's "Waiting on someone" covers it by hand. |
| 7 | S-92 Google sign-in out of Testing | ops | T-53 (Mario) | Config only, once the privacy and terms wording is in. |

Rounds 1 to 4 are all in the `app` lane, so they run one at a time. To go faster, the backend half of the next round (entity, migration, service, tests) can be built in the `backend` lane while the current round's screen is checked. It ships in the next round's PR, not its own.

Parked until Beta (no work in the alpha): S-61, S-83, S-85, S-86, S-87, T-45, S-90 unless Mario says yes, and the E-5 / E-14 grants work.

---

## Round 0: review sweep and roadmap tidy

Not code. Taylor's calls, done in one `process/` PR if he agrees.

- [ ] Taylor runs the phone checks for the 36 in-review stories on staging. Each goes to `done`, or gets a task saying what's wrong.
- [ ] Retire or merge what PLAN.md §5 item 9 listed (frozen prototype stories S-22, S-24, S-25, S-28 to S-33; S-40 into S-50; S-46 split; S-109 folds away in Round 3). Needs Taylor's yes: open question 6.
- [ ] Before the next **Deploy to production**, switch `helpbook-alpha` to .NET 10 (the task from #33).
- [ ] T-203: staging's address in the Google sign-in client, if not done.
- [ ] T-223 (separate `fix/` PR, test-only): second browsers in `app/e2e` take `BASE_URL` from the config instead of defaulting to 5173.

## Round 1: Your organization, about you (S-99)

Branch `story/S-99-your-organization`. Brief: ALPHA-BRIEFS.md, "Your organization", the "About you" part and the org-page lines. Brief questions 1 and 2 need answers first (open question 2).

**Files:**
- Create: `src/WaNonprofitConnect.Data/Entities/OrgProfile.cs`, `src/WaNonprofitConnect.Data/Accounts/OrgProfileService.cs`, migration `AddOrgProfile`
- Modify: `AppDbContext.cs` (DbSet, key on `Ein`, FK to `Organization`, `ContactAccountId` FK to `Account` with `SetNull`), `Exchange/HelpbookContracts.cs` (`OrgPageDto`), `HelpbookService` org page query, `Api/Controllers/AccountControllers.cs` (new `OrgController`), `Program.cs` (register the service)
- App: create `app/src/screens/org/YourOrg.tsx`; modify `api/types.ts`, `api/client.ts`, `api/hooks.ts`, `api/mock/index.ts`, `shell/WhoButton.tsx` (menu item above "Send feedback"), `screens/org/OrgScreen.tsx`, `App.tsx` (route `/org`, inside the confirmed stage)
- Test: `tests/WaNonprofitConnect.Tests/OrgProfileTests.cs`, `app/e2e/your-organization.spec.ts`

**Interfaces:**
- Produces (C#):
  - `OrgProfile { string Ein; string? About; string? Website; Guid? ContactAccountId; DateTime UpdatedAt; string UpdatedBy }`. Its own table, so the monthly IRS import never touches it.
  - `OrgProfileService.GetMineAsync(Guid accountId, CancellationToken) → MyOrgDto`
  - `OrgProfileService.SaveAsync(Guid accountId, SaveOrgProfileRequest, CancellationToken) → MyOrgDto`
  - `record MyOrgDto(OrgSummaryDto Org, string? About, string? Website, Guid? ContactAccountId, IReadOnlyList<OrgPersonDto> People, int PlacesLeft)`. `PlacesLeft` is filled in Round 2; return `0` here.
  - `record OrgPersonDto(Guid AccountId, string Name, string Email, bool IsYou)`
  - `record SaveOrgProfileRequest(string? About, string? Website, Guid? ContactAccountId)`
  - `OrgPageDto` gains `string? About, string? Website, string? AskFor` (first name only).
- Produces (HTTP): `GET /api/v1/org` and `PUT /api/v1/org` (confirmed members only: `403` otherwise).
- Produces (TS): `interface MyOrg { org: OrgSummary; about: string|null; website: string|null; contactAccountId: string|null; people: OrgPerson[]; placesLeft: number }`, `useMyOrg()`, `useSaveMyOrg()`. `OrgPage` gains `about`, `website`, `askFor`.

**Rules the code decides:**
- `About`: trimmed, empty becomes null, 140 characters at most (the field's `maxLength` stops more, so the server's 400 is never seen).
- `Website`: trimmed, empty becomes null. A bare host gets `https://`. Only `http` and `https` are kept; anything else is `400`. 200 characters at most. The link renders with `rel="noopener nofollow ugc"` and `target="_blank"`.
- `ContactAccountId` must be a confirmed member of the same organization, otherwise `400`. If that person leaves, the FK sets it to null.
- "Ask for {first name}": the first word of `Account.Name`.

- [ ] **Step 1: Failing service tests** in `OrgProfileTests.cs`: `Save_trims_about_and_adds_https_to_a_bare_website` (`"  We run a food bank. "`, `"ballardfoodbank.org"` → `"We run a food bank."`, `"https://ballardfoodbank.org"`). `Website_that_is_not_http_is_refused` (`"javascript:alert(1)"` → `ExchangeException` Invalid). `Who_to_ask_must_be_confirmed_here` (a pending member's id → Invalid). `Pending_member_cannot_read_or_save` (Forbidden). `Org_page_shows_first_name_never_email` (contact "Casey Jones" → `AskFor == "Casey"`, and no string property of the serialized `OrgPageDto` contains `@`). `Import_does_not_touch_the_profile` (run `BmfImporter` over the org → profile unchanged).
- [ ] **Step 2:** `dotnet test --filter OrgProfileTests`. Expected: FAIL, the types don't exist.
- [ ] **Step 3:** Entity, migration (`dotnet ef migrations add AddOrgProfile -p src/WaNonprofitConnect.Data`), service, controller, `OrgPageDto` fields.
- [ ] **Step 4:** `dotnet test`. Expected: all pass, including the existing 230.
- [ ] **Step 5:** Commit "Server: an organization says what it does".
- [ ] **Step 6: Failing e2e** `[S-99] an organization says what it does, and others see it on its page`. A member opens **Your organization**, sees the headline and the "Seattle · Food · EIN" line, types into "What you do" and "Website", picks a "Who to ask" chip, taps **Save**, sees "Saved.". A second organization opens the first one's page and sees the line, the website link and "Ask for {first name}", and no email.
- [ ] **Step 7:** Screen, menu item, org page lines, client, hooks, and the fake in `api/mock` (so the demo works).
- [ ] **Step 8:** `npm run lint; npm run build; npm run test:e2e:local`. All pass. Check at 375px in the browser pane with the console clean.
- [ ] **Step 9:** Commit "App: Your organization, and the line on its page". Contract added to ALPHA.md. Change log file. `node scripts/roadmap.js set S-99 review`. PR labeled `staging`.

## Round 2: Invite someone from your organization (S-95, and S-109's Find yours line)

Branch `story/S-95-invite-colleagues`. Brief: "Your organization", the "People here" and "Invite someone" parts, and the Find yours line.

**Files:**
- Modify: `Entities/Account.cs` (`Invite.ByMember bool`), migration `AddInviteByMember`, `Accounts/AccountService.cs` (`CreateMemberInviteAsync`), `OrgProfileService.cs` (`PlacesLeft`), `OrgController` (new route)
- App: `screens/org/YourOrg.tsx` (People here, Invite someone), `screens/find/FindYours.tsx` (the line), `api/*`, `api/mock/index.ts`
- Test: `AccountServiceTests.cs`, `app/e2e/your-organization.spec.ts`

**Interfaces:**
- Consumes: `MyOrgDto`, `OrgPersonDto` (Round 1).
- Produces: `AccountService.CreateMemberInviteAsync(Guid accountId, CancellationToken) → InviteDto`, `POST /api/v1/org/invites` (`201` with `{ code, ein, orgName, uses: 1, used: 0 }`), `const int PlacesPerOrg = 3`. TS: `useMakeOrgCode()`.

**Rules the code decides:**
- `PlacesLeft = 3 − confirmed memberships at the org that didn't come from "ADMIN" or "DEV" − unused member-made codes`. Admin-made codes can still go past 3, as the brief says.
- A member-made code works once (`Uses = 1`), `ByMember = true`, `CreatedBy` = the member's email.
- The last place goes to one code when two people ask at once: count and insert inside one serializable transaction, as the existing invite race does.

- [ ] **Step 1: Failing tests:** `Member_code_works_once_and_confirms_for_their_org`. `Places_left_counts_people_and_unused_codes` (2 people + 1 unused code → 0). `Fourth_code_is_refused` (Conflict). `Admin_test_membership_does_not_take_a_place` (Taylor act-as → still 3 left). `Admin_codes_can_go_past_three`. `The_last_place_goes_to_one_code_when_two_ask_at_once`. `Pending_member_cannot_make_a_code` (Forbidden).
- [ ] **Step 2:** `dotnet test --filter AccountServiceTests`. Expected: FAIL.
- [ ] **Step 3:** Column, migration, `CreateMemberInviteAsync`, `PlacesLeft`, route.
- [ ] **Step 4:** `dotnet test`. Expected: PASS. Commit "Server: members make one-use codes, 3 places".
- [ ] **Step 5: Failing e2e** `[S-95] a member makes a code and a colleague joins with it`: "Up to 3 people can be here. 2 left." → **Make a code** → the code shows with "Send it to them yourself. It works once." → tap copies ("Copied.") → a second browser signs in, enters the code, lands confirmed → the first browser's "People here" lists them. Then `[S-109] Find yours says to ask for a code`: claim an org that has members → "Already on {name}. Ask someone there for an invite code."
- [ ] **Step 6:** Screen sections, the Find yours line, fake. Lint, build, e2e, 375px check.
- [ ] **Step 7:** Commit, contract, change log, `set S-95 review`, mark T-234 done, PR labeled `staging`.

## Round 3: Edit a need or offer, and the rest of S-109

Branch `story/S-97-edit-a-post`. Brief: "Edit a need or offer (S-97)" and "Small lines (the rest of S-109)".

**Files:**
- Modify: `Entities/Exchange.cs` (`Listing.EditedAt`, `Listing.UrgentSince`), migration `AddListingEdits` (backfill `UrgentSince = CreatedAt` for urgent needs), `Exchange/UrgentCap.cs`, `HelpbookService.cs` (`UpdateListingAsync`), `HelpbookContracts.cs`, `Accounts/AccountContracts.cs` (`urgentAgainOn`), `ExchangeControllers.cs` (`PUT listings/{id}`)
- App: `screens/post/Post.tsx` (edit mode), `screens/listing/ListingScreen.tsx` (Edit button, "· Edited", offer placeholder), `App.tsx` (route `/listing/:id/edit`), `api/*`, `api/mock/index.ts`
- Test: `HelpbookServiceTests.cs`, `app/e2e/post.spec.ts`

**Interfaces:**
- Produces: `HelpbookService.UpdateListingAsync(int id, string actingEin, UpdateListingRequest req, CancellationToken) → ListingViewDto`. `record UpdateListingRequest(KindOfHelp Help, string Title, string? Description, decimal? Quantity, string? Unit, Urgency Urgency, Cadence Cadence)` (no `Kind`: a need stays a need). `ListingViewDto` gains `DateTime? EditedAt` and, on your own post, `int? OpenThreads`. `Me.membership` gains `urgentAgainOn: string | null` (the date a used Urgent leaves the 30 days, only when none are left). `UrgentCap.LeftAsync` counts `UrgentSince` in place of `CreatedAt`, plus a new `UrgentCap.AgainOnAsync(db, ein, now) → DateTime?`.
- HTTP: `PUT /api/v1/listings/{id}` → `200` with the listing. Not yours `403`. Closed or done `409`.

**Rules the code decides:**
- Same validation as create (quantity 1 to 1,000,000, urgency saved as Normal on an offer).
- `UrgentSince` is set when a need becomes Critical, by create or edit, and kept if it was already Critical. The cap counts `UrgentSince` within 30 days.
- `SearchText` is rebuilt the same way as on create. `EditedAt = now`. `UpdatedAt = now`.
- Each live (proposed or accepted) thread on the post sends `threadChanged` to both organizations. No new hub event.
- Edit mode reuses Post's fields and chips. The "What is it?" chip is preselected when the title equals one; otherwise "Something else" opens with the title.

- [ ] **Step 1: Failing tests:** `Only_the_poster_can_edit` (403). `Closed_post_cannot_be_edited` (409). `Edit_keeps_kind_and_open_threads`. `Edit_rebuilds_search_text` (title "Laptops" → "Desks"; a "desk" search finds it and "laptop" doesn't). `Editing_to_urgent_counts_once` (2 urgent used → edit a third to Critical → 409 with `UrgentCap.Message`). `Editing_an_urgent_post_keeps_its_place` (edit an already urgent post's title → no extra use). `Urgent_again_on_is_when_the_oldest_leaves_the_window` (used on Sep 21 and Oct 1, now Oct 10 → Oct 21). `Edit_tells_both_sides_of_a_live_thread` (fake notifier records `threadChanged` for both EINs).
- [ ] **Step 2:** `dotnet test --filter HelpbookServiceTests`. Expected: FAIL.
- [ ] **Step 3:** Columns, migration with backfill, cap change, service, route, DTO fields.
- [ ] **Step 4:** `dotnet test`. Expected: PASS. Commit "Server: edit a post; Urgent counts from when it became urgent".
- [ ] **Step 5: Failing e2e** `[S-97] edit a need: fix the title and count, threads stay`: your open need → **Edit this need** → "Edit your need", no "We need" / "We have" chips → change the count → with a thread open, "1 thread is open on this. They'll see the change." → **Save changes** → "Saved." → back on the post with "· Edited". `[S-109] an offer asks what you'd use it for`: the placeholder on an offer is "Say what you'd use it for and when." `[S-109] Urgent says when it comes back`: after 2 urgent needs, the hint reads "You've used Urgent twice this month. You can use it again on {Mon d}."
- [ ] **Step 6:** App changes and the fake. Lint, build, e2e, 375px check.
- [ ] **Step 7:** Commit, contract, change log, `set S-97 review`, `set S-109 review` (its brief folded into Rounds 2 and 3), mark T-235 done, PR labeled `staging`.

## Round 4: How it's going, on Admin (S-100)

Branch `story/S-100-admin-numbers`. Brief: "How it's going (Admin)". Needs answers to the brief's 3 questions and T-237 first (open question 3).

**Files:**
- Create: `src/WaNonprofitConnect.Data/Exchange/AlphaNumbers.cs`
- Modify: `AccountControllers.cs` (`AdminController`: `GET numbers`), `Program.cs` if a service is registered
- App: `screens/admin/Admin.tsx` (new first section), `api/*`, `api/mock/index.ts`, `lib/words.ts` (minutes, hours, days)
- Test: `tests/WaNonprofitConnect.Tests/AlphaNumbersTests.cs`, `app/e2e/admin.spec.ts`

**Interfaces:**
- Produces: `static Task<AlphaNumbersDto> AlphaNumbers.ComputeAsync(AppDbContext db, DateTime asOfUtc, CancellationToken)`.
  `record Ratio(int Got, int Of)`.
  `record AlphaNumbersDto(int Posts, int Started, int Accepted, int Golden, int GoldenThisMonth, string Month, Ratio ThreadWithin14Days, int? FirstAnswerMedianMinutes, Ratio BecameGolden, Ratio BothInFirstWeek, Ratio GivenAndReceived)`.
  `GET /api/v1/admin/numbers` (admin only).
  TS: `interface AlphaNumbers` with the same fields, `useAdminNumbers()`.

**Rules the code decides (the defaults the brief proposes; change them if Taylor answers otherwise):**
- Month boundaries in `America/Los_Angeles`. `Month` is the English month name. The app shows "Goal: 3 by Oct 31" in October, "Goal: 3 a month" after.
- Row 2: posts at least 14 days old, or younger with a thread. Got = those with a thread started within 14 days of posting.
- Row 3: per thread, from `CreatedAt` to the earlier of `RespondedAt` and the first message from the side that didn't start it. Median of those answered. `null` → "None yet".
- Row 4: Of = done threads + threads still open after 30 days + declined + cancelled. Got = done.
- Row 5: organizations whose first membership is at least 7 days old, or younger with both posted. Got = posted a need and an offer within 7 days of their first membership.
- Row 6: Of = organizations with a confirmed member. Got = those that were the giver on one done thread and the receiver on another.
- The demo runs entirely in the browser, so it never reaches these counts. Admin test threads: per T-237, either counted, or left out by adding `Match.StartedByAccountId` (a migration plus one line in `StartOrReuseThreadAsync`) and skipping threads started by an admin account.

- [ ] **Step 1: Failing tests** with a fixed `asOf`, one per row plus: `Empty_database_gives_none_yet` (all `Of == 0`, median `null`). `Month_is_counted_in_Pacific_time` (done at 2026-11-01 04:00 UTC counts in October). `First_answer_ignores_the_starters_own_messages`. `Young_posts_without_a_thread_are_not_counted_yet`.
- [ ] **Step 2:** `dotnet test --filter AlphaNumbersTests`. Expected: FAIL.
- [ ] **Step 3:** `AlphaNumbers.ComputeAsync` and the route.
- [ ] **Step 4:** `dotnet test`. Expected: PASS. Commit "Server: the six alpha numbers".
- [ ] **Step 5: Failing e2e** `[S-100] Admin shows how it's going`: "How it's going" is the first section. The totals line reads "{n} posts · {n} threads started · {n} accepted · {n} golden". Six rows, with "None yet" wherever there's nothing to count. The line "Counts real organizations only. The demo isn't counted." shows.
- [ ] **Step 6:** Section, duration words, fake. Lint, build, e2e, 375px check.
- [ ] **Step 7:** Commit, contract, change log, `set S-100 review`, PR labeled `staging`.

## Round 5: Go-live gate

Not a code round. Done when the first invite codes go out.

- [ ] Rounds 1 to 4 merged and on staging. Taylor runs their phone tests.
- [ ] S-102 / T-238: iPhone Safari and Android Chrome, the map most of all. Install to the home screen, sign in, post, start a thread, message live.
- [ ] Production App Service on .NET 10, then **Deploy to production**.
- [ ] Every invited person's Google account added to the Testing list (up to 100) until S-92.
- [ ] S-79: Mario sends the invite. Taylor makes each code on Admin. S-78 moves to in progress.
- [ ] Taylor nudges by hand from "Waiting on someone" until Round 6 ships.

## Round 6: Email when something waits on you (S-94)

Branch `story/S-94-email-notices`. Brief approved (PR #17). **Blocked:** T-236 (how to send for free) and two lines the brief doesn't cover (open question 5). Plan it now so it's one round once unblocked.

**Approach, free first:** the code sends through an `INoticeSender` interface, so the way mail goes out is a setting:
- `LogNoticeSender` (default): writes the email to the log and sends nothing. The round can merge with sending off.
- `SmtpNoticeSender`: plain SMTP (`System.Net.Mail`, no new package). It works with a project Gmail account and an app password (free, 500 a day, sent from that Gmail address), or with any free-tier provider's SMTP. Credentials go in App Service settings, never in the repo.
- Azure's email service later, when Mario confirms, as a third sender. The brief's "Sent by Azure's email service" line then holds as written.

**Files:**
- Create: `src/WaNonprofitConnect.Data/Notices/` (`Notice.cs` entity, `NoticeService.cs`, `NoticeText.cs` for the approved subjects and bodies, `INoticeSender.cs`), `src/WaNonprofitConnect.Api/Notices/` (`LogNoticeSender.cs`, `SmtpNoticeSender.cs`, `NoticeWorker.cs` as a `BackgroundService`, `NoticesController.cs`)
- Modify: `Entities/Account.cs` (`NoticesOff bool`), migration `AddNotices`, `HelpbookService` (raise on start and accept through the existing `IHelpbookNotifier` seam), `AccountService.DecideClaimAsync` (approved), `screens/legal/Legal.tsx` (the privacy line), `Program.cs`
- Test: `NoticeServiceTests.cs`, `SecurityTests.cs` (the stop link), `app/e2e/notices.spec.ts` (the stop page only; delivery is [needs your phone])

**Interfaces:**
- `Notice { int Id; Guid AccountId; string Kind; int? ThreadId; string Subject; string Body; DateTime CreatedAt; DateTime? SentAt; string? Error }`. This is an outbox: rows are written in the same transaction as the event, and the worker sends them.
- `NoticeService.ThreadStartedAsync(int threadId)`, `.AcceptedAsync(int threadId)`, `.ApprovedAsync(Guid accountId)`, `.UnreadSweepAsync(DateTime now)`.
- `GET /api/v1/notices/stop?t={token}` (a page) and `POST` to the same URL (RFC 8058 one-click, for the `List-Unsubscribe` header). The token is the account id protected by ASP.NET Data Protection. No sign-in needed.
- Links are `/thread/{id}`. Return-to-link (S-107) already carries them through sign-in.

**Rules the code decides:**
- Started: each confirmed person at the other organization, not the starter's own organization. Accepted: each person at the starting organization. Approved: the claimant.
- Unread: the worker runs every 5 minutes (B1 keeps the app awake when Always On is set; check it is). A message the receiving side hasn't read (`NeedSideReadAt` / `OfferSideReadAt`) for an hour → one notice per thread per 6 hours.
- `NoticesOff` people get nothing. A failed send keeps the row with `Error` and retries 3 times, then stops.
- Each sweep is one query against the database. The worker only queries when there's a live thread with an unread message, so it doesn't keep the free serverless database awake around the clock: check the vCore seconds used after a week.

**Tests:** `Started_notifies_the_other_org_not_your_own`. `Unread_waits_an_hour_and_then_once_per_6_hours`. `Read_messages_send_nothing`. `Stopped_people_get_nothing`. `Stop_link_works_signed_out_and_a_forged_token_does_not` (in `SecurityTests`). `Subjects_match_the_brief` ("{org} can help with {title}", "{org} would like {title}", "New message from {org}", "{org} said yes to {title}", "You're in at {org}").

## Round 7: Google sign-in out of Testing (S-92)

After T-53. Fill `app/src/legal/facts.ts` with Mario's wording (a small `fix/` PR, since the words are his). Then, in the Google Cloud console, the consent screen gets the privacy and terms URLs and goes to production. No cost, no code beyond `facts.ts`. Test: a Google account not on the Testing list can sign in [needs your phone].

---

## Data model changes, all rounds

| Round | Change | Migration |
|---|---|---|
| 1 | New `OrgProfiles` (Ein PK, About, Website, ContactAccountId, UpdatedAt, UpdatedBy) | `AddOrgProfile` |
| 2 | `Invites.ByMember bit not null default 0` | `AddInviteByMember` |
| 3 | `Listings.EditedAt datetime2 null`, `Listings.UrgentSince datetime2 null` (backfilled) | `AddListingEdits` |
| 4 | Only if T-237 says leave test threads out: `Matches.StartedByAccountId uniqueidentifier null` | `AddThreadStarter` |
| 6 | New `Notices`, `Accounts.NoticesOff bit not null default 0` | `AddNotices` |

Every migration adds and never drops, so the production database stays compatible with the build before it if a deploy has to roll back.

## API changes, all rounds

| Round | Call | Who |
|---|---|---|
| 1 | `GET /api/v1/org`, `PUT /api/v1/org`. `OrgPage` gains `about`, `website`, `askFor` | confirmed member (the org page stays behind the confirmed stage, as today) |
| 2 | `POST /api/v1/org/invites` | confirmed member |
| 3 | `PUT /api/v1/listings/{id}`. `Listing` gains `editedAt`, own post gains `openThreads`. `Me.membership` gains `urgentAgainOn` | the poster |
| 4 | `GET /api/v1/admin/numbers` | admin |
| 6 | `GET` and `POST /api/v1/notices/stop?t=` | anyone with the link |

## Risks

- **Recruiting, not code, is the critical path.** Rounds 1 to 4 can ship and sit unused. Round 5 depends on Mario.
- **New sentences hide in error paths.** Each round lists the server messages it adds. The app's input limits keep most of them from being seen; any that can be seen go to Taylor first.
- **The demo drifts from the API.** Every round updates `api/mock/index.ts`, and its e2e test runs in the demo once where possible.
- **The free database's 100,000 vCore seconds.** The Round 6 worker must not keep it awake. Watch the usage after its first week.
- **Lane collisions.** Rounds 1 and 2 share `YourOrg.tsx` and `OrgProfileService.cs`, so they're strictly in order. Round 3 touches different files and can go first if Taylor prefers.

## Open questions for Taylor

1. **Order.** Your organization (1), invite someone (2), edit (3), numbers (4)? Or numbers first, as PLAN.md had it?
2. **S-99 brief questions.** Do the 3 places include the person who joined first (recommend: yes)? Should "What you do" also show on posts (recommend: not yet)?
3. **S-100 brief questions and T-237.** Count young posts and organizations as the brief proposes? Leave your own test threads out (that needs one new column)? Count declined and closed threads as not golden?
4. **T-236, email before there's money.** A project Gmail account with an app password (free, 500 a day, sent from a Gmail address), a free tier from an email company, or wait for Mario and Azure's email?
5. **Two lines Round 6 needs:** the page after tapping "Stop these emails", and what an email says if it's sent from a Gmail address rather than Azure's.
6. **Round 0 tidy.** Retire the frozen prototype stories and merge the duplicates PLAN.md listed, in one roadmap PR?

## Executing this plan

One round at a time, in its own worktree, by the session Taylor starts for it. Recommended: **native execution** (superpowers:executing-plans) per round, then one fresh review of the round's branch (superpowers:requesting-code-review) before the PR opens. The rounds are small and depend on each other's interfaces, and every round already gets Taylor's review and a phone check before it merges.
