## 2026-10-27 · Admin shows where people stop, from sign-in to golden thread (S-148)

**Story S-148,** built to the brief "Where people stop" in docs/ALPHA-BRIEFS.md, approved Oct 27 in chat with Taylor's answers to its two questions: people waiting for you show as waiting, not stopped, and "Came back this week" stays.

### What changed

- **"Where people stop" is on Admin, right under "How it's going".** One card, five rows, each a number and what it counts: People signed in, Confirmed at an organization, Organizations that posted, In a thread, With a golden thread.
- **Under each row after the first, in grey, only when someone stopped there:** "{n} stopped here". Under Confirmed, people whose claim waits for you show as "{n} waiting for you" instead, the same people as "Waiting for you" further down.
- **Under the card:** "Came back this week: {n} of {m}": of people confirmed more than 7 days ago, how many signed in during the last 7. Until anyone has been here a week: "Came back this week: None yet".
- **With nobody signed in yet,** every row says "None yet", as "How it's going" does.
- **The same people as "How it's going":** someone who signed in with Google, not you or another admin, not "Test as this organization", not the development sign-in. Threads an admin started aren't counted. Nothing new is recorded: it reads sign-ins, confirmations, posts and threads the app already keeps.
- **A new admin-only API route,** `GET /api/v1/admin/stops`. The demo gets the card with nothing counted.

Needed to make it true, beyond the brief: "Came back this week: None yet" when no one has been confirmed a week yet (the brief gave the line only with numbers).

### Test cases

1. **[verified]** New API tests (`WherePeopleStopTests`): an empty database; every step, with a waiting claim and "came back"; admins, the development sign-in, "Test as this organization" and an admin-started thread left out. All 270 API tests pass.
2. **[verified]** New acceptance tests `[S-148]`: the card is the second section on Admin, with its five rows in order and the "Came back this week" line; someone who isn't an admin gets a 403. The Admin tests pass on a fresh database.
3. **[verified]** Phone width, light and dark, with sample numbers (14 signed in, 9 confirmed, 2 waiting): labels line up, "3 stopped here · 2 waiting for you" under Confirmed, nothing scrolls sideways.
4. **[needs your phone]** On staging, open Admin: "Where people stop" is under "How it's going". People who signed in with Google on staging are counted; you aren't.
5. **[needs your phone]** If someone's claim is waiting, Confirmed says "1 waiting for you", and the same person is in "Waiting for you" below.
