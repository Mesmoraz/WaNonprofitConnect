# Change log

Newest first. Every shipped change lands here with test cases Taylor can run on a phone. Rules: `SDLC.md`, section "Change log and test cases".

---

## 2026-10-02 · Tests for every built alpha story

**Story:** S-113. From Taylor: "write the missing tests."

### What changed

- **9 more acceptance tests**, so every built alpha story has at least one: the base map loads from OpenFreeMap; the map data puts organizations in Washington; tapping an organization's pin opens its card and then its page; the name comes from `brand.json` and the app installs to a home screen; tabs along the bottom on a phone and a rail on a desktop, with no sideways scroll; one address serves the app, the API and deep links, and a reload keeps your place; the Staging tag shows on a staging address and never on the real one; feedback from the name menu reaches Admin; a browser error is reported to the server.
- **The API tests now say which story they prove** (`[Trait("Story", "S-71")]`), so fair ranking, views counted, map data, invites and error logging show up in the coverage table. `dotnet test --filter Story=S-71` runs one story's tests.
- The map exposes itself to tests on its container, so a test can find a pin and tap it like a person.

### Test cases

1. **[verified]** All 22 acceptance tests against the local API and built app: 21 pass, and the empty-board test skips because the local database has posts.
2. **[verified]** The labeled API tests pass (`dotnet test --filter Story=S-71|Story=S-74|...`).
3. **[verified]** `node scripts/acceptance.js`: 23 of 24 built alpha stories covered. The one left is S-113, the test suite itself.
4. **[verified on this PR]** The *acceptance* check is green on GitHub.

---

## 2026-10-02 · Automated acceptance tests on every pull request

**Story:** S-113. From Taylor: "automated tests up and running to ensure functionality based off of acceptance criteria and road maps."

### What changed

- **13 acceptance tests** drive the real app and API in a phone-sized browser, each named after the roadmap stories it proves: the sign-in page and legal links, an invite code, a claim approved in Admin, posting by picking, the board and its kinds of help, directory search, one organization helping another all the way to a golden thread, one thread per post, times in UTC, the new-organization demo, and the map loading only when opened.
- **Every pull request runs them** on GitHub against a fresh SQL Server loaded with 13 real Washington organizations, alongside the 143 API tests. Staging only gets a build that passed both, so production does too.
- **Coverage by story:** each run's summary page shows which built alpha stories have a test (13 of 23 today) and which don't. `node scripts/acceptance.js` prints the same table.
- The SDLC now asks for each story's acceptance criteria to become a test named after it.

### Test cases

1. **[verified]** `npm run test:e2e` in `app/` against the local API and app: 12 pass, and the empty-board test skips on a database that has posts.
2. **[verified]** On this PR, the *acceptance* check is green, and its summary page shows the coverage table.
3. **[needs you]** Open any PR's checks, then *Deploy to staging* → Summary. The table lists stories with ✅ or ⬜.

---

## 2026-09-28 · Post by picking, not typing

**Story:** S-111. From Mario's in-app feedback (#3, Sep 26): "Free text should be minimal or discrete. Kinda like autotrader but with the thread focus." Taylor asked to apply it.

### What changed

- **What is it? is a row of choices.** Pick a kind of help, and a short list shows (Things: Laptops, Food, Clothing, Furniture, Supplies). The one you tap becomes the title.
- **Something else** is the last choice on every row. It opens a short text box for anything the list doesn't have.
- **Details are optional and folded away.** "Add details" opens a small box, 280 characters at most. The rest gets worked out in the thread.
- Changing the kind of help clears what you picked, so a Laptops pick can't end up as a Time post.

### Needs your approval

- The new words: the 6 lists of choices, "Something else", "Add details", and the hint "The rest you can work out in the thread." All are in `docs/ALPHA-BRIEFS.md`, B7.

### Test cases

1. **[verified]** Tap Post. Under Kind of help, nothing else shows until you pick one. Post need is grey.
2. **[verified]** Tap Things. "What is it?" shows Laptops, Food, Clothing, Furniture, Supplies, Something else.
3. **[verified]** Tap Laptops, type 12 in How many, tap Post need. The post opens: "Laptops", "12 needed".
4. **[verified]** Tap Something else. A text box opens with "Laptops for client intake" in grey. Post need stays grey until you type.
5. **[verified]** Tap Add details. A box opens with "Condition, pickup or delivery, dates."
6. **[verified]** Pick Laptops, then tap Time. Nothing under What is it? is picked, and Post need is grey.
7. **[needs your phone]** On an iPhone, tap Something else. The keyboard opens on the text box without the page jumping.
8. **[needs your phone]** Post a need with no details. On the board it shows the title, your organization, and the facts line, with no empty gap.

---

## 2026-09-28 · A staging copy of the site

**Story:** S-112. From Taylor: "set up staging."

### What changed

- **Staging** is at https://helpbook-staging.azurewebsites.net: the same app and settings as the real site, on the same Azure plan (no extra cost), with its own database, so nothing done there touches real organizations. A small orange tag sits at the top, and the tab title starts with "Staging ·". The tag names the pull request on staging by number and title ("Staging · #5 Try it as a new organization…") and opens it on GitHub.
- **Every merge to `main` now goes to staging by itself.** GitHub builds once, runs the API tests, deploys, and checks the site answers. Watch it under the repo's Actions tab.
- **Production only changes when you press Actions → Deploy to production → Run workflow.** It ships the exact files that are on staging.
- **Check a PR on staging before merging it:** add the label **staging** to the PR. GitHub puts that PR on staging, comments the link, and updates it on each new push. One PR at a time: labeling another, or any merge to `main`, takes staging back and says so on the PR.
- GitHub signs in to Azure with a trust link, not a stored password. It can only deploy the two sites, and only from `main`.
- **WebSockets are on in production** (Taylor, Sep 28). Live messages used to fall back to slower polling there.
- `scripts/deploy-azure.ps1` still works by hand. It now goes to staging unless you add `-App helpbook-alpha`.

### Still to do by Taylor

- Add `https://helpbook-staging.azurewebsites.net` to the Google sign-in client's authorized JavaScript origins. Until then, Google sign-in on staging says it can't continue.

### Test cases

