// Layout/seat geometry checks using the instrumented copy (window.__int exposes L.targets and L.zones).
import { launch, open, INSTR, W, M } from './lib.mjs';
const b = await launch();
const report = (name, x) => console.log(name, JSON.stringify(x));
const geo = (p) => p.evaluate(() => { const L = window.__int.L; return { WW: window.__cwDebug().world, targets: [...L.targets.entries()].map(([id, t]) => ({ id, x: Math.round(t.x), y: Math.round(t.y), room: t.room, seat: t.seat, q: !!t.q })), zones: [...L.zones.values()].map((z) => ({ id: z.m.id, x: z.x, y: z.y, w: z.w, h: z.h, chipsBottom: Math.max(0, ...z.chips.map((c) => c.y + c.ch)) })) }; });
const dupPos = (ts) => { const m = new Map(); for (const t of ts) { const k = t.x + ',' + t.y; m.set(k, (m.get(k) || []).concat(t.id)); } return [...m.values()].filter((v) => v.length > 1); };

// A. 120 idle/queued workers: door queues leave the world
{ const ws = []; for (let i = 0; i < 60; i++) ws.push(W('i' + i, { status: 'idle' })); for (let i = 0; i < 20; i++) ws.push(W('q' + i, { status: 'queued' })); for (let i = 0; i < 40; i++) ws.push(W('f' + i, { status: 'working', color: 'build' }));
  const { p, errs } = await open(b, { file: INSTR, init: { workers: ws } }); await p.waitForTimeout(600); const g = await geo(p);
  const out = g.targets.filter((t) => t.x < 0 || t.y < 0 || t.x > g.WW[0] || t.y > g.WW[1]);
  report('A outOfWorld', { world: g.WW, n: out.length, sample: out.slice(0, 4), errs }); await p.close(); }
// B. lunch overflow vs next-up overflow share the same door slots
{ const ws = []; for (let i = 0; i < 8; i++) ws.push(W('i' + i, { status: 'idle' })); for (let i = 0; i < 5; i++) ws.push(W('q' + i, { status: 'queued' }));
  const { p } = await open(b, { file: INSTR, init: { workers: ws } }); await p.waitForTimeout(600); const g = await geo(p);
  report('B samePos', dupPos(g.targets)); await p.close(); }
// C. 5 managers (4 teams + Threads lead) and 6 managers: zone rectangles overlap
for (const n of [4, 5, 6]) { const cols = ['research', 'write', 'build', 'store', 'ops', 'market']; const ws = cols.slice(0, n).map((c, i) => M('m' + i, c));
  const { p } = await open(b, { file: INSTR, init: { workers: ws } }); await p.waitForTimeout(500); const g = await geo(p);
  const ov = []; for (let i = 0; i < g.zones.length; i++) for (let j = i + 1; j < g.zones.length; j++) { const a = g.zones[i], c = g.zones[j]; if (a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h) ov.push(a.id + '&' + c.id + (a.x === c.x && a.y === c.y ? '(identical)' : '')); }
  report('C managers=' + n, ov); await p.screenshot({ path: `shot-zones-${n}.png` }); await p.close(); }
// D. 30 agents on one manager: roster chips run past the zone into the next one
{ const ws = [M('m1', 'research'), M('m2', 'build')]; for (let i = 0; i < 30; i++) ws.push(W('a' + i, { manager: 'm1', status: 'idle' }));
  const { p } = await open(b, { file: INSTR, init: { workers: ws } }); await p.waitForTimeout(500); const g = await geo(p);
  report('D zones', g.zones); await p.close(); }
// E. 6 temps on one team: 5th/6th share x with 1st/2nd, only 24px lower
{ const ws = [M('m1', 'research')]; for (let i = 0; i < 6; i++) ws.push(W('t' + i, { manager: 'm1', temp: true, status: 'working' }));
  const { p } = await open(b, { file: INSTR, init: { workers: ws } }); await p.waitForTimeout(500); const g = await geo(p);
  report('E temps', g.targets.filter((t) => t.id.startsWith('t'))); await p.close(); }
// F. 12 done shells: 6th+ in lunch stack 14px above the first
{ const sh = []; for (let i = 0; i < 12; i++) sh.push({ id: 's' + String(i).padStart(2, '0'), status: 'done', label: 'npm test', finishedAt: Date.now() - 1000, owner: 'coord' });
  const { p } = await open(b, { file: INSTR, init: { shells: sh } }); await p.waitForTimeout(500); const g = await geo(p);
  report('F shells', g.targets.filter((t) => t.id.startsWith('sh:')).map((t) => t.id + '@' + t.x + ',' + t.y).join(' ')); await p.close(); }
// G. duplicate ids: two docs carrying the same data.id
{ const ws = [{ ...W('dup', { name: 'First' }), __docId: 'docA' }, { ...W('dup', { name: 'Second', color: 'write' }), __docId: 'docB' }];
  const { p } = await open(b, { file: INSTR, init: { workers: ws }, panel: 'crew' }); await p.waitForTimeout(500); const g = await geo(p);
  report('G dup', { targets: g.targets, cards: await p.$$eval('#workers .w', (e) => e.map((x) => x.dataset.id + ':' + x.querySelector('b').textContent)), hits: await p.$$eval('#hits .hit', (e) => e.map((x) => x.dataset.id)).then((a) => a.filter((x) => x === 'dup').length) }); await p.close(); }
await b.close();
