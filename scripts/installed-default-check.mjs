/**
 * The installed-price local default and its preview flag
 * (src/data/installedDefault.js, src/lib/installedPrice.js), in Chromium at
 * 390px and 1440px against the built site. The switch ships OFF, so this
 * proves production is unchanged and the preview flag works:
 *
 *   - default build: /tires and a tire page arrive with the toggle off, stay
 *     off after hydration even when /api/geo answers "Sunrise, Broward"
 *     (and /api/geo is never even asked), no hydration warning;
 *   - ?installed=local: off in the prerendered HTML, on straight after
 *     hydration (aria-pressed="true", installed lines on every card, the
 *     install price from services.js), layout shift (CLS) under 0.02 on
 *     /tires (a tire page grows its buy box like a remembered-on visitor's
 *     does today, and the flag must not shift more than that), no
 *     sideways scroll, no live region announcing it, nothing stored, and
 *     pressing it still turns it off (and stores nothing);
 *   - ?installed=off: forced off over a remembered "on"; pressing it works;
 *   - a remembered visitor choice still wins over the default;
 *   - the prerendered HTML is byte-identical with and without the flag, its
 *     canonical is the clean URL (no ?installed=), the canonical in the
 *     hydrated page stays clean, and sitemap.xml names no flagged URL;
 *   - GA4: the preview flag sends no installed_price_default event.
 *
 * Screenshots (390 and 1440, toggle off and ?installed=local) go to
 * INSTALLED_SHOTS (default .scratch/installed/).
 *
 *   npm run build && npm run check:installed
 *
 * Starts `vite preview` on INSTALLED_PORT (default 4352), or tests
 * INSTALLED_BASE when that is set to an already running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

import { INSTALLED_DEFAULT_FOR_LOCAL } from "../src/data/installedDefault.js";
import { getService } from "../src/data/services.js";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.INSTALLED_PORT ?? 4352);
const SHOTS = process.env.INSTALLED_SHOTS ?? ".scratch/installed";
mkdirSync(SHOTS, { recursive: true });

const KEY = "tiredrop.installed.v1";
const TIRE = "/tires/continental-crosscontact-lx25-235-65r17";
const CLS_LIMIT = 0.02;

/* ------------------------------ preview ------------------------------ */

const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.INSTALLED_BASE;
if (!BASE) {
  if (!existsSync("dist/tires.html")) {
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

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;
const fee = getService("tire-installation").priceFrom;
const usd = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

async function open(width, { seed = {} } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  const geoCalls = { n: 0 };
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.route((url) => url.host !== local, (route) => route.fulfill({ status: 200, body: "" }));
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: { atd: "sample", shopify: "live", checkout: "request", newsletter: "off", forms: "on", version: "test" },
    }),
  );
  // A visitor in Sunrise (Broward): the default, if it were on, would apply.
  await page.route("**/api/geo", (route) => {
    geoCalls.n += 1;
    return route.fulfill({
      json: { available: true, country: "US", zip: "33351", lat: 26.165, lng: -80.269, city: "Sunrise", region: "FL" },
    });
  });
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.addInitScript((s) => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    // Seeded once per tab, so a reload keeps what the visitor did since.
    if (!sessionStorage.getItem("__seeded")) {
      sessionStorage.setItem("__seeded", "1");
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    }
  }, seed);
  return { context, page, errors, geoCalls };
}

