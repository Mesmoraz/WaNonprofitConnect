## 2026-10-20 · Every demo uses the same sample data, and an admin picks what it shows (S-128)

**Story S-128.** Taylor, Oct 19: "It's confusing that the demos have different data", and an admin control panel for "show map with lots of connections", "no connections" and every case in between, for the map, the board, Home and the inbox. Then: "I want to be able to change the sample data as an admin to demo." Taylor said to build it; the words below are for line-by-line review on the PR.

### What changed

- **One set of sample data.** The demo, `dev:mock` and the map test page (`/map-dev.html`) now draw the same 32 organizations, the same pins and the same threads. The map test page's own sample, with its 26 threads, became part of that set, and each of those threads has its two posts, so tapping one opens a real thread. Ballard Food Bank is "you" unless you pick someone else.
- **Admin, Demo: pick what the demo shows.** Start from a preset (A few threads, A new organization, Just joined, First post, A message is waiting, Busy, Hard cases, Empty board), then change any setting: You are, Threads on the map (0 to 31), How far along, Waiting on you (0 to 5), Posts from others, Your posts (0 to 5), Could fit lines on the map, Your organization page, Hard cases. Start the demo.
- **Change it while you're in the demo.** The demo bar now says which preset is on ("Demo: Busy.", or "Demo: Busy, changed.") and has a Settings link (admins only) that opens the same settings over the screen. Each change shows right away, and the demo starts over with it.
- **Copy a link to this demo** gives a link like `/admin?demo=busy&waiting=0` to share with Mario. On the real site it only works for a signed-in admin: for anyone else `/admin` doesn't exist and the link does nothing. The demo still never reaches the real site.
- **Try as a new organization** in Admin is now the "A new organization" preset. The name menu keeps it.

### Test cases

1. **[verified]** In the browser, `dev:mock` at phone size: `/admin?demo=busy` signs you in as Ballard Food Bank with Busy, and the address bar drops the settings. The inbox has 3 waiting on you, then in progress and golden threads.
2. **[verified]** The map test page with `?demo=busy` draws 34 threads (31 between organizations, 3 with you) from the same data.
3. **[verified]** In the demo (the app's demo mode, no API): Settings on the demo bar, Waiting on you set to 0: the sheet stays open, the bar says "Demo: Busy, changed.", and the inbox badge goes away. Hard cases shows a declined thread, a closed one and a long message. Empty board shows "Nothing here yet. Post the first one?". A new organization goes to the invite code.
4. **[verified]** Acceptance tests `[S-128]`: an admin's demo link starts Busy, a live change redraws the inbox, Empty board empties the board; a demo link does nothing for someone who isn't an admin. `[S-110]` and `[S-108]` now pick "A new organization" and Start the demo.
5. **[needs your phone]** On staging, Admin: tap Busy, then Start the demo. Look at Home, the board, the map and the inbox.
6. **[needs your phone]** In the demo, tap Settings on the demo bar. Move Threads on the map to 0, then back to 31, and watch the map behind the sheet.
7. **[needs your phone]** Tap Copy a link to this demo and send it to yourself. Open it signed in: the demo starts as you left it. Open it in a private window: nothing happens.
8. **[needs your phone]** Read every word on the Demo section and the Settings sheet (list in the PR). Tell me what to change.
