## 2026-09-23 · Alpha app joined to the backend and the map

**Stories:** S-70, S-73, S-18, S-19, S-20. Built on the approved briefs in `docs/ALPHA-BRIEFS.md`.

### What changed

- The real app now runs end to end against the real backend: board, a need or offer, post, thread, inbox and map.
- The Map tab shows the real map: every Washington nonprofit as a faint dot, member organizations as pins, threads as strings. Tap a pin or a thread for its card.
- Your admin email now works as a single App Service setting. Before this, the admin page would have turned you away.
- Live messages no longer log a connection error each time a page opens.

### Test cases

1. **[verified]** On the board, open an offer, write a message, tap **I need this**. → The thread opens and the toast says "Thread started. {org} will see it in their inbox."
2. **[verified]** As the other organization, open **Inbox**. → That thread is first, marked "Waiting on you".
3. **[verified]** Tap **Accept**. → "You're on. Work out the details here."
4. **[verified]** Tap **Mark done**, then **Mark done** again. → "Done. This is a golden thread."
5. **[verified]** Open **Map** at phone width. → Washington fills the screen. The dots and strings line up with the base map.
6. **[verified]** Tap your own pin. → A card with your organization's name, city and thread count.
7. **[needs your phone]** Pinch and drag the map on a real phone. → It stays smooth and the strings move with it.
8. **[needs your phone]** Once Google sign-in is set up, sign in on the live site. → You land on the invite code screen.

### Known and deliberate

- Organization names show in capitals, as the IRS list has them.
- On an offer, "Nothing of yours fits yet. You can still help." is the approved line, but you are the one asking there. Worth a second look.
- `map-dev.html` (the map test page, with made-up organizations) ships with the build.
