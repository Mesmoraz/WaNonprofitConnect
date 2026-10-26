## 2026-10-25 · Every dot on the map is a Washington organization, and the map says so (S-143)

**Story S-143,** built to the brief in docs/ALPHA-BRIEFS.md ("Every dot is a Washington organization"), approved Oct 25 (PR #59). It came from Taylor the same day: the dots should plainly be every Washington nonprofit at the address on its EIN record; "it just looks messy".

### What changed

- **The map says what the dots are.** Under the kind-of-help chips, a quiet pill: a dot, then "1,204 organizations in view · IRS addresses". The count follows the map as you pan and zoom.
- **Zoomed out, the state fills in.** The dots are larger and lighter, so they add up into soft shading where organizations are. Before, each one was 1 pixel and the state looked empty.
- **Zoomed in, each dot is its own.** A solid blue-grey dot with a thin cream edge, so 3 at one address read as 3, not a blot.
- **Pins have a white center; dots are solid.** An organization here with nothing open was a solid grey pin, the same look as a dot. It's now a white center with a grey ring.
- **The legend leads with the dot:** "Every Washington organization, at the address on its IRS record." The old "A faint dot is any Washington nonprofit." goes.
- **Home's small map** gets the same dots.
- **One token changes:** `--map-dot` is #6E7F96 (was #5E6B78).

### Test cases

1. **[verified]** New acceptance test `[S-143]`: the pill counts organizations in view (all of them on the whole state, 0 out over the Pacific), and the legend's first line is the dot.
2. **[verified]** The other map acceptance tests pass locally (map, legend, open in view): 11 of 11. The first run timed out on a cold local server; all 11 passed run again.
3. **[verified]** In the browser at phone size: the whole state reads "25,781 organizations in view · IRS addresses" with soft shading along I-5 and around Spokane; Seattle at city zoom reads "3,137 organizations in view"; up close each dot has its cream edge; Solid Ground's pin has a white center; Home's small map shows the same dots.
4. **[needs your phone]** On staging, open the Map. Under the chips you see the dot and "organizations in view · IRS addresses".
5. **[needs your phone]** Pinch in on your neighborhood. The count drops as you zoom, and the dots separate into single dots.
6. **[needs your phone]** Find a pin with nothing open. It has a white center and a grey ring, not a solid grey dot.
7. **[needs your phone]** Tap the ? . The first line is the dot: "Every Washington organization, at the address on its IRS record."

