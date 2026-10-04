## 2026-09-22 · Artifact v32 · Scaffolding removed, build stamp added

**Stories:** S-9, S-65 (held backspace), round B3.

### What changed

- The diagnostic page and the `?keys=1` logger are gone from the app and the site.
- **The help sheet now shows a build stamp**, filled in when the site is built. Tap **?** and read the bottom line.

### Why, and what was actually wrong

Backspace is confirmed working on the plain URL, but **no defect was ever found**. Nothing in the app changed between the last "still stuck" report and the confirmation except adding a logger that only observes. The likeliest explanation is that the earlier tests loaded a cached copy of the page, before the fix reached the phone.

Three changes were shipped for this bug and described as fixes. A seven-case diagnostic page then showed every case working, including a replica of the app shell, which disproved all three theories. The build stamp exists so a stale page can be spotted in one glance rather than costing another round.

### Test cases

1. **[verified]** The app carries no debug overlay and the place dropdown still filters (`sea` gives Seatac and the Seattles).
2. **[verified]** Tap **?** in the app. → The last line reads "Build" and a date.
3. **[needs your phone]** Hold backspace in **Your name** and in **City or ZIP**. → Both clear all the way.

### Standing rule

Held-key behaviour cannot be verified in Claude’s browser pane, which cannot synthesise a native held key. It is always marked **[needs your phone]**, and an unverified change is never announced as a fix.
