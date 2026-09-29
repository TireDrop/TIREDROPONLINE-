/**
 * Checks the prerendered build in Chromium.
 *
 *   1. JavaScript OFF: the key routes serve their own <title>, canonical,
 *      description, og:title and <h1>, all different from one another.
 *   2. JavaScript ON, every route: the app hydrates the prerendered markup
 *      in place (the <h1> element the HTML arrived with is still the one on
 *      screen), with no console errors, so no hydration mismatch.
 *   3. A query-string URL and an unknown path render fresh, without errors.
 *   4. Client-side navigation still works after hydration: a header link
 *      changes the page, title and canonical without a full page load.
 *
 * Every /api request is answered by a mock, and third-party hosts are
 * answered empty.
 *
 *   npm run build && npm run check:prerender
 *
 * Starts `vite preview` on PRERENDER_PORT (default 4310), or tests
 * PRERENDER_BASE when that is set to an already running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

import { EXCLUDE } from "./generate-seo-files.mjs";

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.PRERENDER_PORT ?? 4310);
const KEY_ROUTES = ["/", "/tires", "/install", "/tire-size", "/contact"];

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.PRERENDER_BASE;
if (!BASE) {
  if (!existsSync("dist/tires.html")) {
    console.error("No prerendered build in dist/. Run `npm run build` first.");
    process.exit(1);
  }
  BASE = `http://localhost:${PORT}`;
  server = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { stdio: "ignore", detached: true },
  );
  const deadline = Date.now() + 20000;
  for (;;) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      console.error(`vite preview did not come up on ${BASE}`);
      process.kill(-server.pid);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}
const stopServer = () => {
  try {
    if (server) process.kill(-server.pid);
  } catch {
    /* already gone */
  }
};

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

async function newPage({ javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({
    javaScriptEnabled,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text()))
      errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.route(
    (url) => url.host !== local,
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        atd: "sample",
        shopify: "live",
        checkout: "request",
        newsletter: "off",
        forms: "on",
        version: "test",
      },
    }),
  );
  await page.route("**/api/tires**", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  // Remembers the <h1> the served HTML contained, before any script runs.
  await page.addInitScript(() => {
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "interactive")
        window.__servedH1 = document.querySelector("h1");
    });
  });
  return { context, page, errors };
}

const isMounted = () =>
  Object.keys(document.getElementById("root")).some((k) =>
    k.startsWith("__reactContainer"),
  );

let failures = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
const bad = (msg) => {
  failures += 1;
  console.log(`FAIL ${msg}`);
};

/* ---------------------------- 1. no JS ---------------------------- */

{
  const { context, page } = await newPage({ javaScriptEnabled: false });
  const seen = { title: new Set(), canonical: new Set(), h1: new Set() };
  for (const route of KEY_ROUTES) {
    await page.goto(BASE + route);
    const got = await page.evaluate(() => ({
      title: document.title,
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? "",
      description:
        document.querySelector('meta[name="description"]')?.content ?? "",
      ogTitle:
        document.querySelector('meta[property="og:title"]')?.content ?? "",
      h1: document.querySelector("h1")?.textContent.trim() ?? "",
      links: document.querySelectorAll("#root a[href]").length,
    }));
    const expected = `https://tiredroponline.com${route}`;
    const fine =
      got.canonical === expected &&
      got.title &&
      got.description &&
      got.ogTitle === got.title &&
      got.h1 &&
      got.links > 10 &&
      !seen.title.has(got.title) &&
      !seen.canonical.has(got.canonical) &&
      !seen.h1.has(got.h1);
    seen.title.add(got.title);
    seen.canonical.add(got.canonical);
    seen.h1.add(got.h1);
    (fine ? ok : bad)(
      `no-JS ${route}: "${got.title}" | ${got.canonical} | h1 "${got.h1}" | ${got.links} links`,
    );
  }
  await context.close();
}

/* ------------------------- 2. hydrate, all ------------------------- */

