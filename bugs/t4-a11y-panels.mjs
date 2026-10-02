// Panels, Escape, focus, 44px targets, ticker overlap, on 1440 and 390.
import { launch, open, W, M } from './lib.mjs';
const b = await launch();
const ws = [M('m1', 'research', { status: 'working' })]; for (let i = 0; i < 12; i++) ws.push(W('a' + i, { manager: 'm1', status: ['working', 'queued', 'failed'][i % 3] }));
const ev = []; for (let i = 0; i < 30; i++) ev.push({ id: 'e' + i, t: Date.now() - i * 1000, who: 'a' + i, text: 'Event number ' + i, level: 'info' });
for (const [vw, vh] of [[1440, 900], [390, 844]]) {
  const { p, errs } = await open(b, { w: vw, h: vh, init: { workers: ws, events: ev } });
  const act = () => p.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.className || a.tagName) + (a.dataset && a.dataset.id ? '[' + a.dataset.id + ']' : '') : null; });
  // small targets among visible interactive controls (excluding the canvas hit buttons)
  const small = await p.evaluate(() => [...document.querySelectorAll('button:not(.hit),a,[tabindex="0"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden],[inert]') && (r.width < 44 || r.height < 44); }).map((e) => `${e.id || e.className}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
  console.log(vw, 'small targets', JSON.stringify(small.slice(0, 12)), small.length);
  for (const panel of ['now', 'crew', 'feed', 'threads']) {
    await p.click(`.tg[data-panel="${panel}"]`); await p.waitForTimeout(500);
    const g = await p.evaluate((panel) => { const pr = document.getElementById('p-' + panel).getBoundingClientRect(), tk = ticker.getBoundingClientRect(), mc = mapctl.getBoundingClientRect(), top = document.getElementById('top').getBoundingClientRect();
      return { panel: [Math.round(pr.top), Math.round(pr.bottom), Math.round(pr.left), Math.round(pr.right)], tickerTop: Math.round(tk.top), overTicker: pr.bottom > tk.top + 1, overTop: pr.top < top.bottom - 1, overMapctl: pr.bottom > mc.top + 1 && pr.left < mc.right && pr.right > mc.left, hs: document.documentElement.scrollWidth > innerWidth }; }, panel);
    console.log(vw, panel, JSON.stringify(g));
  }
  // focus handling: Tab into the crew panel close button, press Escape
  await p.click('.tg[data-panel="crew"]'); await p.focus('#p-crew [data-close]'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  console.log(vw, 'after Escape from inside panel, focus =', await act());
  // Enter on a crew card opens detail: where does focus go?
  await p.click('.tg[data-panel="crew"]'); await p.waitForTimeout(300); await p.focus('#workers .w[data-id="a3"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  console.log(vw, 'after Enter on card, focus =', await act(), 'detail hidden=', await p.$eval('#detail', (e) => e.hidden), 'panelOpen=', await p.$eval('#p-crew', (e) => e.classList.contains('open')));
  // focus a card, then a data update arrives
  if (vw > 700) { await p.keyboard.press('Escape'); await p.focus('#workers .w[data-id="a4"]'); await p.evaluate(() => { const w = window.__lastW; }); 
    await p.evaluate((ws) => window.__set('workers', ws.map((w) => w.id === 'a5' ? { ...w, activity: 'changed' } : w)), ws); await p.waitForTimeout(200);
    console.log(vw, 'focused card a4, then snapshot changed a5: focus =', await act()); }
  if (vw < 700) { await p.click('.tg[data-panel="now"]'); await p.waitForTimeout(400); await p.screenshot({ path: 'shot-390-now.png' }); await p.click('.tg[data-panel="threads"]'); await p.waitForTimeout(400); await p.screenshot({ path: 'shot-390-threads.png' }); }
  console.log('ERR', errs);
  await p.close();
}
await b.close();
