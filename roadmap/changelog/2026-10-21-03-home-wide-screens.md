## 2026-10-21 · Home on a wide monitor: wider, and larger type (S-136)

**Story S-136.** Taylor, looking at Home on a desktop monitor: "way too much empty space". Of the two options offered, Taylor chose to keep the two columns and asked: "Just fold the empty sections, widen to about 1200px, and bump the type on wide screens." No words change.

On Oct 25, while this waited, Home was rebuilt to its approved brief, map first with fewer words (S-140). That already folds the empty sections: "Waiting on you" only shows when something is waiting. So this now adds only the width and the type, on top of the new Home.

### What changed

- **Wider:** from 1100px, Home goes up to 1200px across, up from 1040px. The map under your name spans the full width, with Waiting on you and New this week in two columns below it.
- **Larger type from 1400px:** your organization's name 26px, section headings 20px, post and thread titles 17px, the lines under them 15px, the label on the map 15px, and "Nothing new this week.", "See the whole board" and "Tap the map to open it." 16px.
- **"Nothing new this week." at the size meant for it** (14px, 16px on a wide monitor). A shared style was shrinking it to 12px on every screen, phones included.
- **Phones and tablets keep the new Home as it is.**

### Test cases

1. **[verified]** In the demo at 1920 × 1080: Home is 1200px across, the map spans it, Waiting on you and New this week sit side by side under it, every size above applies, and there's no sideways scroll.
2. **[verified]** At phone width (375px): the map, then Waiting on you, then New this week, at the phone sizes, with no sideways scroll.
3. **[needs your phone]** On staging on your desktop monitor, open Home. The page is wider and the text is larger than before.
4. **[needs your phone]** On your phone, open Home. It looks as the new Home does, except "Nothing new this week." (when it shows) reads a little larger.
