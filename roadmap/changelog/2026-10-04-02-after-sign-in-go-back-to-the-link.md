## 2026-10-04 · After sign-in, go back to the link you opened

**Story:** S-107. Phase A of the plan (`docs/PLAN.md`): so a link in an email or a message lands where it points.

### What changed

- Open a link inside Helpbook before you're in (a shared post, an organization's page, the inbox, a post form), and you still go through sign in, invite code or find yours, and waiting as before. Once you're confirmed, you land on that link instead of the board.
- The link survives a closed tab while you wait for approval, for up to 7 days, and it's used once.
- Only links inside the app are ever followed.

### Test cases

1. **[verified]** Signed out, open a post's link, sign in. You land on that post.
2. **[verified]** Signed in with no organization, open an organization's page, enter an invite code. You land on that page with "You're in. Welcome, …".
3. **[verified]** A link to Post an offer keeps "We have" picked after sign-in.
4. **[verified]** A saved link to another website is never followed; you land on the board.
5. **[needs your phone]** Signed out on your phone, tap a shared post link and sign in with Google. You land on the post.
