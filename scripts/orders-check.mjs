/**
 * My Orders on /track, against the built site in Chromium with a mocked
 * POST /api/track (no Shopify, nothing real):
 *
 *   First visit
 *   - no saved orders: no "My Orders", the same lookup form as before, a
 *     "Remember this order on this device" box that is OFF; a lookup shows
 *     the status timeline and a carrier button and stores nothing;
 *   Remembering
 *   - ticking the box (plus a name) keeps exactly { orders: [{ order, email,
 *     label }] } under tiredrop.orders.v1 and nothing else (no other
 *     storage, no cookie), shows My Orders with the order selected;
 *   - after a reload My Orders is first, looks the order up by itself and
 *     draws the five-step timeline with the right steps done, plus the
 *     carrier button (https, new tab);
 *   Refresh
 *   - 60 s auto refresh while the page is visible (fake clock): one more
 *     lookup per minute, the timeline moves when the status does;
 *   - hidden page: no lookups; back to visible: one at once if a minute old;
 *   - stops after 30 minutes with a calm message; Refresh starts it again;
 *   - 500s: a calm message, and the gaps double (120 s, then 240 s); 429:
 *     paused message, no hammering; 404: "couldn't find" with Forget;
 *   - offline: message, no lookups, and one when the connection returns;
 *   Forget
 *   - Forget removes one (storage and screen), Forget all asks first and
 *     leaves no storage key;
 *   Privacy
 *   - GA4 gets track_lookup / track_saved / track_refresh / track_forget with
 *     only method params; no order number or email in any gtag call, in any
 *     request to another host, or in the URL;
 *   - storage blocked (private mode): no checkbox, the form still works;
 *   - 320, 360, 390, 844x390 and 1440: no sideways scroll, 44px targets.
 *
 * Screenshots go to ORDERS_SHOTS (default .scratch/orders/).
 *
 *   npm run build && node scripts/orders-check.mjs
 *
 * Starts `vite preview` on ORDERS_PORT (default 4703), or tests ORDERS_BASE
 * when set to an already running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const CHROME = process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.ORDERS_PORT ?? 4703);
const SHOTS = process.env.ORDERS_SHOTS ?? ".scratch/orders";
mkdirSync(SHOTS, { recursive: true });

const stopPreview = (child) => (process.platform === "win32" ? child.kill() : process.kill(-child.pid));
let server = null;
let BASE = process.env.ORDERS_BASE;
if (!BASE) {
  if (!existsSync("dist/track.html")) {
    console.error("No prerendered build in dist/. Run `npm run build` first.");
    process.exit(1);
  }
  BASE = `http://localhost:${PORT}`;
  server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--port", String(PORT), "--strictPort"], {
    stdio: "ignore",
    detached: true,
  });
  const deadline = Date.now() + 20000;
  for (;;) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      console.error(`vite preview did not come up on ${BASE}`);
      stopPreview(server);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}
const stopServer = () => {
  try {
    if (server) stopPreview(server);
  } catch {
    /* already gone */
  }
};

/* ------------------------------ mock API ------------------------------ */

const EMAIL = "buyer@example.com";
const ORDER = "#1001";

const STAGES = {
  // Paid, placed with the supplier, not shipped.
  supplier: { financialStatus: "paid", fulfillmentStatus: "unfulfilled", supplier: "ordered", tracking: [], done: 3 },
  // Shipped with a FedEx number.
  shipped: {
    financialStatus: "paid",
    fulfillmentStatus: "fulfilled",
    supplier: "ordered",
    tracking: [{ number: "123456789012", company: "FedEx", url: "https://www.fedex.com/fedextrack/?trknbr=123456789012" }],
    done: 4,
  },
  delivered: {
    financialStatus: "paid",
    fulfillmentStatus: "fulfilled",
    supplier: "ordered",
    tracking: [{ number: "123456789012", company: "FedEx", url: "https://www.fedex.com/fedextrack/?trknbr=123456789012" }],
    done: 5,
  },
};

