## 2026-10-07 · The map explains itself

**Story:** S-105. Brief approved by Taylor in PR #17 (Phase A briefs).

### What changed

- A round "?" button at the top right of the map opens "What the map shows". Screen readers call it "What the map shows".
- The card shows each kind of line as the map draws it, with its words: golden thread, in progress, started, could fit. Then "The dashes run from the one giving to the one receiving." and "A pin is an organization here. A faint dot is any Washington nonprofit." **Close** shuts it.
- The first time you open the map on a device, the card opens by itself. After that it stays shut until you tap the "?".
- Tapping an organization or a thread closes the card and opens that one's details, as before.

### Test cases

1. **[verified]** A first visit to the map opens the card with all six lines of words, and Close shuts it (acceptance test `[S-105]`).
2. **[verified]** After a reload, the card stays shut. The "?" opens it, and tapping "?" again closes it.
3. **[verified]** Tapping an organization on the map still opens its card and then its page.
4. **[verified]** Checked by eye in light and dark: the swatches match the map's gold, green, amber and grey lines.
5. **[needs your phone]** On staging, open the map for the first time on your phone. The card opens and nothing important is hidden behind it. Close it, then tap "?" to bring it back.
