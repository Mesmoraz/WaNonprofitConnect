## 2026-10-02 · A welcome that asks for one need and one offer

**Story:** S-96. Brief approved by Taylor in PR #6.

### What changed

- **A card at the top of the board**, until your organization has an open need and an open offer: "Start with one need, one offer. Post one thing you need and one thing you could give. When another organization helps, it becomes a golden thread on the map." "the map" opens the Map tab.
- **Post a need** (green) and **Post an offer**. After one is posted, only the other is left, and it turns green. Once both are posted, the card is gone. Closing a post brings it back if that leaves you without one.
- **Post an offer** opens Post with "We have" already picked.
- **Not now** hides the card on this phone or computer.
- This is the first place anyone is told what a golden thread is.

### Test cases

1. **[verified]** Signed in as an organization with nothing open, the card shows the approved words, with **Post a need** green.
2. **[verified]** Post a need, go back to the board. Only **Post an offer** is left, and it's green.
3. **[verified]** **Post an offer** opens "What do you have?" with "We have" picked. Post it. The card is gone.
4. **[verified]** **Not now** hides the card, and it stays hidden after a reload.
5. **[needs your phone]** On staging, try it with **Try as a new organization** (code RAINIER). The card shows on the empty board, and reads well in light and dark.
