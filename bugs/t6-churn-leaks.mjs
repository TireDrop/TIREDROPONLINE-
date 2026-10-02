// Compressed "5-minute" churn: 300 one-second ticks of worker/temp/shell/event churn pushed at 10x speed.
// Measures internal maps (instrumented copy) and transitions; checks robots reach seats and counts stay right.
import { launch, open, INSTR, W, M } from './lib.mjs';
const b = await launch();
const { p, errs } = await open(b, { file: INSTR, init: { workers: [M('m1', 'build')], status: { mission: 'Churn' } } });
const sizes = () => p.evaluate(() => { const I = window.__int; return { seenEv: I.seenEv.size, said: I.said.size, chat: I.chat.size, chatOk: I.chatOk.size, tempDone: I.tempDone.size, shellEnd: I.shellEnd.size, mgrPulse: I.mgrPulse.size, bursts: I.bursts.size, flights: I.flights.length, pos: I.pos.size, workers: I.workers.length, hits: I.hitEls.size, ticker: track.children.length }; });
await p.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const ST = ['queued', 'working', 'reviewing', 'done'];
  let evs = [], shells = [];
  for (let tick = 0; tick < 300; tick++) {
    const ws = [{ id: 'm1', kind: 'manager', name: 'Lead', team: 'Core', color: 'build', status: 'working' }];
    // a rolling window of 8 agents (ids change over time), each walking queued->working->reviewing->done
    for (let k = 0; k < 8; k++) { const n = Math.floor(tick / 4) + k, age = tick - (n - k) * 4; ws.push({ id: 'w' + n, name: 'W' + n, manager: 'm1', color: 'build', temp: n % 3 === 0, status: ST[Math.min(3, Math.max(0, Math.floor((age + k) / 3) % 5))], task: 'Job ' + n, activity: 'Step ' + tick, startedAt: Date.now() - 5000, updatedAt: Date.now() }); }
    window.__set('workers', ws);
    evs.push({ id: 'e' + tick, t: Date.now(), who: 'w' + tick, text: 'event ' + tick }); evs = evs.slice(-40); window.__set('events', evs);
    shells.push({ id: 's' + tick, status: 'running', label: 'cmd', owner: 'm1', startedAt: Date.now() }); shells = shells.slice(-6).map((x, i) => (i < 3 ? { ...x, status: 'done', finishedAt: Date.now() } : x)); window.__set('shells', shells);
    await sleep(100);
  }
});
console.log('after 300 ticks', JSON.stringify(await sizes()));
await p.waitForTimeout(3000);
console.log('3s later   ', JSON.stringify(await sizes()));
console.log('ERR', errs.slice(0, 3));
await b.close();
