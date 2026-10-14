## 2026-10-14 · Auction items is a pick when you post (S-117)

**Story S-117.** Taylor, Oct 14: "for now we just want it to be an option, but helping to plan these events should be an idea on the backlog."

### What changed

- Posting, under Things, "What is it?" now has **Auction items** after Supplies. It works for a need ("we need items for our gala auction") and an offer ("we can give a basket"). Like every pick, it becomes the post's title.
- `docs/ALPHA-BRIEFS.md` (B7 Post) lists the new pick.
- New backlog story S-118: help planning events, like a fundraising auction or a gala.
- No database or API change: the six kinds of help stay as they are.

### Test cases

1. **[verified]** New acceptance test `[S-117]`: Things, then Auction items, then Post need gives a need titled "Auction items". The other posting tests still pass.
2. **[needs your phone]** On staging, tap **+**, then **Things**. "Auction items" is the last pick before "Something else", and the row wraps without running off the screen.
3. **[needs your phone]** Post an offer the same way (We have, Things, Auction items). It shows on the board as an offer titled "Auction items".
