## 2026-09-28 · Try it as a new organization

**Stories:** S-110, S-101. From Taylor: "if we don't have a way to easily test the site as a fresh user we need that flow built into the demo/admin features."

### What changed

- **Try as a new organization**, for admins, in the name menu and at the top of Admin ("Try it as someone new"). It starts the demo signed in with no organization, at "Your invite code", so you walk the front door like a newly invited organization. Each tap starts over from the beginning.
- **Both ways in work in the demo.** The invite hint reads "Demo: try RAINIER." (Rainier Valley Food Bank, nothing posted yet). Or tap "No code? Find your organization", pick West Seattle Food Bank (the hint says "West Seattle Food"), and on the waiting screen "Demo: approve it yourself in Admin." approves your own claim.
- **The demo keeps what you do** (posts, threads, messages) across reloads until you leave it or start over. Before, a reload wiped it.
- **Start the demo** still starts at Ballard Food Bank with posts and a thread waiting. The demo bar now reads "Demo: sample organizations. Only you see this."
- Nothing in the demo reaches the real site.

### Test cases

1. **[verified]** Admin → **Try as a new organization**. You land on "Your invite code" with "Demo: try RAINIER."
2. **[verified]** Enter RAINIER, **Join**. The board shows, and your name reads "· Rainier Valley Food Bank".
3. **[verified]** Post a need, reload. It's still there.
4. **[verified]** Name menu → **Try as a new organization** again. You're back at the invite code, and the need from step 3 is gone.
5. **[verified]** "No code? Find your organization", type "West Seattle Food", pick it, **Join as West Seattle Food Bank**, then approve yourself in Admin. The board shows as West Seattle Food Bank.
6. **[needs your phone]** On the waiting screen in step 5, the line "Demo: approve it yourself in Admin." shows, and "Admin" opens Admin.
7. **[needs your phone]** Name menu → **Leave the demo**. You're back on the real site as yourself, with your real organization.
