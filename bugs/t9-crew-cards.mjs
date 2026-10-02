// Crew cards: a long unbroken name runs out of the card; duplicate data.id makes the second card open the first worker.
import { launch, open, W } from './lib.mjs';
const b = await launch();
for (const vw of [1440, 390]) {
  const ws = [W('long', { name: 'N'.repeat(120), status: 'working' }), { ...W('dup', { name: 'First' }), __docId: 'docA' }, { ...W('dup', { name: 'Second', color: 'write', task: 'Second task' }), __docId: 'docB' }];
  const { p, errs } = await open(b, { w: vw, h: vw > 700 ? 900 : 844, init: { workers: ws }, panel: 'crew' });
  await p.evaluate(() => { if (!document.getElementById('p-crew').classList.contains('open')) document.querySelector('.tg[data-panel="crew"]').click(); }); await p.waitForTimeout(500);
  console.log(vw, JSON.stringify(await p.evaluate(() => { const card = document.querySelector('#workers .w[data-id="long"]'), nm = card.querySelector('.w-top b'), pill = card.querySelector('.w-top .pill');
    const c = card.getBoundingClientRect(), n = nm.getBoundingClientRect(), pl = pill.getBoundingClientRect();
    return { cardRight: Math.round(c.right), nameRight: Math.round(n.right), nameOverflowsCard: n.right > c.right + 1, pillVisible: pl.left < c.right - 4 && pl.width > 0, pillLeft: Math.round(pl.left) }; })));
  await p.locator('#workers .w', { hasText: 'Second' }).first().click(); await p.waitForTimeout(200);
  console.log(vw, 'clicked the "Second" card -> detail shows:', await p.$eval('#detailBody b', (e) => e.textContent));
  await p.screenshot({ path: `shot-crew-long-${vw}.png` }); await p.close(); if (errs.length) console.log(errs);
}
await b.close();
