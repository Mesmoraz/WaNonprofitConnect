## 2026-10-07 · No known vulnerabilities in the app's packages

**Task:** T-231, from the Oct 2 security review (L10). Also marks T-67 done: the lint tool works again (it runs clean since the Node upgrade). Nothing a person sees changes.

### What changed

- Removed `@deck.gl/geo-layers`. The map never used it, but it brought in the code behind 12 of the 13 audit warnings (malformed ZIP and image files).
- Took npm's non-breaking fix for `source-map-js`, which only runs while the app is built.
- `npm audit` now finds 0 vulnerabilities, counting build tools.

### Test cases

1. **[verified]** `npm audit`: found 0 vulnerabilities.
2. **[verified]** Typecheck, lint and the build pass. All 28 acceptance tests pass, the map's included.
3. **[needs your phone]** On staging, open the map. It draws with the threads, pins and dots as before.
