## 2026-10-25 · Home puts the map first and says less (S-140)

**Story S-140,** built to the brief Taylor approved on Oct 25 (docs/ALPHA-BRIEFS.md, "Home puts the map first"). Taylor, on the phone: "it feels too wordy on the phone, too cluttered", and "We want the map to be one of the more prominent features of the home page." It replaces the S-132 question card, which Taylor set aside before it was built.

### What changed

- **The map comes first.** It sits right under your name and city, 270px tall (about a third of a phone screen; it was 200px and below the welcome card). Its counts are on a small label over the map: "14 organizations · 3 golden threads", "3 organizations" with no golden threads yet, or "No other organizations within 25 mi yet". Tap anywhere on it to open the Map on the same place. Under it: "Tap the map to open it." The "Near you" heading and "Open the map" link are gone.
- **Waiting on you shows only when something waits.** "Nothing waiting on you." is gone.
- **The welcome card is shorter.** "Post one need, one offer" (5 words; it was 7), one line, "Each one can become a golden thread.", and the two buttons. "Not now" sits beside the heading, small and grey.
- **New this week shows 2 posts, two lines each:** the title, then "Offer · Northwest Harvest · 8h". The Board keeps the full cards.
- **On the board is gone.** Its rows repeated the Board's tabs, one tap away.
- **The header pill on a phone is your initial only.** It used to read "Test Person · Rainier Valley Food B…", cut off. A screen reader still reads your name and organization. From 900 wide, the side rail keeps the name.
- **Roadmap:** S-140 added; S-132 (the question card) back to Backlog.

### Test cases

1. **[verified]** Acceptance tests `[S-140]` check that the map comes right after your name, is at least 250px tall, and has its label and hint line. They also check 2 two-line posts, that On the board is gone, that Waiting on you is left out when nothing waits, the welcome card's new words and "Not now", and the initial-only pill with the full name for screen readers. All Home, welcome, shell, and demo tests pass (17).
2. **[verified]** The full suite: 59 passed, 2 skipped (fresh database only). "[S-93] feedback reaches Admin" failed once in the full run, with the admin landing in the demo, and passed when run alone. That's the order the tests run in, not this change.
3. **[verified]** At phone width (375) in the mock: the map, its label, the welcome card, and 2 posts fit on the first screen, with a clean console. At 1280 wide: the map runs across the top, with the welcome card and New this week side by side under it.
4. **[needs your phone]** On staging, open Home. The map is the first thing under your organization's name, with "… organizations · … golden threads" on it.
5. **[needs your phone]** Swipe up over the map: the page scrolls. Tap the map: the Map opens on your place.
6. **[needs your phone]** The top right shows only your initial. Tap it: the menu opens as before.
7. **[needs your phone]** Under New this week, 2 posts, each with its title and one grey line ("Offer · … · 8h"). Tap one: the post opens.
