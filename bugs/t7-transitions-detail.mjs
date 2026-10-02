// Status transitions, arrival at seats, detail cards per kind, and the selected item disappearing.
import { launch, open, INSTR, W, M } from './lib.mjs';
const b = await launch();
const det = (p) => p.evaluate(() => ({ open: !document.getElementById('detail').hidden, text: detailBody.textContent.replace(/\s+/g, ' ').trim().slice(0, 110), sel: window.__int.selectedId }));
const far = (p) => p.evaluate(() => { const I = window.__int, out = []; for (const [id, t] of I.L.targets) { const q = I.pos.get(id); if (q && Math.hypot(q.x - t.x, q.y - t.y) > 8) out.push(id + ' off by ' + Math.round(Math.hypot(q.x - t.x, q.y - t.y))); } return out; });
const base = [M('m1', 'research'), M('m2', 'write'), W('a1', { manager: 'm1', status: 'queued' }), W('a2', { manager: 'm1', status: 'queued', color: 'research' }), W('t1', { manager: 'm2', temp: true, status: 'working' })];
const { p, errs } = await open(b, { file: INSTR, init: { workers: base, shells: [{ id: 'old1', status: 'done', label: 'old build', owner: 'coord' }, { id: 'old2', status: 'failed', label: 'old test', owner: 'coord' }, { id: 'r1', status: 'running', label: 'npm run dev', owner: 'a1', startedAt: Date.now() }] } });
console.log('1 shells finished long ago (no finishedAt) on first load -> on floor targets:', await p.evaluate(() => [...window.__int.L.targets.keys()].filter((k) => k.startsWith('sh:'))));
// transitions: queued -> working -> reviewing -> done / failed
const step = async (label, a1, a2) => { await p.evaluate(([a1, a2, base]) => window.__set('workers', base.map((w) => w.id === 'a1' ? { ...w, status: a1 } : w.id === 'a2' ? { ...w, status: a2 } : w)), [a1, a2, base]); await p.waitForTimeout(9000);
  console.log(label, 'not at target after 9s:', JSON.stringify(await far(p)), 'stats', await p.evaluate(() => ['nWorking', 'nReview', 'nDone', 'nQueued', 'tFloor'].map((i) => document.getElementById(i).textContent).join('/'))); };
await step('2 working', 'working', 'working'); await step('3 reviewing', 'reviewing', 'reviewing'); await step('4 done/failed', 'done', 'failed');
// room detail: Terminal Bay while a shell is running
await p.evaluate(() => document.querySelector('.hit[data-id="room:term"]').click()); await p.waitForTimeout(200); console.log('5 room:term', JSON.stringify(await det(p)));
// boss and manager-without-agents cards
await p.evaluate(() => document.querySelector(`.hit[data-id="__boss"]`).click()); await p.waitForTimeout(200); console.log('6 boss', JSON.stringify(await det(p)));
await p.evaluate(() => document.querySelector('.hit[data-id="m2"]').click()); await p.waitForTimeout(200); console.log('7 m2', JSON.stringify(await det(p)));
// temp finishes while its card is open: it walks out after 14s but the card stays?
await p.evaluate(() => document.querySelector('.hit[data-id="t1"]').click()); await p.waitForTimeout(200);
await p.evaluate((base) => window.__set('workers', base.map((w) => w.id === 't1' ? { ...w, status: 'done' } : w.id.startsWith('a') ? { ...w, status: 'done' } : w)), base); await p.waitForTimeout(16000);
console.log('8 temp t1 gone from floor? target=', await p.evaluate(() => window.__int.L.targets.has('t1')), 'pos=', await p.evaluate(() => window.__int.pos.has('t1')), 'detail', JSON.stringify(await det(p)), 'tFloor=', await p.$eval('#tFloor', (e) => e.textContent), 'temp hit button present=', await p.evaluate(() => !!document.querySelector('.hit[data-id="t1"]')));
// selected worker deleted
await p.evaluate(() => document.querySelector('.hit[data-id="a1"]').click()); await p.waitForTimeout(200);
await p.evaluate((base) => window.__set('workers', base.filter((w) => w.id !== 'a1')), base); await p.waitForTimeout(300); console.log('9 a1 deleted', JSON.stringify(await det(p)));
// 60 events in the last hour, but the query is limit(40)
await p.evaluate(() => window.__set('events', Array.from({ length: 60 }, (_, i) => ({ id: 'e' + i, t: Date.now() - i * 30000, text: 'e' + i })))); await p.waitForTimeout(1200);
console.log('10 events in last hour shown =', await p.$eval('#tHour', (e) => e.textContent), '(60 really happened)');
console.log('ERR', errs);
await b.close();
