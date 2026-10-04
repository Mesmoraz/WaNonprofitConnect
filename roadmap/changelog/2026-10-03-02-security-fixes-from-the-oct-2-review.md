## 2026-10-03 · Security fixes from the Oct 2 review

**Story:** S-114. PR #13. Record: `docs/SECURITY-REVIEW-2026-10-02.md`. Nothing the review found was critical or high.

### What changed

- Every page and API answer carries security headers. Other sites can't show the app inside theirs, and the browser only loads code, map tiles and Google sign-in from the places the app uses.
- Feedback pictures must be real images. Signed out, feedback is limited to 5 an hour.
- **Signing out ends the session on every device.**
- Changes sent from another website are refused.
- Too-big requests get "That's too much to send at once." How many runs from 1 to 1,000,000.
- Accounts not confirmed yet see map pins only, and don't count toward board views. The import log is admin-only.
- Browser error text can't fake lines in the server log. The build has zero warnings.

### Test cases

1. **[verified]** On staging, the security headers are on every answer, Google's sign-in button draws, and nothing is blocked.
2. **[verified]** How many set to 2000000 says "Pick a number from 1 to 1,000,000."
3. **[needs your phone]** Sign in with Google on staging; it works.
4. **[needs your phone]** Sign in on a laptop and your phone, sign out on the phone, reload the laptop: it asks you to sign in.
5. **[needs your phone]** Open the map, then Send feedback: the picture shows, and it sends.
