## 2026-10-16 · Invite someone from your organization (S-95)

**Story S-95,** Round 2 of `docs/ALPHA-PLAN.md`. Brief: "Your organization" in `docs/ALPHA-BRIEFS.md`, the People here and Invite someone parts, plus S-109's Find yours line. Taylor, Oct 16: the 3 places include the person who joined first.

### What changed

- **Your organization** now lists **People here**, as "{name} · {email}" with "(you)" after yours. Only people at the organization see it.
- **Invite someone:** "Up to 3 people can be here. {n} left." and **Make a code**. The code shows large with "Send it to them yourself. It works once." Tap it to copy ("Copied."). Once 3 people are here, or codes are out for the rest: "All 3 places are taken." and no button.
- A code works once and confirms your colleague for your organization straight away.
- Your "Test as this organization" doesn't take a place, and you aren't listed in People here or as a "Who to ask" choice (T-234).
- Codes you make on Admin still go past 3, as the brief says.
- **Find yours:** "Already on {name}. Ask a member to invite you." now reads "Already on {name}. Ask someone there for an invite code."
- API: `POST /api/v1/org/invites` and `placesLeft` in `GET /org`. New column `Invites.ByMember`. Contract in `docs/ALPHA.md`.
- The demo does the same: Ballard Food Bank has 1 place left (you and Maria).

### Test cases

1. **[verified]** 8 new API tests pass: a member's code works once, places count people and unused codes, a fourth code is refused, your test membership takes no place, admin codes go past 3, two people asking for the last place at once get one code between them, and a pending member can't make one. All 246 API tests pass.
2. **[verified]** New acceptance tests `[S-95]` (make a code, a colleague joins with it on another phone, then shows under People here) and `[S-109]` (the Find yours line). All 42 acceptance tests pass (1 skipped: fresh database only).
3. **[verified]** In the demo at phone width: People here, "1 left", Make a code, the code, then "All 3 places are taken." with the button gone.
4. **[needs your phone]** On staging, open your name, then **Your organization**. Under People here you see yourself with "(you)". Tap **Make a code**. Tap the code, then paste it somewhere: it's the same code.
5. **[needs your phone]** Sign in on a second phone with an account that isn't on any organization yet, and enter the code. You land on the board, confirmed for your organization, and the first phone lists them under People here after a refresh.
6. **[needs your phone]** On a third account, open "No code? Find your organization" and search for yours. It says "Already on Helpbook. Ask someone there for an invite code."