function orderBody(stageName, name = ORDER) {
  const st = STAGES[stageName];
  const labels = ["Ordered", "Paid", "With our supplier", "Shipped", "Delivered"];
  const keys = ["ordered", "paid", "supplier", "shipped", "final"];
  return {
    found: true,
    kind: "order",
    order: {
      name,
      createdAt: "2026-09-20T15:04:00Z",
      cancelled: false,
      financialStatus: st.financialStatus,
      fulfillmentStatus: st.fulfillmentStatus,
      delivery: "ship",
      lines: [{ title: "Continental TrueContact Tour 225/45R17", quantity: 4 }],
      tracking: st.tracking,
      supplier: st.supplier,
      timeline: {
        steps: keys.map((key, i) => ({ key, label: labels[i], done: i < st.done })),
        current: keys[st.done - 1],
        complete: st.done === 5,
        cancelled: false,
      },
    },
  };
}

/** One mocked /api/track per page: `mock.mode` picks the answer. */
function installApi(page) {
  const mock = { mode: "ok", stage: "shipped", calls: [], bodies: [] };
  page.route("**/api/track", async (route) => {
    const req = route.request();
    const body = JSON.parse(req.postData() || "{}");
    mock.calls.push(Date.now());
    mock.bodies.push(body);
    if (mock.mode === "500") return route.fulfill({ status: 502, json: { error: "We couldn't look that up just now." } });
    if (mock.mode === "429") return route.fulfill({ status: 429, json: { error: "Too many lookups." }, headers: { "retry-after": "600" } });
    if (mock.mode === "404") return route.fulfill({ status: 404, json: { found: false, error: "We couldn't find an order with that number and email." } });
    if (mock.mode === "abort") return route.abort("internetdisconnected");
    if (body.email !== EMAIL) return route.fulfill({ status: 404, json: { found: false, error: "nope" } });
    return route.fulfill({ json: orderBody(mock.stage, /^\d+$/.test(String(body.order).replace(/\D/g, "")) ? `#${String(body.order).replace(/\D/g, "")}` : ORDER) });
  });
  return mock;
}

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
const local = new URL(BASE).host;
const KEY = "tiredrop.orders.v1";

async function open({ width = 390, height = 844, blockStorage = false, clock = false, seed = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  const foreign = [];
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.route(
    (url) => url.host !== local,
    (route) => {
      foreign.push({ url: route.request().url(), body: route.request().postData() ?? "" });
      return route.fulfill({ status: 200, body: "" });
    },
  );
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: { atd: "sample", shopify: "live", checkout: "request", newsletter: "on", forms: "on", scanner: "on", chat: "on", version: "t" },
    }),
  );
  const mock = installApi(page);
  if (blockStorage) {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      };
      Object.defineProperty(window, "localStorage", { get: blocked, configurable: true });
    });
  }
  if (seed) {
    await page.addInitScript(
      ({ key, value }) => {
        if (!sessionStorage.getItem("__seeded")) {
          localStorage.setItem(key, value);
          sessionStorage.setItem("__seeded", "1");
        }
      },
      { key: KEY, value: JSON.stringify(seed) },
    );
  }
  if (clock) await page.clock.install({ time: new Date("2026-10-20T15:00:00Z") });
  return { context, page, errors, foreign, mock };
}

const real = (errors) => errors.filter((e) => !/status of 404|status of 429|status of 502|Failed to load resource|net::ERR/.test(e));

let failures = 0;
async function check(name, fn) {
  if (process.env.ORDERS_ONLY && !new RegExp(process.env.ORDERS_ONLY, "i").test(name)) return;
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    const at = String(err?.stack ?? "").match(/orders-check\.mjs:(\d+)/)?.[1];
    console.log(`FAIL ${name}${at ? ` (line ${at})` : ""}\n     ${String(err?.message ?? err).split("\n").slice(0, 8).join("\n     ")}`);
  }
}

const URL_TRACK = `${BASE}/track`;
const stored = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);
const settle = (page, ms = 300) => page.waitForTimeout(ms);
const myOrders = (page) => page.locator('[data-testid="my-orders"]');
const timelineDone = (page) =>
  page.locator('[data-testid="selected-order"] [data-testid="order-timeline"] li').evaluateAll((lis) => lis.map((li) => li.dataset.state));
// index.html defines gtag() to push into dataLayer; the events are read there.
const gaEvents = (page) =>
  page.evaluate(() =>
    (window.dataLayer ?? []).map((a) => Array.from(a)).filter((a) => a[0] === "event").map((a) => ({ name: a[1], params: a[2] })),
  );
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