// What was actually built: the sitemap (which includes content routes) plus
// the prerendered pages kept out of it.
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const routes = [
  ...[...sitemap.matchAll(/<loc>https:\/\/[^/]+([^<]*)<\/loc>/g)].map(
    (m) => m[1] || "/",
  ),
  ...EXCLUDE,
];
{
  const { context, page, errors } = await newPage();
  for (const route of routes) {
    errors.length = 0;
    await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForFunction(isMounted);
    await page.waitForLoadState("networkidle");
    const kept = await page.evaluate(
      () =>
        window.__servedH1 != null &&
        window.__servedH1 === document.querySelector("h1"),
    );
    if (kept && errors.length === 0) ok(`hydrated ${route}`);
    else
      bad(
        `hydrate ${route}: ${kept ? "" : "markup was replaced, not hydrated. "}` +
          errors.join(" | "),
      );
  }
  await context.close();
}

/* ---------------- 3. query string and unknown path ---------------- */

// A shopper with a cart and a compare list: both load from localStorage after
// hydration, so they must not trip it.
{
  const { context, page, errors } = await newPage();
  await context.addInitScript(() => {
    localStorage.setItem(
      "tiredrop.cart.v1",
      JSON.stringify({
        lines: [
          {
            key: "t1:n",
            id: "t1",
            name: "Test tire",
            price: 150,
            qty: 4,
            install: false,
            installPrice: 25,
          },
        ],
      }),
    );
    localStorage.setItem(
      "tiredrop.compare.v1",
      JSON.stringify(["michelin-agilis-crossclimate-245-75r17"]),
    );
  });
  await page.goto(BASE + "/tires", { waitUntil: "load" });
  await page.waitForFunction(isMounted);
  await page.waitForLoadState("networkidle");
  const state = await page.evaluate(() => ({
    kept: window.__servedH1 === document.querySelector("h1"),
    cart: document.querySelector('a[aria-label^="Cart,"]')?.getAttribute("aria-label"),
  }));
  (state.kept && errors.length === 0 ? ok : bad)(
    `hydrated /tires with a saved cart (${state.cart}) ${errors.join(" | ")}`,
  );
  await context.close();
}

for (const url of ["/tires?size=225/45R18", "/tire-size?size=225/45R17", "/no-such-page"]) {
  const { context, page, errors } = await newPage();
  await page.goto(BASE + url, { waitUntil: "load" });
  await page.waitForFunction(isMounted);
  await page.waitForLoadState("networkidle");
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent);
  if (errors.length === 0 && h1) ok(`rendered ${url}: h1 "${h1.trim()}"`);
  else bad(`render ${url}: h1 "${h1}" ${errors.join(" | ")}`);
  await context.close();
}

/* ------------------------ 4. client navigation ------------------------ */

{
  const { context, page, errors } = await newPage();
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForFunction(isMounted);
  await page.evaluate(() => {
    window.__sameDocument = true;
  });
  await page.locator('#root a[href="/tires"]:visible').first().click();
  await page.waitForURL(`${BASE}/tires`);
  await page.waitForFunction(() => document.title.startsWith("Shop Tires"));
  const state = await page.evaluate(() => ({
    same: window.__sameDocument === true,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
    h1: document.querySelector("h1")?.textContent.trim(),
    lds: document.querySelectorAll('script[type="application/ld+json"]').length,
  }));
  const fine =
    state.same &&
    state.canonical === "https://tiredroponline.com/tires" &&
    state.lds === 1 &&
    errors.length === 0;
  (fine ? ok : bad)(
    `client nav / -> /tires: same document ${state.same}, canonical ${state.canonical}, ` +
      `h1 "${state.h1}", ${state.lds} JSON-LD block(s) ${errors.join(" | ")}`,
  );
  await context.close();
}

await browser.close();
stopServer();
console.log(
  failures
    ? `\n${failures} check(s) failed`
    : `\nall checks passed (${routes.length} routes hydrated)`,
);
process.exit(failures ? 1 : 0);
