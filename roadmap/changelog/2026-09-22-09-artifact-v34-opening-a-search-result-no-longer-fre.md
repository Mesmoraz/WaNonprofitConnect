## 2026-09-22 · Artifact v34 · Opening a search result no longer freezes the app

**Story:** S-66, round B5.

### What changed

- **Tapping an organization in search works.** The app was turning an EIN like `911428805` into a number, failing to find the organization, and throwing part-way through drawing the screen. Everything after that point stopped responding.
- **The stuck welcome message was the same bug.** The message clears itself after a few seconds, but the code that clears it never ran once the screen had failed, so it sat on top of the tab bar. With the crash fixed it disappears on its own; it can also be tapped away.
- **The message now sits above the tab bar** rather than over it. It was measured against the taller phone-width bar, not guessed.
- **A screen that fails can no longer freeze the app.** If one ever throws, it returns to the board instead of leaving a dead picture on screen.

### Why

Taylor: "Selecting an option from the search seems to freeze the app, the You’re in Welcome message doesn’t disappear and blocks the bottom menu."

The fault predates round B5 — the old Orgs list had the same link — but the board search is what made it easy to reach.

### Test cases

1. **[needs your phone]** Board → search `ballard` → tap **Ballard Food Bank**. → Its page opens. **[verified]**
2. **[needs your phone]** Search `ballard` → tap **Ballard High School**. → The school’s page opens. **[verified]**
3. **[needs your phone]** Search `seattle foundation`, `worksource`, `dana`, and a university, and open each. → All open. **[verified]** (all six kinds checked)
4. **[needs your phone]** Sign up fresh and reach the board. → The welcome message sits above the tabs, all five are readable, and it vanishes after a few seconds. **[verified]**
5. **[needs your phone]** Tap the message while it is showing. → It disappears. **[verified]**
