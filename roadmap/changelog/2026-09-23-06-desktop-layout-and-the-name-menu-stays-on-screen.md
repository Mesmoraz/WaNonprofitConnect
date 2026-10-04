## 2026-09-23 · Desktop layout, and the name menu stays on screen

**Story:** S-76. From Taylor: the menu went off the screen, and on a desktop it "should not look like a phone app".

### What changed

- Your name menu on the sign-in, invite and admin screens drops down now. On a desktop it used to open upward, off the top of the screen.
- On a desktop, the sign-in, invite, waiting and admin screens are a card in the middle of the page, under a full-width top bar. They were a phone-width strip.
- The board shows its posts in 2 columns on a laptop and 3 on a wide screen. Phones are unchanged.

### Test cases

1. **[verified]** On a desktop, sign in and tap your name at the top right. → The menu drops down with **Admin** and **Sign out**.
2. **[verified]** On a desktop, look at **Your invite code**. → A centered card, "← Back" or the name on the left of a full-width bar.
3. **[verified]** On a laptop, open the board. → Posts sit in 2 columns, in rank order left to right.
4. **[verified]** On a phone, open the board. → One column, as before.
5. **[needs your phone]** On your phone, tap your name on **Your invite code**. → The menu drops down and stays on screen.