const real = (errors) => errors.filter((e) => !/status of 404/.test(e));

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err?.message ?? err).split("\n").slice(0, 6).join("\n     ")}`);
  }
}

const mounted = () =>
  Object.keys(document.getElementById("root") ?? {}).some((k) => k.startsWith("__reactContainer"));
const pressed = (page) =>
  page.locator('[data-testid="installed-toggle"] button').getAttribute("aria-pressed");
const settle = (page) => page.waitForTimeout(1200); // the lookup, hydration and any late shift
const cls = (page) => page.evaluate(() => window.__cls);
const lineCount = (page) => page.locator('[data-testid="installed-lines"]').count();
const stored = (page) => page.evaluate((k) => localStorage.getItem(k), KEY);

/* ------------------------------ checks ------------------------------ */

await check("the switch ships off", async () => {
  assert.equal(INSTALLED_DEFAULT_FOR_LOCAL, false);
});

await check("default build: off in the HTML and after hydration, even for a visitor in Sunrise; /api/geo never asked", async () => {
  assert.equal(INSTALLED_DEFAULT_FOR_LOCAL, false, "this check describes the shipped build (switch off)");
  for (const width of [390, 1440]) {
    const { context, page, errors, geoCalls } = await open(width);
    for (const path of ["/tires", TIRE]) {
      await page.goto(BASE + path);
      await page.waitForFunction(mounted);
      await settle(page);
      assert.equal(await pressed(page), "false", `${width} ${path}`);
      assert.equal(await lineCount(page), 0, `${width} ${path}: no installed lines`);
      assert.equal(await stored(page), null, "nothing stored");
    }
    assert.equal(geoCalls.n, 0, "the switch is off: no location lookup at all");
    assert.deepEqual(real(errors), [], `${width}`);
    await context.close();
  }
});

await check("prerendered HTML is identical with and without the flag, canonical clean, sitemap untouched", async () => {
  for (const path of ["/tires", TIRE]) {
    const plain = await (await fetch(`${BASE}${path}`)).text();
    for (const flag of ["local", "off"]) {
      const flagged = await (await fetch(`${BASE}${path}?installed=${flag}`)).text();
      assert.ok(flagged === plain, `${path}?installed=${flag}: served HTML differs from the plain page`);
    }
    assert.match(plain, /aria-pressed="false"[^>]*>(?:(?!<\/button>).)*Show installed price/s, path);
    assert.ok(!plain.includes('data-testid="installed-lines"'), `${path}: no installed lines in the HTML`);
    const canonical = plain.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    assert.equal(canonical, `https://tiredroponline.com${path}`, `${path}: canonical`);
    assert.ok(!/noindex/i.test(plain.match(/<meta name="robots"[^>]*>/i)?.[0] ?? ""), `${path}: not noindexed`);
  }
  const sitemap = readFileSync("dist/sitemap.xml", "utf8");
  assert.ok(!/installed=/.test(sitemap), "sitemap names no ?installed= URL");
  assert.ok(sitemap.includes("https://tiredroponline.com/tires<"), "sitemap still lists /tires");
});

await check("?installed=local: on after hydration, no layout shift, install price right, nothing stored", async () => {
  for (const width of [390, 1440]) {
    const { context, page, errors, geoCalls } = await open(width);
    await page.goto(`${BASE}/tires?installed=local`);
    await page.waitForFunction(mounted);
    await page.waitForFunction(() => document.querySelector('[data-testid="installed-toggle"] button')?.getAttribute("aria-pressed") === "true");
    await settle(page);
    const n = await page.locator("article").count();
    assert.ok(n > 0, "tire cards");
    assert.equal(await page.locator('article [data-testid="installed-lines"]').count(), n, "every tire card");
    const first = page.locator("article").first();
    const each = Number((await first.locator("p.tnum").last().innerText()).match(/\$([\d,.]+)/)[1].replace(/,/g, ""));
    const text = await first.locator('[data-testid="installed-lines"]').innerText();
    assert.match(text, /Installed from/);
    const round = (x) => Math.round(x * 100) / 100;
    assert.ok(text.includes(`${usd(each)} + ${usd(fee)} = ${usd(round(each + fee))}`), `one tire: ${text}`);
    const shift = await cls(page);
    console.log(`     /tires?installed=local at ${width}: CLS ${shift.toFixed(4)}`);
    assert.ok(shift < CLS_LIMIT, `CLS ${shift} (limit ${CLS_LIMIT})`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no sideways scroll");
    // Told by aria-pressed only: nothing in the toggle or its lines is a live region.
    assert.equal(
      await page.locator('[data-testid="installed-toggle"] [aria-live], [data-testid="installed-toggle"] [role="status"], [data-testid="installed-toggle"] [role="alert"], [data-testid="installed-lines"][aria-live]').count(),
      0,
      "no live region",
    );
    assert.equal(await stored(page), null, "the flag stores nothing");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("tiredrop.area.v1")), null, "nor in sessionStorage");
    assert.equal(geoCalls.n, 0, "the flag needs no lookup");
    // The canonical in the hydrated page is still the clean URL.
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://tiredroponline.com/tires");
    // GA4: the preview flag is not the default and sends no default event.
    const events = await page.evaluate(() => (window.dataLayer ?? []).map((a) => Array.from(a)).filter((a) => a[0] === "event" && /^installed_price/.test(a[1])));
    assert.deepEqual(events, [], "no installed_price_* events from the preview flag");

    // The visitor can still turn it off, and that is not stored either.
    const toggle = page.locator('[data-testid="installed-toggle"] button');
    await toggle.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector('[data-testid="installed-toggle"] button')?.getAttribute("aria-pressed") === "false");
    assert.equal(await lineCount(page), 0);
    assert.equal(await stored(page), null);
    const toggled = await page.evaluate(() => (window.dataLayer ?? []).map((a) => Array.from(a)).filter((a) => a[0] === "event" && a[1] === "installed_price_toggle").map((a) => a[2]));
    assert.deepEqual(toggled, [{ toggle_state: "off", placement: "results" }]);
    assert.deepEqual(real(errors), [], `${width}`);
    await context.close();
  }
});

