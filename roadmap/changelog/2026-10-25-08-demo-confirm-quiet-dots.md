## 2026-10-25 · Demo settings wait for Show this demo, and the map's dots fade back (S-145, S-146)

**Stories S-145 and S-146,** built to the briefs in docs/ALPHA-BRIEFS.md ("Demo settings wait for Show this demo", "The dots fade back"), approved by Taylor in chat Oct 25 ("Yes, build both as briefed. Drop the pill."). Taylor, the same day: a confirm button instead of a link, the link landed on an invite code that didn't work, and the dots are distracting when they shouldn't be the focus.

### What changed

- **Admin, Demo: Show this demo.** Settings no longer take effect as you tap them. Pick a preset and any settings, then tap the primary **Show this demo** right under them. "Start the demo" and "Copy a link to this demo" are gone.
- **In the demo, Settings waits too.** Changes stay in the sheet until you tap **Show this demo**; **Cancel** leaves the demo as it was. Both buttons stay pinned to the bottom of the sheet while you scroll.
- **Why the invite code didn't work:** A new organization starts at the invite code on purpose, and in the demo only sample codes work. The box now comes filled in with RAINIER, so Join just works.
- **The dots fade back.** Much fainter at every zoom (22% up close, was 90%), smaller, and no cream edge, so pins and golden threads lead. Home's small map matches.
- **The pill is gone** ("1,204 organizations in view · IRS addresses").
- **The ? explains the dots first:** a few faint dots on a scrap of the map's land, then "Faint dots are Washington nonprofits that haven't joined yet."

### Test cases

1. **[verified]** In the browser at phone size, Admin: Show this demo sits right under the settings; A new organization then Show this demo lands on the invite code with RAINIER filled in, and Join gets in.
2. **[verified]** In the demo (the app's demo mode) at phone size: Settings, Waiting on you set to 0, then Cancel: the bar still says "Demo: Busy." and 3 are waiting. Again with Show this demo: the sheet closes, the bar says "Demo: Busy, changed.", and none are waiting. The buttons stay at the bottom of the sheet while it scrolls.
3. **[verified]** In the browser at phone size, the Map: no dot count under the chips, and the ? leads with the faint dots line and its swatch.
4. **[verified]** Acceptance tests `[S-110]`, `[S-128] [S-145]`, `[S-108]`, `[S-143] [S-146]` and the legend test updated for the new buttons and words.
5. **[needs your phone]** On staging, Admin: pick Busy, change Waiting on you, tap Show this demo. The demo opens the way you set it.
6. **[needs your phone]** In the demo, tap Settings, change something, tap Cancel: nothing changes. Change it again and tap Show this demo: the screen behind redraws.
7. **[needs your phone]** Admin, A new organization, Show this demo: the invite code is filled in. Tap Join.
8. **[needs your phone]** Open the Map, zoomed out and then on your neighborhood. The dots stay faint and the pins and golden threads stand out. Tap the ?: the first line explains the dots.
