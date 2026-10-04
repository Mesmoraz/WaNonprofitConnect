## 2026-09-28 · Full review: times, errors, one thread per post, live updates, a lighter first load

**Story:** S-103. From Taylor: a full review and QA pass, comparing the mission, the roadmap, and the app. Follow-ups are S-104 to S-109, each waiting on a brief.

### What changed

- **Times read right.** The server sent UTC times without saying so, so phones in Washington read every new message and post as 7 hours in the future ("1m" for 7 hours, every age off by 7 hours).
- **A failed action says why.** Post, I can help, Accept, Mark done, and Send show the server's sentence (for example "Urgent is 2 a month. Pick This week instead.") instead of only "That didn't work. Try again."
- **One thread per post.** Tapping I can help again on a post you already have a thread on adds your message to that thread. It no longer makes a second thread and a duplicate post. I can help stays grey until you write a message or pick one of yours.
- **Live messages survive a sleeping phone.** The connection used to give up after about 42 seconds offline. Now it keeps trying and catches up on an open thread.
- **Faster first visit.** The map loads when you open it. The sign-in screen needs about 430 KB of code instead of 2.2 MB.
- **Board.** An empty board says "Nothing here yet. Post the first one?" (it used to say "Nothing here with those filters" with no filters set). Search results open the organization. Posts that aren't open say Done, Closed, or In a thread, never Fulfilled or Matched. Cause names are in sentence case ("Food", "Arts and culture").
- **iPhone.** The extra empty band above the tab bar, under pinned buttons and the message box, is gone.
- **Server.** Long details no longer cause a server error. Accepting needs both posts still open. Cancelling never puts a closed post back on the board. When two people redeem the last use of an invite code at once, only one of them gets it.
- **Admin.** New invite codes show first. Approve and Not this one say so if they fail.

### Needs your approval

- The server's error sentences, rewritten in the voice. The full list (old to new) is in the chat for this round and under S-109.

### Test cases

1. **[verified]** Send a message in a thread. Under it: "Casey · 1m", not a time 7 hours off.
2. **[verified]** Open a post you have no thread on. I can help is grey until you type a message.
3. **[verified]** Start a thread, then do it again on the same post. You land in the same thread.
4. **[verified]** Board, type "food bank" in Search everyone here, tap a result. The organization's page opens.
5. **[verified]** The map still loads, with dots, clusters, and the golden thread.
6. **[needs your phone]** On an iPhone, the Post need button and the message box sit right on the tab bar, with no empty band.
7. **[needs your phone]** Open a thread, lock the phone for 2 minutes, unlock. A message sent meanwhile from another account shows without a reload.
8. **[needs your phone]** On the board, a brand-new organization with nothing posted sees "Nothing here yet. Post the first one?"
