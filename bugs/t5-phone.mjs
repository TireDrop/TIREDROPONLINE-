// Phone (390px): Today chip row inside the Now sheet is shifted off-screen; ticker paints over the bottom of open sheets.
import { launch, open, W } from './lib.mjs';
const b = await launch();
const ev = [{ id: 'e1', t: Date.now(), who: 'a1', text: 'Shipped the thing' }];
const { p } = await open(b, { w: 390, h: 844, init: { workers: [W('a1'), W('a2', { status: 'queued' })], events: ev }, panel: 'now' });
await p.click('.tg[data-panel="now"]').catch(() => {}); await p.evaluate(() => { if (!document.getElementById('p-now').classList.contains('open')) document.querySelector('.tg[data-panel="now"]').click(); }); await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(() => {
  const c = chiprow.getBoundingClientRect(), t = document.querySelector('.today').getBoundingClientRect(), pn = document.getElementById('p-now').getBoundingClientRect();
  const tk = ticker.getBoundingClientRect(), x = 200, y = Math.round(tk.top + tk.height / 2), topEl = document.elementFromPoint(x, y);
  return { chipParent: chiprow.parentElement.id, chipLeft: Math.round(c.left), chipWidth: Math.round(c.width), todayLeft: Math.round(t.left), todayH: Math.round(t.height), todayScrollH: document.querySelector('.today').scrollHeight, transform: getComputedStyle(chiprow).transform,
    panelBottom: Math.round(pn.bottom), tickerTop: Math.round(tk.top), elementAtTickerRow: topEl && (topEl.closest('.ticker') ? 'TICKER (covers panel)' : topEl.closest('.panel') ? 'panel' : topEl.tagName) };
})));
await p.screenshot({ path: 'shot-390-now-chiprow.png', clip: { x: 0, y: 300, width: 390, height: 200 } });
await b.close();
