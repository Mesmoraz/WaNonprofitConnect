// Which roadmap stories have automated tests. Reads roadmap/roadmap.json and finds story ids in test names:
//   browser acceptance tests (app/e2e/*.spec.ts): test('[S-20] ...')
//   API and service tests (tests/**/*.cs): [Trait("Story", "S-20")] on the test method
// Prints a Markdown table of the stories that are built (review or done) in the alpha's epics, covered or not.
//   node scripts/acceptance.js            the table
//   node scripts/acceptance.js --all      every built story, not only the alpha's
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const roadmap = JSON.parse(fs.readFileSync(path.join(root, 'roadmap', 'roadmap.json'), 'utf8'));
const ALPHA_INITIATIVE = 'I-6';   // the alpha: accounts, the core loop, the map, live and invited

function files(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ['bin', 'obj', 'node_modules'].includes(e.name) ? [] : files(p, ext);
    return p.endsWith(ext) ? [p] : [];
  });
}

const found = {};   // story id -> { e2e: [test names], api: [files] }
const note = (id, kind, what) => ((found[id] ??= { e2e: [], api: [] })[kind].push(what));

for (const f of files(path.join(root, 'app', 'e2e'), '.spec.ts')) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/test\(\s*'((?:\[S-\d+\]\s*)+)([^']*)'/g)) {
    for (const id of m[1].match(/S-\d+/g)) note(id, 'e2e', m[2].trim());
  }
}
// API and service tests carry [Trait("Story", "S-71")] on the test method.
for (const f of files(path.join(root, 'tests'), '.cs')) {
  const src = fs.readFileSync(f, 'utf8');
  // One or more [Trait("Story", ...)] lines, any other attributes, then the method name.
  for (const m of src.matchAll(/((?:\[[^\]\n]*Trait\("Story",[^\]\n]*\]\s*)+)(?:\[[^\]\n]*\]\s*)*public\s+(?:async\s+)?\w+(?:<\w+>)?\s+(\w+)\s*\(/g)) {
    for (const id of m[1].match(/S-\d+/g)) note(id, 'api', m[2].replace(/_/g, ' '));
  }
}

const all = process.argv.includes('--all');
const epics = new Set(roadmap.epics.filter(e => all || e.initiative === ALPHA_INITIATIVE).map(e => e.id));
const built = roadmap.stories.filter(s => epics.has(s.epic) && (s.status === 'review' || s.status === 'done'));
const covered = built.filter(s => found[s.id]);

const rows = built.map(s => {
  const f = found[s.id];
  const tests = f ? [...f.e2e.map(t => `browser: ${t}`), ...f.api.map(a => `API: ${a}`)].join('<br>') : '';
  return `| ${f ? '✅' : '⬜'} | ${s.id} | ${s.title.replace(/\|/g, '/')} | ${s.status} | ${tests} |`;
});

console.log(`### Acceptance tests: ${covered.length} of ${built.length} built ${all ? '' : 'alpha '}stories covered\n`);
console.log('| | Story | What it is | Status | Tests |');
console.log('|---|---|---|---|---|');
console.log(rows.join('\n'));
