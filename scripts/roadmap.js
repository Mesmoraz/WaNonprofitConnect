// Roadmap tooling. roadmap/roadmap.json is the single source; this validates it, derives epic and
// initiative status from their children, writes roadmap/README.md (the board, in Markdown), and
// exports renderHtml() for scripts/build-site.js. See roadmap/SDLC.md for the rules.
//
//   node scripts/roadmap.js                      validate + regenerate README + print the board
//   node scripts/roadmap.js set <id> <status>    move an item (any id)
//   node scripts/roadmap.js block <id> "reason"  / unblock <id>
//   node scripts/roadmap.js add task <S-id> "title"
//   node scripts/roadmap.js add story <E-id> "title"
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'roadmap', 'roadmap.json');
const readme = path.join(root, 'roadmap', 'README.md');
const today = () => new Date().toISOString().slice(0, 10);

function load() { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function save(d) { d.updated = today(); fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n'); }

// ---- validation ------------------------------------------------------------
function validate(d) {
  const errs = [];
  const st = new Set(d.statuses);
  const ids = new Set();
  const seen = id => { if (ids.has(id)) errs.push(`duplicate id ${id}`); ids.add(id); };
  const inits = new Set(d.initiatives.map(i => (seen(i.id), i.id)));
  const epics = new Set(d.epics.map(e => (seen(e.id), e.id)));
  for (const e of d.epics) if (!inits.has(e.initiative)) errs.push(`${e.id}: unknown initiative ${e.initiative}`);
  for (const s of d.stories) {
    seen(s.id);
    if (!epics.has(s.epic)) errs.push(`${s.id}: unknown epic ${s.epic}`);
    if (!st.has(s.status)) errs.push(`${s.id}: bad status ${s.status}`);
    if (!/^[SIET]-\d+$/.test(s.id)) errs.push(`${s.id}: bad id`);
    for (const t of s.tasks || []) { seen(t.id); if (!st.has(t.status)) errs.push(`${t.id}: bad status ${t.status}`); }
    if (/helpbook/i.test(JSON.stringify(s))) errs.push(`${s.id}: the roadmap is public; say Name TBD, not the real name`);
  }
  if (/helpbook/i.test(JSON.stringify([d.name, d.initiatives, d.epics]))) errs.push('the roadmap is public; say Name TBD, not the real name');
  const inProgress = d.stories.filter(s => s.status === 'in-progress');
  if (inProgress.length > 1) errs.push(`WIP limit: ${inProgress.length} stories in progress (${inProgress.map(s => s.id).join(', ')}); the limit is 1`);
  return errs;
}

// ---- derived status --------------------------------------------------------
const RANK = { backlog: 0, ready: 1, 'in-progress': 2, review: 2, done: 3 };
function derive(children) {
  if (!children.length) return 'backlog';
  if (children.every(c => c.status === 'done')) return 'done';
  if (children.some(c => c.status === 'in-progress' || c.status === 'review')) return 'in-progress';
  if (children.some(c => c.status === 'ready')) return 'ready';
  return 'backlog';
}
function model(d) {
  const stories = d.stories.map(s => ({ ...s, tasks: s.tasks || [] }));
  const epics = d.epics.map(e => {
    const ss = stories.filter(s => s.epic === e.id);
    const done = ss.filter(s => s.status === 'done').length;
    return { ...e, stories: ss, status: derive(ss), done, total: ss.length };
  }).sort((a, b) => a.initiative.localeCompare(b.initiative, undefined, { numeric: true }) || a.order - b.order);
  const initiatives = d.initiatives.map(i => {
    const es = epics.filter(e => e.initiative === i.id);
    const ss = es.flatMap(e => e.stories);
    return { ...i, epics: es, status: derive(es), done: ss.filter(s => s.status === 'done').length, total: ss.length };
  });
  return { ...d, stories, epics, initiatives };
}

const LABEL = { backlog: 'Backlog', ready: 'Ready', 'in-progress': 'In progress', review: 'In review', done: 'Done' };

// ---- Markdown board --------------------------------------------------------
function renderMarkdown(m) {
  const lines = [`# ${m.name}`, '', `Generated from \`roadmap.json\` on ${m.updated}. Don't edit this file; run \`node scripts/roadmap.js\`. Rules: [SDLC.md](SDLC.md).`, ''];
  lines.push('## Board', '');
  lines.push('| ' + m.statuses.map(s => LABEL[s]).join(' | ') + ' |');
  lines.push('| ' + m.statuses.map(() => '---').join(' | ') + ' |');
  const cols = m.statuses.map(s => m.stories.filter(x => x.status === s).map(x => `${x.id} ${x.title}${x.blocked ? ' ⛔' : ''}`));
  const rows = Math.max(...cols.map(c => c.length));
  for (let r = 0; r < rows; r++) lines.push('| ' + cols.map(c => c[r] || '').join(' | ') + ' |');
  lines.push('', '## Roadmap', '');
  for (const i of m.initiatives) {
    lines.push(`### ${i.id} ${i.title} · ${LABEL[i.status]} · ${i.done}/${i.total} stories done`, '', i.why, '');
    for (const e of i.epics) {
      lines.push(`#### ${e.id} ${e.title} · ${LABEL[e.status]} · ${e.done}/${e.total}`, '', e.goal, '');
      for (const s of e.stories) {
        lines.push(`- **${s.id}** ${s.title} · ${LABEL[s.status]}${s.round ? ` · round ${s.round}` : ''}${s.blocked ? ` · ⛔ ${s.blocked}` : ''}${s.source ? ` · _${s.source}_` : ''}`);
        for (const t of s.tasks) lines.push(`    - [${t.status === 'done' ? 'x' : ' '}] ${t.id} ${t.title}${t.status !== 'done' ? ` (${LABEL[t.status]})` : ''}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

// ---- Site page -------------------------------------------------------------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderHtml(m) {
  const pill = s => `<span class="pill ${s}">${LABEL[s]}</span>`;
  const task = t => `<li class="task ${t.status}"><span class="box">${t.status === 'done' ? '✓' : ''}</span><span>${esc(t.title)}</span></li>`;
  const story = (s, withEpic) => {
    const e = m.epics.find(x => x.id === s.epic);
    return `<details class="story ${s.status}${s.blocked ? ' blocked' : ''}"><summary><span class="id">${s.id}</span><span class="t">${esc(s.title)}</span>${pill(s.status)}</summary>
      <div class="body">${withEpic ? `<div class="meta">${esc(e.title)} · ${esc(m.initiatives.find(i => i.id === e.initiative).title)}</div>` : ''}${s.round ? `<div class="meta">Round ${esc(s.round)}</div>` : ''}${s.blocked ? `<div class="meta blocked">Blocked: ${esc(s.blocked)}</div>` : ''}${s.source ? `<div class="meta">${esc(s.source)}</div>` : ''}${s.tasks.length ? `<ul class="tasks">${s.tasks.map(task).join('')}</ul>` : '<div class="meta">No tasks yet. Detail gets written when this is next.</div>'}</div></details>`;
  };
  const board = `<div class="board">${m.statuses.map(s => { const ss = m.stories.filter(x => x.status === s); return `<section class="col ${s}"><h3>${LABEL[s]} <span class="n">${ss.length}</span></h3>${ss.map(x => story(x, true)).join('') || '<div class="empty">Nothing here</div>'}</section>`; }).join('')}</div>`;
  const roadmap = m.initiatives.map(i => `<section class="init"><h2><span class="id">${i.id}</span>${esc(i.title)}</h2><p class="why">${esc(i.why)}</p><div class="bar"><i style="width:${i.total ? Math.round(100 * i.done / i.total) : 0}%"></i></div><div class="meta">${i.done} of ${i.total} stories done · ${LABEL[i.status]}</div>
    ${i.epics.map(e => `<details class="epic ${e.status}"><summary><span class="id">${e.id}</span><span class="t">${esc(e.title)}</span>${pill(e.status)}<span class="frac">${e.done}/${e.total}</span></summary><div class="body"><p class="goal">${esc(e.goal)}</p>${e.stories.map(s => story(s, false)).join('') || '<div class="meta">No stories yet.</div>'}</div></details>`).join('')}</section>`).join('');
  const counts = m.statuses.map(s => `${m.stories.filter(x => x.status === s).length} ${LABEL[s].toLowerCase()}`).join(' · ');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>Name TBD roadmap</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=IBM+Plex+Sans:wght@400;600&display=swap">
<style>
  :root { --ground:#F5F7F3; --paper:#fff; --paper-2:#EEF1EC; --ink:#1B2430; --ink-2:#4B5563; --ink-3:#7C8794; --line:#D9DED7; --accent:#2E6B4E; --accent-ink:#fff; --warn:#A33A2E; --gold:#B8741A;
    --c-backlog:#8A938C; --c-ready:#3B5BA9; --c-in-progress:#B8741A; --c-review:#7A5CA8; --c-done:#2E6B4E; }
  @media (prefers-color-scheme: dark) { :root { --ground:#131A1E; --paper:#1B2329; --paper-2:#222B31; --ink:#E7EAE4; --ink-2:#B6BDB6; --ink-3:#8A938C; --line:#2E3A40; --accent:#74B894; --accent-ink:#0F1A14; --warn:#E58C7D; --gold:#E0A04B; --c-ready:#7C95D9; --c-in-progress:#E0A04B; --c-review:#B99BE0; --c-done:#74B894; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--ground); color:var(--ink); font-family:"IBM Plex Sans",system-ui,sans-serif; font-size:15px; line-height:1.45; padding:0 0 40px; }
  header { padding:20px 16px 12px; max-width:1100px; margin:0 auto; }
  header a { color:var(--accent); text-decoration:none; font-weight:600; font-size:14px; }
  h1 { font-family:"Bricolage Grotesque",sans-serif; font-size:32px; margin:6px 0 4px; letter-spacing:-0.01em; }
  .sub { color:var(--ink-2); margin:0 0 14px; font-size:14px; }
  .tabs { display:flex; gap:6px; }
  .tabs button { font:inherit; font-weight:600; font-size:14px; border:1px solid var(--line); background:var(--paper); color:var(--ink-2); padding:8px 14px; border-radius:999px; cursor:pointer; }
  .tabs button.on { background:var(--ink); color:var(--paper); border-color:var(--ink); }
  main { max-width:1100px; margin:0 auto; padding:0 16px; }
  .view { display:none; } .view.on { display:block; }
  .id { font-size:11px; font-weight:600; color:var(--ink-3); letter-spacing:0.04em; margin-right:8px; white-space:nowrap; }
  .pill { font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; background:var(--paper-2); color:var(--ink-2); white-space:nowrap; margin-left:auto; }
  .pill.ready { color:var(--c-ready); } .pill.in-progress { color:var(--c-in-progress); } .pill.review { color:var(--c-review); } .pill.done { color:var(--c-done); }
  details { background:var(--paper); border:1px solid var(--line); border-radius:12px; margin:8px 0; }
  summary { list-style:none; display:flex; align-items:center; gap:6px; padding:10px 12px; cursor:pointer; }
  summary::-webkit-details-marker { display:none; }
  summary .t { flex:1; font-weight:600; min-width:0; }
  .frac { font-size:12px; color:var(--ink-3); margin-left:6px; white-space:nowrap; }
  .body { padding:0 12px 12px; border-top:1px solid var(--line); }
  .meta { font-size:12px; color:var(--ink-3); margin-top:8px; }
  .meta.blocked { color:var(--warn); font-weight:600; }
  .goal { color:var(--ink-2); font-size:14px; margin:10px 0 4px; }
  .tasks { list-style:none; padding:0; margin:8px 0 0; }
  .task { display:flex; gap:8px; align-items:flex-start; font-size:14px; padding:4px 0; color:var(--ink-2); }
  .task .box { width:18px; height:18px; border:1.5px solid var(--line); border-radius:5px; display:grid; place-items:center; font-size:12px; flex:none; margin-top:2px; color:var(--accent-ink); }
  .task.done .box { background:var(--accent); border-color:var(--accent); }
  .task.done span:last-child { text-decoration:line-through; color:var(--ink-3); }
  .story.blocked > summary { border-left:3px solid var(--warn); border-radius:12px 0 0 12px; }
  /* roadmap view */
  .init { margin:18px 0 26px; }
  .init h2 { font-family:"Bricolage Grotesque",sans-serif; font-size:22px; margin:0 0 4px; display:flex; align-items:center; }
  .why { color:var(--ink-2); margin:0 0 8px; font-size:14px; }
  .bar { height:8px; background:var(--paper-2); border-radius:999px; overflow:hidden; }
  .bar i { display:block; height:100%; background:var(--accent); border-radius:999px; }
  .epic > summary .t { font-size:15px; }
  .epic .story { margin:8px 0 0; }
  /* board view */
  .board { display:grid; gap:14px; }
  .col h3 { font-size:14px; margin:14px 0 4px; display:flex; align-items:center; gap:8px; }
  .col h3 .n { font-size:12px; color:var(--ink-3); font-weight:600; background:var(--paper-2); padding:1px 8px; border-radius:999px; }
  .col.backlog h3 { color:var(--c-backlog); } .col.ready h3 { color:var(--c-ready); } .col.in-progress h3 { color:var(--c-in-progress); } .col.review h3 { color:var(--c-review); } .col.done h3 { color:var(--c-done); }
  .empty { color:var(--ink-3); font-size:13px; padding:10px 0; }
  /* stacked on phones: active work first; the desktop grid keeps left-to-right order */
  .col.in-progress { order:1; } .col.review { order:2; } .col.ready { order:3; } .col.done { order:4; } .col.backlog { order:5; }
  @media (min-width: 900px) { .board { grid-template-columns:repeat(5, minmax(0,1fr)); align-items:start; } .board .col { order:0; } .board .story summary { padding:8px 10px; } }
  footer { max-width:1100px; margin:30px auto 0; padding:0 16px; color:var(--ink-3); font-size:12px; line-height:1.5; }
</style>
</head>
<body>
<header>
  <a href="index.html">← Name TBD</a>
  <h1>Roadmap</h1>
  <p class="sub">${counts}. Updated ${esc(m.updated)}. Tap anything to open it.</p>
  <div class="tabs"><button class="on" data-v="roadmap">Roadmap</button><button data-v="board">Board</button></div>
</header>
<main>
  <div class="view on" id="roadmap">${roadmap}</div>
  <div class="view" id="board">${board}</div>
</main>
<footer>Initiatives hold epics, epics hold stories, stories hold tasks. Status rolls up from the bottom. The order is the current plan and changes as we learn.</footer>
<script>
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === b.dataset.v));
    try { localStorage.setItem('roadmap-view', b.dataset.v); } catch (e) {}
  }));
  try { const v = localStorage.getItem('roadmap-view'); if (v) document.querySelector('.tabs button[data-v="' + v + '"]').click(); } catch (e) {}
</script>
</body>
</html>
`;
}

// ---- CLI -------------------------------------------------------------------
function findItem(d, id) {
  for (const s of d.stories) { if (s.id === id) return s; for (const t of s.tasks || []) if (t.id === id) return t; }
  return null;
}
function nextId(d, prefix) {
  let n = 0;
  const bump = id => { const m = id.match(new RegExp(`^${prefix}-(\\d+)$`)); if (m) n = Math.max(n, +m[1]); };
  d.initiatives.forEach(i => bump(i.id)); d.epics.forEach(e => bump(e.id));
  d.stories.forEach(s => { bump(s.id); (s.tasks || []).forEach(t => bump(t.id)); });
  return `${prefix}-${n + 1}`;
}
function regenerate(d) {
  const errs = validate(d);
  if (errs.length) { console.error('roadmap.json has problems:\n  ' + errs.join('\n  ')); process.exit(1); }
  const m = model(d);
  fs.writeFileSync(readme, renderMarkdown(m) + '\n');
  return m;
}

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  const d = load();
  if (cmd === 'set') {
    const [id, status] = args; const it = findItem(d, id);
    if (!it) { console.error(`no story or task ${id}`); process.exit(1); }
    if (!d.statuses.includes(status)) { console.error(`status must be one of ${d.statuses.join(', ')}`); process.exit(1); }
    it.status = status; save(d); console.log(`${id} → ${status}`);
  } else if (cmd === 'block' || cmd === 'unblock') {
    const [id, reason] = args; const it = findItem(d, id);
    if (!it) { console.error(`no story or task ${id}`); process.exit(1); }
    if (cmd === 'block') it.blocked = reason || 'blocked'; else delete it.blocked;
    save(d); console.log(`${id} ${cmd}ed`);
  } else if (cmd === 'add') {
    const [what, parent, ...rest] = args; const title = rest.join(' ');
    if (!title) { console.error('give it a title'); process.exit(1); }
    if (what === 'task') {
      const s = d.stories.find(x => x.id === parent); if (!s) { console.error(`no story ${parent}`); process.exit(1); }
      const id = nextId(d, 'T'); (s.tasks = s.tasks || []).push({ id, title, status: 'ready' }); save(d); console.log(`${id} added to ${parent}`);
    } else if (what === 'story') {
      if (!d.epics.some(e => e.id === parent)) { console.error(`no epic ${parent}`); process.exit(1); }
      const id = nextId(d, 'S'); d.stories.push({ id, epic: parent, title, status: 'backlog', added: today(), tasks: [] }); save(d); console.log(`${id} added to ${parent}`);
    } else { console.error('add task <S-id> "title" | add story <E-id> "title"'); process.exit(1); }
  } else if (cmd) { console.error('commands: set, block, unblock, add'); process.exit(1); }
  const m = regenerate(load());
  console.log(`${m.name} · ${m.updated}`);
  for (const s of m.statuses) console.log(`  ${LABEL[s].padEnd(12)} ${m.stories.filter(x => x.status === s).length}`);
  console.log('  README regenerated');
}

module.exports = { load, model, validate, renderHtml, renderMarkdown };
