## 2026-10-25 · The demo strip stays at the top while you scroll (S-138)

**Story S-138.** Taylor, on a phone in the demo: "I do not see that on my phone", about the strip that says "Demo: A few threads. Settings · Leave the demo". The strip was only at the very top of each page: one scroll and it was gone, with Settings and Leave the demo along with it. Taylor asked: "keep the demo strip pinned at the top on the phone while scrolling." No words change.

### What changed

- **The demo strip stays put under the top bar** while the page scrolls under it, on every tab, on a phone and on a computer alike. Settings and Leave the demo are always one tap away.
- **The demo settings sheet still opens on top of everything,** the strip included.
- **Outside the demo nothing changes:** there's no strip there.

The demo still lives in each browser on its own. To see the strip on your phone, start the demo there: tap your name, then Start the demo.

### Test cases

1. **[verified]** In the demo at phone width (375px), scrolled down, the strip stays right under the top bar and takes taps on Home, Board, Map, Inbox, Post, and a thread. There's no sideways scroll.
2. **[verified]** Scrolled down in a thread, tapping Settings opens the demo settings sheet above the strip.
3. **[needs your phone]** On staging, tap your name, then Start the demo. Scroll down on Home and on the Board. The strip stays at the top. Tap Settings: the demo settings open.
4. **[needs your phone]** Tap Leave the demo. You're back in the real site, and the strip is gone.
