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

# Admin numbers brief (S-100, approved with PRs #26 and #28; questions answered Oct 27)

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

**Taylor's answers (Oct 27):** yes to all three as proposed. 1: wait before counting young posts and organizations. 2: leave out threads an admin started (each thread now records who started it; threads from before Oct 27 still count). 3: count done, declined, cancelled, and threads open over 30 days.

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

## S-131: What's open in view (map lane and backend). Approved Oct 21 (Taylor: "Start S-131")

- **A strip at the top:** "14 needs · 9 offers in view". Tap it and a list slides up: one row per open post in view, nearest first. Each row: kind of help chip, title, organization · city. Tap a row to open the post.
- **Kind of help filter:** chips under the strip: All, Time, Skills, Things, Partnership, For schools, Jobs and mentoring. One at a time. Pins, the strip and the list follow it.
- **Backend:** `GET /api/v1/map/open` returns the open posts with each one's place and kind of help, for the strip, the list and the chips.
- **Decided while building:** each row's kind of help chip is amber for a need and green for an offer, like the rings. The chips follow the board's order (Things first). Tapping a picked chip again goes back to All. While the list is open, the toggles step aside. An empty list says "Nothing open in view. Move the map to see more." 

## S-130: Find what fits you (map lane and backend). Approved Oct 21 (Taylor: "Start S-130")

- **For:** see, on the map, who could help with your needs and whose needs you could help with.
- **The one action:** turn on a toggle and tap a line.
- **Two toggles** sit above the map's bottom edge, only when your organization has something open:
  - "Offers for your needs"
  - "Needs you can help with" (Taylor, Oct 20: "help with is great")
  - One on at a time. Tap again to turn it off.
- **When one is on:** thin dashed lines run from your pin to each organization that fits, up to 12, best fit first. Green dashes for an offer coming to you, amber for a need you could meet. Your pin pulses. Everything else on the map dims. The lines go when you turn it off. Nobody else sees them.
- **A card slides up:** "5 offers could fit your needs" (or "4 needs you could help with"). One row per fit: their post's title, organization · city · miles, and which of your posts it fits ("For your: Winter coats"). Tap a row or a line to open their post, where "I can help" or "I need this" starts a thread as today.
- **Empty:** "Nothing fits your needs yet. Check the board?" with "Check the board" as the link. (Nothing tells you when a fit shows up yet, so no promise.) For offers: "Nothing you can help with yet. Check the board?"
- **Each toggle only when it can find something:** "Offers for your needs" when you have a need open, "Needs you can help with" when you have an offer open.
- **Turning one on frames the map** on you and every organization that fits, above the card. Tapping a pin still opens its card; closing it brings the list back.
- **No open posts:** the toggles aren't there. The strip at the top still works.
- **Your own threads** stay faint while a toggle is on.
- **Backend:** `GET /api/v1/map/fits?for=needs|offers` returns pairs for your organization: your post, their post, their EIN, score. Same scoring as a post's "Could fit" today.

---

# Home asks what brings you here (S-132, approved Oct 21, set aside Oct 25 for S-140)

Approved by Taylor 2026-10-21 in chat ("merge"), as written. Built in its own pull request afterwards.

Taylor, Oct 20, on Home for a just-joined organization: "the home page doesn't feel very intuitive quite yet. Like a new user won't understand what to do. Maybe make it more question oriented? 'Are you looking for something specific'? Or like a 'Get started here' button with a flow chart of options?"

**What's wrong now** (seen with the Just joined, First post, A message is waiting, and Busy demos): a new organization lands on a card that asks for two posts, then sections that say "Nothing waiting on you" and "Nothing new this week", and rows of counts. Nothing asks what you came for. Someone who came to find help, or to give it, has to guess that posting is how. Once an organization has posts and threads, Home works; this changes Home for the first days and leaves the rest alone.

## The question card (replaces the Welcome card)

- **For:** a new organization picks what it came to do and is one tap from it. It's also where a new organization first hears what a golden thread is.
- **The one action:** pick an answer. Still no green button on Home (the S-126 exception); the answers are the actions.
- **When it shows:** at the top of Home, under your name, while your organization has no open post and no thread. "Not now" hides it on this device, as the Welcome card's did. Anyone can bring it back from the link at the bottom of Home (below).
- Headline: "What brings you here today?"
- Line: "Pick one. We'll show you the next step."
- Four answers, each a full-width row with a short line under it (two by two on a wide screen):
  1. **We need something** · "Volunteers, skills, things, or a partner."
  2. **We have something to give** · "Time, skills, or things you can spare."
  3. **Who's near us?** · "Organizations and golden threads around {city}." (No city: "around Washington".)
  4. **Just looking** · "See everything posted."
