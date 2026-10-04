## 2026-09-23 · Live data, testing as any organization, and a livelier map

**Stories:** S-74, S-69, S-73. From Taylor: the map stopped moving, golden threads looked broken, the map needs every WA nonprofit, and "find your organization" should just work, with an admin bypass for testing.

### What changed

- **The live site now has every Washington nonprofit.** Its database was empty, so search found nothing and the map had no dots. The site now loads the IRS list and the Census ZIP locations itself whenever it finds them missing.
- **Test as this organization.** In Admin, pick any organization, then tap **Test as this organization**. You're that organization at once, with no code. Switch back and forth to play both sides of a thread.
- **The map moves again.** The dashes drift from giver to receiver even when Windows has "Animation effects" turned off. That setting had been freezing the map.
- **Threads draw on top.** Roads and town names no longer cut through golden threads.

### Test cases

1. **[needs your phone]** Admin → type "food bank". → A list of Washington food banks.
2. **[needs your phone]** Pick one, tap **Test as this organization**. → "You're now {org}." and the board.
3. **[needs your phone]** Post a need. Then in Admin, test as a second organization, open that need, tap **I can help**. → A thread.
4. **[needs your phone]** Test as the first organization again, open **Inbox**. → The thread says "Waiting on you". Accept, then mark done.
5. **[needs your phone]** Open **Map**. → Faint dots across the state, and the golden thread drifting on top of the roads.

### Known and deliberate

- Organizations sit at their ZIP's center, so a city's nonprofits cluster together. Street addresses are Beta (S-49).
- Anything you post while testing shows to everyone on the live site. There's no test switch yet; see the chat for the proposal.
