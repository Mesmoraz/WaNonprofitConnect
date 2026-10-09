## 2026-10-09 · Roadmap after the Oct 9 merges

**Process change.** Taylor asked Claude to merge the open pull requests, and added the permission (Oct 9).

### What changed

- Merged in this order, with each conflict resolved and the tests rerun: #32 (.NET 10), #20, #21, #22, #23, #24, #25, #26, #28, #29, #30, #31. #27 was closed as a duplicate of #32.
- On the roadmap, the merged stories and tasks are now done. The stories whose briefs were approved by merging #26 and #28 are now ready: Admin numbers, Your organization, inviting colleagues, editing a post, and the small lines.
- `SDLC.md` and `CLAUDE.md`: Claude merges only when Taylor asks in chat. Turning on auto-fix is not approval to merge.
- The Admin "Waiting on someone" acceptance test now waits for the list to load before it checks it. It failed on databases that already held old test threads.
- New task: switch the production App Service to .NET 10 just before the next production deploy. Staging already runs .NET 10.

### Test cases

1. **[verified]** On `main` after the merges, all 230 API tests pass on .NET 10, typecheck and lint pass, `npm audit` finds 0 vulnerabilities, and all 37 acceptance tests pass.
2. **[verified]** The fixed Admin test passes on a database with old threads.
3. **[needs you]** Before the next **Deploy to production**, set `helpbook-alpha` to .NET 10 in the Azure portal (Configuration, then General settings).
4. **[needs your phone]** On staging, run the phone checks from #20 to #25 and #31. They're all on staging together now.
