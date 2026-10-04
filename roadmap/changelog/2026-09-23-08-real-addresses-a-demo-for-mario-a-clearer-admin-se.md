## 2026-09-23 · Real addresses, a demo for Mario, a clearer admin search

**Stories:** S-49, S-69, S-73. From Taylor: add Mario as an admin, show real locations, the white dots look terrible, the admin search isn't clearly a search, and give Mario pre-made data to show people the flow.

### What changed

- **Mario is an admin** (mpozzo20@gmail.com).
- **Organizations sit at their street address.** Each IRS address was matched with the Census Bureau's free geocoder. About two in three matched. The rest (mostly PO boxes) sit at their ZIP's center. The dots no longer spread into 1.3 km clouds.
- **Start the demo.** Admins have **Start the demo** in their name menu. The board, map, inbox and threads fill with sample posts from real Washington organizations, and the map keeps its real statewide dots. Nothing in the demo is saved or seen by anyone else. A grey line at the top reads "Demo: sample organizations. Nothing here is saved." with **Leave the demo**.
- **Admin search looks and acts like a search.** A search icon, results that drop down under the field, "Searching" while it looks, and the picked organization shown with a check and an ×.

### Test cases

1. **[verified]** Admin → type "food ba". → A dropdown of food banks under the field.
2. **[verified]** Pick one. → It shows with a check; **Test as this organization** appears.
3. **[verified]** Name menu → **Start the demo**. → 17 sample posts, an inbox with 2 unread, the grey demo line.
4. **[verified]** In the demo, open **Map**. → Statewide dots and sample threads between Seattle, Tacoma, Bellingham and Spokane.
5. **[verified]** Tap **Leave the demo**. → Back to your real organization; the grey line is gone.
6. **[needs your phone]** Zoom into Seattle on the map. → Dots along streets, not round clouds.
7. **[needs your phone]** Mario signs in with Google. → **Admin** and **Start the demo** in his name menu. (Add him as a Google test user first.)
