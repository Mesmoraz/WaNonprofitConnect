## 2026-10-07 · An account stays with the Google account that made it

**Task:** T-218, from the Oct 2 security review (L7). Decided by Taylor, Oct 7: refuse it.

### What changed

- If a different Google account signs in with the email of an existing account, it's refused, with "That Google account isn't the one this email signed up with. Use that one, or send feedback and we'll sort it out." Before, it got the existing account, including admin rights if the email was an admin's.
- The sign-up screen now shows the server's own sentence when sign-in is refused, not only "That didn't work. Try again."
- Unchanged: the same Google account always gets in. An account made before Google sign-in takes on the first Google account that signs in with its email.

### Test cases

1. **[verified]** In the service test, a second Google identity with Sam's email is refused with the approved line, and Sam's account isn't touched.
2. **[verified]** The same Google identity still signs in. An account with no Google identity yet takes the first one, and refuses a second.
3. **[verified]** The front-door and return-to-link acceptance tests pass.
4. **[needs your phone]** On staging, sign in with Google as usual. You get in as before. (A second Google identity on the same email can't be set up just to test this.)
