// Assembles docs/how-it-works.html: keeps the existing <style> block, replaces everything after it.
const fs = require('fs');
const path = require('path');
const docs = path.join(__dirname, '..', 'docs');
const file = path.join(docs, 'how-it-works.html');
const cur = fs.readFileSync(file, 'utf8');
const head = cur.slice(0, cur.indexOf('</style>') + 8)
  .replace(`  summary .sub { display: block; font-weight: 400; font-size: 15px; color: var(--ink-2); margin-top: 2px; }`,
`  summary .sub { display: block; font-weight: 400; font-size: 15px; color: var(--ink-2); margin-top: 2px; }
  summary .ttl { font-size: 18px; font-family: "Bricolage Grotesque", sans-serif; }
  .ph { border: 2px dashed var(--line); border-radius: 14px; padding: 18px 20px; color: var(--ink-3); font-style: italic; max-width: 72ch; margin: 8px 0 28px; background: transparent; }
  .lbl { display: inline-block; font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-right: 6px; }
  details .body p { margin-bottom: 12px; }
  figure { margin: 8px 0 32px; }
  figcaption { font-size: 14px; color: var(--ink-3); margin-top: 8px; }`);
const figure = fs.readFileSync(path.join(docs, 'map-figure.svg'), 'utf8');

const body = `
<div class="wrap">
  <div class="eyebrow">Name TBD · how it works</div>
  <nav class="pages" id="pages">
    <a href="#problem"><span class="n">1</span>The problem</a>
    <a href="#building"><span class="n">2</span>What we're building</a>
    <a href="#pieces"><span class="n">3</span>How it works</a>
    <a href="#handoff"><span class="n">4</span>From a need to a hand-off</a>
    <a href="#matching"><span class="n">5</span>Matching &amp; fairness</a>
    <a href="#map"><span class="n">6</span>Reading the map</a>
    <a href="#builders"><span class="n">7</span>For builders</a>
  </nav>

  <!-- ================================================================ 1 -->
  <section class="page" id="problem">
    <h1>The problem</h1>
    <p class="big">Nonprofits need help. People and businesses want to give it. The two rarely find each other.</p>
    <div class="ph">Examples of nonprofits, people, and businesses working together go here.</div>
    <h2>How we're handling it</h2>
    <div class="ph">Explanation of the idea goes here.</div>
    <div class="pager"><a class="next" href="#building">Next: What we're building <small>2 of 7</small></a></div>
  </section>

  <!-- ================================================================ 2 -->
  <section class="page" id="building">
    <h1>What we're building</h1>
    <p class="big">We're building a map to see the golden thread between nonprofits, businesses, and people.</p>
    <figure>
      ${figure}
      <figcaption>An example from the prototype: Computers 4 People in Need in Bellingham gave fifteen laptops to Ballard Food Bank in Seattle. Once a hand-off is done, it stays on the map as a gold thread. <a href="prototype.html">Open the live map →</a></figcaption>
    </figure>
    <p>Every nonprofit is a pin where it actually is. When one organization helps another, a thread appears between them. Zoomed out you see where help is flowing across the state; zoomed in you see who helped whom, with what, and when.</p>
    <p>Around the map is the part that makes the threads happen: a board where organizations say what they need and what they have, matching that finds who fits, and a private conversation to work out the hand-off. The next page walks through each piece.</p>
    <div class="pager"><a href="#problem">← The problem</a><a class="next" href="#pieces">Next: How it works <small>3 of 7</small></a></div>
  </section>

  <!-- ================================================================ 3 -->
  <section class="page" id="pieces">
    <h1>How it works</h1>
    <p class="big">Here's each piece, where we're at with it, and what's still missing.</p>

    <details open>
      <summary><span><span class="ttl">The public list</span><span class="sub">Every nonprofit is already written down. We start from there.</span></span></summary>
      <div class="body">
        <p>Every nonprofit is registered with the IRS. The IRS publishes that registry as a free spreadsheet anyone can download. It lists each organization's name, address, tax ID, what kind of organization it is, and roughly how big it is.</p>
        <p>The nonprofits do not need to sign up for this service. We use the IRS's database to pull in that information so there's no extra work on their part. We found that Washington has 35,361 nonprofit organizations, and all of them are available in our app from day one. Someone who works at one of these organizations will be able to "claim" it in the app, as long as they can verify they work there.</p>
        <p><span class="lbl">Missing</span>Phone numbers, emails, and websites. The IRS spreadsheet doesn't have them. We'll have to find that information from other sources — other public filings, the state's charity registry, or the organization itself once it's claimed.</p>
      </div>
    </details>

    <details>
      <summary><span><span class="ttl">Keeping the list current</span><span class="sub">The IRS updates monthly. So do we, without touching anything a person typed.</span></span></summary>
      <div class="body">
        <p><span class="lbl">Where we're at</span>The IRS reposts the spreadsheet every month. We built a small program that downloads the new one, compares it to what we have, and updates only what changed: new organizations get added, changed ones get updated, ones that dropped off get flagged rather than deleted. It writes down every run so we can always say how fresh the data is.</p>
        <p>It never overwrites anything a person entered. If a food bank writes its own description, that stays theirs no matter what the next IRS file says.</p>
        <p><span class="lbl">Missing</span>Right now someone has to run it. We still need to put it on a schedule so it runs itself each month, and to pull in the IRS's other monthly files — the one that says who's currently in good standing, and the one that says who lost their status.</p>
      </div>
    </details>

    <details>
      <summary><span><span class="ttl">Where everything lives</span><span class="sub">One place for the organizations and everything people add.</span></span></summary>
      <div class="body">
        <p><span class="lbl">Where we're at</span>All 42,510 Washington organizations are loaded and searchable, along with the needs and offers people post, the connections between them, and the messages inside those connections. Every organization is filed under its IRS tax ID, so the same one can never show up twice.</p>
        <p><span class="lbl">Missing</span>Accounts. Today the prototype pretends you're signed in. The real version needs real sign-in, and a record of which people belong to which organizations.</p>
      </div>
    </details>

    <details>
      <summary><span><span class="ttl">The rules</span><span class="sub">One front door that every screen goes through, so the rules can't be bent.</span></span></summary>
      <div class="body">
        <p><span class="lbl">Where we're at</span>The phone app, the website, and anything we build later never touch the stored data directly. They all go through one door and ask: search organizations, post this need, accept this connection. The door checks who's asking and whether the rules allow it, then does the work.</p>
        <p>That means the rules live in one place. Only the <em>other</em> side can accept a connection. Only the two organizations in a connection can read their messages. An organization can only have two "we can't operate without this" needs open at a time. No screen can get around any of that.</p>
        <p><span class="lbl">Missing</span>Knowing who's really asking. Today a request just says which organization it's for and we take its word. Real sign-in and "prove you work there" are the next thing to build.</p>
      </div>
    </details>

    <details>
      <summary><span><span class="ttl">The app</span><span class="sub">The screens: board, map, organizations, post, inbox, you.</span></span></summary>
      <div class="body">
        <p><span class="lbl">Where we're at</span>A clickable prototype you can open on a phone. It walks through the whole story — a food bank posts a need, a refurbisher gets alerted, they connect, message, and hand off — from both sides. The organizations in it are real; the people, posts, and messages are invented so we could show the flow.</p>
        <p><span class="lbl">Missing</span>The real thing. The prototype keeps everything on your device and pretends to sign you in. The finished app will be the same screens, connected to the real data, with real accounts.</p>
      </div>
    </details>

    <details>
      <summary><span><span class="ttl">Being told the moment something happens</span><span class="sub">You shouldn't have to keep checking.</span></span></summary>
      <div class="body">
        <p><span class="lbl">Where we're at</span>When a need is posted that matches what you have, when someone accepts your proposal, when a message arrives — the app is told the instant it happens rather than the next time you refresh. Public news (a new listing) goes to everyone. Private news (your connections, your messages) goes only to the two organizations involved. This works today.</p>
        <p><span class="lbl">Missing</span>Reaching you when the app is closed: email and phone notifications, and a daily digest for the less urgent stuff.</p>
      </div>
    </details>

    <details>
      <summary><span><span class="ttl">The map</span><span class="sub">Where help is, and where it's flowing.</span></span></summary>
      <div class="body">
        <p><span class="lbl">Where we're at</span>Every organization is placed by its ZIP code. Nearby ones gather into numbered circles when you're zoomed out and spread apart as you zoom in. Every connection is a thread; completed ones are gold. You can filter by needs or offers, who's giving, category, and distance. Page 6 explains how to read it.</p>
        <p><span class="lbl">Missing</span>Street-level placement (we know the addresses; we just haven't turned them into exact map points yet), and a real street map underneath instead of the plain outline.</p>
      </div>
    </details>

    <div class="pager"><a href="#building">← What we're building</a><a class="next" href="#handoff">Next: From a need to a hand-off <small>4 of 7</small></a></div>
  </section>

  <!-- ================================================================ 4 -->
  <section class="page" id="handoff">
    <h1>From a need to a hand-off</h1>
    <p class="big">Six steps. Both sides can always see where things stand.</p>
    <div class="steps">
      <div class="step"><div class="n">1</div><div><h3>You post</h3><p>"We need twelve laptops." Or: "We have forty sheets of plywood." You pick a category and a quantity, and for a need, how urgent it is.</p></div></div>
      <div class="step"><div class="n">2</div><div><h3>We look for fits</h3><p>We compare it with everything open and let the organizations that fit know — including ones that haven't posted anything but told us "we often have laptops."</p></div></div>
      <div class="step"><div class="n">3</div><div><h3>Someone raises a hand</h3><p>One side taps "I have this" (or "I need this"). That pairs the need with the offer and asks the other side.</p></div></div>
      <div class="step"><div class="n">4</div><div><h3>The other side says yes</h3><p>Only they can. Once accepted, both listings are held so nobody else can claim them in the meantime.</p></div></div>
      <div class="step"><div class="n">5</div><div><h3>You work it out</h3><p>A private conversation for just the two of you: timing, pickup, who to call. Nobody else can see it.</p></div></div>
      <div class="step"><div class="n gold">6</div><div><h3>Done</h3><p>Either side marks it complete. Both listings close, and the hand-off shows on both organizations' pages and on the map as a gold thread.</p></div></div>
    </div>
    <p class="soft">If the other side says no, nothing changes. If you cancel after accepting, both listings just reopen.</p>

    <h2>A few things you'll run into</h2>
    <details><summary><span><span class="ttl">How urgent: P0 to P3</span><span class="sub">So "urgent" keeps meaning something.</span></span></summary><div class="body"><p><b>P0</b> — we can't operate without it. <b>P1</b> — we need it this week. <b>P2</b> — this month. <b>P3</b> — whenever it works.</p><p>We limit each organization to two open P0s a month. Otherwise everything becomes a P0 and the word stops helping anyone.</p></div></details>
    <details><summary><span><span class="ttl">Things that repeat</span><span class="sub">Weekly produce. Monthly bookkeeping. A standing arrangement.</span></span></summary><div class="body"><p>A need or an offer can be one-time, weekly, monthly, quarterly, or ongoing. When a repeating pair is accepted it becomes a standing agreement: it has a next date, each delivery gets logged with one tap, and either side can end it whenever. "Monthly produce to Thurston County Food Bank since July — three deliveries so far."</p></div></details>
    <details><summary><span><span class="ttl">Who can see what</span><span class="sub">Needs and offers are public. Conversations aren't.</span></span></summary><div class="body"><p>Needs and offers are meant to be seen — that's the whole point. Connections and messages are private to the two organizations in them. The IRS file lists a contact person for each organization; we never show that name.</p></div></details>
    <div class="pager"><a href="#pieces">← How it works</a><a class="next" href="#matching">Next: Matching &amp; fairness <small>5 of 7</small></a></div>
  </section>

  <!-- ================================================================ 5 -->
  <section class="page" id="matching">
    <h1>Matching &amp; fairness</h1>
    <p class="big">We always show our work, and everyone gets a turn at the top.</p>
    <h2>How we decide who fits</h2>
    <p>For a need, every open offer gets points, and we show the points. Ballard Food Bank needs twelve laptops; Computers 4 People in Need has fifteen:</p>
    <div class="score">
      <span>Same kind of thing (Technology)</span><span class="n">+50</span>
      <span>Same words: laptop, computer</span><span class="n">+35</span>
      <span>Different cities</span><span class="n">+0</span>
      <span>The need is a P0</span><span class="n">+10</span>
      <span>The offer covers the whole amount</span><span class="n">+10</span>
      <span>The offer is recent</span><span class="n">+5</span>
      <span class="tot">Match score</span><span class="n tot">110</span>
    </div>
    <p>Weak fits don't get shown. And an organization gets told about a fit even if it hasn't posted anything — as long as its page says "we often have laptops."</p>
    <p><span class="lbl">Missing</span>Learning from what actually gets completed. Right now the points are fixed; over time we'd like the ones that lead to real hand-offs to count for more.</p>

    <h2>How we keep the board fair</h2>
    <p>A board that rewards whoever is biggest or posts the most would quietly bury the small organizations. So we don't do that.</p>
    <div class="cards">
      <div class="card"><h3>Most urgent first, then least-seen</h3><p>Among needs of the same urgency, the one fewer people have seen goes to the top. It rotates.</p></div>
      <div class="card"><h3>No crowding</h3><p>No organization gets more than two of the top six spots.</p></div>
      <div class="card"><h3>A reserved seat</h3><p>One of the top spots always goes to the listing that's been seen the least, whoever posted it.</p></div>
      <div class="card"><h3>We say why</h3><p>Every listing says why it's where it is ("P1 · seen twice"). Every organization can see how often it's shown compared with average.</p></div>
      <div class="card"><h3>Not for sale</h3><p>If we ever show sponsored content, it's labeled and it sits outside this list. Placement can't be bought.</p></div>
      <div class="card"><h3>Alerts follow rules, not size</h3><p>You hear about something because it fits what you said you need or have, near you. Never because someone is big or popular.</p></div>
    </div>
    <div class="pager"><a href="#handoff">← From a need to a hand-off</a><a class="next" href="#map">Next: Reading the map <small>6 of 7</small></a></div>
  </section>

  <!-- ================================================================ 6 -->
  <section class="page" id="map">
    <h1>Reading the map</h1>
    <p class="big">Pins are organizations. Threads are help.</p>
    <div class="legend-row"><div class="sw"><span class="dot" style="background:var(--offer)"></span></div><p><b>Green pin</b> — a nonprofit, placed at its ZIP code.</p></div>
    <div class="legend-row"><div class="sw"><span class="dot" style="background:#3B5BA9"></span></div><p><b>Blue pin</b> — a business that gives.</p></div>
    <div class="legend-row"><div class="sw"><span class="dot" style="background:#7A5CA8"></span></div><p><b>Purple pin</b> — a person who gives.</p></div>
    <div class="legend-row"><div class="sw"><span class="dot" style="background:var(--offer);width:26px;height:26px;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:700">7</span></div><p><b>Numbered circle</b> — several organizations close together. Tap it and they spread apart. The soft glow behind it is how active that place is.</p></div>
    <div class="legend-row"><div class="sw"><span class="ln" style="border-color:var(--gold)"></span></div><p><b>Gold thread</b> — a finished hand-off between two organizations.</p></div>
    <div class="legend-row"><div class="sw"><span class="ln" style="border-color:var(--offer)"></span></div><p><b>Green thread</b> — accepted, being worked out.</p></div>
    <div class="legend-row"><div class="sw"><span class="ln dashed" style="border-color:var(--need)"></span></div><p><b>Amber dashed</b> — someone raised a hand; waiting on the other side.</p></div>
    <div class="legend-row"><div class="sw"><span class="ln dotted" style="border-color:var(--ink-3)"></span></div><p><b>Grey dotted</b> — we think these two fit; nobody has acted yet.</p></div>
    <h2>Which way is it going?</h2>
    <p>Threads sit quietly until you pick one. Tap a thread — or choose it from the Connections list — and it lights up: the dashes drift and a small dot travels along it <b>from the giver to the receiver</b>. Everything else fades back so you can't lose the one you chose.</p>
    <h2>Filters</h2>
    <p>Needs or offers, who's giving, what kind of thing, and how far from you — plus which kinds of thread to show. The same filters run the Board, so the list and the map always agree.</p>
    <div class="pager"><a href="#matching">← Matching &amp; fairness</a><a class="next" href="#builders">Next: For builders <small>7 of 7</small></a></div>
  </section>

  <!-- ================================================================ 7 -->
  <section class="page" id="builders">
    <h1>For builders</h1>
    <p class="big">The technical page. If you're not building on this, you already have the whole story.</p>
    <p class="soft">This documents the backend as it exists today. In the language of the earlier pages: "the rules" is an API, "where everything lives" is a SQL Server database, "being told the moment something happens" is SignalR.</p>

    <h2>Every endpoint</h2>
    <p>An endpoint is one web address with one job. <span class="verb get">GET</span> reads, <span class="verb post">POST</span> changes something. Reading organization data is open; changing anything requires naming the organization you act for (today a header <span class="ep">X-Org-Ein</span>; later a real login). Development address <span class="ep">http://localhost:5253</span>; interactive documentation at <span class="ep">/swagger</span>.</p>

    <h3>Organizations (public data)</h3>
    <div class="tbl"><table>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/orgs</span></td><td>Search. Filters: <span class="ep">q</span> (words, or a 9-digit EIN), <span class="ep">city</span>, <span class="ep">zip</span>, <span class="ep">ntee</span> (K or K31), <span class="ep">foundation</span>, <span class="ep">only501c3</span>, <span class="ep">excludePrivateFoundations</span>, <span class="ep">minRevenue</span>/<span class="ep">maxRevenue</span>, <span class="ep">page</span>/<span class="ep">pageSize</span>.<div class="ex">GET /api/v1/orgs?q=food+bank&amp;city=Seattle</div></td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/orgs/{ein}</span></td><td>One organization, every IRS code translated to words, with ProPublica and IRS links. Never includes the "in care of" name.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/stats</span></td><td>Counts by cause, size, city, filing type.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/ntee</span></td><td>The 26 cause categories.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/codes</span></td><td>Every IRS code table, translated.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/imports</span></td><td>The import log: file, date, fingerprint, rows changed.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/health</span></td><td>"Healthy" when the database is reachable.</td></tr>
    </table></div>

    <h3>Listings (needs and offers)</h3>
    <div class="tbl"><table>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/listings</span></td><td>The board. Filters: <span class="ep">kind</span>, <span class="ep">category</span>, <span class="ep">status</span> (default Open), <span class="ep">city</span>, <span class="ep">orgEin</span>, <span class="ep">q</span>.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/listings</span></td><td>Post a need or offer as the acting organization. Alerts everyone whose listings or tags fit.<div class="ex">POST /api/v1/listings   (X-Org-Ein: 911428805)
{ "kind":"Need", "category":"Technology", "title":"Laptops for client intake stations",
  "quantity":12, "unit":"laptops", "urgency":"Critical", "tags":"laptops,computers" }</div></td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/listings/{id}</span></td><td>One listing.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/listings/{id}/matches</span></td><td>Best counterparts, each with a score and plain-English reasons.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/listings/{id}/close</span></td><td>The poster takes it down.</td></tr>
    </table></div>

    <h3>Connections and messages</h3>
    <div class="tbl"><table>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/matches</span></td><td>The acting organization's inbox, with threads.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/matches</span></td><td>Propose: <span class="ep">needListingId</span>, <span class="ep">offerListingId</span>, optional note. You must own one side.</td></tr>
      <tr><td><span class="verb get">GET</span><span class="ep">/api/v1/matches/{id}</span></td><td>One connection with its thread. Parties only.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/matches/{id}/accept</span></td><td>The other side accepts; both listings become Matched.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/matches/{id}/decline</span></td><td>The other side declines; listings stay open.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/matches/{id}/complete</span></td><td>Either side; both listings become Fulfilled.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/matches/{id}/cancel</span></td><td>Either side; an accepted pair reopens.</td></tr>
      <tr><td><span class="verb post">POST</span><span class="ep">/api/v1/matches/{id}/messages</span></td><td>Send a message. Not on declined or cancelled connections.</td></tr>
    </table></div>
    <p>Errors are short sentences with a standard code: 400 invalid input, 401 you didn't say who you are, 403 not allowed ("Only the two organizations in this match can access it"), 404 not found, 409 wrong state ("Offer listing is Matched"). Every endpoint is rate-limited per caller.</p>

    <h2>Live updates</h2>
    <div class="tbl"><table>
      <tr><th>Event</th><th>Who gets it</th></tr>
      <tr><td><span class="verb ws">LIVE</span><span class="ep">listing.created · listing.updated</span></td><td>Everyone connected</td></tr>
      <tr><td><span class="verb ws">LIVE</span><span class="ep">match.proposed / accepted / declined / completed / cancelled</span></td><td>The two organizations in the connection</td></tr>
      <tr><td><span class="verb ws">LIVE</span><span class="ep">message.sent</span></td><td>The two organizations in the thread</td></tr>
    </table></div>
    <p>An app connects once to <span class="ep">/hubs/exchange</span>, says which organization it represents, and then just listens.</p>

    <h2>What is real and what is simulated</h2>
    <div class="cards">
      <div class="card"><h3>Real today</h3><p>IRS data for all 42,510 Washington organizations in a database. The endpoints above, with matching, connections, messaging and live updates — run end-to-end by a command-line demo and 57 automated tests. The 32 organizations in the prototype are real records.</p></div>
      <div class="card"><h3>Simulated in the prototype</h3><p>Sign-in, the people (Casey, Jordan), every listing, connection and message, the example businesses and community member, the alerts. The prototype runs the same matching rules in the browser and keeps everything on your device.</p></div>
      <div class="card"><h3>Designed, not built</h3><p>Claiming an organization and verifying you belong, business and supporter accounts and payments, standing agreements and priorities in the backend, email and push alerts, the finished app. See the design brief.</p></div>
    </div>

    <h2>Glossary</h2>
    <dl>
      <dt>501(c)(3)</dt><dd>The part of US tax law for charities. Gifts to them are tax-deductible; the IRS decides who qualifies.</dd>
      <dt>EIN</dt><dd>An organization's permanent nine-digit tax ID. Our primary key.</dd>
      <dt>NTEE code</dt><dd>The cause category (K31 = food banks).</dd>
      <dt>API / endpoint</dt><dd>The front door; each address on it is an endpoint with one job.</dd>
      <dt>JSON</dt><dd>The text format requests and answers travel in.</dd>
      <dt>SignalR</dt><dd>The technology behind live updates.</dd>
      <dt>Listing</dt><dd>One need or one offer.</dd>
      <dt>Match / connection</dt><dd>One need paired with one offer: Proposed → Accepted → Completed.</dd>
      <dt>Standing agreement</dt><dd>An accepted recurring pair with logged deliveries.</dd>
      <dt>ZIP centroid</dt><dd>The center of a ZIP code area; where a pin sits until street-level geocoding exists.</dd>
      <dt>Acting organization</dt><dd>The organization a request is made for — today a header, later your login.</dd>
    </dl>
    <p class="soft">Companion pages: <a href="prototype.html">the prototype</a> · <a href="design.html">the design brief</a>.</p>
    <div class="pager"><a href="#map">← Reading the map</a></div>
  </section>
</div>

<script>
  (function () {
    const ids = ['problem', 'building', 'pieces', 'handoff', 'matching', 'map', 'builders'];
    const links = [...document.querySelectorAll('#pages a')];
    function show() {
      const id = ids.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'problem';
      document.querySelectorAll('section.page').forEach(s => s.classList.toggle('on', s.id === id));
      links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
      const on = links.find(a => a.classList.contains('on')); if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest' });
      window.scrollTo({ top: 0 });
    }
    window.addEventListener('hashchange', show);
    show();
  })();
</script>
`;
fs.writeFileSync(file, head + body);
console.log('how-it-works rebuilt', (head + body).length);
