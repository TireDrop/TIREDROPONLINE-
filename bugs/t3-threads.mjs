// Threads panel: data, empty, error codes, user_changed, archived toggle, thread robots + detail cards.
import { launch, open, INSTR } from './lib.mjs';
const b = await launch();
const now = Date.now(), iso = (m) => new Date(now - m * 60000).toISOString();
const TH = [
  { id: 'session_a', title: 'Write blog batch posts', session_status: 'SESSION_STATUS_RUNNING', status_bucket: 'SESSION_STATUS_BUCKET_WORKING', created_at: iso(40), updated_at: iso(1), post_turn_summary: { status_detail: 'Drafting post 3 of 7', recent_action: 'Ran checks' } },
  { id: 'session_b', title: 'Fix checkout bug', session_status: 'SESSION_STATUS_IDLE', status_bucket: 'SESSION_STATUS_BUCKET_BLOCKED', created_at: iso(300), updated_at: iso(20), post_turn_summary: { needs_action: 'Pick A or B' } },
  { id: 'session_d', title: 'Old thread', session_status: 'SESSION_STATUS_ARCHIVED', status_bucket: 'SESSION_STATUS_BUCKET_COMPLETED', created_at: iso(9000), updated_at: iso(8000) },
];
const S = (p) => p.evaluate(() => ({ state: thState.textContent, hiddenState: thState.hidden, rows: [...document.querySelectorAll('#thList li')].map((l) => l.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)), more: thMore.hidden ? '(hidden)' : thMore.textContent, tg: thTgN.textContent, sub: thN.textContent,
  robots: [...window.__int.L.targets.keys()].filter((k) => k.startsWith('th:')), stats: ['nWorking', 'nReview', 'tFloor'].map((i) => document.getElementById(i).textContent).join('/') }));
const { p, errs } = await open(b, { file: INSTR, panel: 'threads', threads: TH });
await p.waitForTimeout(400);
console.log('1 data', JSON.stringify(await S(p)));
await p.click('#thMore'); console.log('2 archived on', JSON.stringify((await S(p)).rows), (await S(p)).more);
await p.click('#thMore');
// open a thread robot's detail card, then a user switch arrives
await p.evaluate(() => document.querySelector('.hit[data-id="th:session_a"]').click()); await p.waitForTimeout(300);
console.log('3 detail th:', await p.$eval('#detailBody', (e) => e.textContent.replace(/\s+/g, ' ').slice(0, 140)), await p.$eval('#detail .d-link', (a) => a.href).catch(() => 'no link'));
await p.evaluate(() => window.__thEmit({ type: 'error', error: { code: 'user_changed' } })); await p.waitForTimeout(1500);
console.log('4 after user_changed', JSON.stringify(await S(p)), 'detailOpen=', await p.$eval('#detail', (e) => !e.hidden));
for (const code of ['needs_reauth', 'rate_limited']) { await p.evaluate(() => window.__thEmit({ type: 'data', result: { payload: { ccr: { data: [], has_more: false } } } }));
  console.log('5 empty', JSON.stringify((await S(p)).rows));
  await p.evaluate((c) => window.__thEmit({ type: 'error', error: { code: c } }), code); console.log('6', code, JSON.stringify(await S(p))); }
await p.evaluate(() => window.__thEmit({ type: 'data', result: { payload: 'not json' } })); console.log('7 bad payload', (await S(p)).state);
console.log('ERR', errs);
await b.close();
