## 2026-10-10 · Your organization: what you do, a website, who to ask (S-99)

**Story S-99,** Round 1 of `docs/ALPHA-PLAN.md`. Brief: "Your organization" in `docs/ALPHA-BRIEFS.md`, the About you part and the lines on the organization's page (approved by merging #28). People here and Invite someone come with S-95.

### What changed

- New **Your organization** in the name menu, above "Send feedback", for people confirmed for an organization. It shows the name, the "Seattle · Food · EIN" line, and About you: What you do (one line, 140 characters), Website, and Who to ask (a chip per person here). Save shows "Saved."
- An organization's page now shows the What you do line, the website as a link, and "Ask for {first name}" under its name. Anything not filled in is left out. The email is never shown.
- API: `GET` and `PUT /api/v1/org`, and the page gains `about`, `website` and `askFor`. A new `OrgProfiles` table, so the IRS import never touches it. Contract in `docs/ALPHA.md`.
- The demo does the same: Ballard Food Bank has Maria as a colleague, and the West Seattle Tool Library and Second Harvest pages already say what they do.
- Defaults taken on the brief's open questions: "What you do" shows only on the organization's page, not on posts (as the brief recommended). The word "Optional" isn't shown on Website; the field just can be left empty.
- One new sentence the brief didn't cover: a website that isn't one shows "Enter a website like yourorganization.org." It needs your OK (T-239).

### Test cases

1. **[verified]** 7 new API tests pass (trims and adds https, refuses non-web links, who to ask must be confirmed here, pending people can't read or save, the page shows a first name and never an email, who to ask clears if the person goes, the IRS import leaves it alone). All 237 API tests pass.
2. **[verified]** New acceptance test `[S-99]`: a member fills About you and saves, and someone at another organization sees the line, the link and "Ask for …", with no email. All 38 acceptance tests pass (1 skipped: fresh database only).
3. **[verified]** In the demo at phone width: the menu item, the screen's words, Save, and three organization pages (filled in, seeded, and nothing said).
4. **[needs your phone]** On staging, open your name, then **Your organization**. Type a line and a website without `https://`, pick yourself, tap **Save**. You should see "Saved." and the website with `https://` in front.
5. **[needs your phone]** Open your organization from the map, or from a post. The line, the website link and "Ask for {your first name}" show under the name. Tap the link: it opens in a new tab.
6. **[needs your phone]** Clear all three and save. The organization's page goes back to how it was.
