## 2026-09-24 · Send feedback from inside the app

**Story:** S-93. From Taylor: a way for the co-founder to send feedback as he uses the app, with what was on his screen.

### What changed

- **Send feedback** is in the name menu on every screen, and on the crash screen ("or tell us what happened").
- It takes a picture of the screen first (the map included), then asks "What happened, or what would you change?" with "Include a picture of this screen" ticked. **Send**, then "Sent. Thanks for telling us."
- With the note we get: who sent it and for which organization, the page, the screen size, the browser, light or dark, whether the demo was on, the last pages visited, and recent errors and failed server calls.
- It works in the demo too, and always reaches the real server.
- **Admin → Feedback** lists new notes with the picture, the details, and **Done**. Each note also goes to the log, so `scripts/errors.ps1` shows it.
- If the picture takes more than 4 seconds, the box opens without it. A note always gets through.

### Test cases

1. **[verified]** Name menu shows **Send feedback**. Send a note from the map. → "Sent. Thanks for telling us."
2. **[verified]** Admin → Feedback shows the note with "Taylor · BALLARD FOOD BANK · /map · Sep 24", and the details (page, screen, browser, recent pages).
3. **[verified]** A note with a picture: the picture comes back as a 320×180 JPEG.
4. **[verified]** The production build runs board, map, post, inbox, organization page and admin with no crash.
5. **[needs your phone]** On your laptop, open the map, **Send feedback**. → A small picture of the map in the box. (My browser pane was hidden, which stops the capture, so I couldn't see this one.)
6. **[needs your phone]** Same on your phone.

### New lines, for approval

- "Send feedback", "What happened, or what would you change?", "Include a picture of this screen", "Sent. Thanks for telling us.", "That didn’t send. Try again.", crash screen "or tell us what happened", Admin label "Feedback", "Nothing new.", "Done".