/** Fill the lookup form (and tick Remember, with a name, if asked). */
async function lookup(page, { order = "1001", email = EMAIL, remember = false, label = "" } = {}) {
  await page.locator("#track-order").fill(order);
  await page.locator("#track-email").fill(email);
  if (remember) {
    await page.locator("#track-remember").check();
    if (label) await page.locator("#track-label").fill(label);
  }
  await page.getByRole("button", { name: /Track Order/ }).click();
}

const SAVED = { orders: [{ order: ORDER, email: EMAIL, label: "Camry tires" }] };

/* ------------------------------- checks ------------------------------- */

await check("first-time visitor: the plain form, Remember off, nothing stored", async () => {
  const { page, errors, mock, context } = await open();
  await page.goto(URL_TRACK);
  await page.locator("#track-order").waitFor();
  await settle(page);
  assert.equal(await myOrders(page).count(), 0, "no My Orders without saved orders");
  assert.equal(await page.locator("#track-remember").isChecked(), false, "Remember is off by default");
  assert.match(await page.locator('label[for="track-remember"]').innerText(), /Remember this order on this device/);
  await lookup(page);
  await page.locator('[data-testid="order-result"]').waitFor();
  assert.equal(mock.calls.length, 1);
  assert.deepEqual(mock.bodies[0], { order: "1001", email: EMAIL, website: "" });
  assert.deepEqual(await timelineDone(page), []);
  const states = await page.locator('[data-testid="order-result"] [data-testid="order-timeline"] li').evaluateAll((l) => l.map((x) => x.dataset.state));
  assert.deepEqual(states, ["done", "done", "done", "now", "next"]);
  const labels = await page.locator('[data-testid="order-result"] [data-testid="order-timeline"] li p:first-child').allInnerTexts();
  assert.deepEqual(labels, ["Ordered", "Paid", "With our supplier", "Shipped", "Delivered"]);
  const carrier = page.locator('[data-testid="carrier-link"]');
  assert.equal(await carrier.count(), 1);
  assert.equal(await carrier.getAttribute("href"), "https://www.fedex.com/fedextrack/?trknbr=123456789012");
  assert.equal(await carrier.getAttribute("target"), "_blank");
  assert.match(await carrier.getAttribute("rel"), /noopener/);
  assert.equal(await stored(page), null, "nothing remembered");
  assert.equal(await myOrders(page).count(), 0);
  await page.screenshot({ path: `${SHOTS}/01-first-visit-result-390.png`, fullPage: true });
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("a missed lookup is the same calm message, and is never remembered", async () => {
  const { page, mock, context } = await open();
  await page.goto(URL_TRACK);
  await lookup(page, { email: "wrong@example.com", remember: true });
  await page.locator('[role="alert"]').waitFor();
  assert.match(await page.locator('[role="alert"]').innerText(), /couldn't find that order/i);
  assert.equal(await stored(page), null);
  assert.equal(mock.calls.length, 1);
  await context.close();
});

await check("Remember: stores order, email, name and nothing else; My Orders shows it", async () => {
  const { page, errors, foreign, context } = await open();
  await page.goto(URL_TRACK);
  await lookup(page, { remember: true, label: "Camry tires" });
  await myOrders(page).waitFor();
  await page.locator('[data-testid="order-result"]').waitFor();
  assert.deepEqual(JSON.parse(await stored(page)), SAVED);
  const dump = await page.evaluate(() => ({
    others: Object.entries(localStorage).filter(([k]) => k !== "tiredrop.orders.v1"),
    session: JSON.stringify(Object.entries(sessionStorage)),
    cookie: document.cookie,
  }));
  assert.ok(
    !/1001|example\.com|Camry/.test(JSON.stringify(dump)),
    "the order, email and name are in no other storage entry, session storage or cookie",
  );
  assert.match(await myOrders(page).innerText(), /Camry tires/);
  assert.equal(await page.locator("#track-order").inputValue(), "", "the form is clear for another order");
  const saved = (await gaEvents(page)).filter((e) => e.name === "track_saved");
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].params ?? {}, {}, "track_saved carries no parameters");
  assert.match(await page.locator('[data-testid="orders-notice"]').innerText(), /Remembered on this device/);
  await page.screenshot({ path: `${SHOTS}/02-remembered-390.png`, fullPage: true });
  assert.ok(foreign.every((f) => !f.body.includes("example.com")), "no email sent to another host");
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("reload: My Orders first, looked up by itself, five-step timeline and carrier button", async () => {
  const { page, errors, mock, context } = await open({ seed: SAVED });
  await page.goto(URL_TRACK);
  await myOrders(page).waitFor();
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  assert.equal(mock.calls.length, 1, "one lookup on arrival");
  assert.deepEqual(mock.bodies[0], { order: "#1001", email: EMAIL, website: "" });
  assert.deepEqual(await timelineDone(page), ["done", "done", "done", "now", "next"]);
  // My Orders comes before the form in the page.
  const order = await page.evaluate(() => {
    const a = document.querySelector('[data-testid="my-orders"]');
    const b = document.querySelector("#track-order");
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? "mine-first" : "form-first";
  });
  assert.equal(order, "mine-first");
  assert.equal(await page.locator('[data-testid="selected-order"] [data-testid="carrier-link"]').count(), 1);
  assert.match(await page.locator('[data-testid="refresh-line"]').innerText(), /Updated \d{1,2}:\d{2}/);
  assert.match(await page.locator('[data-testid="call-shop"]').getAttribute("href"), /^tel:/);
  const ga = await gaEvents(page);
  assert.ok(ga.some((e) => e.name === "track_lookup" && e.params.method === "saved"));
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("auto refresh: every 60 s while visible; the timeline moves with the status", async () => {
  const { page, mock, context } = await open({ seed: SAVED, clock: true });
  mock.stage = "supplier";
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  assert.deepEqual(await timelineDone(page), ["done", "done", "now", "next", "next"]);
  mock.stage = "shipped";
  await page.clock.runFor(61_000);
  await settle(page);
  assert.equal(mock.calls.length, 2, "one more after a minute");
  assert.deepEqual(await timelineDone(page), ["done", "done", "done", "now", "next"]);
  mock.stage = "delivered";
  await page.clock.runFor(60_000);
  await settle(page);
  assert.equal(mock.calls.length, 3);
  assert.deepEqual(await timelineDone(page), ["done", "done", "done", "done", "done"]);
  const ga = await gaEvents(page);
  assert.equal(ga.filter((e) => e.name === "track_refresh" && e.params.method === "auto").length, 2);
  await page.screenshot({ path: `${SHOTS}/03-delivered-390.png`, fullPage: true });
  await context.close();
});

await check("hidden page: no lookups; back in view: one at once", async () => {
  const { page, mock, context } = await open({ seed: SAVED, clock: true });
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  const setHidden = (hidden) =>
    page.evaluate((h) => {
      Object.defineProperty(document, "hidden", { value: h, configurable: true });
      Object.defineProperty(document, "visibilityState", { value: h ? "hidden" : "visible", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await setHidden(true);
  const before = mock.calls.length;
  await page.clock.runFor(5 * 60_000);
  await settle(page);
  assert.equal(mock.calls.length, before, "nothing while hidden");
  await setHidden(false);
  await settle(page, 500);
  assert.equal(mock.calls.length, before + 1, "one on return");
  await page.clock.runFor(61_000);
  await settle(page);
  assert.equal(mock.calls.length, before + 2, "and the minute rhythm resumes");
  await context.close();
});

await check("stops after 30 minutes; Refresh starts it again", async () => {
  const { page, mock, context } = await open({ seed: SAVED, clock: true });
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  for (let i = 0; i < 31; i += 1) {
    await page.clock.runFor(60_000);
    await settle(page, 60);
  }
  await settle(page);
  const stopped = mock.calls.length;
  assert.ok(stopped <= 31, `lookups stop at about 30 (${stopped})`);
  assert.match(await page.locator('[data-testid="refresh-message"]').innerText(), /paused after 30 minutes/i);
  await page.clock.runFor(10 * 60_000);
  await settle(page);
  assert.equal(mock.calls.length, stopped, "nothing once stopped");
  await page.screenshot({ path: `${SHOTS}/04-paused-390.png`, fullPage: true });
  await page.locator('[data-testid="refresh"]').click();
  await settle(page, 500);
  assert.equal(mock.calls.length, stopped + 1);
  assert.equal(await page.locator('[data-testid="refresh-message"]').count(), 0, "message gone");
  await page.clock.runFor(61_000);
  await settle(page);
  assert.equal(mock.calls.length, stopped + 2, "watching again");
  const ga = await gaEvents(page);
  assert.ok(ga.some((e) => e.name === "track_refresh" && e.params.method === "manual"));
  await context.close();
});

await check("server trouble: calm message, the status stays, gaps double", async () => {
  const { page, mock, context } = await open({ seed: SAVED, clock: true });
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  mock.mode = "500";
  await page.clock.runFor(61_000);
  await settle(page);
  assert.equal(mock.calls.length, 2);
  assert.equal(await page.locator('[data-testid="refresh-message"]').getAttribute("data-status"), "error");
  assert.equal(await page.locator('[data-testid="order-result"]').count(), 1, "the last status stays on screen");
  await page.clock.runFor(60_000);
  await settle(page);
  assert.equal(mock.calls.length, 2, "not at 60 s any more");
  await page.clock.runFor(61_000); // 121 s after the first failure
  await settle(page);
  assert.equal(mock.calls.length, 3);
  await page.clock.runFor(200_000);
  await settle(page);
  assert.equal(mock.calls.length, 3, "and the next gap is 240 s");
  await page.clock.runFor(45_000);
  await settle(page);
  assert.equal(mock.calls.length, 4);
  mock.mode = "ok";
  await page.locator('[data-testid="refresh"]').click();
  await settle(page, 500);
  assert.equal(await page.locator('[data-testid="refresh-message"]').count(), 0, "recovers");
  await context.close();
});

await check("rate limit (429): paused message, ten minutes of quiet", async () => {
  const { page, mock, context } = await open({ seed: SAVED, clock: true });
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  mock.mode = "429";
  await page.clock.runFor(61_000);
  await settle(page);
  assert.equal(mock.calls.length, 2);
  assert.equal(await page.locator('[data-testid="refresh-message"]').getAttribute("data-status"), "limited");
  assert.match(await page.locator('[data-testid="refresh-message"]').innerText(), /paused for a few minutes/i);
  await page.clock.runFor(9 * 60_000);
  await settle(page);
  assert.equal(mock.calls.length, 2, "quiet for the server's ten minutes");
  await page.screenshot({ path: `${SHOTS}/05-limited-390.png`, fullPage: true });
  await context.close();
});

await check("order no longer found: message, Forget works", async () => {
  const { page, mock, context } = await open({ seed: SAVED });
  mock.mode = "404";
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="refresh-message"]').waitFor();
  assert.equal(await page.locator('[data-testid="refresh-message"]').getAttribute("data-status"), "gone");
  await page.locator('[data-testid="forget-order"]').click();
  await settle(page);
  assert.equal(await myOrders(page).count(), 0);
  assert.equal(await stored(page), null);
  await context.close();
});

await check("offline: a message and no lookups; one when the connection returns", async () => {
  const { page, mock, context } = await open({ seed: SAVED });
  await page.goto(URL_TRACK);
  await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
  const before = mock.calls.length;
  await context.setOffline(true);
  await page.locator('[data-testid="refresh-message"]').waitFor();
  assert.equal(await page.locator('[data-testid="refresh-message"]').getAttribute("data-status"), "offline");
  assert.match(await page.locator('[data-testid="refresh-message"]').innerText(), /You are offline/);
  await page.locator('[data-testid="refresh"]').click();
  await settle(page);
  assert.equal(mock.calls.length, before, "no lookup while offline");
  await page.screenshot({ path: `${SHOTS}/06-offline-390.png`, fullPage: true });
  await context.setOffline(false);
  await page.waitForFunction(() => !document.querySelector('[data-testid="refresh-message"]'));
  assert.equal(mock.calls.length, before + 1, "one lookup when back online");
  await context.close();
});

await check("Forget one, Forget all (asks first), nothing left in storage; GA gets method-only events", async () => {
  const seed = {
    orders: [
      { order: "#1003", email: EMAIL },
      { order: "#1002", email: EMAIL, label: "Truck" },
      { order: ORDER, email: EMAIL, label: "Camry tires" },
    ],
  };
  const { page, foreign, context } = await open({ seed });
  await page.goto(URL_TRACK);
  await myOrders(page).waitFor();
  assert.equal(await page.locator('[data-testid="saved-order"]').count(), 3);
  // Selecting another order looks it up.
  await page.locator('[data-testid="saved-order"][data-order="#1002"]').click();
  await page.waitForFunction(() => /Order #1002/.test(document.querySelector('[data-testid="selected-order"]')?.textContent ?? ""));
  await page.locator('[data-testid="forget-order"]').nth(1).click();
  await settle(page);
  assert.equal(await page.locator('[data-testid="saved-order"]').count(), 2);
  assert.deepEqual(JSON.parse(await stored(page)).orders.map((o) => o.order), ["#1003", "#1001"]);
  assert.match(await page.locator('[data-testid="orders-notice"]').innerText(), /Forgot order #1002/);
  await page.locator('[data-testid="forget-all"]').click();
  await page.screenshot({ path: `${SHOTS}/07-forget-all-390.png`, fullPage: true });
  assert.equal(await page.locator('[data-testid="saved-order"]').count(), 2, "asked first, nothing gone yet");
  await page.locator('[data-testid="forget-all-confirm"]').click();
  await settle(page);
  assert.equal(await myOrders(page).count(), 0);
  assert.equal(await stored(page), null, "the storage entry is gone");
  const ga = await gaEvents(page);
  const names = new Set(ga.map((e) => e.name));
  for (const n of ["track_lookup", "track_refresh", "track_forget"]) assert.ok(names.has(n) || n === "track_refresh", n);
  const text = JSON.stringify(ga);
  assert.ok(!/1001|1002|1003|example\.com|Camry|Truck/.test(text), "no order number, email or name in any gtag call");
  assert.ok(ga.filter((e) => e.name.startsWith("track_")).every((e) => Object.keys(e.params).every((k) => k === "method")));
  assert.ok(foreign.every((f) => !/1001|1002|example\.com/.test(f.url + f.body)), "nothing sent to another host");
  await context.close();
});

await check("storage blocked (private mode): no checkbox, the form still works", async () => {
  const { page, errors, context } = await open({ blockStorage: true });
  await page.goto(URL_TRACK);
  await page.locator("#track-order").waitFor();
  await settle(page);
  assert.equal(await page.locator("#track-remember").count(), 0, "nothing to tick when nothing can be kept");
  assert.equal(await myOrders(page).count(), 0);
  await lookup(page);
  await page.locator('[data-testid="order-result"]').waitFor();
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("the /track?order= link still fills the order number only", async () => {
  const { page, context } = await open();
  await page.goto(`${URL_TRACK}?order=%231001`);
  await page.locator("#track-order").waitFor();
  assert.equal(await page.locator("#track-order").inputValue(), "#1001");
  assert.equal(await page.locator("#track-email").inputValue(), "");
  await context.close();
});

for (const [width, height] of [[390, 844], [360, 640], [320, 568], [844, 390], [1440, 900]]) {
  await check(`${width}x${height}: no sideways scroll, 44px targets, screenshots`, async () => {
    const { page, errors, context } = await open({ width, height, seed: { orders: [...SAVED.orders, { order: "#1002", email: EMAIL }] } });
    await page.goto(URL_TRACK);
    await page.locator('[data-testid="selected-order"] [data-testid="order-result"]').waitFor();
    await settle(page);
    const wide = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      return [...document.querySelectorAll("body *")]
        .filter((e) => e.getBoundingClientRect().right > W + 1)
        .slice(0, 4)
        .map((e) => `${e.tagName}.${String(e.className).slice(0, 50)} right=${Math.round(e.getBoundingClientRect().right)}`);
    });
    assert.ok(await noSideways(page), `no horizontal scroll (${wide.join("; ")})`);
    const small = await page.evaluate(() => {
      const box = document.querySelector('[data-testid="my-orders"]');
      const targets = [...box.querySelectorAll("button, a.btn-primary, a.btn-outline")];
      const remember = document.querySelector('label[for="track-remember"]');
      if (remember) targets.push(remember);
      return targets
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && r.height < 43.5)
        .map(({ el, r }) => `${el.textContent.trim().slice(0, 30)} ${Math.round(r.height)}px`);
    });
    assert.deepEqual(small, [], "every button and link is 44px tall");
    await page.screenshot({ path: `${SHOTS}/10-my-orders-${width}x${height}.png`, fullPage: true });
    assert.deepEqual(real(errors), []);
    await context.close();
  });
}

await browser.close();
stopServer();
if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll orders checks passed.");
