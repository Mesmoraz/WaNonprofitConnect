## 2026-10-21 · Home on a wide monitor: wider, no holes under short sections, larger type (S-136)

**Story S-136.** Taylor, looking at Home on a desktop monitor: "way too much empty space". Of the two options offered, Taylor chose to keep the two columns and asked: "Just fold the empty sections, widen to about 1200px, and bump the type on wide screens." No words change.

### What changed

- **Each column stacks on its own.** From 1100px, the left column is Waiting on you, then New this week; the right is Near you, then On the board. Before, the two columns shared rows, so a short "Nothing waiting on you." still took the full height of the map beside it and left a hole. Now New this week starts right under it.
- **Wider:** Home goes up to 1200px across, from 1040px.
- **Larger type from 1400px:** your organization's name 26px, section headings 20px, On the board rows 17px, card titles 17px, the lines under them 15px, and "Nothing waiting on you.", "See the whole board" and the line under the map 16px.
- **"Nothing waiting on you." and "Nothing new this week." at the size meant for them** (14px, 16px on a wide monitor). A shared style was shrinking them to 12px on every screen, phones included.
- **Phones and tablets keep the same order:** Waiting on you, Near you, New this week, On the board.

### Test cases

1. **[verified]** In the demo at 1920 × 1080, with nothing waiting: New this week starts right under "Nothing waiting on you." (about 70px down, where before it waited for the map to end), the page is 1200px across, and every size above applies. With three threads waiting, the left column still lines up with no gap.
2. **[verified]** At phone width (375px): the sections run Waiting on you, Near you, New this week, On the board, with no sideways scroll and a clean console.
3. **[needs your phone]** On staging on your desktop monitor, open Home. The page is wider, the text is larger, and nothing leaves an empty gap under "Waiting on you".
4. **[needs your phone]** On your phone, open Home. It looks as it did, except "Nothing waiting on you." reads a little larger.
