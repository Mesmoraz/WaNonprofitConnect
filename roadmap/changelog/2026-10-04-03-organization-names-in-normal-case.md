## 2026-10-04 · Organization names in normal case

**Story:** S-98. Phase A of the plan (`docs/PLAN.md`): the IRS list is all capitals, which reads like a government list.

### What changed

- Organization names read in normal case everywhere, keeping acronyms: "Ballard Food Bank", "YWCA of Olympia", "Tacoma-Pierce Habitat for Humanity", "Barbara McClintock PTO", "Northwest Harvest E M M".
- The IRS name in the database doesn't change. The server sends the readable version, so every screen, Admin and the map show the same name.
- Known misses, fixed as they turn up: acronyms with a vowel that aren't on the list (YPO reads "Ypo"), and a few possessives the IRS wrote as a lone S.

### Test cases

1. **[verified]** The board's cards show "Ballard Food Bank", not all capitals.
2. **[verified]** Your name at the top reads "Casey · Computers 4 People in Need".
3. **[verified]** Search "Ballard Food": the result reads "Ballard Food Bank".
4. **[verified]** Tacoma-Pierce Habitat's page heading reads "Tacoma-Pierce Habitat for Humanity".
5. **[needs your phone]** A thread, Admin's claims and invites, and an organization's card on the map all show normal-case names.
