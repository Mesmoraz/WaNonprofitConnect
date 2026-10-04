## 2026-09-24 · Privacy and terms pages, as a draft

**Story:** S-77. From Taylor: build them with the draft language.

### What changed

- **/privacy, "What we keep, and why"** and **/terms, "How Helpbook works"**, open to anyone, signed in or not. The wording is the draft in `docs/PRIVACY-TERMS-DRAFT.md`, updated to mention feedback notes and their screen pictures.
- Under the sign-in button: "By signing in you agree to the terms and the privacy page."
- The five facts only Taylor can supply show as highlighted placeholders: [contact email], [who runs it], [date], and the liability sentence (the 7-day reply time is filled in). Both pages say "Draft: this page is still being reviewed." until all are filled in, in one file, `app/src/legal/facts.ts`.

### Test cases

1. **[verified]** Signed out, the sign-in page shows the new line, and "the privacy page" opens /privacy.
2. **[verified]** /terms shows "How Helpbook works", the draft line, and "[who runs it]" highlighted.
3. **[verified]** Signed in, /privacy opens, and "← Back" returns to the board.
4. **[verified]** No sideways scroll at phone width.
5. **[needs your phone]** Read both on your phone, top to bottom.

### Still needed before Google sign-in can be published (S-92)

- The contact email, who runs it, the date, and the liability sentence, then a lawyer's read before the public launch.
