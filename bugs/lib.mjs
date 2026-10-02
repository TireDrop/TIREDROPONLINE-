// Shared harness: stubs window.claude (db + mcp) with push-able snapshots.
import { chromium } from 'playwright';
import path from 'path';
export const DIR = path.dirname(new URL(import.meta.url).pathname);
export const ORIG = path.resolve(DIR, '../dreamteam.html');
export const INSTR = path.resolve(DIR, 'dt-instr.html');   // identical copy + one line exposing internal maps as window.__int
export async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); }
export async function open(b, { file = ORIG, w = 1440, h = 900, init = {}, panel = null, threads = null, noDb = false, noMcp = false } = {}) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror: ' + e)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(({ init, panel, threads, noDb, noMcp }) => {
    const L = { workers: [], events: [], shells: [], status: [] }, E = { workers: [], events: [], shells: [], status: [] };
    const D = { workers: init.workers || [], events: init.events || [], shells: init.shells || [], status: init.status || null };
    const snap = (arr) => ({ docs: arr.map((x, i) => ({ id: x.__docId || x.id || 'd' + i, data: () => { const c = { ...x }; delete c.__docId; return c; } })) });
    const fire = (k) => { for (const cb of L[k]) cb(k === 'status' ? { exists: !!D.status, data: () => D.status } : snap(k === 'events' ? D.events.slice().sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 40) : D[k])); };
    window.__set = (k, v) => { D[k] = v; fire(k); };
    window.__err = (k, code) => { for (const cb of E[k]) cb({ code }); };
    const coll = (k) => { const o = { onSnapshot(cb, err) { L[k].push(cb); if (err) E[k].push(err); setTimeout(() => fire(k), 30); return () => {}; }, orderBy() { return o; }, limit() { return o; } }; return o; };
    const db = { collection: (path) => coll(path), doc: () => coll('status') };
    const mcp = { watchTool(s, t, i, h) { window.__th = h; window.__thUnsub = 0; if (threads) setTimeout(() => h({ type: 'data', result: { payload: { ccr: { data: threads, has_more: false } } } }), 40); return () => { window.__thUnsub++; }; } };
    window.__thEmit = (ev) => window.__th && window.__th(ev);
    window.claude = { use: async (n) => (n === 'db' ? (noDb ? null : db) : n === 'mcp' ? (noMcp ? null : mcp) : null) };
    try { localStorage.clear(); if (panel) localStorage.setItem('cw-panel', panel); } catch (e) {}
  }, { init, panel, threads, noDb, noMcp });
  await p.goto('file://' + file);
  await p.waitForTimeout(700);
  return { p, errs };
}
export const W = (id, o = {}) => ({ id, name: o.name || id, color: 'build', status: 'working', task: 'Task for ' + id, activity: 'Doing ' + id, startedAt: Date.now() - 60000, updatedAt: Date.now(), ...o });
export const M = (id, color, o = {}) => ({ id, name: 'Mgr ' + id, kind: 'manager', team: 'Team ' + id, color, status: 'idle', ...o });
export const posOf = (p, id) => p.evaluate((id) => window.__cwW2S(id), id);
