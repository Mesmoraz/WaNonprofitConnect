## 2026-09-24 · Filters saved to your organization, and read from names too

**Story:** S-88. Taylor granted the app permission to add tables.

### What changed

- **Who they serve** is saved to your organization, not the device. Everyone there shares it, and it follows you to your phone. Admins can set it for any organization.
- When an organization's cause code gives no group (1 in 5 WA charities has none, and many food banks are filed under odd codes), its name is read instead. "Food bank" means Food, "PTA" means Education, "Senior center" means The elderly, and so on. Private "family foundations" and churches named "Harvest" are left out on purpose.
- New table: OrgPreferences (the first change to the live database's structure since launch).

### Test cases

1. **[verified]** As Auburn Food Bank (code T70, no group), open **Filters**. → **Food** is on.
2. **[verified]** The board shows Ballard Food Bank's posts (no code; matched by its name) and hides the tool library's.
3. **[verified]** Tap **Housing**. → Saved to your organization; a second person there sees it too (a new test).
4. **[needs your phone]** Change a chip on your computer, then open the board on your phone. → The same chips.
