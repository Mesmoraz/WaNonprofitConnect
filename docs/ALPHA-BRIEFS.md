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
- Your own post: red button **× Close this need** / **× Close this offer**, which asks "Close this need?" / "Close this offer?", "It comes off the board, and you can’t open it again.", with **Close need** / **Close offer** (red) and "Keep it"; then toast "Closed. It’s off the board." (Taylor, Sep 24), line "Closed posts leave the board.", and instead of "Yours that fit": label "Offers that could fit" / "Needs that could fit", line "Open one to start a thread.", none: "Nothing fits yet. It’s on the board, so anyone can find it." (Taylor, Sep 24: the "Could fit" list was unclear and matched the wrong things. A fit now needs a word in common, not just the same kind of help.)
- Gone from the prototype: match scores, "Let's collaborate", category, tags.

## B7 Post

- Chips "We need" / "We have". Headline follows: "What do you need?" / "What do you have?"
- Label "Kind of help": Time, Skills, Things, Partnership, For schools, Jobs and mentoring.
- "What is it?" (S-111, Mario's feedback, Sep 26: "Free text should be minimal or discrete"). Shows once a kind of help is picked, as chips. The chip is the title.
  - Time: Driving, Event help, Sorting and packing, Tutoring, Office help
  - Skills: Bookkeeping, Legal help, Tech help, Design, Marketing
  - Things: Laptops, Food, Clothing, Furniture, Supplies
  - Partnership: A sponsor, Staff volunteer day, Event partner, Shared space
  - For schools: Guest speakers, Field trips, Classroom supplies, Tutoring
  - Jobs and mentoring: Mock interviews, Mentors, Job openings, Apprenticeships
  - Last chip on every row: "Something else", which opens a text box (80 characters) with the placeholder from TAXONOMY.md's "A need sounds like" / "An offer sounds like" columns.
- Details are optional and folded away: a link "Add details" after How often opens the box (placeholder "Condition, pickup or delivery, dates.", 280 characters) with the hint "The rest you can work out in the thread."
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

## Who they serve (board filter)

Approved by Taylor 2026-09-24. Round one of S-88.

- In the board's Filters, under "What": label "Who they serve", 12 chips: Children and youth · Education · Food · Housing · Health · Families · The elderly · Veterans · Communities facing barriers · Environment · Animals · Arts and culture.
- Line: "Set from your organization’s cause code. Tap to change."
- Chips start from your organization's IRS cause code. A post shows if its organization serves a group you picked; nothing picked shows everything. Organizations with no listed group count as outside your filters (Taylor, Sep 24: they had always shown, and laptops appeared under Food).
- At the bottom when posts are hidden: "{n} more outside your filters. Show them".
- "Clear filters" clears these too. The map isn't filtered yet. Picks are saved to your organization, shared by everyone there; an admin can set them. When a cause code gives no group (none, or one like T70 "federated giving"), the organization's name is read instead: "Food bank" is Food, "PTA" is Education, and so on.

## Welcome card

Approved by Taylor 2026-10-02 (PR #6, merged). Built in the welcome-card PR.

- **For:** the alpha asks each organization to post one need and one offer. A newly joined organization lands on the board with only a toast. This says what to do first, and it's the first place anyone is told what a golden thread is.
- **Where:** a card at the top of the board. It shows for a confirmed organization with no open need or no open offer, however it joined (invite code or approved claim). It keys off your posts, so it goes away once you have both.
- Headline: "Start with one need, one offer"
- Line: "Post one thing you need and one thing you could give. When another organization helps, it becomes a golden thread on the map." ("the map" links to the Map tab.)
- Nothing posted yet: **Post a need** (green) and **Post an offer** (plain). Need posted: only **Post an offer** (green). Offer posted: only **Post a need** (green).
- **Post an offer** opens Post with "We have" picked; **Post a need** with "We need".
- Link "Not now" hides it on this device. It never comes back once both posts exist.
- Stays: the "You're in. Welcome, {org}." toast, and "Nothing here yet. Post the first one?" under the card on an empty board.
- Goes: nothing.

---

# Phase A briefs (proposed Oct 4, waiting for approval)

Approving the pull request that adds these approves every word below. Each one is built in its own pull request afterwards. Edit any line in the review.

## Who they serve, while the board is small (S-108)

- **For:** with 10 organizations, a filter set from your cause code hides most of the posts the alpha needs you to see.
- While the board has **fewer than 30 open posts**, "Who they serve" starts with nothing picked, so you see everything. Picks your organization saved are kept.
- The line under the chips changes, only while the board is small: "Showing everyone while the board is small. Tap to narrow it." (Was: "Set from your organization's cause code. Tap to change.", which comes back at 30 posts.)
- Stays: the 12 groups, saving to your organization, "{n} more outside your filters. Show them".

## Admin: waiting on someone (new story)

- **For:** until email notices exist, Taylor nudges by hand. This shows who to nudge.
- On Admin, under "Waiting for you", label "Waiting on someone".
- A thread shows here when it has waited **2 days** for a yes, or has been accepted with no message for **7 days**.
- Each row: the thread's title, then "{organization} hasn't answered · 3 days" or "Quiet since Sep 30", then the people at the organization it's waiting on, "{name} · {email}". Tap an email to copy it: toast "Copied."
- None: "Every thread is moving."

## Loading and error lines (S-106, built)

- **For:** a blank screen on a slow phone looks broken.
- Any screen still loading after 2 seconds shows the approved line: "Waking up. The first visit in a while can take a minute."
- The map doesn't load: "The map didn't load. Try again?" ("Try again" is the link.)
- A post that's gone: "This post is gone. Back to the board?" ("Back to the board" is the link.)
- A thread that's gone, or isn't yours: "This thread is gone. Back to your inbox?" ("Back to your inbox" is the link.)
- An organization's page that doesn't load: "That didn't work. Try again" (the approved line, as on the board).

## A closed thread says so (S-104)

- **For:** a declined or closed thread goes silent today, and the message box just disappears.
- You said not this time: "You said not this time. Their post stays on the board."
- They said not this time (approved, unchanged): "{org} said not this time. Your post stays on the board."
- Closed (a post was closed, or the thread was cancelled): "This thread is closed. Find another on the board?" ("the board" is the link.)
- In the inbox, the status word for both: "Closed".
- The message box stays hidden; the messages so far stay readable.

## What the map shows (S-105)

- **For:** the map is the payoff, and nothing on it explains the lines.
- A round "?" button at the top of the map, labelled for screen readers "What the map shows". The first time you open the map, the card opens by itself.
- Card headline: "What the map shows"
  - Gold, glowing: "Golden thread. Help that was given."
  - Green: "In progress. They're working it out."
  - Amber, dashed: "Started. Waiting for a yes."
  - Grey, dotted: "Could fit. A need and an offer that might go together."
  - "The dashes run from the one giving to the one receiving."
  - "A pin is an organization here. A faint dot is any Washington nonprofit."
- Button: **Close**.

## Email when something waits on you (S-94)

- **For:** threads stall when no one knows they were started.
- Sent by Azure's email service from its own address, shown as "Helpbook". No domain needed. It costs about $0.25 per 1,000 emails; the alpha would send a few hundred a month at most.
- **Someone starts a thread with your organization.** To each person at your organization. Subject: "{org} can help with {title}" on your need, or "{org} would like {title}" on your offer. Body: their first message, then the button **Open the thread**.
- **A new message you haven't seen for an hour.** Subject: "New message from {org}". Body: the message, then **Open the thread**. At most one per thread every 6 hours.
- **They said yes.** Subject: "{org} said yes to {title}". Body: "Work out the details in the thread." then **Open the thread**.
- **You're approved.** Subject: "You're in at {org}". Body: "Post one need and one offer to start." then **Open Helpbook**.
- Footer on every email: "You get these because you're with {org} on Helpbook." then the link "Stop these emails", which works in one tap, no sign-in.
- Links open the right screen, through sign-in if needed (S-107).
- The privacy page gets one line: "We email you when something waits on you. You can stop the emails from any of them."
