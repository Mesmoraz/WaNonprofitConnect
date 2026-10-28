## 2026-10-28 · Golden thread art on the empty board, the empty inbox and a golden thread (S-150)

Taylor, Oct 28: "can we add some of the art?" Brief approved in chat ("Approve, use both").

### What changed

- **The needle and pin** sits above "Nothing here yet." on an empty Board and above "No threads yet." on an empty Inbox: small, centered, with rounded corners so the cream square reads as a picture in dark mode too.
- **The two houses joined by a gold line** runs as a banner across a golden thread, above "Done. This is a golden thread. See it on the map".
- Both are decoration (`alt=""`), so screen readers skip them; the words beside them say it. No words changed.
- Each picture is shrunk to the size it shows at: the needle and pin is 4 KB (inlined in the app), the banner 29 KB.
- The two houses still read dark red; a rerun with cream houses swaps in later (`design/art/README.md`). Not in this round: the hands and crate, Puget Sound at dusk, the app icon.

### Test cases

1. **[verified]** The golden thread acceptance test (S-18) sees the banner on a golden thread, with empty alt text.
2. **[verified]** On a fresh database (as on GitHub), the empty Inbox and the empty Board show the needle and pin.
3. **[verified]** Screenshots at phone size, light and dark.
4. **[needs your phone]** On staging, open a golden thread: the map banner shows above "Done. This is a golden thread."
5. **[needs your phone]** On staging, sign in as an organization with no threads and open the Inbox: the needle and pin above "No threads yet."
