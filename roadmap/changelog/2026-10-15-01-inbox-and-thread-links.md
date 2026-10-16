## 2026-10-15 · The inbox says what the thing is, and a thread opens its posts (S-119)

**Story S-119,** the first round from the UX review of Oct 14. Taylor: "add the friction list and start with those two fixes." No new words.

### What changed

- **Inbox:** each row says what the other side's post is ("Their offer · Used 2-door commercial refrigerator"), with the count after it when there's more than one ("Laptops · 12 laptops"). Before, a post with a unit showed only the count, like "1 unit".
- **Thread:** in "Need: …" and "Offer: …" at the top, each title is a link to that post, so you can check the details while you talk.
- The two lines are spaced so their tap areas don't overlap. Without that, tapping the need on a phone opened the offer (the acceptance test caught it).
- **Roadmap:** the rest of the friction list is now backlog stories S-120 to S-125 ("I can help" says what it needs, search finds posts, your posts in one place, partly done threads, kinds of help cut off on a phone, how many of what). A task under S-94 (T-240) records that started threads and waiting claims sit unseen until email is in.

### Test cases

1. **[verified]** New acceptance test `[S-119]`: the inbox row reads "Their need · {title} · 12 laptops", and tapping the need's title in the thread opens that post. All 38 acceptance tests pass (1 skipped: fresh database only).
2. **[verified]** In the demo at phone width: the inbox row shows the refrigerator's name in place of "1 unit", both thread links go to the right post, and the tap areas don't overlap.
3. **[needs your phone]** On staging, open a thread from your inbox. Tap the need's title: its post opens. Go back and tap the offer's title: the other post opens.
4. **[needs your phone]** In your inbox, each row names the thing, not just a number.
