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
  - Things: Laptops, Food, Clothing, Furniture, Supplies, Auction items (S-117, Taylor, Oct 14)
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

## Welcome card (moves to Home, S-126)

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
- Picks your organization saved still apply while the board is small (Taylor, Oct 7). The "Showing everyone" line shows only when nothing is picked.

## Admin: waiting on someone (S-116)

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

## A closed thread says so (S-104, built)

- **For:** a declined or closed thread goes silent today, and the message box just disappears.
- You said not this time: "You said not this time. Their post stays on the board."
- They said not this time (approved, unchanged): "{org} said not this time. Your post stays on the board."
- Closed (a post was closed, or the thread was cancelled): "This thread is closed. Find another on the board?" ("the board" is the link.)
- In the inbox, the status word for both: "Closed".
- The message box stays hidden; the messages so far stay readable.

## What the map shows (S-105, built)

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

---

# Admin numbers brief (S-100, proposed Oct 7, waiting for approval)

Approving the pull request that adds this approves every word below. Edit any line in the review.

## How it's going (Admin)

- **For:** the six measures in `docs/PLAN.md`, section 6, so we learn how the alpha is going without asking anyone. Only admins see it.
- **Where:** the first section on Admin, above "Try it as someone new". Label: "How it's going".
- A line of totals first: "{n} posts · {n} threads started · {n} accepted · {n} golden".
- Then six rows. Each has the number, large, then what it counts, then its goal in grey:
  1. "2" · "Golden threads in October" · "Goal: 3 by Oct 31". The month is the current one. After October the goal line reads "Goal: 3 a month".
  2. "4 of 12" · "Posts that got a thread within 14 days" · "Goal: 1 in 3"
  3. "5 hours" · "Typical wait for a first answer" · "Goal: under a day". The wait runs from "I can help" or "I need this" to the other organization's first message or yes. "Typical" is the middle one: half answer faster, half slower. Shown as minutes, hours or days ("40 minutes", "5 hours", "2 days").
  4. "3 of 8" · "Threads that became golden" · "Goal: half"
  5. "6 of 9" · "Organizations that posted a need and an offer in their first week" · "Goal: 8 in 10"
  6. "2 of 9" · "Organizations that have both given and received" · no goal line. This is help moving both ways.
- A row with nothing to count yet shows "None yet" in place of the number. Other rows still show.
- Line under the rows: "Counts real organizations only. The demo isn't counted."
- **Stays:** everything else on Admin, in the same order below this.
- **Goes:** nothing.

### Questions for you

1. **Counting while it's new.** Row 2 counts a post once it's 14 days old, or sooner if it already has a thread. Row 5 counts an organization once its first week is over, or sooner if it has already posted both. Otherwise the first two weeks would show "0 of 0". OK?
2. **Your own test threads.** Threads you make with "Test as this organization" count like anyone's. Should they be left out? Leaving them out also hides real threads at an organization you once tested as.
3. **Which threads count in row 4.** I'd count threads that are done, plus those still open after 30 days. That way a thread started yesterday doesn't count against us. Declined and closed threads count as not golden. OK?

---

# The rest of Phase A (proposed Oct 7, waiting for approval)

Approving the pull request that adds these approves every word below. Each one is built in its own pull request afterwards. Edit any line in the review.

## Your organization (S-99 and S-95, a new screen)

- **For:** before saying yes to a stranger, people want to know who they are (S-99). The alpha also promised up to three people per organization, and today only Taylor can add them (S-95).
- **Where:** in your name menu as **Your organization**, above "Send feedback". Only people confirmed for an organization see it.
- Headline: the organization's name. Under it, the same line as its page: "Seattle · Food · EIN 91-1428805".
- Label "About you".
  - Field "What you do", placeholder "We run a food bank and a free store in Ballard.", 140 characters. Hint: "One line. Others see it on your page."
  - Field "Website", placeholder "yourorganization.org". Optional.
  - Field "Who to ask": chips with the first name of each person here. Pick one. Hint: "Others see the name, not the email. Messages still go through threads."
- Pinned button: **Save**. Toast: "Saved."
- Label "People here": each person as "{name} · {email}", with "(you)" after yours. Only people at the organization see this list.
- Label "Invite someone". Line: "Up to 3 people can be here. {n} left." Plain button **Make a code**. The code shows large, with the line "Send it to them yourself. It works once." Tap the code to copy it: toast "Copied." Once 3 people are here: "All 3 places are taken." and no button.
- **On the organization's page** (what everyone else sees), under the name and its line: the "What you do" line, then the website as a link, then "Ask for {first name}". Anything not filled in is left out.
- **Find yours:** "Already on {name}. Ask a member to invite you." becomes "Already on {name}. Ask someone there for an invite code."
- **Stays:** the organization's page as it is, with "Needs and offers" below the new lines.
- **Goes:** nothing.

### Questions for you

1. Does 3 people include the person who joined first? I'd say yes: 3 in all, as the recruiting note says. Codes you make on Admin can still go past 3.
2. Should "What you do" also show on each post, under the organization's name? I'd keep it to the organization's page for now, so the board stays three lines a card.

