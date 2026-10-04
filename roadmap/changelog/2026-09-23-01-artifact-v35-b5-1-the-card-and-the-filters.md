## 2026-09-23 · Artifact v35 · B5.1: the card and the filters

**Story:** S-67, round B5.

### What changed

- **Priority reads in plain words, and most posts carry none.** Critical is **Urgent**, High is **This week**, and the two lower levels show no mark at all. Six of the fifteen open needs are marked; the other nine are clean.
- **No more doubled priority.** The `P1` pill and the grey `P1 · seen 1×` line underneath were saying the same thing twice. The grey line now appears only when it says something surprising: the fair-rotation slot, or a post that is being lifted for being under-seen.
- **The card has three clear lines**: the title, then the organization on its own line, then one grey line of facts — city, how many, how often, how long ago. The organization used to be buried mid-sentence and wrapped.
- **NEED and OFFER keep the strongest pill**, since that is the distinction that matters most.
- **Kinds of help now look like navigation, not filters.** That top row is a segmented selector with the active one underlined, and it no longer counts towards "Filters".
- **The filter sheet is grouped under labels**: What, Who, How far. The two rows of pills were reading as one category.

### Why

Taylor: the board "feels a little busy still like too much text", `P1` was on the card twice and meant nothing to a reader, and the two chip groups "look the same aesthetically" while doing different jobs.

### Test cases

1. **[needs your phone]** Open the **Board**. → Cards read: NEED (and This week only when urgent), title, organization, then "Spokane · 15 employers · 12h". No `P1`, no "seen 1×". **[verified]**
2. **[needs your phone]** Look down the list. → Most cards have only the NEED or OFFER pill. **[verified]**
3. **[needs your phone]** Tap **Time** in the top row. → It underlines, three posts show, and the Filters link still reads just "Filters". **[verified]**
4. **[needs your phone]** Tap **Filters**. → Three labelled groups: What, Who, How far. **[verified]**
5. **[needs your phone]** Open any post. → Under the title it says "Needed this week" or "Needed this month" as a sentence, with no stray punctuation. **[verified]**
6. **[needs your phone]** Tap **Post** and open the urgency list. → "Urgent · can’t operate without it (0 of 2 used this month)", "This week · needed this week", "Needed this month", "Whenever it works". **[verified]**

### Known and deliberate

- `docs/TAXONOMY.md` and `docs/VOICE.md` were updated: they said "P0 to P3, with its meaning beside it", which is no longer true.
- The seeded data leans towards High, so "This week" shows on about 4 in 10 open needs. If that starts to feel like noise, the fix is the seed data, not the design.
- The Post screen was touched only where it printed the old labels; its own round is B7.
