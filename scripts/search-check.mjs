/**
 * The header's store-wide search and its drop-down, and /search, in
 * Chromium against the built site, at 1440px and 390px:
 *
 *   - typing a partial or run-together size ("225/45", "2254517") shows the
 *     size suggestion; a brand shows the brand and its tires; "rotation" and
 *     "mobile" show the rotation tool and service, and the mobile
 *     installation page;
 *   - the WAI-ARIA combobox: role, aria-expanded, aria-controls naming the
 *     listbox, aria-activedescendant following ArrowDown/ArrowUp, Enter
 *     opening the highlighted suggestion, Escape closing the list (and
 *     keeping what was typed), Tab leaving it, a click elsewhere closing it;
 *   - Enter with nothing highlighted keeps the old behaviour (a size to that
 *     size) and sends anything else to /search?q=, which lists the same
 *     groups in full; "See all results" goes there too;
 *   - GA4: `search` on a submit, `search_suggestion` on a picked suggestion;
 *   - a mouse click and a phone tap on a suggestion; every row at least
 *     44px tall; no sideways scroll at 390px with the list open or on
 *     /search; axe finds nothing serious with the list open;
 *   - /search is prerendered noindex and hydrates in place;
 *   - no console errors anywhere (the /api/tires 404 the harness answers,
 *     standing in for the distributor API, aside) and no hydration warnings.
 *
 * Screenshots go to SEARCH_SHOTS (default .scratch/search/).
 *
 *   npm run build && npm run check:search
 *
 * Starts `vite preview` on SEARCH_PORT (default 4361), or tests
 * SEARCH_BASE when that is set to an already running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

import { mockVpic } from "./vpic-mock.mjs";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.SEARCH_PORT ?? 4361);
const SHOTS = process.env.SEARCH_SHOTS ?? ".scratch/search";
mkdirSync(SHOTS, { recursive: true });

/* ------------------------------ preview ------------------------------ */

// vite preview runs as its own process group so the whole tree can be
// stopped; Windows has no process groups, and there the server is the
// child itself (node runs vite directly rather than through npx).
const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.SEARCH_BASE;
if (!BASE) {
  if (!existsSync("dist/search.html")) {
    console.error("No prerendered /search in dist/. Run `npm run build` first.");
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
      console.error(`vite preview did not come up on ${BASE} (port busy? set SEARCH_PORT)`);
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

async function open(width) {
  const phone = width < 600;
  const context = await browser.newContext({
    viewport: { width, height: phone ? 844 : 900 },
    hasTouch: phone,
    isMobile: phone,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
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
  // No distributor API: the sample catalog answers, as on a preview without ATD.
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));
  await mockVpic(page);
  // Every gtag() call (index.html's stub pushes them onto dataLayer), kept
  // across navigations; and the <h1> the served HTML arrived with.
  await page.addInitScript(() => {
    const KEY = "__gaCalls";
    const dl = (window.dataLayer = window.dataLayer || []);
    const push = dl.push.bind(dl);
    dl.push = (entry) => {
      try {
        const calls = JSON.parse(sessionStorage.getItem(KEY) || "[]");
        calls.push(Array.from(entry));
        sessionStorage.setItem(KEY, JSON.stringify(calls));
      } catch {
        /* storage blocked */
      }
      return push(entry);
    };
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "interactive") window.__servedH1 = document.querySelector("h1");
    });
  });
  const input = page.locator(phone ? "#mobile-search" : "#masthead-search");
  const listboxId = phone ? "mobile-search-listbox" : "masthead-search-listbox";
  const listbox = page.locator(`#${listboxId}`);
  return { context, page, errors, input, listbox, listboxId };
}

const real = (errors) => errors.filter((e) => !/status of 404/.test(e));

const mounted = () =>
  Object.keys(document.getElementById("root") ?? {}).some((k) => k.startsWith("__reactContainer"));

async function events(page, name) {
  const calls = await page.evaluate(() => JSON.parse(sessionStorage.getItem("__gaCalls") || "[]"));
  return calls.filter((c) => c[0] === "event" && c[1] === name).map((c) => c[2]);
}

async function waitEvent(page, name, test = () => true) {
  const deadline = Date.now() + 8000;
  for (;;) {
    const found = (await events(page, name)).filter(test);
    if (found.length) return found;
    if (Date.now() > deadline) throw new Error(`no matching ${name} event`);
    await page.waitForTimeout(100);
  }
}

