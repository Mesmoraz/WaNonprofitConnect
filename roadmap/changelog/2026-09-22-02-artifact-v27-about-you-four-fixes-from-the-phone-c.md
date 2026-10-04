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