## Edit a need or offer (S-97)

- **For:** today the only way to fix a typo or a count is to close the post and post again, which loses its threads.
- **Where:** on your own post that's still on the board, a plain button **Edit this need** / **Edit this offer**, above the red close button. It doesn't show on a post that's closed or done.
- It opens the Post screen filled in. Headline: "Edit your need" / "Edit your offer". The "We need" / "We have" chips don't show: a need stays a need.
- Everything else can change, with the same words as Post.
- Pinned button: **Save changes**. Toast: "Saved." Then back to the post.
- If threads are open on it: line above the button "1 thread is open on this. They'll see the change." (With more: "2 threads are open on this. They'll see the change.")
- On the post, after an edit, the line under the headline reads "Seattle · Posted 2 days ago · Edited".
- **Why Urgent is greyed out** (on Post and Edit both, from S-109): when you've used Urgent twice in 30 days, the hint under "How soon" reads "You've used Urgent twice this month. You can use it again on Oct 21." instead of "Urgent is 2 a month, so it keeps meaning you can't operate without it."
- **Goes:** nothing.

## Small lines (the rest of S-109)

- On an offer, the message box placeholder: "Say what you'd use it for and when." (Was "Say what you can do and when.", which fits a need, not an offer.)
- Invite code, a wrong code: "That code didn't work. Check it and try again." Approve as it is.
- Invite code, anything else going wrong: "That didn't work. Try again." Approve as it is.
- When the app can't find out who you are at start: "That didn't work. Try again" ("Try again" is the link). Approve as it is.
- Server error sentences (for example "Urgent is 2 a month. Pick This week instead.") stay as they are for now. They get a brief of their own once the alpha shows which ones people actually see.

---

# Home (S-126, approved Oct 19)

Approved by Taylor 2026-10-19 in chat, as written. Built in its own pull request afterwards.

## Home (a new first tab)