/** Types like a person (one key at a time) and waits for the list. */
async function typeIn(h, text) {
  await h.input.click();
  await h.input.fill("");
  await h.input.pressSequentially(text, { delay: 20 });
  await h.listbox.waitFor();
  // The debounce, then the suggestions for the whole text.
  await h.page.waitForTimeout(250);
}

const optionTexts = (h) => h.listbox.getByRole("option").allInnerTexts();
const groupNames = (h) =>
  h.listbox.getByRole("group").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));

async function noSidewaysScroll(page, label) {
  const { scroll, width } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
  }));
  assert.ok(scroll <= width, `${label}: page is ${scroll}px wide at ${width}px`);
}

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err?.message ?? err).split("\n").slice(0, 8).join("\n     ")}`);
  }
}

/* ------------------------------- checks ------------------------------- */

await check("1440 typing a size shows the size suggestion, from the first digits and in any spelling", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  assert.equal(await h.input.getAttribute("role"), "combobox");
  assert.equal(await h.input.getAttribute("aria-expanded"), "false");

  await typeIn(h, "225/45");
  assert.equal(await h.input.getAttribute("aria-expanded"), "true");
  assert.equal(await h.input.getAttribute("aria-controls"), h.listboxId);
  assert.equal((await groupNames(h))[0], "Tire sizes");
  const texts = await optionTexts(h);
  assert.ok(texts.some((t) => t.startsWith("Shop 225/45R17 tires")), texts.join(" | "));
  assert.ok(texts.some((t) => t.startsWith("Shop 225/45 tires")), texts.join(" | "));
  assert.ok(texts.at(-1).startsWith("See all results for “225/45”"), texts.at(-1));
  assert.ok(texts.length <= 9, `${texts.length} rows`);
  await h.page.screenshot({ path: `${SHOTS}/size-1440.png` });

  for (const typed of ["2254517", "225 45 17", "P225/45R17"]) {
    await typeIn(h, typed);
    const first = (await optionTexts(h))[0];
    assert.ok(first.startsWith("Shop 225/45R17 tires"), `${typed}: ${first}`);
  }
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("1440 typing a brand shows the brand and its tires; a mouse click opens one", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await typeIn(h, "contin");
  const groups = await groupNames(h);
  assert.ok(groups.includes("Brands & tire types"), groups.join(", "));
  assert.ok(groups.includes("Tires & wheels"), groups.join(", "));
  const texts = await optionTexts(h);
  assert.ok(texts.some((t) => t.startsWith("Continental tires")), texts.join(" | "));
  assert.ok(texts.filter((t) => t.startsWith("Continental ")).length >= 3, texts.join(" | "));
  await h.page.screenshot({ path: `${SHOTS}/brand-1440.png` });
  await h.listbox.getByRole("option", { name: /^Continental tires/ }).click();
  await h.page.waitForURL(/\/tires\?brand=continental$/);
  assert.equal(await h.input.inputValue(), "");
  assert.equal(await h.listbox.count(), 0);
  const [sel] = await waitEvent(h.page, "search_suggestion");
  assert.deepEqual(sel, {
    search_term: "contin",
    suggestion_type: "brands",
    suggestion_path: "/tires?brand=continental",
  });
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("1440 \"rotation\" and \"mobile\" show the right pages", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await typeIn(h, "rotation");
  let paths = await h.listbox.getByRole("option").evaluateAll((els) => els.map((e) => e.dataset.path));
  assert.ok(paths.includes("/tire-rotation-pattern"), paths.join(" "));
  assert.ok(paths.includes("/services/tire-rotation"), paths.join(" "));
  assert.ok((await groupNames(h)).includes("Pages & guides"));
  await h.page.screenshot({ path: `${SHOTS}/rotation-1440.png` });

  await typeIn(h, "mobile");
  paths = await h.listbox.getByRole("option").evaluateAll((els) => els.map((e) => e.dataset.path));
  assert.equal(paths[0], "/mobile-service", paths.join(" "));
  assert.ok(paths.some((p) => p.startsWith("/mobile-service/")), paths.join(" "));
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("1440 keyboard: ArrowDown/ArrowUp move aria-activedescendant, Enter opens the highlighted one", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await typeIn(h, "rotation");
  assert.equal(await h.input.getAttribute("aria-activedescendant"), null, "nothing highlighted yet");
  const active = async () => {
    const id = await h.input.getAttribute("aria-activedescendant");
    const opt = h.page.locator(`[id="${id}"]`);
    assert.equal(await opt.getAttribute("aria-selected"), "true", id);
    assert.equal(await h.page.locator('[role="option"][aria-selected="true"]').count(), 1);
    return id;
  };
  await h.page.keyboard.press("ArrowDown");
  assert.equal(await active(), "masthead-search-option-0");
  await h.page.keyboard.press("ArrowDown");
  assert.equal(await active(), "masthead-search-option-1");
  await h.page.keyboard.press("ArrowUp");
  assert.equal(await active(), "masthead-search-option-0");
  await h.page.keyboard.press("ArrowUp");
  const last = await active();
  assert.ok((await h.page.locator(`[id="${last}"]`).innerText()).startsWith("See all results"), "wraps to the last row");
  await h.page.keyboard.press("ArrowDown");
  await h.page.keyboard.press("ArrowDown");
  const id = await active();
  const target = await h.page.locator(`[id="${id}"]`).getAttribute("data-path");
  // Focus never left the box.
  assert.equal(await h.page.evaluate(() => document.activeElement?.id), "masthead-search");
  await h.page.keyboard.press("Enter");
  await h.page.waitForURL((url) => url.pathname + url.search + url.hash === target);
  const [sel] = await waitEvent(h.page, "search_suggestion");
  assert.equal(sel.search_term, "rotation");
  assert.equal(sel.suggestion_path, target);
  assert.equal(await h.input.getAttribute("aria-expanded"), "false");
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("1440 Escape closes and keeps the text; Tab leaves; a click elsewhere closes", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await typeIn(h, "mobile");
  await h.page.keyboard.press("ArrowDown");
  await h.page.keyboard.press("Escape");
  await h.listbox.waitFor({ state: "detached" });
  assert.equal(await h.input.getAttribute("aria-expanded"), "false");
  assert.equal(await h.input.getAttribute("aria-activedescendant"), null);
  assert.equal(await h.input.inputValue(), "mobile");
  assert.equal(new URL(h.page.url()).pathname, "/");
  // Typing again reopens it.
  await h.page.keyboard.type(" install");
  await h.listbox.waitFor();

  await h.page.keyboard.press("Tab");
  await h.listbox.waitFor({ state: "detached" });
  assert.notEqual(await h.page.evaluate(() => document.activeElement?.id), "masthead-search");

  await typeIn(h, "tesla");
  await h.page.mouse.click(20, 860);
  await h.listbox.waitFor({ state: "detached" });
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("1440 Enter with nothing highlighted: a size goes to the size, anything else to /search with the groups in full", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await typeIn(h, "2254517");
  await h.page.keyboard.press("Enter");
  await h.page.waitForURL(/\/tires\?size=225-45r17/);
  let [search] = await waitEvent(h.page, "search");
  assert.deepEqual(search, { search_term: "2254517", search_type: "site" });

  await typeIn(h, "rotation");
  await h.page.keyboard.press("Enter");
  await h.page.waitForURL(/\/search\?q=rotation$/);
  await h.page.getByRole("heading", { level: 1, name: "Results for “rotation”" }).waitFor();
  [search] = await waitEvent(h.page, "search", (p) => p.search_term === "rotation");
  assert.equal(search.search_type, "site");
  await h.page.getByRole("heading", { level: 2, name: /^Pages & guides/ }).waitFor();
  const main = h.page.locator("main");
  await main.locator('a[href="/tire-rotation-pattern"]').waitFor();
  await main.locator('a[href="/services/tire-rotation"]').waitFor();
  assert.equal(
    await h.page.locator('meta[name="robots"]').getAttribute("content"),
    "noindex, follow",
  );
  await h.page.screenshot({ path: `${SHOTS}/results-1440.png`, fullPage: true });

  // "See all results" from the drop-down lands on the same page.
  await typeIn(h, "tesla");
  await h.listbox.getByRole("option", { name: /^See all results for/ }).click();
  await h.page.waitForURL(/\/search\?q=tesla$/);
  await h.page.locator('main a[href="/learn/tesla"]').waitFor();
  assert.ok((await h.page.locator('main a[href^="/learn/tesla/"]').count()) >= 5);
  await waitEvent(h.page, "search", (p) => p.search_term === "tesla");

  // The page's own box searches again.
  await h.page.fill("#search-page-q", "2254517");
  await h.page.locator("#search-page-q").press("Enter");
  await h.page.waitForURL(/\/search\?q=2254517$/);
  await h.page.getByRole("heading", { level: 2, name: /^Tire sizes/ }).waitFor();
  await h.page.locator('main a[href="/tires?size=225-45r17"]').waitFor();
  await h.page.getByRole("heading", { level: 2, name: /^Tires & wheels/ }).waitFor();

  // Nothing found: says so, with the phone number.
  await h.page.goto(`${BASE}/search?q=zzqqxx`);
  await h.page.getByRole("heading", { level: 2, name: "No matches for “zzqqxx”" }).waitFor();
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("1440 axe: nothing serious or critical with the list open", async () => {
  const h = await open(1440);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await typeIn(h, "225/45");
  await h.page.keyboard.press("ArrowDown");
  await h.page.addScriptTag({ content: AXE });
  const result = await h.page.evaluate(() =>
    window.axe.run(document.querySelector('form[role="search"]'), {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
    }),
  );
  const blocking = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  assert.deepEqual(
    blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    [],
  );
  await h.context.close();
});

await check("390 the phone's search: suggestions as you type, 44px rows, no sideways scroll, a tap opens one", async () => {
  const h = await open(390);
  await h.page.goto(`${BASE}/`);
  await h.page.waitForFunction(mounted);
  await h.input.tap();
  await h.input.pressSequentially("225/45", { delay: 20 });
  await h.listbox.waitFor();
  await h.page.waitForTimeout(250);
  const texts = await optionTexts(h);
  assert.ok(texts.some((t) => t.startsWith("Shop 225/45R17 tires")), texts.join(" | "));
  const small = await h.listbox.getByRole("option").evaluateAll((els) =>
    els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent),
  );
  assert.deepEqual(small, []);
  const box = await h.listbox.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390, `list spans ${box.x}-${box.x + box.width}`);
  await noSidewaysScroll(h.page, "/ with the list open");
  await h.page.screenshot({ path: `${SHOTS}/size-390.png` });

  // A longer label still fits: truncated, not overflowing.
  await h.input.fill("");
  await h.input.pressSequentially("tesla", { delay: 20 });
  await h.page.waitForTimeout(250);
  await noSidewaysScroll(h.page, "/ with long guide titles");
  await h.page.screenshot({ path: `${SHOTS}/guides-390.png` });

  await h.input.fill("");
  await h.input.pressSequentially("mobile", { delay: 20 });
  await h.page.waitForTimeout(250);
  await h.listbox.locator('[role="option"][data-path="/mobile-service"]').tap();
  await h.page.waitForURL(/\/mobile-service$/);
  await h.page.waitForFunction(() => !document.getElementById("mobile-search-listbox"));

  await h.page.goto(`${BASE}/search?q=mobile`);
  await h.page.getByRole("heading", { level: 1 }).waitFor();
  await h.page.locator('main a[href="/mobile-service"]').first().waitFor();
  await noSidewaysScroll(h.page, "/search?q=mobile");
  await h.page.screenshot({ path: `${SHOTS}/results-390.png`, fullPage: true });
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await check("/search is prerendered noindex and hydrates in place, with no errors", async () => {
  const html = readFileSync("dist/search.html", "utf8");
  assert.match(html, /<meta name="robots" content="noindex, follow" \/>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/tiredroponline.com\/search" \/>/);
  assert.match(html, /<h1[^>]*>Search the store<\/h1>/);
  const sitemap = readFileSync("dist/sitemap.xml", "utf8");
  assert.ok(!sitemap.includes("/search<"), "not in the sitemap");

  const h = await open(1440);
  await h.page.goto(`${BASE}/search`, { waitUntil: "load" });
  await h.page.waitForFunction(mounted);
  await h.page.waitForLoadState("networkidle");
  assert.ok(await h.page.evaluate(() => window.__servedH1 === document.querySelector("h1")), "hydrated, not replaced");
  assert.deepEqual(real(h.errors), []);
  await h.context.close();
});

await browser.close();
stopServer();
if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nall search checks passed");
