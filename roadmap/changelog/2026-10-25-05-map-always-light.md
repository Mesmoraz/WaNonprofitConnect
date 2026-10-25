## 2026-10-25 · The map is always light: warm land, blue water, on every phone (S-139)

**Story S-139,** built to the brief in docs/ALPHA-BRIEFS.md ("The map, always light"), approved Oct 25 (PR #52). It came from Taylor the same day: "the map is too dark".

### What changed

- **The map is light on every phone,** dark mode included. Before, a phone in dark mode got a near-black map. Tabs, cards and sheets still follow the phone.
- **New colors:** land is warm cream, water is soft blue, and parks and woods are pale green. Puget Sound, the lakes and the coast show again; before, they were almost the same grey as the land. The faint nonprofit dots are a little darker.
- **Pins, threads, glow and confetti** keep their light-mode amber, green and gold in dark mode too.
- **Home's "Near you" map** gets the same colors.
- **Built as 4 tokens** in `tokens.css`: `--map-land`, `--map-water`, `--map-park`, `--map-dot`. The map's box keeps the light set of the other colors it reads.

Needed to make it true, beyond the brief: the map's box is cream underneath, so dark mode doesn't flash black before the map draws. The dark-mode trick that inverted the map credits' "i" button is gone, since the credits are always light now.

### Test cases

1. **[verified]** New acceptance test `[S-139]`: with the phone in dark mode, the map's land and water are the new cream and blue. Its amber, green and gold are the light-mode ones, and the rest of the page is still dark.
2. **[verified]** The other map and Home acceptance tests pass locally (3 that failed in the long run passed when run again on their own).
3. **[verified]** In the browser at phone size, with the phone set to dark: the map is cream from the first frame, water is blue, and the buttons around it stay dark. Console clean.
4. **[needs your phone]** On staging, set your phone to dark mode and open the Map. It's light, and you can see the Sound and the coast.
5. **[needs your phone]** Find a golden thread. It glows gold on the light map.
6. **[needs your phone]** Open Home. The "Near you" map is light too.
7. **[needs your phone]** Set your phone back to light mode. The map looks the same, and warmer than before.
