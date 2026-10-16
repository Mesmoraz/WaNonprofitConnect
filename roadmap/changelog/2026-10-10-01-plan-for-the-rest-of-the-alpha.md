## 2026-10-10 · A plan for the rest of the alpha

**Process.** Taylor asked for a technical plan for everything left in the alpha, written with the Superpowers plugin's planning skill. No app code changes.

### What changed

- New `docs/ALPHA-PLAN.md`: the rest of the alpha as 8 rounds in order, each mapped to its roadmap stories. Each round lists the files, data and API changes, the tests that prove it, and how it's checked on a phone. Six questions for Taylor at the end.
- `docs/CONTINUE.md` points to it.
- Roadmap: S-98 (names in normal case) and S-107 (back to the link after sign-in) are done. Both were merged on Oct 4 (#18, #16) but still said backlog.
- Roadmap: 5 new tasks found while planning. Admin test memberships shouldn't take one of an organization's 3 places (T-234). Urgent counts from when a post became urgent, so an edit can't get around 2 a month (T-235). How to send email before there's money (T-236). Whether admin test threads count in the numbers (T-237). The real-phone check before the first invite (T-238).

### Test cases

1. **[verified]** `node scripts/roadmap.js` validates the roadmap with no errors.
2. **[needs you]** Read `docs/ALPHA-PLAN.md` and answer its six open questions, in the PR or in chat. The first round to build waits on question 1 (the order).
