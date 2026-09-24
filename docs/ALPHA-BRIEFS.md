# Alpha screen briefs

Approved by Taylor 2026-09-23, as written. Build exactly this. Anything else a screen needs gets briefed first.

## Invite code

- Headline: "Your invite code"
- Line: "It came in the message that invited you."
- Field label: "Invite code". Button: **Join**
- Link: "No code? Find your organization"

## Waiting

- Headline: "We'll check and let you know"
- Line: "Someone will confirm you belong to {org} within a day."
- No button.

## B6 A need or offer

- Top line: "Need · Things" (kind and kind of help). Add "Urgent" or "This week" if set. For repeating posts add "Every week", "Every month", "Every quarter", or "Ongoing"; nothing for one-time.
- Headline: the post's title. Under it: the organization's name, then "Seattle · Posted 2 days ago".
- Quantity ("12 laptops"), then the details.
- Label "Yours that fit": your open posts of the opposite kind that pair with this one; tap one to use it. None: "Nothing of yours fits yet. You can still help." On an offer: "Nothing of yours fits yet. You can still ask." (Taylor, 2026-09-23)
- Field "Message to {org}", placeholder "Say what you can do and when."
- Pinned button: **I can help** (on a need) or **I need this** (on an offer). Afterwards toast "Thread started. {org} will see it in their inbox." and open the thread.
- Already a thread with you on this post: button **Open your thread**.
- Your own post: button **Close this need** / **Close this offer**, line "Closed posts leave the board.", and instead of "Yours that fit": label "Offers that could fit" / "Needs that could fit", line "Open one to start a thread.", none: "Nothing fits yet. It’s on the board, so anyone can find it." (Taylor, Sep 24: the "Could fit" list was unclear and matched the wrong things. A fit now needs a word in common, not just the same kind of help.)
- Gone from the prototype: match scores, "Let's collaborate", category, tags.

## B7 Post

- Chips "We need" / "We have". Headline follows: "What do you need?" / "What do you have?"
- Label "Kind of help": Time, Skills, Things, Partnership, For schools, Jobs and mentoring.
- Field "What is it?", placeholder follows the kind of help, from TAXONOMY.md's "A need sounds like" / "An offer sounds like" columns (for example "Laptops for client intake").
- Field "Details", placeholder "Condition, pickup or delivery, dates."
- "How many", hint "Just the number, if it matters." No "Of what" (Taylor, Sep 23: the title already says what it is). A count with no unit shows as "12 needed" or "12 to give".
- Needs only, "How soon": Urgent, This week, This month, Whenever. Hint: "Urgent is 2 a month, so it keeps meaning you can't operate without it." Urgent is disabled once the organization has used 2 in the last 30 days.
- "How often": Once, Every week, Every month, Every quarter, Ongoing.
- Button **Post need** / **Post offer**. Toast "Posted. It's on the board now." Then open the post.
- Gone: tags, category, live match-score preview.

## B8 Thread

- Headline: the other organization's name.
- Two lines: "Need: {title} · {org}" and "Offer: {title} · {org}".
- One status at a time:
  - You started it, not answered: "Waiting for {org} to accept."
  - They started it: **Accept** (green), "Not this time" (plain).
  - Accepted: "You're on. Work out the details here." and **Mark done**, which asks "Mark this done? Both posts close." with **Mark done** / "Not yet".
  - Done: "Done. This is a golden thread."
  - Declined: "{org} said not this time. Your post stays on the board."
- Messages with "Casey · 2h" under each. None: "No messages yet. Say hello."
- Composer placeholder "Write a message", button **Send**.
- Gone: match score, standing agreements (Beta).

## B8 Inbox

- Headline "Inbox".
- Each row: organization name, "Their need · 12 laptops", a status word (Waiting on you · Waiting on them · In progress · Golden), an unread dot, the time.
- Waiting on you first, then newest activity.
- None: "No threads yet. Find a need on the board you can help with." with "the board" as the link.
- No alerts section in the alpha.

## Map detail card

- An organization: name, then "Seattle · 3 threads".
- A thread: "{giver} → {receiver}", then "Things · In progress". If it's yours, **Open thread**.

## Admin

Approved by Taylor 2026-09-23.

- Opens from your name menu as **Admin**. Only admins see it, and it works before you belong to an organization.
- Headline "Admin".
- Invite codes: field "Find the organization", field "How many people" (3 by default), button **Make code**. Each code shows large, with "{org} · 1 of 3 used". Tap a code to copy it: toast "Copied."
- Waiting for you: each claim shows "{name} · {email}", the organization, then "Seattle · Sep 23", with **Approve** and "Not this one". None: "No one is waiting."
