## 2026-10-07 · Every screen says something while it loads or fails

**Story:** S-106. Brief approved by Taylor in PR #17 (Phase A briefs).

### What changed

- The board, inbox, a post, a thread, an organization's page and the map each say "Waking up. The first visit in a while can take a minute." if they're still loading after 2 seconds. Before, only the very first screen did, and the rest stayed blank.
- A post that's gone says "This post is gone. Back to the board?", and "Back to the board" goes there.
- A thread that's gone, or isn't yours, says "This thread is gone. Back to your inbox?", and "Back to your inbox" goes there.
- When the map doesn't load: "The map didn't load. Try again?" Tapping "Try again" draws it.
- An organization's page that doesn't load still says "That didn't work. Try again", as approved.

### Test cases

1. **[verified]** With the inbox held back 3.5 seconds: nothing for the first 2 seconds, then the waking-up line, then the inbox.
2. **[verified]** Open a post that doesn't exist: "This post is gone. Back to the board?" Tap the link to land on the board.
3. **[verified]** Open a thread that doesn't exist: "This thread is gone. Back to your inbox?" Tap the link to land on the inbox.
4. **[verified]** Open a thread between two other organizations: the same "This thread is gone" line.
5. **[verified]** With the map's data failing: "The map didn't load. Try again?" Then Try again draws the map.
6. **[needs your phone]** On staging after it has been quiet for an hour, open the app and tap through Board, Map and Inbox. Each says "Waking up" instead of staying blank.
7. **[needs your phone]** On staging, close one of your posts, then open its old link. It still opens and shows as closed, not as gone.
