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