- **For:** a calm place to land and re-center. It shows where you stand and puts the Board, the Map, or a thread waiting on you one tap away. It puts the next possible golden thread in front of you.
- **Where:** a new first tab. Tabs: Home, Board, Map, Post, Inbox. `/` is Home; the Board moves to `/board`. The logo goes to Home. A link opened before signing in still lands where it pointed (S-107).
- No green button. Home is for finding your way, not one action; Post is one tap away in the tabs. (An approved exception to voice rule 6.)
- **Your organization:** your name, then "Spokane · Food". One line: "2 needs, 1 offer open · 3 golden threads" with the link "Your page" (your organization's page). Without an open need or an open offer, the Welcome card shows here instead of that line, with its approved words.
- **Waiting on you:** heading "Waiting on you". Up to 3 threads where the next step is yours, each with one line under its title: "{Org} started a thread" or "1 new message". Tap opens the thread. With none: "Nothing waiting on you."
- **Near you:** heading "Near you". A small live map around your organization, about 25 mi each way: your pin, every nonprofit as a faint dot, organizations here as pins, and their threads. It doesn't pan or zoom on Home, and it loads after the rest of Home. Tap opens the Map on the same place. Line: "12 organizations, 2 golden threads within 25 mi. Open the map" (Changed by Taylor Oct 19, after seeing the still picture on staging: "I'd rather it truly be a live map that's small of a radius around the organization.")
- **New this week:** heading "New this week". The 3 newest needs and offers from the last 7 days that pass your "Who they serve" filter, as short board cards. Link "See the whole board". With none: "Nothing new this week. See the whole board?" ("See the whole board" is the link.)
- **On the board:** heading "On the board". Up to 5 quiet rows, each opening the Board already filtered, the count first: "4 needs you could meet" (from the map's suggested pairs for your offers), your cause ("78 posts from food organizations"), the busiest kinds of help ("78 posts under Things"), "2 urgent needs", and "12 posts that match your filters". A row with nothing behind it doesn't show. (Was "Go to" with chips like "Food · 6"; changed by Taylor Oct 19: "a little unclear as to what that means exactly and why they are there".)
- **Stays:** the Board, Map, Post, and Inbox as they are.
- **Goes:** the Welcome card from the top of the Board (it moves to Home).

---

# Map threads, one line per pair (S-127, approved Oct 19)

Approved by Taylor 2026-10-19 in chat, as written. Taylor, on seeing Home's small map: "instead of adding MORE lines we make the lines look different if there are multiple connections."

- **For:** the map reads at a glance. Several threads between the same two places are one line that looks fuller, not more lines.
- **One line per pair.** Every thread between the same two places is one curve, in the color of the furthest along: golden, then in progress, then started, then could fit.
- **More threads, a juicier line:** thicker with each thread up to 5; small bright sparks run along it, one per thread up to 5, from the one giving to the one receiving; a golden pair glows stronger the more golden threads it has.
- **A number on the line** when there's more than one: a small round badge in the middle, "4".
- **Confetti when a thread turns golden** while you're looking at the map: a short burst of gold confetti at both pins. None when the phone asks for reduced motion.
- **Tapping a line with a number** opens a card "{Org A} and {Org B}" with one row per thread: its title and where it stands (Golden, In progress, Waiting for a yes, Could fit). Tap a row to open it. (Where an end is a cluster, the tap opens the cluster, as tapping the cluster does.)
- **Legend:** one new line, "A thicker line with a number is several threads between the same two places."
- **Home's small map** gets the same look; it's the same map.

# The map shows what's open (S-129 approved Oct 20; S-131 and S-130 to follow)

Taylor, Oct 20: "I want the map to also be a place where people can intuitively see where there are available offers and available needs to be picked up. ... all of the threads make it seem like all needs and offers are completed. I think a thread should ONLY exist if the thread is being met and is complete." And: a toggle to "find offers that might suit your need" and "find needs that you can fulfill" that draws temporary threads for your view. "The map needs to be made to be more usable and visually striking."

Taylor's answers, Oct 20: (1) "threads should only be shown as complete": on the map, a line is a golden thread; the voice sheet's words stay. (2) Your own threads that are underway "should appear maybe as faint lines". (3) "Help with is great." (4) The strip and the filter are a story of their own (S-131).

Checked against the mission: Need → Match → Golden Thread → Action → Impact. Today the map shows the third step and hides the first. This puts the needs and offers back on the map, and keeps the gold for help that was given.

## S-129: Pins show what's open, lines are golden only (map lane, with a small backend change). Approved Oct 20

- **For:** see at a glance where help is wanted and where it's on offer, near you.
- **The one action:** tap a pin with something open and see what it is.
- **Pins say what's open.** A pin is a ring: the amber part is open needs, the green part is open offers, in proportion. Bigger with more open posts (up to 6). An organization with nothing open is a small grey pin. A cluster is the same ring for everyone inside it, with the count in the middle.
- **Lines are golden threads only.** Other organizations' started and in-progress threads are no longer drawn. Neither are the "Could fit" lines the map draws for everyone today.
- **Your own threads that are underway** show as faint, thin lines from your pin, so you can still find them. Tap one to open it as today.
- **Golden threads keep their glow**, sparks, number and confetti (S-127), and the base map gets a little quieter so they stand out more.
- **Tapping a pin:** the card says "{n} needs · {n} offers · {n} golden threads" and lists the open posts, then "See their needs and offers" as today.
- **Legend, rewritten:**
  - "What the map shows"
  - [amber ring] "Amber is open needs."
  - [green ring] "Green is open offers."
  - [gold line] "A golden thread. Help that was given."
  - [faint line] "Your threads that are underway."
  - "A bigger pin has more open. A faint dot is any Washington nonprofit."
- **Backend:** `MapData` gets `open`: for each organization with open posts, how many needs and how many offers.
- **Goes:** started, in-progress and "Could fit" lines on the shared map; the four-line legend.
- **Stays:** clusters, faint dots, your amber-ringed pin, golden glow, sparks, numbers, confetti. Home's small map gets the same pins.

## S-131: What's open in view (map lane and backend), after S-129

- **A strip at the top:** "14 needs · 9 offers in view". Tap it and a list slides up: one row per open post in view, nearest first. Each row: kind of help chip, title, organization · city. Tap a row to open the post.
- **Kind of help filter:** chips under the strip: All, Time, Skills, Things, Partnership, For schools, Jobs and mentoring. One at a time. Pins, the strip and the list follow it.
- **Backend:** `GET /api/v1/map/open` returns the open posts with each one's place and kind of help, for the strip, the list and the chips.

## S-130: Find what fits you (map lane and backend)

- **For:** see, on the map, who could help with your needs and whose needs you could help with.
- **The one action:** turn on a toggle and tap a line.
- **Two toggles** sit above the map's bottom edge, only when your organization has something open:
  - "Offers for your needs"
  - "Needs you can help with" (Taylor, Oct 20: "help with is great")
  - One on at a time. Tap again to turn it off.
- **When one is on:** thin dashed lines run from your pin to each organization that fits, up to 12, best fit first. Green dashes for an offer coming to you, amber for a need you could meet. Your pin pulses. Everything else on the map dims. The lines go when you turn it off. Nobody else sees them.
- **A card slides up:** "5 offers could fit your needs" (or "4 needs you could help with"). One row per fit: their post's title, organization · city · miles, and which of your posts it fits ("For your: Winter coats"). Tap a row or a line to open their post, where "I can help" or "I need this" starts a thread as today.
- **Empty:** "Nothing fits your needs yet. We'll tell you when something does." (Only if we keep that promise. Otherwise: "Nothing fits your needs yet. Check the board?" with "Check the board" as the link.)
- **No open posts:** the toggles aren't there. The strip at the top still works.
- **Your own threads** stay faint while a toggle is on.
- **Backend:** `GET /api/v1/map/fits?for=needs|offers` returns pairs for your organization: your post, their post, their EIN, score. Same scoring as a post's "Could fit" today.
