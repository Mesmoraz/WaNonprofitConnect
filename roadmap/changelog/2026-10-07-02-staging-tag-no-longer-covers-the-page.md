## 2026-10-07 · The Staging tag no longer covers the page

**Story:** S-112 (staging). From Taylor's feedback, Oct 7: "the staging banner blocks information".

### What changed

- On staging, the tag is now a thin strip across the top, and the app starts just below it. Nothing on the page sits under it, on a phone or a wide screen. Before, it floated over the page and hid the demo line.
- The strip still links to the pull request, as "Staging · #21 ...".
- The real site has no strip and nothing moves.

### Test cases

1. **[verified]** On a phone-sized screen at the staging address, the name button and the "Helpbook" logo start below the strip (acceptance test `[S-112]`).
2. **[verified]** On a wide screen, the demo line and the board start below the strip, and the page doesn't scroll.
3. **[verified]** At the normal address there's no strip.
4. **[needs your phone]** On staging, in the demo, read the whole line "Demo: sample organizations. Only you see this. Leave the demo" with nothing covering it.
5. **[needs your phone]** On an iPhone with a notch, from the home-screen app: the strip sits below the clock and battery, and the top bar is fully readable.
