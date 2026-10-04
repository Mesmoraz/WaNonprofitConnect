## 2026-09-28 · Post by picking, not typing

**Story:** S-111. From Mario's in-app feedback (#3, Sep 26): "Free text should be minimal or discrete. Kinda like autotrader but with the thread focus." Taylor asked to apply it.

### What changed

- **What is it? is a row of choices.** Pick a kind of help, and a short list shows (Things: Laptops, Food, Clothing, Furniture, Supplies). The one you tap becomes the title.
- **Something else** is the last choice on every row. It opens a short text box for anything the list doesn't have.
- **Details are optional and folded away.** "Add details" opens a small box, 280 characters at most. The rest gets worked out in the thread.
- Changing the kind of help clears what you picked, so a Laptops pick can't end up as a Time post.

### Needs your approval

- The new words: the 6 lists of choices, "Something else", "Add details", and the hint "The rest you can work out in the thread." All are in `docs/ALPHA-BRIEFS.md`, B7.

### Test cases

1. **[verified]** Tap Post. Under Kind of help, nothing else shows until you pick one. Post need is grey.
2. **[verified]** Tap Things. "What is it?" shows Laptops, Food, Clothing, Furniture, Supplies, Something else.
3. **[verified]** Tap Laptops, type 12 in How many, tap Post need. The post opens: "Laptops", "12 needed".
4. **[verified]** Tap Something else. A text box opens with "Laptops for client intake" in grey. Post need stays grey until you type.
5. **[verified]** Tap Add details. A box opens with "Condition, pickup or delivery, dates."
6. **[verified]** Pick Laptops, then tap Time. Nothing under What is it? is picked, and Post need is grey.
7. **[needs your phone]** On an iPhone, tap Something else. The keyboard opens on the text box without the page jumping.
8. **[needs your phone]** Post a need with no details. On the board it shows the title, your organization, and the facts line, with no empty gap.
