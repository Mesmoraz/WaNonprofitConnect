## 2026-10-21 · The map shows the offers for your needs, and the needs you can help with (S-130)

**Story S-130,** built to the brief in docs/ALPHA-BRIEFS.md ("Find what fits you"), approved Oct 21. Taylor, Oct 20: a toggle to "find offers that might suit your need" and "find needs that you can fulfill" that draws temporary threads for your view only. "Help with is great."

### What changed

- **Two toggles on the map:** "Offers for your needs" and "Needs you can help with". Each shows only when you have something it can match: a need open for the first, an offer open for the second. One is on at a time. Tap it again to turn it off.
- **When one is on,** dashed lines run from your pin to each organization that fits, up to 12. Green lines are offers coming to you. Amber lines are needs your help would go to. Your pin pulses, everything else dims, and the map frames you and the organizations that fit. Nobody else sees the lines.
- **A card lists the fits:** "5 offers could fit your needs" or "4 needs you could help with". Each row shows their post's title, the organization, city and miles, and which of your posts it fits ("For your: Winter coats"). Tap a row, or a line, to open their post and start a thread there.
- **When nothing fits:** "Nothing fits your needs yet. Check the board?" or "Nothing you can help with yet. Check the board?" The words "Check the board" are the link.
- **New in the API:** `GET /api/v1/map/fits?for=needs|offers`, for confirmed members. It uses the same scoring as a post's "Could fit", leaves out pairs already in a thread, and returns the best first.

Decided while building, beyond the brief: each toggle shows only when it can find something; the empty line for offers; and turning a toggle on frames the map. All are written into the brief. S-129 is marked done on the roadmap, since PR #46 merged.

### Test cases

1. **[verified]** New API test: fits pair your posts with other organizations' posts, never your own. A pair leaves once it's in a thread, and an organization with nothing open gets none.
2. **[verified]** New acceptance test `[S-130]`: Rainier Valley Food Bank offers folding tables that fit Ballard Food Bank's need. Ballard's "Offers for your needs" card lists the offer with "For your: …". Tapping the line, or the row, opens the post.
3. **[verified]** New acceptance test `[S-130]`: tapping a toggle again turns it off, and the "?" replaces the list with the legend.
4. **[verified]** New acceptance test `[S-130]`: a bad `for` gets 400, and someone not confirmed gets 403.
5. **[verified]** In the browser at phone size, in the demo as Ballard Food Bank: the green line from FareStart, the card with "4 mi", and the empty line for offers.
6. **[needs your phone]** On staging, with a need open, open the Map and tap "Offers for your needs". Dashed green lines run to the organizations that fit, your pin pulses, and the card lists them.
7. **[needs your phone]** Tap a line. Their post opens. Come back, and tap a row in the card. The same thing happens.
8. **[needs your phone]** With an offer open, tap "Needs you can help with". The lines are amber and run from your pin.
9. **[needs your phone]** Tap the lit toggle again. The lines and the card go.
