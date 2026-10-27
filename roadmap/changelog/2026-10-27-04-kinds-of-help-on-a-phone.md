## 2026-10-27 · Every kind of help shows on a phone (S-124)

### What changed

- **The Board's kinds of help wrap onto a second line instead of running past the edge.** On a phone, "Jobs and mentoring" and "Partnership" sat off the screen in a row that scrolled sideways with no scrollbar, so nothing said they were there. Now all seven (All, then the six kinds) show at once: five on the first line, two on the second.
- **The map's Filter chips do the same,** wrapping onto as many lines as they need.
- No words change.

### Test cases

1. **[verified]** New acceptance test `[S-124]`: on a 360 px wide phone, every Board tab and every map Filter chip ends inside the screen. The Board and Map tests pass.
2. **[verified]** Checked in screenshots at 360 px: the Board's tabs on two lines with the green line under the one picked, the map's chips on three lines above the map.
3. **[needs your phone]** On staging, open the Board: you can see Jobs and mentoring and Partnership without swiping. Tap one and its posts show.
4. **[needs your phone]** Open the Map, tap Filter: every chip shows, none cut off.
