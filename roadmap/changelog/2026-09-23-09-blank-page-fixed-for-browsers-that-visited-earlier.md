## 2026-09-23 · Blank page fixed for browsers that visited earlier

**Story:** S-76. From Taylor: "it's blank when I open it".

### What changed

- The app no longer keeps an offline copy of itself. That copy (a service worker) had saved the broken files from earlier today and kept serving them, so the page stayed blank. The new version removes the old copy on every device the next time it opens. It can still be added to a home screen.

### Test cases

1. **[verified]** In a browser that had the old copy, open the site twice. → "Join Helpbook" with the Google button, and no offline copy left.
2. **[needs your phone]** On your computer and phone, open the site, close it, open it again. → The sign-in page.
