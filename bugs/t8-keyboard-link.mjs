// Keyboard reach (tab order with many robots), unvalidated w.link scheme, and the LIVE pill after a listener error.
import { launch, open, W } from './lib.mjs';
const b = await launch();
const ws = Array.from({ length: 30 }, (_, i) => W('a' + i, { status: 'working' }));
ws.push(W('evil', { link: 'javascript:document.title="PWNED-"+(typeof opener)', status: 'working', name: 'Evil' }));
const { p, errs } = await open(b, { init: { workers: ws } });
let n = 0; for (; n < 80; n++) { await p.keyboard.press('Tab'); const id = await p.evaluate(() => document.activeElement.dataset.panel || document.activeElement.id); if (id === 'now') break; }
console.log('Tab presses before reaching the first panel toggle (Now):', n + 1);
await p.evaluate(() => document.querySelector('.hit[data-id="evil"]').click()); await p.waitForTimeout(200);
console.log('detail link href =', await p.$eval('#detail .d-link', (a) => a.getAttribute('href')));
const pagePromise = p.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);
await p.click('#detail .d-link'); const np = await pagePromise; await p.waitForTimeout(800);
console.log('opener title =', await p.title(), '| new tab =', np ? await np.url() + ' title=' + await np.title().catch(() => '?') : 'none');
// listener error then recovery
await p.evaluate(() => window.__err('events', 'unavailable')); await p.waitForTimeout(100);
await p.evaluate((ws) => window.__set('workers', ws), ws); await p.evaluate(() => window.__set('events', [{ id: 'z', t: Date.now(), text: 'still flowing' }])); await p.waitForTimeout(300);
console.log('pill after error + later snapshots:', await p.$eval('#liveTxt', (e) => e.textContent), '| feed:', await p.$eval('#feed', (e) => e.textContent.trim().slice(0, 30)));
console.log('ERR', errs);
await b.close();