1. **[verified]** Open https://helpbook-staging.azurewebsites.net. The tab reads "Staging · Helpbook", and a small "Staging" tag shows at the top.
2. **[verified]** https://helpbook-staging.azurewebsites.net/health answers 200.
3. **[needs your phone]** After you add the staging address in Google Cloud, sign in on staging. Your admin menu shows **Admin**.
4. **[needs your phone]** Merge this PR. Within about 5 minutes, Actions shows *Deploy to staging* green.
5. **[needs your phone]** Actions → *Deploy to production* → Run workflow. It goes green, and the real site still works.

---

## 2026-09-28 · Try it as a new organization

**Stories:** S-110, S-101. From Taylor: "if we don't have a way to easily test the site as a fresh user we need that flow built into the demo/admin features."

### What changed

- **Try as a new organization**, for admins, in the name menu and at the top of Admin ("Try it as someone new"). It starts the demo signed in with no organization, at "Your invite code", so you walk the front door like a newly invited organization. Each tap starts over from the beginning.
- **Both ways in work in the demo.** The invite hint reads "Demo: try RAINIER." (Rainier Valley Food Bank, nothing posted yet). Or tap "No code? Find your organization", pick West Seattle Food Bank (the hint says "West Seattle Food"), and on the waiting screen "Demo: approve it yourself in Admin." approves your own claim.
- **The demo keeps what you do** (posts, threads, messages) across reloads until you leave it or start over. Before, a reload wiped it.
- **Start the demo** still starts at Ballard Food Bank with posts and a thread waiting. The demo bar now reads "Demo: sample organizations. Only you see this."
- Nothing in the demo reaches the real site.

### Test cases

1. **[verified]** Admin → **Try as a new organization**. You land on "Your invite code" with "Demo: try RAINIER."
2. **[verified]** Enter RAINIER, **Join**. The board shows, and your name reads "· Rainier Valley Food Bank".
3. **[verified]** Post a need, reload. It's still there.
4. **[verified]** Name menu → **Try as a new organization** again. You're back at the invite code, and the need from step 3 is gone.
5. **[verified]** "No code? Find your organization", type "West Seattle Food", pick it, **Join as West Seattle Food Bank**, then approve yourself in Admin. The board shows as West Seattle Food Bank.
6. **[needs your phone]** On the waiting screen in step 5, the line "Demo: approve it yourself in Admin." shows, and "Admin" opens Admin.
7. **[needs your phone]** Name menu → **Leave the demo**. You're back on the real site as yourself, with your real organization.

---

## 2026-09-28 · Full review: times, errors, one thread per post, live updates, a lighter first load

**Story:** S-103. From Taylor: a full review and QA pass, comparing the mission, the roadmap, and the app. Follow-ups are S-104 to S-109, each waiting on a brief.

### What changed

- **Times read right.** The server sent UTC times without saying so, so phones in Washington read every new message and post as 7 hours in the future ("1m" for 7 hours, every age off by 7 hours).
- **A failed action says why.** Post, I can help, Accept, Mark done, and Send show the server's sentence (for example "Urgent is 2 a month. Pick This week instead.") instead of only "That didn't work. Try again."
- **One thread per post.** Tapping I can help again on a post you already have a thread on adds your message to that thread. It no longer makes a second thread and a duplicate post. I can help stays grey until you write a message or pick one of yours.
- **Live messages survive a sleeping phone.** The connection used to give up after about 42 seconds offline. Now it keeps trying and catches up on an open thread.
- **Faster first visit.** The map loads when you open it. The sign-in screen needs about 430 KB of code instead of 2.2 MB.
- **Board.** An empty board says "Nothing here yet. Post the first one?" (it used to say "Nothing here with those filters" with no filters set). Search results open the organization. Posts that aren't open say Done, Closed, or In a thread, never Fulfilled or Matched. Cause names are in sentence case ("Food", "Arts and culture").
- **iPhone.** The extra empty band above the tab bar, under pinned buttons and the message box, is gone.
- **Server.** Long details no longer cause a server error. Accepting needs both posts still open. Cancelling never puts a closed post back on the board. When two people redeem the last use of an invite code at once, only one of them gets it.
- **Admin.** New invite codes show first. Approve and Not this one say so if they fail.

### Needs your approval

- The server's error sentences, rewritten in the voice. The full list (old to new) is in the chat for this round and under S-109.

### Test cases

1. **[verified]** Send a message in a thread. Under it: "Casey · 1m", not a time 7 hours off.
2. **[verified]** Open a post you have no thread on. I can help is grey until you type a message.
3. **[verified]** Start a thread, then do it again on the same post. You land in the same thread.
4. **[verified]** Board, type "food bank" in Search everyone here, tap a result. The organization's page opens.
5. **[verified]** The map still loads, with dots, clusters, and the golden thread.
6. **[needs your phone]** On an iPhone, the Post need button and the message box sit right on the tab bar, with no empty band.
7. **[needs your phone]** Open a thread, lock the phone for 2 minutes, unlock. A message sent meanwhile from another account shows without a reload.
8. **[needs your phone]** On the board, a brand-new organization with nothing posted sees "Nothing here yet. Post the first one?"

---

## 2026-09-24 · Privacy and terms pages, as a draft

**Story:** S-77. From Taylor: build them with the draft language.

### What changed

- **/privacy, "What we keep, and why"** and **/terms, "How Helpbook works"**, open to anyone, signed in or not. The wording is the draft in `docs/PRIVACY-TERMS-DRAFT.md`, updated to mention feedback notes and their screen pictures.
- Under the sign-in button: "By signing in you agree to the terms and the privacy page."
- The five facts only Taylor can supply show as highlighted placeholders: [contact email], [who runs it], [date], and the liability sentence (the 7-day reply time is filled in). Both pages say "Draft: this page is still being reviewed." until all are filled in, in one file, `app/src/legal/facts.ts`.

### Test cases

1. **[verified]** Signed out, the sign-in page shows the new line, and "the privacy page" opens /privacy.
2. **[verified]** /terms shows "How Helpbook works", the draft line, and "[who runs it]" highlighted.
3. **[verified]** Signed in, /privacy opens, and "← Back" returns to the board.
4. **[verified]** No sideways scroll at phone width.
5. **[needs your phone]** Read both on your phone, top to bottom.

### Still needed before Google sign-in can be published (S-92)

- The contact email, who runs it, the date, and the liability sentence, then a lawyer's read before the public launch.

## 2026-09-24 · Send feedback from inside the app

**Story:** S-93. From Taylor: a way for the co-founder to send feedback as he uses the app, with what was on his screen.

### What changed

