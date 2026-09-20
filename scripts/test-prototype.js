// Headless smoke test for docs/helpbook-prototype.html: runs the story via Play, then via manual actions,
// and checks that the guide step tracks progress both ways.   node scripts/test-prototype.js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'helpbook-prototype.html'), 'utf8');
let js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

function boot() {
  const els = { guide: { innerHTML: '', classList: { toggle() {}, add() {} } }, phone: { innerHTML: '' } };
  global.document = { getElementById: id => els[id] || null, addEventListener() {} };
  global.localStorage = { getItem: () => null, setItem() {} };
  global.confirm = () => true; global.window = { addEventListener() {} }; global.requestAnimationFrame = fn => setTimeout(() => fn(performance.now() + 1000), 0); global.cancelAnimationFrame = clearTimeout; global.matchMedia = () => ({ matches: true });
  const m = { exports: {} };
  new Function('module', 'exports', js + ';module.exports={S:()=>S,STEPS,playStep,syncStep,go,finishClaim,propose,respond,complete,switchTo,postListing};')(m, m.exports);
  return m.exports;
}
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else console.log('ok  ', msg); };

(async () => {
  // --- Play-only walk: every Play should move the guide forward by one.
  let x = boot();
  for (let i = 0; i < 7; i++) { await x.playStep(); assert(x.S().step === i + 1, `Play at step ${i + 1} advanced guide to ${i + 2} (screen ${x.S().screen})`); }
  await x.playStep(); assert(x.S().step === 7, 'Play at last step stays on last step');
  const m1 = x.S().matches.find(m => m.offer === 4); assert(m1 && m1.status === 'Completed', 'story match completed via Play');

  // --- Manual walk: user does things by hand; guide should follow.
  x = boot();
  const s = () => x.S();
  const act = (label, fn) => { const was = x.STEPS[s().step].done(); fn(); x.syncStep(was); console.log(`     ${label} -> guide at step ${s().step + 1}`); };
  act('tap Continue with Google', () => x.go('role')); assert(s().step === 1, 'sign-up tap advanced to step 2');
  act('finish claim', () => x.finishClaim()); assert(s().step === 2, 'claim advanced to step 3');
  act('open Orgs tab', () => x.go('orgs')); assert(s().step === 3, 'browsing advanced to step 4');
  act('post need', () => x.postListing({ kind: 'Need', category: 'Technology', title: 'Laptops for client intake stations', desc: '', qty: 12, unit: 'laptops', urgency: 'Critical', tags: 'laptops' }));
  assert(s().step === 4, 'posting advanced to step 5');
  const need = s().listings.find(l => l.title === 'Laptops for client intake stations');
  act('switch to Jordan', () => x.switchTo('jordan')); assert(s().step === 4, 'switching perspective alone does not advance');
  act('Jordan proposes', () => x.propose(need.id, 4, 'hi')); assert(s().step === 5, 'proposal advanced to step 6');
  act('switch to Casey', () => x.switchTo('casey'));
  act('Casey accepts', () => x.respond(s().matches.find(m=>m.offer===4).id, true)); assert(s().step === 6, 'accept advanced to step 7');
  act('switch to Jordan', () => x.switchTo('jordan'));
  act('Jordan completes', () => x.complete(s().matches.find(m=>m.offer===4).id)); assert(s().step === 7, 'complete advanced to step 8');

  // --- Prev then an unrelated action must not throw the guide forward again.
  s().step = 3; const was = x.STEPS[3].done(); x.go('feed'); x.syncStep(was);
  assert(s().step === 3, 'after Prev, a step that was already done stays put on unrelated actions');
})();