await check("?installed=local on a tire page: on after hydration, no more shift than a remembered-on visitor has today", async () => {
  // The prerendered tire page is off, so ANY on state (remembered, default,
  // preview) grows the buy box after hydration. The flag must not add to what
  // a visitor who turned it on earlier already gets; /tires itself is held to
  // CLS_LIMIT above. (Zero here needs the state known before the first paint:
  // see docs/ops/installed-price-default.md.)
  for (const width of [390, 1440]) {
    const measure = async (query, seed) => {
      const { context, page, errors } = await open(width, { seed });
      await page.goto(`${BASE}${TIRE}${query}`);
      await page.waitForFunction(mounted);
      await page.locator('[data-testid="installed-lines"]').first().waitFor();
      await settle(page);
      const text = await page.locator('[data-testid="installed-lines"]').first().innerText();
      assert.match(text, /Installed from/);
      assert.match(text, /Set of 4/);
      assert.equal(await pressed(page), "true");
      const shift = await cls(page);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no sideways scroll");
      assert.deepEqual(real(errors), [], `${width}`);
      await page.screenshot({ path: `${SHOTS}/tire-${width}-${query ? "local" : "remembered"}.png` });
      await context.close();
      return shift;
    };
    const flagged = await measure("?installed=local", {});
    const remembered = await measure("", { [KEY]: JSON.stringify({ v: 1, on: true }) });
    console.log(`     tire page at ${width}: CLS ${flagged.toFixed(4)} with ?installed=local, ${remembered.toFixed(4)} remembered-on`);
    assert.ok(flagged <= remembered + 0.01, `the flag shifts more (${flagged}) than a remembered-on visitor (${remembered})`);
  }
});

await check("?installed=off forces off over a remembered on, and pressing it still works", async () => {
  const { context, page, errors } = await open(390, { seed: { [KEY]: JSON.stringify({ v: 1, on: true }) } });
  await page.goto(`${BASE}/tires`);
  await page.waitForFunction(mounted);
  await page.waitForFunction(() => document.querySelector('[data-testid="installed-toggle"] button')?.getAttribute("aria-pressed") === "true");
  await page.goto(`${BASE}/tires?installed=off`);
  await page.waitForFunction(mounted);
  await settle(page);
  assert.equal(await pressed(page), "false");
  assert.equal(await lineCount(page), 0);
  await page.locator('[data-testid="installed-toggle"] button').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="installed-toggle"] button')?.getAttribute("aria-pressed") === "true");
  assert.ok((await lineCount(page)) > 0);
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("a remembered visitor choice still wins: on stays on, plain /tires with it off stays off", async () => {
  const { context, page, errors } = await open(390, { seed: { [KEY]: JSON.stringify({ v: 1, on: true }) } });
  await page.goto(`${BASE}/tires`);
  await page.waitForFunction(mounted);
  await page.waitForFunction(() => document.querySelector('[data-testid="installed-toggle"] button')?.getAttribute("aria-pressed") === "true");
  assert.ok((await lineCount(page)) > 0);
  await page.locator('[data-testid="installed-toggle"] button').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="installed-toggle"] button')?.getAttribute("aria-pressed") === "false");
  await page.reload();
  await page.waitForFunction(mounted);
  await settle(page);
  assert.equal(await pressed(page), "false");
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("screenshots: /tires at 390 and 1440, toggle off and ?installed=local", async () => {
  for (const width of [390, 1440]) {
    for (const [label, query] of [["off", ""], ["local", "?installed=local"]]) {
      const { context, page } = await open(width);
      await page.goto(`${BASE}/tires${query}`);
      await page.waitForFunction(mounted);
      await settle(page);
      // The toggle at the top, the first card's price (and its installed lines) below.
      await page.locator("article").first().scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 220));
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${SHOTS}/tires-${width}-${label}.png` });
      await context.close();
    }
  }
});

await browser.close();
stopServer();
if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll installed-default checks passed.");