- **Who's near us?** opens the Map on your place (the same place "Near you" opens). **Just looking** opens the Board.
- Link: "Not now".

### The second step (the flow chart)

**We need something** and **We have something to give** open a second step in the same card, no new page:

- Headline: "Two ways to start"
- After **We need something**:
  - **Post what you need** · "Others here can offer to help." Opens Post with "We need" picked.
  - **See what's offered** · "{n} offers on the board now." Opens the Board showing offers. None: "Nothing offered yet."
  - Field "Looking for something specific?", placeholder "Laptops, drivers, a cooler", button **Search**. Opens the Board with that search. (Taylor's "Are you looking for something specific?")
- After **We have something to give**:
  - **Find a need you could meet** · "{n} needs on the board now." Opens the Board showing needs. None: "Nothing needed yet."
  - **Post what you have** · "Others can ask for it." Opens Post with "We have" picked.
- Under the choices, both: "When another organization helps, it becomes a golden thread on the map." ("the map" links to the Map, as the Welcome card's did.)
- Link: "Pick another answer" (back to the four answers).

## How Home changes after that

- **After your first post** (one open need or one open offer, no thread yet): the card goes. In its place, one line: "Your need is on the board. Post an offer too?" or "Your offer is on the board. Post a need too?" ("Post an offer too" / "Post a need too" is the link and opens Post with that kind picked.) It goes once you have both, as the Welcome card did.
- **Once you have a need and an offer, or any thread:** the S-126 line, as now: "2 needs, 1 offer open · 3 golden threads · Your page".
- **Waiting on you:** doesn't show until your organization has had a thread. After that, as now, "Nothing waiting on you." when there's nothing.
- **Just posted** (was "New this week"): heading "Just posted". The same 3 newest needs and offers from the last 7 days, now leaving out your own posts (with the Busy demo it showed two of Ballard's own). With none: "Nothing posted in the last 7 days. See the whole board?" ("See the whole board" is the link.) Taylor, Oct 20, on staging: Home said nothing was new this week while the board showed 2 needs marked "This week". "This week" stays the word for how soon a need is needed (VOICE.md rule 4: one name per thing).
- **Near you, with no one near:** "No other organizations within 25 mi yet. Open the map" (was "0 organizations, 0 golden threads within 25 mi.", seen with the Empty board demo). With organizations but no golden threads: "3 organizations within 25 mi. Open the map".
- **At the bottom of Home, always:** "Not sure what to do next? Start here." ("Start here" is the link. It opens the question card at the top of Home, even after "Not now" or once you have posts.)

## Stays and goes

- **Stays:** your name and city; Near you and On the board as S-126 built them; the tabs; the "You're in. Welcome, {org}." toast.
- **Goes:** the Welcome card ("Start with one need, one offer", its two buttons, its line). Its golden thread line moves into the second step; "Not now" moves to the question card.

## Checked against

- **MISSION.md:** each answer is a start on Need → Match → Golden Thread. "We need something" and "We have something to give" are the two ends of a thread; "Who's near us?" is the map of the threads; "Just looking" is how a curious organization finds its way in.
- **VOICE.md:** headlines 6 words or fewer ("What brings you here today?" is 5, "Two ways to start" is 4); one line under each; "We'll" only as a promise; thread and golden thread, never connection or match; sentence case; digits; no exclamation marks or em-dashes. The answers are written as the organization talking ("We need something"), since it's their answer to a question.
- **Tests (when built):** `[S-132]` acceptance tests for a new organization: the four answers, each second step, the search, "Not now" and "Start here", the one line after a first post, and the S-126 line after both.

---

# The map, always light (S-139, proposed Oct 25)

Taylor, Oct 25: "let's redesign the color scheme the map is too dark". Taylor picked "always light" from 2 prototypes (always light, or light plus a lifted dark version), in chat the same day. Approving this pull request approves the brief. It gets built in its own pull request afterwards.

**What's wrong now:** a phone in dark mode gets a near-black map, and the threads and pins sit in the dark. A phone in light mode gets a flat grey map: land, water and woods are almost the same grey, so Puget Sound and the coast disappear.

## The map's colors

- **For:** see Washington, and the threads on it, at a glance on any phone.
- **The one action:** none new. The map's taps stay as they are.
- **Always light.** The map is light on every phone, in dark mode too. Dark mode still darkens the tabs, cards and sheets around and over the map.
- **Land** is a warm cream (#F4F1EA). **Water** is a soft blue (#CFE0E3), so the Sound, the lakes and the coast show again. **Parks and woods** are a pale green (#E3EBDD).
- **Faint dots** (every Washington nonprofit) are a slate grey (#5E6B78), a little darker than now.
- **Pins, threads, glow, sparks and confetti** use their light-mode colors on every phone: amber needs, green offers, golden threads. They aren't changed, only no longer swapped for the dark-mode set.
- **Town names and roads** stay as quiet as now, with the town names on the cream.
- **Home's small map** ("Near you") gets the same colors.
- **No new words.** Nothing a person reads changes.
- **Built as tokens:** `--map-land`, `--map-water`, `--map-park`, `--map-dot` in `tokens.css`, the same in light and dark, so a later change touches one block.
- **Goes:** the dark base map, and the grey ground under the map.
- **Stays:** everything on the map and over it, as S-127, S-129, S-130 and S-131 left it.

## Checked against

- **MISSION.md:** the map is where golden threads are seen. A light map lets them be the brightest thing on screen on every phone.
- **VOICE.md:** no copy changes.
- **SDLC.md, keeping designs uncoupled:** colors live in `:root` tokens; the map reads them, never raw values.
- **Tests (when built):** `[S-139]` acceptance test: with the phone in dark mode, the map's background is the light land color and a golden thread is drawn in its light-mode gold.

---

# Home puts the map first (S-140, approved Oct 25)

Approved by Taylor 2026-10-25 in chat ("Approved as written"). Replaces the S-132 question card, which is set aside. Built in its own pull request afterwards.

Taylor, Oct 25: "it feels too wordy on the phone, too cluttered" and "We want the map to be one of the more prominent features of the home page."

**What's wrong now** (a phone, 375 wide): 6 sections stacked, about 95 words before the first post, the organization's name twice (the header pill and the heading), a "Nothing waiting on you." block, a small map below the fold, and 5 rows of counts that repeat the Board's tabs.

## Home

- **For:** the same calm place to land (S-126), with the map as the first thing you see.
- **Your organization:** your name, then "Seattle · Food". Stays.
- **The map:** right under your name, about a third of a phone screen tall. The still picture of your pin, organizations around you, and their golden threads, as S-126 drew it, only larger. No "Near you" heading. On the map, bottom corner, a small label: "14 organizations · 3 golden threads". With organizations but no golden threads: "3 organizations". With no one near: "No other organizations within 25 mi yet". Tap anywhere on the map opens the Map. Under it, one grey line: "Tap the map to open it." "Open the map" goes.
- **Waiting on you:** shows only when a thread is waiting on you, then under the map, as S-126 built it. "Nothing waiting on you." goes.
- **Welcome card:** shows when it does now (until your organization has an open need and an open offer). Headline "Post one need, one offer" (was "Start with one need, one offer", 7 words). Line: "Each one can become a golden thread." The two buttons stay. "Not now" moves up beside the headline, small and grey.
- **Your standing line** (when the welcome card doesn't show): stays, "2 needs, 1 offer open · 3 golden threads · Your page".
- **New this week:** heading stays. 2 posts, not 3. Each card is 2 lines: the title, then "Offer · Northwest Harvest · 8h". The NEED or OFFER tag and the "Seattle · 6 pallets" line go from these cards (the Board keeps them). "See the whole board" stays. With none: "Nothing new this week. See the whole board?" as now.
- **On the board:** goes. Its rows repeated the Board's tabs, one tap away.

## Every tab

- **The header pill on a phone:** your initial only (was "Test Person · Rainier Valley Food B…", cut off). Tap does what it does now. A screen reader still reads your name and organization. Wider screens (the side rail, from 900 wide) keep the name.

## Stays and goes

- **Stays:** the tabs, the "You're in. Welcome, {org}." toast, the Board, Map, Post, and Inbox as they are.
- **Goes:** the S-132 question card (set aside, never built), "Near you" as a heading, "Nothing waiting on you.", "On the board", the third New this week post.

## Checked against

- **MISSION.md:** the map is where golden threads show; putting it first puts the threads in front of everyone who opens the app.
- **VOICE.md:** headlines 6 words or fewer ("Post one need, one offer" is 5); one line under it; golden thread, never connection; digits; sentence case; no em-dashes or exclamation marks.
- **Tests (when built):** `[S-140]` the map comes first and opens the Map, its label, the welcome card's words, Waiting on you hidden with nothing waiting, 2 two-line posts, no On the board, the initial-only pill on a phone.

---

# Every dot is a Washington organization (S-143, approved Oct 25)

Approved by Taylor 2026-10-25 in chat ("Approved as written. Build it.").

Taylor, Oct 25: "let's make it way more obvious that the spots on the map are all of the non-profits in WA with an associated address from their EIN, it just looks messy atm"

**What's wrong now** (staging, a phone, 375 wide):

- **The whole state:** the 25,781 dots are 1 pixel at 40%. Washington looks empty, in the one view where "every organization in the state" would land hardest.
- **A city:** the dots turn into grey speckle, the same grey as a pin with nothing open (Solid Ground), so dots and pins blur together. Where several share an address they clump into dark blots.
- **Nothing on the map says what they are.** The only words are the legend's fifth line, "A faint dot is any Washington nonprofit.", and the legend opens by itself just once.

## On the map

- **A line that says what the dots are.** Under the kind-of-help chips, a small pill: a dot, then "1,204 organizations in view · IRS addresses". The count follows the map as you pan and zoom, the way "11 needs · 6 offers in view" does. Zoomed out on the whole state it reads "25,781 organizations in view · IRS addresses". It is text, not a button.
- **The whole state shows where they are.** Zoomed out, each dot is drawn a little larger and lighter, so they add up: Seattle, Tacoma, Spokane and the I-5 corridor read as soft shaded areas, and empty land stays clear. The state looks full, not blank.
- **A city shows each one.** Zoomed in, each dot is a small solid dot in its own color, a quiet blue-grey (#6E7F96, was slate grey #5E6B78), with a thin cream edge, so 3 at one address read as 3 dots, not a blot. Pins are larger and white-centered, so a dot never looks like a pin.
- **One rule: a pin has a white center, a dot is solid.** An organization here with nothing open (Solid Ground today) is a solid grey pin now, which is what a dot looks like. It becomes a white center with a grey ring, the same shape as every other pin.
- **Dots stay under everything else:** under town names, pins, rings and threads, as now.

## The legend ("What the map shows")

- The dot comes first, with its own swatch: "Every Washington organization, at the address on its IRS record."
- "A faint dot is any Washington nonprofit." goes from the paragraph under the list. "A bigger pin has more open." stays.
- The rest stays as written.

## Home's small map

- The same dot look as the Map tab. No new line: its label ("14 organizations · 3 golden threads") still counts the organizations here.

## Not in this round

- **Tapping a dot** to see that organization's name. The dots carry only an EIN today, so it needs a names lookup first. A story of its own if you want it.

## Stays and goes

- **Stays:** pins (but the one with nothing open), rings, threads, the strip, chips, toggles, cards, and the map's colors from S-139 (land, water, parks).
- **Goes:** the 1-pixel dots at state zoom, the solid grey pin, the legend's "faint dot" line.
- **Built as tokens:** `--map-dot` in `tokens.css` changes; nothing reads a raw color.

## Checked against

- **MISSION.md:** the dots are the community's whole capacity, every organization that could be one end of a golden thread. Showing them plainly says "they're all here" before anyone joins.
- **VOICE.md:** "organization", not "nonprofit" (the Words table); "IRS addresses" is the one place the record matters, in a metadata line with a middle dot; digits; sentence case; no em-dashes.
- **Tests (when built):** `[S-143]` the pill shows a count of organizations in view that changes when the map zooms in, and the legend's first line is the dot.

---

# Tap a place, see who's there (S-144, approved Oct 25)

Taylor, Oct 25: "can we make it so the map is interactable like you can click on a region of the map, like "Seattle" or even "Ballard" and a boundary of that place is focused and we can see what organizations are there". Taylor picked "every organization inside the place, members and all listed nonprofits, with a count" in chat the same day, and approved this brief in chat ("Approved as written. Build it in its own PR."). Built in its own pull request.

**Decided while building:** a place name under a pin (Seattle's, at state zoom) goes to the pin, as every tap on a pin does; zoom in to tap the name. "Show all of Washington" clears the place and leaves the map where it is. The place's chip is the outline's blue-grey, so the two read as one thing.

## On the map

- **For:** see everyone in one place you know by name, not just whatever fits on the screen.
- **The one action:** tap a place name on the map.
- **Which names you can tap:** every Washington city and town, and Seattle's neighborhoods (Ballard, Fremont, Rainier Valley and the rest). Other names on the map (rivers, parks, other cities' neighborhoods) do nothing, as now.
- **Tap "Ballard":** the map moves to fit Ballard and draws its outline, a thin blue-grey line. Land outside the outline fades a little. Pins, dots and threads inside stay as they are.
- **The strip at the top** reads "214 organizations in Ballard · 6 joined". Tap it and the list slides up, the same sheet as "in view".
- **A chip for the place,** first in the chip row: "Ballard ×". Tap × and the outline goes, the map stays where it is, and the strip goes back to "in view".
- **Tapping another place name** swaps the outline to it. Tapping a pin still opens its card, outline or not.
- **Moving the map** keeps the outline and the count. The count is for the place, not the screen.

## The list

- **Title:** "214 organizations in Ballard".
- **Joined first:** the organizations that have joined, each with its pin's ring (amber needs, green offers) and "2 needs · 1 offer open" under its name. Tap one to open its page.
- **Then everyone else,** under a small grey line "Not here yet", A to Z. Each row: the name, then its NTEE area in a metadata line ("Food · Seattle"). Tap one to open its page, as from search today.
- **Long lists** show 50 at a time, with "Show 50 more" at the bottom.
- **The kind-of-help chips** narrow the joined part to organizations with something open of that kind. "Not here yet" stays as it is, since they have nothing posted.
- **Empty:** "No organizations in Ballard yet. Show all of Washington?" with "Show all of Washington" as the link. It clears the place.

## Where the outlines come from

- **Cities and towns:** the U.S. Census Bureau's place boundaries for Washington (public domain), about 600 places, fetched by a script into a seed file like our other public data. No new service and no cost.
- **Seattle's neighborhoods:** the City of Seattle's neighborhood map, from its open data (terms checked before it's built).
- **Simplified** so the whole file is small enough for a phone, loaded only the first time you tap a place.
- **Inside or not** is decided by the organization's address on its IRS record, the same point its dot sits on.

## Backend

- `GET /api/v1/places/{id}/orgs` returns every organization inside the outline, joined first, with a total, 50 at a time. The dots only carry an EIN today, so this is where the names come from. Public, like `/map/points`.

## Not in this round

- **Neighborhoods outside Seattle.** Most cities don't publish outlines for free. Tacoma, Spokane and others get added as stories when we find their data.
- **Counties** and **searching for a place by name.** Each a story of its own if you want it.

## Stays and goes

- **Stays:** pins, rings, threads, dots, the "in view" strip and list when no place is picked, the toggles, cards, legend, Home's small map (it stays still; tapping it opens the Map as now).
- **Goes:** nothing.
- **Built as tokens:** the outline and the fade are `--map-place-line` and `--map-place-fade` in `tokens.css`.
- **Works with the dot brief (pull request 59):** if that one lands first, its "organizations in view" pill reads "in Ballard" while a place is picked, and this strip keeps the joined count.

## Checked against

- **MISSION.md:** geographic area is one of the things golden threads are found by. A place shows the whole community's capacity there, joined or not, before anyone has to ask.
- **VOICE.md:** "organization", never nonprofit or member (the Words table); "joined" for organizations here, as the privacy page says it; headline-length strip; digits; sentence case; no em-dashes; the empty state is a sentence and a next step.
- **Tests (when built):** `[S-144]` tapping a city name draws its outline and the strip reads "{n} organizations in {place} · {n} joined", the list puts joined organizations first, × clears it back to "in view", and a Seattle neighborhood name works.

---

# Demo settings wait for Show this demo (S-145, approved Oct 25)

Approved by Taylor 2026-10-25 in chat ("Yes, build both as briefed."). Taylor, Oct 25: "when I adjust the settings, I want just like a confirm button to change the layout based on what I selected, not a new link. And that link sent me to an invite code but didn't work."

**What was wrong:** each setting took effect the moment you tapped it. On Admin the only way to see it was a grey "Start the demo" under a page whose pinned button says Make code, so "Copy a link to this demo" looked like the thing to press. A link (or "You are") set to A new organization starts at the invite code on purpose, and there only the sample codes work; a real code fails.

- **For:** pick what the demo shows, then see it. **The one action:** Show this demo.
- **Admin, Demo:** a primary **Show this demo** button right under the settings. "Start the demo" and "Copy a link to this demo" go. "Now: Busy, changed." stays.
- **In the demo, Settings:** nothing changes until you choose. Hint: "Pick what to show, then tap Show this demo. What you did in the demo starts over. Only you see this." Buttons: **Cancel**, **Show this demo** (primary), pinned to the bottom of the sheet so they're always in reach. Show this demo closes the sheet and the screen behind redraws.
- **A new organization:** the invite code box starts filled in with RAINIER, so Join just works. "Demo: try RAINIER." stays.
- **Stays:** a link like `/admin?demo=busy` still starts that demo for an admin (the tests and the map harness use it); nothing in the app offers one.
- **Tests:** `[S-145]` a change in the sheet waits for Show this demo, Cancel leaves the demo as it was, and the invite code is filled in.

---

# The dots fade back (S-146, approved Oct 25)

Approved by Taylor 2026-10-25 in chat ("Yes, build both as briefed. Drop the pill."). Taylor, Oct 25: "the map "?" doesn't explain the dots on the map still, and the dots on the map are still too busy and take away. They're distracting, they should be more transparent ... to say "hey there are non-profits here just not registered yet" but it's the focus of the map page and shouldn't be." This turns back part of S-143.

- **For:** pins and golden threads are the focus. The dots are a quiet hint that more nonprofits are out there.
- **The dots:** much fainter at every zoom (about a quarter as strong up close: 22% from 90%), smaller, no cream edge. Zoomed out they're a light wash. Pins keep S-143's white center.
- **Goes:** the pill under the chips ("1,204 organizations in view · IRS addresses").
- **The ? first line,** next to a few faint dots on a scrap of the map's land: "Faint dots are Washington nonprofits that haven't joined yet."
- **Stays:** pins, rings, threads, the strip, chips, the rest of the legend. Home's small map gets the same fainter dots.
- **VOICE.md:** the Words table prefers "organization" over "nonprofit"; Taylor approved "nonprofits" here, and these are IRS-registered nonprofits, where the term matters.
- **Tests:** `[S-146]` no dot count on the map, and the legend's first line is the new one.


---

# A calmer map (S-147, approved Oct 25)

Approved by Taylor 2026-10-25 in chat ("Approved as briefed. Merge #63 first so I can see the dots, then build the calmer map in its own PR."). Taylor, Oct 25, from staging on a phone: "the map when busy is confusing to look at there are too many threads and moving pieces... the clutter at the top of the filters is a lot, the symbols aren't intuitive Green/Orange and white with the numbers... we need to make it a little less noisy and more clear."

**What was wrong:** numbers meant two things (organizations in a bubble, threads on a line); a ring split amber and green had to be explained; in Busy every golden thread had sparks running on it; four layers of controls sat on the map (count, chips, the dots pill, two buttons at the bottom).

- **For:** see at a glance who needs help, who offers it, and where help was given. **The one action:** tap a place to see what's open there.
- **Symbols, one meaning each:** one organization is one solid dot with a white edge, amber if it has needs, green if it only has offers, a little bigger with more open, never a number. Nothing open: a small white pin with a grey edge. Several close together: one grey bubble with a number, and the number always means organizations. Lines never carry numbers; several threads between two places draw a little thicker.
- **Threads, still until you ask:** golden threads are thin, still, solid gold lines; nothing runs along them and nothing glows. Tap a place and only its threads light up and glow; the rest fade. Your own threads underway stay faint and dashed, and still.
- **Top of the screen, one row:** the count and the ?, with **Filter** next to the count. Filter opens the kind-of-help chips under it; picking one closes them and the button says which ("Filter: Food"). When the count is long, Filter wraps under it rather than cutting the count off.
- **At the bottom, one button:** **What fits you**. It opens a choice between "Offers for your needs" and "Needs you can help with", or goes straight to the one you have when you only have needs or only offers open. Tapped again while on, it turns off.
- **The ?, shorter, in this order:** amber dot "Needs help.", green dot "Offers help.", grey bubble "Several organizations close together.", gold line "Help that was given.", faint dashed line "Your threads that are underway.", faint dots "Faint dots are Washington nonprofits that haven't joined yet." "A bigger pin has more open." and the line about numbers go.
- **Stays:** the map's colors, the faint dots (S-146), tapping a place, the open list, confetti when a thread turns golden while you watch. Home's small map and the place list use the same symbols.
- **Goes:** sparks and the dash drift, numbers on lines and on single organizations, the split ring, the always-on chip row, the second bottom button.
- **Tests:** `[S-147]` the chips are behind Filter and it names the one picked; What fits you turns a toggle on and off; the legend reads in this order.

**Changed after staging (Taylor, Oct 25, in chat):** "the map looks better with 64, but the animated threads really added something so let's bring that back and the grey dots are also meh". Taylor then picked what stays: the one row with Filter, the solid amber and green pins, and the shorter ?. So:

- **Back as before (S-127, S-129, S-130):** the threads' drifting dashes, the sparks on golden threads and their glow; the cluster bubbles with their amber and green ring around the count; the two buttons at the bottom, "Offers for your needs" and "Needs you can help with". What fits you and the grey bubbles go.
- **Stays from this round:** one solid dot per organization, Filter in one row at the top, the shorter ? (its cluster and gold-line swatches drawn as the map draws them again), the faint dots. Lines still carry no numbers; only clusters do.

---

# Three small fixes from the friction list (S-120, S-125, S-134). Approved Oct 27 (Taylor: "Approve #70")

Drafted Oct 27. Each one is a word-level change, so nothing is built until you approve it line by line. Merging this PR is the approval; edit any line in it first.

## "I can help" says what it needs (S-120)

- **For:** someone who opens another organization's need and taps the green button.
- **What's wrong now:** "I can help" (or "I need this") is greyed out until you pick one of yours or type a message. It looks broken, and nothing says why.
- **The one action:** start a thread. The button stays green the whole time.
- **Tapped with nothing picked and no message:** the message box gets the cursor, and under it, in the error line: "Write a message first, or pick one of yours." (On an offer, the same line.)
- **Stays:** the button's words, "Yours that fit", the placeholder "Say what you can do and when."
- **Goes:** the greyed-out button.

## "How many" says how many of what (S-125)

- **For:** someone posting, at How many.
- **What's wrong now:** "How many" sits under the title with "Just the number, if it matters." It doesn't say of what, so a post titled "Volunteers for Saturday" gets a 4 that could be shifts, hours or people.
- **The line under How many, once there's a title:** "How many {title}, if it matters." Example: "How many folding tables, if it matters." The title is shown as typed, except its first letter drops to lower case unless its first word is an acronym ("How many PPE kits, if it matters."). Taylor, Oct 28, after seeing it built: keep this rule, so a title that starts with a name ("Spanish tutors") reads "spanish tutors" here.
- **With no title yet:** "Just the number, if it matters." (as now).
- **On the post itself:** no change. It still reads "6 needed" or "6 to give".

## The empty board says nothing's here once (S-134)

- **For:** an organization on a board with no posts yet (the Empty board demo).
- **What's wrong now:** above "Nothing here yet. Post the first one?" the count line says "0 open · 0 done", so the board says it's empty twice, once in numbers.
- **The change:** with no open posts and none done, the count goes. Filters stays where it is, on the right. With any post open or done, the count shows as now ("0 open · 3 done" included).
- **No new words.**

## Checked against

- **MISSION.md:** all three keep someone moving from a need to a thread: a button that works, a count that means something, a board that says what to do.
- **VOICE.md:** rule 10 (an error is a sentence and a next step: "Write a message first, or pick one of yours."); rule 6 (one green button, and it stays green); rule 2 (one sentence under How many). No banned words, no em-dashes.
- **Tests (when built):** `[S-120]` the button is enabled and the line shows when tapped with nothing; `[S-125]` the line under How many follows the title; `[S-134]` no count on an empty board, a count once something is done.

---

# Where people stop (Admin, S-148). Approved Oct 27

Drafted Oct 27, iterating on "How it's going". Merging this PR is the approval; edit any line in it first.

**Why:** the six numbers say how many threads turn golden. They don't say where the rest of the cohort stopped: someone who signed in and never got confirmed needs a different nudge from an organization that posted and heard nothing. This counts each step with what the app already keeps (sign-ins, confirmations, posts, threads). Nothing new is tracked and nothing is sent anywhere.

## Where people stop

- **For:** seeing, at a glance, the step where the alpha's people and organizations stop, so you know whom to nudge and how.
- **Where:** on Admin, right under "How it's going". Label: "Where people stop".
- **One card, five rows, each a number and what it counts:**
  1. "{n}" · "People signed in"
  2. "{n}" · "Confirmed at an organization"
  3. "{n}" · "Organizations that posted"
  4. "{n}" · "In a thread"
  5. "{n}" · "With a golden thread"
- Rows 1 and 2 count people; rows 3 to 5 count organizations ("In a thread": started one or was asked in one).
- **Under each row after the first, in grey, only when someone stopped there:** "{n} stopped here". Example: under "Confirmed at an organization", "3 stopped here" means 3 people signed in and weren't confirmed. Row 3 counts people's organizations, so its line compares organizations with confirmed people to organizations that posted.
- **A row below the card:** "Came back this week: {n} of {m}". Of confirmed people who joined more than 7 days ago, how many signed in during the last 7 days.
- **With nobody signed in yet:** the card shows "None yet" in place of the numbers, as "How it's going" does.
- Same people as "How it's going": you and other admins, "Test as this organization", and the development sign-in aren't counted.
- **Stays:** "How it's going" and everything below it.
- **Goes:** nothing.

## Questions for you

1. **Waiting claims.** Someone who asked to join and is waiting for you shows as "stopped" at Confirmed. Should row 2's line say "{n} waiting for you" for them instead, so they don't look lost? (I'd say yes: it's the same list as "Waiting for you" further down.)
2. **"Came back this week."** Sign-in only records the last time, so this can't say how often. OK as one number, or leave it out for now?

**Taylor's answers (Oct 27, in chat):** 1, yes: people waiting for you show as "{n} waiting for you" under row 2, not as stopped. 2, keep it.

## Checked against

- **MISSION.md:** each row is a step toward a golden thread. The card shows where the threads stop forming.
- **VOICE.md:** "people" and "organizations", never users; "thread" and "golden thread"; digits; sentence case; no banned words. The label is 3 words.
- **Tests (when built):** `[S-148]` API tests for each step, the test sign-ins left out, and "came back"; an acceptance test that the card is under "How it's going" and admins only.

---

# A golden thread links to the map (S-149). Approved Oct 28

Taylor, Oct 28, on a golden thread's screen: "this should be a link back to the map to see the golden thread". Approved in chat ("and approve").

- **For:** seeing the help you gave or got as a golden line on the map, between the two organizations.
- **The line on a golden thread:** "Done. This is a golden thread. See it on the map". "See it on the map" is the link.
- **Where it goes:** the Map, opened on the two organizations, with the golden line between them and the thread's card open (the card you get when you tap a line).
- **Stays:** "Done. This is a golden thread." and its gold bar.
- **Not in this round:** the same link on a golden thread's row in the Inbox.

# Golden thread art in the app (S-150). Brief, Oct 28

Taylor, Oct 28: "can we add some of the art?" The drafts are in `design/art/` (see its README). Two of them are ready enough; the rest wait.

- **For:** a little warmth where the app has nothing to show yet, and a moment when help lands. The art never says anything the words don't.
- **The needle and pin (`03`), on empty screens:**
  - The Board, above "Nothing here yet. Post the first one?"
  - The Inbox, above "No threads yet. Find a need on the board you can help with."
  - Small (about 140 px square), centered, corners rounded so the cream square reads as a picture in dark mode too.
- **The two houses (`01`), on a golden thread:** a short banner across the top of the thread, above "Done. This is a golden thread. See it on the map". Only when the thread is done.
- **Alt text:** none (`alt=""`). The pictures are decoration; the words beside them already say it, so screen readers skip them.
- **No new words.** Every line above stays as it is.
- **Weight:** each picture shrunk to the size it shows at (about 30 KB, not 400), so a slow phone doesn't wait on it.
- **Not in this round:** the hands and crate (`02`, off palette), Puget Sound at dusk (`04`, too dark and busy under words), the app icon (`05`, needs redrawing as an SVG). The "Nothing under {kind} yet" and filter empty states stay plain, so the picture means "nothing here at all".

## Question for you

The two houses read dark red and the coastline is invented (README). Use `01` now and swap in a rerun later, or wait for the rerun and ship only the needle and pin?
