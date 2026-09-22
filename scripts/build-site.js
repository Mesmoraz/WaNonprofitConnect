// Builds the public static site (prototype + design brief) from the artifact-format pages in docs/.
// The artifact pages omit <html>/<head>/<body>; this wraps them as complete documents, adds the
// viewport/robots meta, and loads Mermaid for the design brief (the artifact viewer renders it natively).
//
//   node scripts/build-site.js [outDir]      default outDir: ../helpbook-site (sibling folder, its own git repo)
const fs = require('fs');
const path = require('path');
const roadmap = require('./roadmap');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, '..', 'helpbook-site'));
fs.mkdirSync(out, { recursive: true });

function wrap(srcFile, { extraHead = '', extraBody = '' } = {}) {
  const src = fs.readFileSync(path.join(root, 'docs', srcFile), 'utf8');
  const cut = src.indexOf('</style>') + '</style>'.length;      // title + fonts + style live before this
  const stamp = new Date().toISOString().slice(0,16).replace('T',' ') + ' UTC';
  const head = src.slice(0, cut), body = src.slice(cut).replace('>working copy<', '>' + stamp + '<');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
${head}
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
${extraHead}
</head>
<body>
${body}
${extraBody}
</body>
</html>
`;
}

const mermaid = `<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
<script>
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  mermaid.initialize({ startOnLoad: true, theme: dark ? 'dark' : 'neutral', securityLevel: 'loose' });
</script>`;

fs.writeFileSync(path.join(out, 'prototype.html'), wrap('helpbook-prototype.html'));
fs.writeFileSync(path.join(out, 'design.html'), wrap('helpbook-step2-design.html', { extraBody: mermaid }));
fs.writeFileSync(path.join(out, 'how-it-works.html'), wrap('how-it-works.html'));
fs.copyFileSync(path.join(root, 'docs', 'keytest.html'), path.join(out, 'keytest.html'));  // temporary diagnostic, see roadmap S-63

// Roadmap page: generated from roadmap/roadmap.json (validated first; a bad file fails the build).
{ const d = roadmap.load(); const errs = roadmap.validate(d);
  if (errs.length) { console.error('roadmap.json has problems:\n  ' + errs.join('\n  ')); process.exit(1); }
  fs.writeFileSync(path.join(out, 'roadmap.html'), roadmap.renderHtml(roadmap.model(d))); }

fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Name TBD</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>
  :root { --ground:#F5F7F3; --paper:#fff; --ink:#1B2430; --ink-2:#4B5563; --line:#D9DED7; --accent:#2E6B4E; --accent-ink:#fff; }
  @media (prefers-color-scheme: dark) { :root { --ground:#131A1E; --paper:#1B2329; --ink:#E7EAE4; --ink-2:#B6BDB6; --line:#2E3A40; --accent:#74B894; --accent-ink:#0F1A14; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:var(--ground); color:var(--ink); font-family:"IBM Plex Sans",system-ui,sans-serif; padding:24px 16px; }
  main { max-width: 520px; width: 100%; }
  h1 { font-family:"Bricolage Grotesque",sans-serif; font-size:44px; margin:0 0 6px; letter-spacing:-0.01em; }
  p { color:var(--ink-2); line-height:1.5; margin:0 0 22px; }
  a.card { display:block; background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:16px 18px; text-decoration:none; color:inherit; margin-bottom:12px; }
  a.card:hover { border-color:var(--accent); }
  a.card b { display:block; font-size:18px; margin-bottom:2px; }
  a.card span { color:var(--ink-2); font-size:14px; }
  a.card.primary { background:var(--accent); color:var(--accent-ink); border-color:var(--accent); }
  a.card.primary span { color:inherit; opacity:0.85; }
  small { display:block; color:var(--ink-2); font-size:12px; margin-top:18px; line-height:1.5; }
</style>
</head>
<body>
<main>
  <h1>Name TBD</h1>
  <p>Where Washington's 35,000 nonprofits say what they need and what they have — and get connected. A working concept, not a product yet.</p>
  <a class="card primary" href="prototype.html"><b>Try the prototype →</b><span>Play the story from both sides: a food bank needs laptops, a refurbisher has them. Works on your phone.</span></a>
  <a class="card" href="how-it-works.html"><b>How it works</b><span>Every part of the system explained in plain language — where the data comes from, how matching decides, what the map shows, and every endpoint.</span></a>
  <a class="card" href="design.html"><b>Read the design brief</b><span>Account types, verification, wireframes, data model, and the plan.</span></a>
  <a class="card" href="roadmap.html"><b>See the roadmap</b><span>What is done, what is next, and what is waiting. Updated as the work moves.</span></a>
  <small>Organizations are real WA 501(c)(3)s from the IRS Business Master File. People, listings and messages are invented. Nothing you do here is stored or sent anywhere.</small>
</main>
</body>
</html>
`);

fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, 'README.md'), `# Name TBD — prototype site

Static pages only: the clickable prototype, the design brief, how it works, and the roadmap. Generated from the (private) WaNonprofitConnect repo by \`scripts/build-site.js\`; edit there, not here.
`);
console.log('Built site →', out);
for (const f of fs.readdirSync(out)) console.log('  ', f, fs.statSync(path.join(out, f)).size, 'bytes');
