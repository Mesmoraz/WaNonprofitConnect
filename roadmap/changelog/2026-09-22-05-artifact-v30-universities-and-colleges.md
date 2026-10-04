## 2026-09-22 · Artifact v30 · Universities and colleges

**Story:** S-62 (higher education seed), round B4.

### What changed

- **49 higher-education institutions** joined the app: 8 public four-year campuses (including UW Bothell and UW Tacoma), 34 community and technical colleges, and 7 private nonprofit universities and colleges. The app now holds 995 organizations.
- They are the same participant type as K-12 schools, so **A school or district** finds all of them with no new screen or code.
- **48 of the 49 carry real coordinates**, from the federal NCES geocoded campus locations, so they sit correctly on the map today rather than waiting for the geocoding step.

### Why

Taylor asked that schools scale to universities, middle schools, and elementary schools. Universities and colleges are switched on; middle and elementary remain one line away in `scripts/build-seeds.js`.

### Test cases

1. **[needs your phone]** Sign up → **A school or district** → **Find my school** → type `university of washington`. → Three results: Seattle, Bothell, Tacoma, each labelled "University". **[verified]**
2. **[needs your phone]** Type `cascadia`. → Two high schools and "Cascadia College · Bothell · Community college" together in one list. **[verified]**
3. **[needs your phone]** Type `whitman`. → "Whitman College · Walla Walla · Private college", not "university". **[verified]**
4. **[needs your phone]** Type `evergreen`. → Two districts, three high schools, and "The Evergreen State College · Olympia · College". **[verified]**
5. **[needs your phone]** The app should still open quickly. It is now 302 KB.

### Known and deliberate

- **UW has its branch campuses as their own rows; WSU does not.** WSU Vancouver, Tri-Cities, Spokane and Everett exist in the same federal source and could be added the same way. Taylor decides whether the two should match.
- `domain` is each institution’s website host, which is not always the staff email domain (Spokane’s colleges and the UW branches especially). Confirming by email domain may need a second field.
- Yakima Valley College carries a PO Box ZIP from the federal source; its coordinates are the physical campus.
- Only main campuses are included for the community and technical colleges.
