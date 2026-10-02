// Edge-case data sweep: 0/30/120 workers, bad fields, long names, duplicates, orphan agents. Looks for JS errors and NaN/undefined in the DOM.
import { launch, open, W, M } from './lib.mjs';
const b = await launch();
const COLS = ['research', 'write', 'build', 'ops', 'review', 'store', 'market'], STS = ['working', 'reviewing', 'done', 'failed', 'queued', 'idle'];
const mk = (n) => { const mg = [M('m1', 'research'), M('m2', 'write'), M('m3', 'build'), M('m4', 'store')]; const out = [...mg];
  for (let i = 0; i < n; i++) out.push(W('a' + i, { color: COLS[i % 7], status: STS[i % 6], manager: 'm' + (1 + (i % 4)), progress: (i * 7) % 101, temp: i % 9 === 0 })); return out; };
const bad = [
  { id: 'x1' }, { id: 'x2', status: 'paused', color: 'purple' }, { id: 'x3', name: 'N'.repeat(300), task: 'T '.repeat(400), status: 'working', color: 'write' },
  { id: 'x4', status: 'working', manager: 'ghost' }, M('lonely', 'ops'), { id: 'x5', status: 'done', progress: 0, startedAt: 0, finishedAt: 0 },
  { id: 'x6', status: 'working', startedAt: 'yesterday', progress: '50' }, { id: 'x7', kind: 'manager', status: 'working' }, { id: 'x8', temp: true, status: 'queued' },
];
const cases = { zero: [], n30: mk(30), n120: mk(120), bad };
for (const [name, workers] of Object.entries(cases)) {
  for (const [vw, vh] of [[1440, 900], [390, 844]]) {
    const { p, errs } = await open(b, { w: vw, h: vh, init: { workers, status: { mission: 'M', bossName: 'Jay' } }, panel: 'crew' });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const txt = document.body.innerText; const bad = (txt.match(/.{0,30}(NaN|undefined|null|\[object).{0,30}/g) || []).slice(0, 5);
      const ov = [...document.querySelectorAll('.panel.open, .panel.open *')].filter((e) => e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible').length;
      return { bad, stats: ['nWorking', 'nReview', 'nDone', 'nQueued', 'nShell', 'tFloor'].map((i) => document.getElementById(i).textContent).join('/'), cards: document.querySelectorAll('#workers .w').length, hscroll: document.documentElement.scrollWidth > innerWidth, ov, floor: window.__cwFloorStats.n, maxMs: Math.round(window.__cwFloorStats.max) };
    });
    console.log(name, vw, JSON.stringify(r), errs.slice(0, 3));
    await p.screenshot({ path: `shot-${name}-${vw}.png` });
    await p.close();
  }
}
await b.close();
