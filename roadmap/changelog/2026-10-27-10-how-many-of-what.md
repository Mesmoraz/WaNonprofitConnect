## 2026-10-27 · "How many" says how many of what (S-125)

Built to the brief "Three small fixes from the friction list", approved Oct 27 (Taylor: "Approve #70").

### What changed

- **The line under How many follows the title.** Once a post has a title, it reads "How many {title}, if it matters.", for example "How many folding tables, if it matters." With no title yet it still says "Just the number, if it matters."
- **The title reads as part of the sentence:** its first letter drops to lower case, unless its first word is an acronym ("How many PPE kits, if it matters.").
- On the post itself nothing changes: it still reads "6 needed" or "6 to give".

Needed to make it true, beyond the brief: the brief kept capitals for "a name the IRS list spells in capitals", which is a rule for organization names; titles have no such list, so only an acronym as the first word keeps its capitals. A title that starts with a place or a name ("Spanish tutors") reads "spanish tutors" in this line.

### Test cases

1. **[verified]** New acceptance test `[S-125]`: no title, "Just the number, if it matters."; "Folding tables", "How many folding tables, if it matters."; "PPE kits" keeps its capitals. All 9 Post tests pass.
2. **[needs your phone]** On staging, Post: pick a kind of help, then a title. The line under How many names it.
