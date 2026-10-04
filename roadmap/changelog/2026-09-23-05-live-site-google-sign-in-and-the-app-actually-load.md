## 2026-09-23 · Live site: Google sign-in, and the app actually loads

**Story:** S-75.

### What changed

- Google sign-in is set up on the live site.
- The live site was a blank page. Every script and style was answered with the page itself. It loads now.
- Deploying is one command, `scripts/deploy-azure.ps1`. Its zip used Windows paths that Azure's Linux servers rejected. Fixed.

### Test cases

1. **[verified]** Open https://helpbook-alpha.azurewebsites.net → "Join Helpbook" and **Sign in with Google**.
2. **[needs your phone]** Tap **Sign in with Google** and pick taylor.philpott@gmail.com. → "Your invite code".
3. **[needs your phone]** Tap your name, then **Admin**. → The admin page, with "No one is waiting."
4. **[needs your phone]** Make a code for your own test organization, redeem it on the invite screen. → The board.
