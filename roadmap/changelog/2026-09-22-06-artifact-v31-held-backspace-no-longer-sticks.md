## 2026-09-22 · Artifact v31 · Held backspace no longer sticks

**Story:** S-9 (About you), round B3.

### What changed

- **Typing does no layout work.** Holding backspace used to rebuild the place suggestion list on every repeat; the list growing and shrinking under the field is what made the key stick on Android.
- The list of places is now built once instead of rescanning all 995 organizations per keystroke, the suggestion box is only touched when its contents actually change, and rapid keys are held until they stop (about a seventh of a second) before the list updates.
- The save button is likewise only rewritten when it actually changes.

### Why

Taylor: "holding the backspace button gets stuck." This was made worse by the seed data landing: the suggestion list was scanning every organization on every keystroke, and there are now 995 of them.

### Test cases

1. **[needs your phone]** Just me → Set up my profile → type something into **City or ZIP**, then hold backspace. → The text clears smoothly and the field keeps up. This is the one that was broken.
2. **[needs your phone]** Hold backspace in **Your name**. → Same.
3. **[needs your phone]** Tap **City or ZIP** and type `tac`. → After a moment, eight Tacoma entries appear. **[verified]**
4. **[needs your phone]** Tap one. → The field fills and the list closes. **[verified]**
5. **[needs your phone]** Tap **Driving**, then save. → The board opens as that person. **[verified]**

### Measured

13 rapid keystrokes now cause **0 writes** to the suggestion list and take 1.2 ms in total, against one full rebuild per keystroke before.