- **Send feedback** is in the name menu on every screen, and on the crash screen ("or tell us what happened").
- It takes a picture of the screen first (the map included), then asks "What happened, or what would you change?" with "Include a picture of this screen" ticked. **Send**, then "Sent. Thanks for telling us."
- With the note we get: who sent it and for which organization, the page, the screen size, the browser, light or dark, whether the demo was on, the last pages visited, and recent errors and failed server calls.
- It works in the demo too, and always reaches the real server.
- **Admin → Feedback** lists new notes with the picture, the details, and **Done**. Each note also goes to the log, so `scripts/errors.ps1` shows it.
- If the picture takes more than 4 seconds, the box opens without it. A note always gets through.

### Test cases

1. **[verified]** Name menu shows **Send feedback**. Send a note from the map. → "Sent. Thanks for telling us."
2. **[verified]** Admin → Feedback shows the note with "Taylor · BALLARD FOOD BANK · /map · Sep 24", and the details (page, screen, browser, recent pages).
3. **[verified]** A note with a picture: the picture comes back as a 320×180 JPEG.
4. **[verified]** The production build runs board, map, post, inbox, organization page and admin with no crash.
5. **[needs your phone]** On your laptop, open the map, **Send feedback**. → A small picture of the map in the box. (My browser pane was hidden, which stops the capture, so I couldn't see this one.)
6. **[needs your phone]** Same on your phone.

### New lines, for approval

- "Send feedback", "What happened, or what would you change?", "Include a picture of this screen", "Sent. Thanks for telling us.", "That didn’t send. Try again.", crash screen "or tell us what happened", Admin label "Feedback", "Nothing new.", "Done".

## 2026-09-24 · No more silent blank screen while the site wakes

**Story:** S-91. From Taylor: after leaving the demo, the site was completely blank.

### What changed

- While the app finds out who you are, it used to show nothing at all. After a quiet hour (the database waking) or during a restart, that could last a minute and look broken. Now, after 2 seconds, it says "Waking up. The first visit in a while can take a minute."
- The page itself is always checked with the server, so a new version is seen at once. The app's code files, which never change once built, are kept by the browser for a year.
- No error reached the log from Taylor's browser, so this was a wait, not a crash.

### Test cases

1. **[verified]** The page is served with "no-cache" (a new test).
2. **[needs your phone]** Open the site after an hour away. → "Waking up. The first visit in a while can take a minute." then the app.

### New line, for approval

- "Waking up. The first visit in a while can take a minute."

## 2026-09-24 · Two organizations at one spot no longer swap names

**Story:** S-84. From Taylor: tapping Treehouse showed Seattle Children's PlayGarden.

### What changed

- Organizations at exactly the same point (one building, or two placed at one ZIP center) sat on top of each other: the label named one and a tap hit the other. They now fan out on a ring about 40 m across. Zoomed out they still group together; zoomed in each is its own pin.
- In the demo, five pairs shared a ZIP this way, including Treehouse and Seattle Children's PlayGarden (98144).

### Test cases

1. **[verified]** Two organizations at one point get two positions about 40 m apart, in a fixed order.
2. **[needs your phone]** In the demo, zoom into Treehouse. → Two pins side by side; tapping each opens its own card.

## 2026-09-24 · Errors reach us; backups written down

**Story:** S-91.

### What changed

- **Browser errors are reported.** A script error or a crashed screen on anyone's device is sent to the server log, with the page and the browser, at most 5 per page load.
- **A crashed screen says so.** "That didn’t work. Reload the page" instead of going blank.
- **Server errors carry a reference.** An unexpected error answers "That didn’t work. Try again." with a traceId, and the log line has the same id.
- **One command shows recent errors:** `powershell -File scripts/errors.ps1`.
- **Backups:** Azure keeps 7 days of point-in-time restore automatically. How to restore is in `docs/OPERATIONS.md`, with deploying and reading errors.

### Test cases

1. **[verified]** Throw a test error in the browser. → It appears in the server log as "Client error (error) on /: …", with the stack.
2. **[verified]** A test error report without signing in is accepted (a new test).
3. **[needs your phone]** Nothing to tap: tell me if a screen ever shows "That didn’t work. Reload the page", and I'll find it in the log.

### Found along the way

- App output wasn't being saved to the log files today; container logging to the file system is now on.
- A restart while the database was waking still crashed the site (18:09 UTC): the retry checked only the innermost error, a reset connection, not the database error around it. It now looks through the whole chain, and Azure allows the app 10 minutes to start instead of about 140 seconds.
- Checked end to end on the live site: a test error sent from outside appears in the log, and `scripts/errors.ps1` finds it.

### New line, for approval

- Crash screen: "That didn’t work. Reload the page" ("Reload the page" is the link).

## 2026-09-24 · The site waits for a sleeping database instead of crashing

**Story:** S-75.

### What changed

- The Azure database is on the free serverless tier. It pauses after an idle hour and takes about a minute to wake. The app used to crash if it started while the database slept, which took the site down three times on Sep 24 (13:25, 15:48, 16:19 UTC). Now it waits up to about 3 minutes at startup, and every database call retries while it wakes.
- Starting a thread runs through the same retry, so it can't half-finish.
- Filters saved to your organization are live. The new table was created, which confirms Taylor's permission change worked.

### Test cases

1. **[verified]** Start a thread against real SQL Server with retries on. → 201, the thread exists.
2. **[verified]** The live filters endpoint answers "sign in first" (401), not "not found".
3. **[needs your phone]** Leave the site alone for over an hour, then open it. → It loads, maybe a little slowly the first time, not an error.

## 2026-09-24 · Filters saved to your organization, and read from names too

**Story:** S-88. Taylor granted the app permission to add tables.

### What changed

- **Who they serve** is saved to your organization, not the device. Everyone there shares it, and it follows you to your phone. Admins can set it for any organization.
- When an organization's cause code gives no group (1 in 5 WA charities has none, and many food banks are filed under odd codes), its name is read instead. "Food bank" means Food, "PTA" means Education, "Senior center" means The elderly, and so on. Private "family foundations" and churches named "Harvest" are left out on purpose.
- New table: OrgPreferences (the first change to the live database's structure since launch).

### Test cases

1. **[verified]** As Auburn Food Bank (code T70, no group), open **Filters**. → **Food** is on.
2. **[verified]** The board shows Ballard Food Bank's posts (no code; matched by its name) and hides the tool library's.
3. **[verified]** Tap **Housing**. → Saved to your organization; a second person there sees it too (a new test).
4. **[needs your phone]** Change a chip on your computer, then open the board on your phone. → The same chips.

## 2026-09-24 · Who they serve is strict

**Story:** S-88. From Taylor: laptops showed under Food.

### What changed

- With groups picked, only organizations serving one of them show. Organizations with no matching cause code (a laptop refurbisher, tool libraries) now wait behind "{n} more outside your filters. Show them", instead of always showing.

### Test cases

1. **[verified]** As Ballard Food Bank in the demo, with Food on. → 5 posts, all from food organizations, and "12 more outside your filters. Show them".
2. **[needs your phone]** Tap **Show them**. → All 17.

## 2026-09-24 · Who they serve

**Story:** S-88, round one. Mario's idea; brief approved by Taylor with 12 groups and "Communities facing barriers".

### What changed

- The board's **Filters** have a new group, **Who they serve**, with 12 chips. They start from your organization's IRS cause code: a food bank starts with **Food**.
- A post shows if its organization serves a group you picked. Organizations without a listed group always show. Nothing picked shows everything.
- When your filters hide posts, the bottom of the board says "{n} more outside your filters. Show them".
- Your picks are remembered on each device. Saving them to your account comes next.

### Test cases

1. **[verified]** As Ballard Food Bank in the demo, open **Filters**. → **Food** is on; "Filters · 1".
2. **[verified]** The board shows 10 posts and "7 more outside your filters. Show them".
3. **[verified]** Tap **Show them**. → All 17.
4. **[verified]** Tap **Clear filters**. → Everything, and the line is gone.
5. **[needs your phone]** On your real organization, open **Filters**. → The chips your cause code maps to are on.

## 2026-09-24 · Closing a post asks first

**Story:** S-18, round B6. From Taylor: closing should look like what it does and ask to confirm.

### What changed

- **× Close this need** (or offer) is red with an ×.
- It opens a box: "Close this need?" / "It comes off the board, and you can’t open it again." with **Close need** in red and "Keep it". Escape or a tap outside keeps it.
- After closing: "Closed. It’s off the board." and the board.

### Test cases

1. **[verified]** On your own post, tap **× Close this need**. → The box, with focus on "Keep it".
2. **[verified]** Tap **Keep it**. → The box goes; the post stays.
3. **[verified]** Tap **× Close this need**, then **Close need**. → The board, "Closed. It’s off the board.", and the post is gone.
4. **[needs your phone]** On a phone, the box fits the screen and both buttons are easy to tap.

## 2026-09-24 · "Could fit" means it now

**Story:** S-18, round B6. From Taylor: after posting 12 laptops, the page listed canned vegetables, a refrigerator and plywood as fits, and it wasn't clear what the page was for.

### What changed

- **Fits need a word in common.** Before, any post with the same kind of help counted, so every Things offer "fit" every Things need. Now a laptop need finds laptop offers and nothing else. The map's suggested threads use the same rule.
- **Your own post says what the list is.** "Offers that could fit" (or "Needs that could fit"), then "Open one to start a thread." With none: "Nothing fits yet. It’s on the board, so anyone can find it."
- The demo uses the same rule.

### Test cases

1. **[verified]** Post a need "12 laptops". → Only "15 refurbished laptops" under "Offers that could fit".
2. **[verified]** A laptop need against "6 pallets of canned vegetables" is not a fit (a new test).
3. **[needs your phone]** Post something nothing matches, like "Folding chairs". → "Nothing fits yet. It’s on the board, so anyone can find it."

### Known and deliberate

- The underlined text in the screenshot doesn't come from the app. It looks like a browser setting that underlines every link.

## 2026-09-23 · Post: "Of what" is gone

**Story:** S-19, round B7. From Taylor: "what is the difference between 'What is it' and 'of what'?" He approved dropping it.

### What changed

- The Post screen asks "What is it?" and one optional "How many", with the hint "Just the number, if it matters." "Of what" is gone.
- A count shows as "12 needed" on a need and "12 to give" on an offer. Older posts that named a unit still read "12 laptops".
- The "Things" placeholders no longer put a number in the title: "Laptops for client intake" and "Refurbished laptops".
- Wish list: search the map for an organization or a place (S-87, backlog).

### Test cases

1. **[verified]** Post, Things, "Laptops for client intake", How many 12, **Post need**. → The post reads "12 needed".
2. **[verified]** Back on the board. → "Seattle · 12 needed · 1m".
3. **[needs your phone]** Post an offer with a count. → "{n} to give".

## 2026-09-23 · Map: steady cursor, growing pins, tappable threads and organizations

**Story:** S-84. From Taylor's bug list.

### What changed

- **The cursor no longer flickers** over a pin. Two parts of the map were both setting it, every frame.
- **Pins grow when you hover them**, easing up to about 1.5 times their size.
- **A tapped thread shows both posts.** The card lists the need and the offer, each tappable, and both organization names open their page.
- **A tapped organization opens its page.** The card has **See their needs and offers**. The page shows the name, city, cause and EIN, how many golden threads and threads in progress it has, and its open needs and offers.

### Test cases

1. **[needs your phone]** On a desktop, move the mouse over a pin. → A steady pointer, and the pin grows.
2. **[verified]** Tap a thread. → "Second Harvest Inland Northwest → Spokane Humane Society", "Things · In progress", then **Need** Dog and cat food and **Offer** Pallet of pet food.
3. **[verified]** Tap an organization's name in that card. → Its page: "Spokane · Animals · EIN 91-0565011", "1 in progress".
4. **[verified]** Open Ballard Food Bank's page. → Its 3 open posts as cards.
5. **[needs your phone]** Tap a pin, then **See their needs and offers**. → The same page.

### New lines, for approval

- Map card: "See their needs and offers". Thread card labels "Need" and "Offer".
- Organization page: "{city} · {cause} · EIN {ein}", "{n} golden threads · {n} in progress", label "Needs and offers", empty "Nothing open right now."

## 2026-09-23 · Blank page fixed for browsers that visited earlier

**Story:** S-76. From Taylor: "it's blank when I open it".

### What changed

- The app no longer keeps an offline copy of itself. That copy (a service worker) had saved the broken files from earlier today and kept serving them, so the page stayed blank. The new version removes the old copy on every device the next time it opens. It can still be added to a home screen.

### Test cases

1. **[verified]** In a browser that had the old copy, open the site twice. → "Join Helpbook" with the Google button, and no offline copy left.
2. **[needs your phone]** On your computer and phone, open the site, close it, open it again. → The sign-in page.

## 2026-09-23 · Real addresses, a demo for Mario, a clearer admin search

**Stories:** S-49, S-69, S-73. From Taylor: add Mario as an admin, show real locations, the white dots look terrible, the admin search isn't clearly a search, and give Mario pre-made data to show people the flow.

### What changed

- **Mario is an admin** (mpozzo20@gmail.com).
- **Organizations sit at their street address.** Each IRS address was matched with the Census Bureau's free geocoder. About two in three matched. The rest (mostly PO boxes) sit at their ZIP's center. The dots no longer spread into 1.3 km clouds.
- **Start the demo.** Admins have **Start the demo** in their name menu. The board, map, inbox and threads fill with sample posts from real Washington organizations, and the map keeps its real statewide dots. Nothing in the demo is saved or seen by anyone else. A grey line at the top reads "Demo: sample organizations. Nothing here is saved." with **Leave the demo**.
- **Admin search looks and acts like a search.** A search icon, results that drop down under the field, "Searching" while it looks, and the picked organization shown with a check and an ×.

### Test cases

1. **[verified]** Admin → type "food ba". → A dropdown of food banks under the field.
2. **[verified]** Pick one. → It shows with a check; **Test as this organization** appears.
3. **[verified]** Name menu → **Start the demo**. → 17 sample posts, an inbox with 2 unread, the grey demo line.
4. **[verified]** In the demo, open **Map**. → Statewide dots and sample threads between Seattle, Tacoma, Bellingham and Spokane.
5. **[verified]** Tap **Leave the demo**. → Back to your real organization; the grey line is gone.
6. **[needs your phone]** Zoom into Seattle on the map. → Dots along streets, not round clouds.
7. **[needs your phone]** Mario signs in with Google. → **Admin** and **Start the demo** in his name menu. (Add him as a Google test user first.)

## 2026-09-23 · Live data, testing as any organization, and a livelier map

**Stories:** S-74, S-69, S-73. From Taylor: the map stopped moving, golden threads looked broken, the map needs every WA nonprofit, and "find your organization" should just work, with an admin bypass for testing.

### What changed

- **The live site now has every Washington nonprofit.** Its database was empty, so search found nothing and the map had no dots. The site now loads the IRS list and the Census ZIP locations itself whenever it finds them missing.
- **Test as this organization.** In Admin, pick any organization, then tap **Test as this organization**. You're that organization at once, with no code. Switch back and forth to play both sides of a thread.
- **The map moves again.** The dashes drift from giver to receiver even when Windows has "Animation effects" turned off. That setting had been freezing the map.
- **Threads draw on top.** Roads and town names no longer cut through golden threads.

### Test cases

1. **[needs your phone]** Admin → type "food bank". → A list of Washington food banks.
2. **[needs your phone]** Pick one, tap **Test as this organization**. → "You're now {org}." and the board.
3. **[needs your phone]** Post a need. Then in Admin, test as a second organization, open that need, tap **I can help**. → A thread.
4. **[needs your phone]** Test as the first organization again, open **Inbox**. → The thread says "Waiting on you". Accept, then mark done.
5. **[needs your phone]** Open **Map**. → Faint dots across the state, and the golden thread drifting on top of the roads.

### Known and deliberate

- Organizations sit at their ZIP's center, so a city's nonprofits cluster together. Street addresses are Beta (S-49).
- Anything you post while testing shows to everyone on the live site. There's no test switch yet; see the chat for the proposal.

## 2026-09-23 · Desktop layout, and the name menu stays on screen

**Story:** S-76. From Taylor: the menu went off the screen, and on a desktop it "should not look like a phone app".

### What changed

- Your name menu on the sign-in, invite and admin screens drops down now. On a desktop it used to open upward, off the top of the screen.
- On a desktop, the sign-in, invite, waiting and admin screens are a card in the middle of the page, under a full-width top bar. They were a phone-width strip.
- The board shows its posts in 2 columns on a laptop and 3 on a wide screen. Phones are unchanged.

### Test cases

1. **[verified]** On a desktop, sign in and tap your name at the top right. → The menu drops down with **Admin** and **Sign out**.
2. **[verified]** On a desktop, look at **Your invite code**. → A centered card, "← Back" or the name on the left of a full-width bar.
3. **[verified]** On a laptop, open the board. → Posts sit in 2 columns, in rank order left to right.
4. **[verified]** On a phone, open the board. → One column, as before.
5. **[needs your phone]** On your phone, tap your name on **Your invite code**. → The menu drops down and stays on screen.

## 2026-09-23 · Live site: Google sign-in, and the app actually loads

**Story:** S-75.

### What changed

- Google sign-in is set up on the live site.
- The live site was a blank page. Every script and style was answered with the page itself. It loads now.
- Deploying is one command, `scripts/deploy-azure.ps1`. Its zip used Windows paths that Azure's Linux servers rejected. Fixed.

### Test cases

1. **[verified]** Open https://helpbook-alpha.azurewebsites.net → "Join Helpbook" and **Sign in with Google**.
2. **[needs your phone]** Tap **Sign in with Google** and pick taylor.philpott@gmail.com. → "Your invite code".
3. **[needs your phone]** Tap your name, then **Admin**. → The admin page, with "No one is waiting."
4. **[needs your phone]** Make a code for your own test organization, redeem it on the invite screen. → The board.

## 2026-09-23 · Admin page

**Story:** S-69. Brief approved by Taylor today.

### What changed

- A new **Admin** page, reached from your name menu. It makes invite codes and approves or turns down people who claimed an organization.
- On an offer with nothing of yours to pair, the line now reads "You can still ask" instead of "You can still help" (Taylor).

### Test cases

1. **[verified]** Sign in as an admin with no organization and tap your name. → The menu shows **Admin** and **Sign out**.
2. **[verified]** Tap **Admin**, find "ballard food", pick it, tap **Make code**. → A large 8-letter code with "BALLARD FOOD BANK · 0 of 3 used".
3. **[verified]** Someone else redeems that code. → They're confirmed for that organization.
4. **[verified]** Tap **Approve** on a waiting claim. → "No one is waiting." and that person is confirmed.
5. **[needs your phone]** Tap a code. → "Copied." and the code pastes into a message.
6. **[needs your phone]** Open an offer from another organization. → "Nothing of yours fits yet. You can still ask."

## 2026-09-23 · Alpha app joined to the backend and the map

**Stories:** S-70, S-73, S-18, S-19, S-20. Built on the approved briefs in `docs/ALPHA-BRIEFS.md`.

### What changed

- The real app now runs end to end against the real backend: board, a need or offer, post, thread, inbox and map.
- The Map tab shows the real map: every Washington nonprofit as a faint dot, member organizations as pins, threads as strings. Tap a pin or a thread for its card.
- Your admin email now works as a single App Service setting. Before this, the admin page would have turned you away.
- Live messages no longer log a connection error each time a page opens.

### Test cases

1. **[verified]** On the board, open an offer, write a message, tap **I need this**. → The thread opens and the toast says "Thread started. {org} will see it in their inbox."
2. **[verified]** As the other organization, open **Inbox**. → That thread is first, marked "Waiting on you".
3. **[verified]** Tap **Accept**. → "You're on. Work out the details here."
4. **[verified]** Tap **Mark done**, then **Mark done** again. → "Done. This is a golden thread."
5. **[verified]** Open **Map** at phone width. → Washington fills the screen. The dots and strings line up with the base map.
6. **[verified]** Tap your own pin. → A card with your organization's name, city and thread count.
7. **[needs your phone]** Pinch and drag the map on a real phone. → It stays smooth and the strings move with it.
8. **[needs your phone]** Once Google sign-in is set up, sign in on the live site. → You land on the invite code screen.

### Known and deliberate

- Organization names show in capitals, as the IRS list has them.
- On an offer, "Nothing of yours fits yet. You can still help." is the approved line, but you are the one asking there. Worth a second look.
- `map-dev.html` (the map test page, with made-up organizations) ships with the build.

## 2026-09-23 · Azure alpha deployed

**Story:** S-75.

### What changed

- The React app, API, SignalR hub, and Azure SQL database are live at [helpbook-alpha.azurewebsites.net](https://helpbook-alpha.azurewebsites.net).
- The app connects to SQL with its managed identity. The temporary firewall access from Taylor’s computer has been removed.
- Google sign-in still needs the OAuth client ID before people can sign in.

### Why

Taylor upgraded the Azure account and asked to finish the backend setup.

### Test cases

1. **[needs your phone]** Open `https://helpbook-alpha.azurewebsites.net`. → The sign-up page loads over HTTPS.
2. **[needs your phone]** Open `https://helpbook-alpha.azurewebsites.net/signup` directly. → The sign-up page loads after a refresh.

## 2026-09-23 · Artifact v35 · B5.1: the card and the filters

**Story:** S-67, round B5.

### What changed

- **Priority reads in plain words, and most posts carry none.** Critical is **Urgent**, High is **This week**, and the two lower levels show no mark at all. Six of the fifteen open needs are marked; the other nine are clean.
- **No more doubled priority.** The `P1` pill and the grey `P1 · seen 1×` line underneath were saying the same thing twice. The grey line now appears only when it says something surprising: the fair-rotation slot, or a post that is being lifted for being under-seen.
- **The card has three clear lines**: the title, then the organization on its own line, then one grey line of facts — city, how many, how often, how long ago. The organization used to be buried mid-sentence and wrapped.
- **NEED and OFFER keep the strongest pill**, since that is the distinction that matters most.
- **Kinds of help now look like navigation, not filters.** That top row is a segmented selector with the active one underlined, and it no longer counts towards "Filters".
- **The filter sheet is grouped under labels**: What, Who, How far. The two rows of pills were reading as one category.

### Why

Taylor: the board "feels a little busy still like too much text", `P1` was on the card twice and meant nothing to a reader, and the two chip groups "look the same aesthetically" while doing different jobs.

### Test cases

1. **[needs your phone]** Open the **Board**. → Cards read: NEED (and This week only when urgent), title, organization, then "Spokane · 15 employers · 12h". No `P1`, no "seen 1×". **[verified]**
2. **[needs your phone]** Look down the list. → Most cards have only the NEED or OFFER pill. **[verified]**
3. **[needs your phone]** Tap **Time** in the top row. → It underlines, three posts show, and the Filters link still reads just "Filters". **[verified]**
4. **[needs your phone]** Tap **Filters**. → Three labelled groups: What, Who, How far. **[verified]**
5. **[needs your phone]** Open any post. → Under the title it says "Needed this week" or "Needed this month" as a sentence, with no stray punctuation. **[verified]**
6. **[needs your phone]** Tap **Post** and open the urgency list. → "Urgent · can’t operate without it (0 of 2 used this month)", "This week · needed this week", "Needed this month", "Whenever it works". **[verified]**

### Known and deliberate

- `docs/TAXONOMY.md` and `docs/VOICE.md` were updated: they said "P0 to P3, with its meaning beside it", which is no longer true.
- The seeded data leans towards High, so "This week" shows on about 4 in 10 open needs. If that starts to feel like noise, the fix is the seed data, not the design.
- The Post screen was touched only where it printed the old labels; its own round is B7.

---

## 2026-09-22 · Artifact v34 · Opening a search result no longer freezes the app

**Story:** S-66, round B5.

### What changed

- **Tapping an organization in search works.** The app was turning an EIN like `911428805` into a number, failing to find the organization, and throwing part-way through drawing the screen. Everything after that point stopped responding.
- **The stuck welcome message was the same bug.** The message clears itself after a few seconds, but the code that clears it never ran once the screen had failed, so it sat on top of the tab bar. With the crash fixed it disappears on its own; it can also be tapped away.
- **The message now sits above the tab bar** rather than over it. It was measured against the taller phone-width bar, not guessed.
- **A screen that fails can no longer freeze the app.** If one ever throws, it returns to the board instead of leaving a dead picture on screen.

### Why

Taylor: "Selecting an option from the search seems to freeze the app, the You’re in Welcome message doesn’t disappear and blocks the bottom menu."

The fault predates round B5 — the old Orgs list had the same link — but the board search is what made it easy to reach.

### Test cases

1. **[needs your phone]** Board → search `ballard` → tap **Ballard Food Bank**. → Its page opens. **[verified]**
2. **[needs your phone]** Search `ballard` → tap **Ballard High School**. → The school’s page opens. **[verified]**
3. **[needs your phone]** Search `seattle foundation`, `worksource`, `dana`, and a university, and open each. → All open. **[verified]** (all six kinds checked)
4. **[needs your phone]** Sign up fresh and reach the board. → The welcome message sits above the tabs, all five are readable, and it vanishes after a few seconds. **[verified]**
5. **[needs your phone]** Tap the message while it is showing. → It disappears. **[verified]**

---

## 2026-09-22 · Artifact v33 · B5: the Board

**Stories:** S-17 (board), S-22 (grants tab), S-23 (directory search), round B5.

### What changed

- **Kinds of help replace the category dropdown.** One sideways-scrolling row: All, Things, Time, Skills, For schools, Jobs and mentoring, Partnership, Together.
- **Search everyone here** sits at the top. Two characters or more replaces the board with organizations and people, by name or EIN; clearing it brings the board back. This is the old Orgs tab, where people actually look for it.
- **Five tabs**: Board, Map, Post, Grants, Inbox. Grants only appears for organizations, so someone signed up as "Just me" sees four.
- **Your name in the top bar opens your own page** instead of the perspective switcher, which now lives on that page.
- The two big post buttons are gone (the Post tab does that), the count line reads "31 open · 3 done", and the ranking paragraph is one line: "Urgent first, then whoever’s been seen least."
- Empty states offer the next step: "Nothing under Together yet. Post the first one?" and "Nothing here with those filters. Clear them?"
- The Grants tab exists but says "Nothing here yet" until round B9.

### Test cases

1. **[needs your phone]** Open the **Board**. → A search field, one row of chips, "31 open · 3 done", then the posts. No big buttons at the top. **[verified]**
2. **[needs your phone]** Tap **For schools**. → Four posts: career day speakers, a shop field trip, robotics mentors, a design workshop. The Filters link reads "Filters · 1". **[verified]**
3. **[needs your phone]** Tap **Together**. → "Nothing under Together yet. Post the first one?" **[verified]**
4. **[needs your phone]** Tap **All**, then type `ballard` in the search. → Ballard Food Bank and Ballard High School. **[verified]**
5. **[needs your phone]** Type `zzzz`. → "No one by that name. Try an EIN." **[verified]**
6. **[needs your phone]** Clear the search, tap **Grants**. → The Grants page with "Nothing here yet". **[verified]**
7. **[needs your phone]** Tap your name in the top bar. → Your own page, with "Switch perspective" on it. **[verified]**
8. **[needs your phone]** Switch to a person (your page → Switch perspective → Dana). → The Grants tab disappears and four tabs remain. **[verified]**

### Known and deliberate

- The standalone Orgs screen still exists behind the search results; B10 folds it in properly along with the profile layout.
- The Together initiative still has no post of its own, so that chip is empty until B11.
- The old categories (Materials, Equipment, Food) survive as tags on each post; only the filter changed.

---

## 2026-09-22 · Artifact v32 · Scaffolding removed, build stamp added

**Stories:** S-9, S-65 (held backspace), round B3.

### What changed

- The diagnostic page and the `?keys=1` logger are gone from the app and the site.
- **The help sheet now shows a build stamp**, filled in when the site is built. Tap **?** and read the bottom line.

### Why, and what was actually wrong

Backspace is confirmed working on the plain URL, but **no defect was ever found**. Nothing in the app changed between the last "still stuck" report and the confirmation except adding a logger that only observes. The likeliest explanation is that the earlier tests loaded a cached copy of the page, before the fix reached the phone.

Three changes were shipped for this bug and described as fixes. A seven-case diagnostic page then showed every case working, including a replica of the app shell, which disproved all three theories. The build stamp exists so a stale page can be spotted in one glance rather than costing another round.

### Test cases

1. **[verified]** The app carries no debug overlay and the place dropdown still filters (`sea` gives Seatac and the Seattles).
2. **[verified]** Tap **?** in the app. → The last line reads "Build" and a date.
3. **[needs your phone]** Hold backspace in **Your name** and in **City or ZIP**. → Both clear all the way.

### Standing rule

Held-key behaviour cannot be verified in Claude’s browser pane, which cannot synthesise a native held key. It is always marked **[needs your phone]**, and an unverified change is never announced as a fix.

---

## 2026-09-22 · Artifact v31 · Held backspace no longer sticks

**Story:** S-9 (About you), round B3.

### What changed

- **Typing does no layout work.** Holding backspace used to rebuild the place suggestion list on every repeat; the list growing and shrinking under the field is what made the key stick on Android.
- The list of places is now built once instead of rescanning all 995 organizations per keystroke, the suggestion box is only touched when its contents actually change, and rapid keys are held until they stop (about a seventh of a second) before the list updates.
- The save button is likewise only rewritten when it actually changes.

### Why

Taylor: "holding the backspace button gets stuck." This was made worse by the seed data landing: the suggestion list was scanning every organization on every keystroke, and there are now 995 of them.

### Test cases

1. **[needs your phone]** Just me → Set up my profile → type something into **City or ZIP**, then hold backspace. → The text clears smoothly and the field keeps up. This is the one that was broken.
2. **[needs your phone]** Hold backspace in **Your name**. → Same.
3. **[needs your phone]** Tap **City or ZIP** and type `tac`. → After a moment, eight Tacoma entries appear. **[verified]**
4. **[needs your phone]** Tap one. → The field fills and the list closes. **[verified]**
5. **[needs your phone]** Tap **Driving**, then save. → The board opens as that person. **[verified]**

### Measured

13 rapid keystrokes now cause **0 writes** to the suggestion list and take 1.2 ms in total, against one full rebuild per keystroke before.

---

## 2026-09-22 · Artifact v30 · Universities and colleges

**Story:** S-62 (higher education seed), round B4.

### What changed

- **49 higher-education institutions** joined the app: 8 public four-year campuses (including UW Bothell and UW Tacoma), 34 community and technical colleges, and 7 private nonprofit universities and colleges. The app now holds 995 organizations.
- They are the same participant type as K-12 schools, so **A school or district** finds all of them with no new screen or code.
- **48 of the 49 carry real coordinates**, from the federal NCES geocoded campus locations, so they sit correctly on the map today rather than waiting for the geocoding step.

### Why

Taylor asked that schools scale to universities, middle schools, and elementary schools. Universities and colleges are switched on; middle and elementary remain one line away in `scripts/build-seeds.js`.

### Test cases

1. **[needs your phone]** Sign up → **A school or district** → **Find my school** → type `university of washington`. → Three results: Seattle, Bothell, Tacoma, each labelled "University". **[verified]**
2. **[needs your phone]** Type `cascadia`. → Two high schools and "Cascadia College · Bothell · Community college" together in one list. **[verified]**
3. **[needs your phone]** Type `whitman`. → "Whitman College · Walla Walla · Private college", not "university". **[verified]**
4. **[needs your phone]** Type `evergreen`. → Two districts, three high schools, and "The Evergreen State College · Olympia · College". **[verified]**
5. **[needs your phone]** The app should still open quickly. It is now 302 KB.

### Known and deliberate

- **UW has its branch campuses as their own rows; WSU does not.** WSU Vancouver, Tri-Cities, Spokane and Everett exist in the same federal source and could be added the same way. Taylor decides whether the two should match.
- `domain` is each institution’s website host, which is not always the staff email domain (Spokane’s colleges and the UW branches especially). Confirming by email domain may need a second field.
- Yakima Valley College carries a PO Box ZIP from the federal source; its coordinates are the physical campus.
- Only main campuses are included for the community and technical colleges.

---

## 2026-09-22 · Artifact v29 · B4: real seed data for every kind

**Stories:** S-11, S-12, S-14, S-15, S-16 (seed data), round B4.

### What changed

- **The app now holds 946 organizations**, up from 47: 335 school districts and 520 high schools from OSPI, 12 workforce boards and 35 WorkSource centers, 5 foundations, 32 nonprofits, 3 example businesses, and 4 people.
- **14 new needs and offers** cover Time, Skills, Partnership, For schools, and Jobs and mentoring, so every kind of help in the taxonomy has something real behind it. Two existing posts were retagged to their true kind.
- **The three verified grants** and **one Together initiative** (South Seattle winter coat drive) are loaded, though no screen shows them yet.
- **Seeds are generated, not typed.** `scripts/build-seeds.js` writes the data block from `docs/seeds/*.json`; the hand-typed rows are gone.
- **Scalable by level.** One line in that script (`LEVELS`) turns on middle schools, elementary schools, universities, or community colleges. Nothing in the app keys off the level, only off the participant type.
- Map cluster circles are capped so dense areas read as counts rather than blobs.

### Why

Taylor approved the 18 seeded titles and asked that schools scale to universities, middle schools, and elementary schools.

### Test cases

1. **[needs your phone]** Sign up → **A school or district** → **Find my school** → type `ballard high`. → One result: "Ballard High School", Seattle. **[verified]**
2. **[needs your phone]** Same screen, type `seattle public`. → "Seattle Public Schools · Seattle · District". **[verified]**
3. **[needs your phone]** Back → **A workforce program** → type `workforce southwest`. → "Workforce Southwest Washington". **[verified]**
4. **[needs your phone]** Go to **Board**. → Posts include "Career day speakers, March 12", "Three apprenticeships this fall", and "A sponsor for our summer meals program". **[verified]**
5. **[needs your phone]** Go to **Map**. → Circles show counts (about 109 around Seattle) rather than one large blob, and the map still pans and zooms. **[verified]**
6. **[needs your phone]** The app should still open in about a second. It is now 293 KB, up from 139 KB.
7. **[needs your phone]** Just me → Set up my profile → tap **City or ZIP**. → The place list still works. **[verified]**

### Known and deliberate

- The board still shows everything in one list; kind-of-help chips are round B5.
- Grants and the Together initiative are loaded but not reachable until B9 and B11.
- The map cluster cap is a stopgap so it stays readable at this scale; the map redesign is B11.

---

## 2026-09-22 · Artifact v28 · About you: a real dropdown for City or ZIP

**Story:** S-9 (About you), round B3.

### What changed

- **City or ZIP now shows a real dropdown.** Tapping the field lists nearby places; typing filters them; tapping one fills the field and closes the list.
- The old approach used the browser's own `datalist`, which Android does not draw as a dropdown. It pushed the options into the keyboard's suggestion strip instead, with nothing on screen to say where they came from.

### Why

Taylor's phone check: "The carrot in the City or Zip doesn't make a drop down on my phone, I see options on my keyboard on android, but it isn't clear where those are coming from."

### Test cases

1. **[needs your phone]** Sign up → Just me → Set up my profile. Tap **City or ZIP**. → A list appears under the field, starting with "Bellingham 98225".
2. **[needs your phone]** Type `spo`. → The list narrows to four Spokane entries (99201, 99202, 99217, 99220). **[verified]** in the browser pane.
3. **[needs your phone]** Tap **Spokane 99202**. → The field fills with "Spokane 99202" and the list closes. **[verified]**
4. **[needs your phone]** Tap **Driving**, then **Save and go to the board**. → The board opens and the toast reads "You're in. Welcome, Dana." **[verified]**
5. **[needs your phone]** Go back into the field and hold the delete key. → The text clears continuously, not one character per press. *Claude cannot verify this one: the browser-automation tool does not perform the native delete, though the key event does reach the page un-blocked.*
6. **[needs your phone]** Type a place that matches nothing, like `zzz`. → No list appears, and the field keeps what you typed.

---

## 2026-09-22 · Artifact v27 · About you: four fixes from the phone check

**Story:** S-9 (About you), round B3.

### What changed

- **Holding delete now repeats.** Typing no longer redraws the screen, so the field is never replaced mid-keystroke.
- **Typed text counts on its own.** Anything in "Something else?" enables **Save and go to the board** without tapping a tag first.
- **A typed entry becomes a tag.** **Add**, or Enter, turns it into a chip beside the built-in ones, already picked, with a × to take it off.
- **"When" is gone.** People can be flexible.
- The button under the form reads "Fill in the top two" until it is ready.

### Why

All four came from Taylor's phone check of v26.

### Test cases

1. **[verified]** Just me → Set up my profile. → No "When" section between the tags and "Causes you care about".
2. **[verified]** Type "Beekeeping" into **Something else?** without tapping anything. → The save button turns green.
3. **[verified]** Tap **Add**. → "Beekeeping ×" appears as a selected tag with the others; the field clears.
4. **[verified]** Tap the "Beekeeping ×" tag. → It disappears from the list.
5. **[needs your phone]** Hold delete in **Your name**. → The text clears continuously. *Not verifiable in the automation pane; see the entry above.*

---

## 2026-09-22 · Artifact v26 · About you (new screen)

**Story:** S-9 (About you), round B3. First build of the screen for people who sign up as "Just me": name, place, what they can do, causes. Saving creates the person and opens the board.

Also: the role screen's "Demo: this path isn't built yet" line was removed, because all six paths now exist.

### Test cases

1. **[verified]** Sign up → **Just me** → the button reads "Set up my profile".
2. **[verified]** Fill name, place, and one tag → the button reads "Save and go to the board" → tapping it opens the board as that person.
3. **[verified]** No path on the role screen shows a "not built yet" note.
