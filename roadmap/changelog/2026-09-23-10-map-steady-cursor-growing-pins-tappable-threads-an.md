## 2026-09-23 · Map: steady cursor, growing pins, tappable threads and organizations

**Story:** S-84. From Taylor's bug list.

### What changed

- **The cursor no longer flickers** over a pin. Two parts of the map were both setting it, every frame.
- **Pins grow when you hover them**, easing up to about 1.5 times their size.
- **A tapped thread shows both posts.** The card lists the need and the offer, each tappable, and both organization names open their page.
- **A tapped organization opens its page.** The card has **See their needs and offers**. The page shows the name, city, cause and EIN, how many golden threads and threads in progress it has, and its open needs and offers.

### Test cases

1. **[needs your phone]** On a desktop, move the mouse over a pin. → A steady pointer, and the pin grows.
2. **[verified]** Tap a thread. → "Second Harvest Inland Northwest → Spokane Humane Society", "Things · In progress", then **Need** Dog and cat food and **Offer** Pallet of pet food.
3. **[verified]** Tap an organization's name in that card. → Its page: "Spokane · Animals · EIN 91-0565011", "1 in progress".
4. **[verified]** Open Ballard Food Bank's page. → Its 3 open posts as cards.
5. **[needs your phone]** Tap a pin, then **See their needs and offers**. → The same page.

### New lines, for approval

- Map card: "See their needs and offers". Thread card labels "Need" and "Offer".
- Organization page: "{city} · {cause} · EIN {ein}", "{n} golden threads · {n} in progress", label "Needs and offers", empty "Nothing open right now."
