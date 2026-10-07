## 2026-10-07 · A closed thread says so

**Story:** S-104. Brief approved by Taylor in PR #17 (Phase A briefs). Also marks T-57 (security headers) done: they shipped in PR #13, and staging sends them.

### What changed

- If you say not this time, your thread reads "You said not this time. Their post stays on the board." Before, it went silent.
- The other side still reads "{org} said not this time. Your post stays on the board."
- When a post is closed, its threads that are still waiting or in progress close too. Each reads "This thread is closed. Find another on the board?", and "the board" goes there. If one of those threads had taken the other organization's post off the board, that post goes back on.
- In the inbox, declined and closed threads both say "Closed".
- The message box stays hidden on a closed thread. The messages so far stay readable.

### Why

A declined or closed thread used to go quiet: no line, and the message box just disappeared. Before this change, closing a post also left its threads open, so people kept writing into a thread for something that was gone.

### Test cases

1. **[verified]** Decline a thread: "You said not this time. Their post stays on the board.", no message box, and the first message still shows. The inbox row says "Closed".
2. **[verified]** The side that started it reads "{org} said not this time. Your post stays on the board."
3. **[verified]** Close a post that has a thread: the other side reads "This thread is closed. Find another on the board?", with no message box, and the inbox says "Closed". "the board" opens the board.
4. **[verified]** In the service test, closing a post cancels a waiting thread and an in-progress thread, puts the helper's offer back on the board, and leaves a thread on another post alone.
5. **[needs your phone]** On staging, close one of your posts that has a thread. Open that thread from the inbox and check the line and that the message box is gone.
