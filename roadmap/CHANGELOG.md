# Change log

Newest first. Every shipped change lands here with test cases Taylor can run on a phone. Rules: `SDLC.md`, section "Change log and test cases".

---

## 2026-09-22 · Artifact v28 · About you: a real dropdown for City or ZIP

**Story:** S-9 (About you), round B3.

### What changed

- **City or ZIP now shows a real dropdown.** Tapping the field lists nearby places; typing filters them; tapping one fills the field and closes the list.
- The old approach used the browser's own `datalist`, which Android does not draw as a dropdown. It pushed the options into the keyboard's suggestion strip instead, with nothing on screen to say where they came from.

### Why

Taylor's phone check: "The carrot in the City or Zip doesn't make a drop down on my phone, I see options on my keyboard on android, but it isn't clear where those are coming from."

### Test cases

1. **[needs your phone]** Sign up → Just me → Set up my profile. Tap **City or ZIP**. → A list appears under the field, starting with "Bellingham 98225".
2. **[needs your phone]** Type `spo`. → The list narrows to four Spokane entries (99201, 99202, 99217, 99220). **[verified]** in the browser pane.
3. **[needs your phone]** Tap **Spokane 99202**. → The field fills with "Spokane 99202" and the list closes. **[verified]**
4. **[needs your phone]** Tap **Driving**, then **Save and go to the board**. → The board opens and the toast reads "You're in. Welcome, Dana." **[verified]**
5. **[needs your phone]** Go back into the field and hold the delete key. → The text clears continuously, not one character per press. *Claude cannot verify this one: the browser-automation tool does not perform the native delete, though the key event does reach the page un-blocked.*
6. **[needs your phone]** Type a place that matches nothing, like `zzz`. → No list appears, and the field keeps what you typed.

---

## 2026-09-22 · Artifact v27 · About you: four fixes from the phone check

**Story:** S-9 (About you), round B3.

### What changed

- **Holding delete now repeats.** Typing no longer redraws the screen, so the field is never replaced mid-keystroke.
- **Typed text counts on its own.** Anything in "Something else?" enables **Save and go to the board** without tapping a tag first.
- **A typed entry becomes a tag.** **Add**, or Enter, turns it into a chip beside the built-in ones, already picked, with a × to take it off.
- **"When" is gone.** People can be flexible.
- The button under the form reads "Fill in the top two" until it is ready.

### Why

All four came from Taylor's phone check of v26.

### Test cases

1. **[verified]** Just me → Set up my profile. → No "When" section between the tags and "Causes you care about".
2. **[verified]** Type "Beekeeping" into **Something else?** without tapping anything. → The save button turns green.
3. **[verified]** Tap **Add**. → "Beekeeping ×" appears as a selected tag with the others; the field clears.
4. **[verified]** Tap the "Beekeeping ×" tag. → It disappears from the list.
5. **[needs your phone]** Hold delete in **Your name**. → The text clears continuously. *Not verifiable in the automation pane; see the entry above.*

---

## 2026-09-22 · Artifact v26 · About you (new screen)

**Story:** S-9 (About you), round B3. First build of the screen for people who sign up as "Just me": name, place, what they can do, causes. Saving creates the person and opens the board.

Also: the role screen's "Demo: this path isn't built yet" line was removed, because all six paths now exist.

### Test cases

1. **[verified]** Sign up → **Just me** → the button reads "Set up my profile".
2. **[verified]** Fill name, place, and one tag → the button reads "Save and go to the board" → tapping it opens the board as that person.
3. **[verified]** No path on the role screen shows a "not built yet" note.
