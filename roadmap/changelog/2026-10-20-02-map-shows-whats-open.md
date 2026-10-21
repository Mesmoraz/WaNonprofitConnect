## 2026-10-20 · The map shows what's open, and draws a thread once it's golden (S-129)

**Story S-129,** built to the brief Taylor approved on Oct 20 (docs/ALPHA-BRIEFS.md, "The map shows what's open"). Taylor: the map should show "where there are available offers and available needs to be picked up", "threads should only be shown as complete", and your own underway "should appear maybe as faint lines".

### What changed

- **Pins are rings that say what's open.** Amber is open needs, green is open offers, in proportion. A pin grows with more open, up to 6. An organization with nothing open is a small grey pin. A cluster's ring is everyone inside it, with the count in its middle.
- **Only golden threads are drawn for everyone.** Other organizations' started and in-progress threads, and the "Could fit" lines, are gone from the map.
- **Your own threads that are underway** are faint grey lines from your pin. Tap one to see it, as before.
- **Golden stands out more:** pins with golden threads glow gold, sparks run only along golden lines, and the base map's roads and town names are a little fainter.
- **Tapping a pin** says "{n} needs · {n} offers · {n} golden threads" and lists up to 4 of its open posts. Tap one to open it.
- **The legend** is rewritten: "Amber is open needs." "Green is open offers." "A golden thread. Help that was given." "Your threads that are underway." "A bigger pin has more open. A faint dot is any Washington nonprofit."
- **Home's small map** has the same pins and lines.
- **The map's data** now counts each organization's open needs and offers.

Not in the brief, called out: the legend keeps S-127's line "A thicker line with a number is several threads between the same two places." Golden lines still carry a number. The strip and the kind-of-help chips are their own story (S-131), and the toggles are S-130.

### Test cases

1. **[verified]** New API test: the map counts open needs and offers per organization, and a member with nothing open has none.
2. **[verified]** New acceptance test `[S-129]`: posting a need and an offer adds 1 to each of that organization's counts.
3. **[verified]** New acceptance test `[S-129]`: tapping Ballard Food Bank's pin shows "needs · offers · golden threads" and its new need. Tapping the need opens it.
4. **[verified]** New acceptance test `[S-129]`: Rebuilding Together's new thread with Hopelink is drawn on Rebuilding's map. It is not drawn on Ballard's map until it turns golden, and then it is.
5. **[verified]** The legend test checks the new words. All earlier map tests still pass.
6. **[verified]** In the map harness at phone size, in light and dark: amber and green rings, grey pins, golden lines only, and faint lines from your own pin.
7. **[needs your phone]** On staging, open the Map. Pins are amber and green rings, and the only bright lines are golden.
8. **[needs your phone]** Tap a pin with something open. The card says how many needs, offers and golden threads it has, and lists its posts.
9. **[needs your phone]** If your organization has a thread underway, a faint grey line runs from your pin. Tap it and its card opens.
10. **[needs your phone]** Tap the ?. The legend shows the two rings and the new lines.
11. **[needs your phone]** Open Home. The small map shows the same rings.
