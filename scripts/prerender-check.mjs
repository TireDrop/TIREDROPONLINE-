/**
 * Checks the prerendered build in Chromium.
 *
 *   1. JavaScript OFF: the key routes serve their own <title>, canonical,
 *      description, og:title and <h1>, all different from one another.
 *   2. JavaScript ON, every route: the app hydrates the prerendered markup
 *      in place (the <h1> element the HTML arrived with is still the one on
 *      screen), with no console errors, so no hydration mismatch.
 *   3. A query-string URL and an unknown path render fresh, without errors.
 *      A saved cart, compare list and vehicle hydrate without a mismatch;
 *      the vehicle and its fitment answers appear after hydration, never
 *      in the served HTML.
 *   4. Client-side navigation still works after hydration: a header link
 *      changes the page, title and canonical without a full page load.
 *   5. Article bodies load one at a time: index and hub pages fetch none,
 *      an article page only its own, and a link to another article fetches
 *      and renders that one in the same document.
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
import { loadContent } from "../src/content/node.js";

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
  // Each route three times: whether the saved cart lands before or after the
  // route's Suspense boundary hydrates is a race, and an urgent update in
  // that window used to replace the page (React error 421, see
  // CartContext.jsx). The cart and compare list load as transitions now.
  for (const route of ["/tires", "/track", "/contact", "/learn/sidewall/dot-date-code"]) {
    for (let run = 1; run <= 3; run += 1) {
      errors.length = 0;
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForFunction(isMounted);
      await page.waitForLoadState("networkidle");
      const state = await page.evaluate(() => ({
        kept: window.__servedH1 === document.querySelector("h1"),
        cart: document
          .querySelector('a[aria-label^="Cart,"]')
          ?.getAttribute("aria-label"),
        compare: JSON.parse(localStorage.getItem("tiredrop.compare.v1") || "[]").length,
      }));
      (state.kept && state.cart === "Cart, 4 items" && state.compare === 1 && errors.length === 0
        ? ok
        : bad)(
        `hydrated ${route} with a saved cart (${state.cart}, compare ${state.compare}), run ${run} ${errors.join(" | ")}`,
      );
    }
  }
  await context.close();
}

// A shopper with a saved vehicle. The server renders with no vehicle; the
// saved one loads in an effect after hydration, so the served markup must
// hydrate in place and then show the vehicle and its fitment answers.
{
  const { context, page, errors } = await newPage();
  await context.addInitScript(() => {
    localStorage.setItem(
      "tiredrop.fitment.v1",
      JSON.stringify({ type: "vehicle", year: "2019", make: "Ford", model: "F-150" }),
    );
  });
  for (const route of [
    "/tires",
    "/tires/continental-terraincontact-at-265-70r17",
    "/tires/nitto-ridge-grappler-285-70r17",
    "/cart",
    "/compare",
  ]) {
    for (let run = 1; run <= 2; run += 1) {
      errors.length = 0;
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForFunction(isMounted);
      await page.waitForLoadState("networkidle");
      const state = await page.evaluate(() => ({
        kept: window.__servedH1 === document.querySelector("h1"),
        bar:
          document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? "",
      }));
      // The tire search asks /api/tires, which this harness answers 404.
      const real = errors.filter((e) => !/status of 404/.test(e));
      // An empty cart or compare list has no bar to show.
      const barOk =
        /^\/(cart|compare)$/.test(route) ||
        /2019 Ford F-150 \(265\/70R17\)/.test(state.bar);
      (state.kept && barOk && real.length === 0
        ? ok
        : bad)(
        `hydrated ${route} with a saved vehicle ("${state.bar.trim()}"), run ${run} ${real.join(" | ")}`,
      );
    }
  }
  await context.close();
}

// The served HTML itself carries no vehicle and no fitment answer: those
// depend on the visitor's storage, so they only appear after hydration.
{
  const html = await (await fetch(`${BASE}/tires/nitto-ridge-grappler-285-70r17`)).text();
  const clean =
    !/data-fit=/.test(html) &&
    !/Doesn(&#x27;|')t fit/.test(html) &&
    /data-testid="shopping-for"/.test(html) &&
    />Add to Cart</.test(html);
  (clean ? ok : bad)(
    "prerendered product page: Shopping-for bar shell, no fitment answer, Add to Cart present",
  );
}

for (const url of ["/tires?size=225/45R18", "/tire-size?size=225/45R17", "/no-such-page"]) {
  const { context, page, errors } = await newPage();
  await page.goto(BASE + url, { waitUntil: "load" });
  await page.waitForFunction(isMounted);
  await page.waitForLoadState("networkidle");
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent);
  // /tires?size= searches /api/tires for that size, which this harness
  // answers 404 (the sample catalog then answers).
  const real = errors.filter((e) => !/status of 404/.test(e) || url === "/no-such-page");
  if (real.length === 0 && h1) ok(`rendered ${url}: h1 "${h1.trim()}"`);
  else bad(`render ${url}: h1 "${h1}" ${real.join(" | ")}`);
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

/* --------------------- 5. one article, one chunk --------------------- */

// Each article's body ships in a chunk of its own (src/content/details.js):
// an index or hub page downloads no article's text, an article page only its
// own, and following a link to another article fetches that one and renders
// it. An article counts as downloaded when a plain sentence from its body
// turns up in any script the page fetched, whether as Markdown or as HTML.
{
  const content = loadContent();
  const markers = [...content.getLearnArticles(), ...content.getBlogPosts()]
    .map((a) => ({
      path: a.path,
      text: a.body
        .split("\n")
        .map((l) => l.trim())
        // A plain paragraph line: no list marker or inline Markdown, and no
        // character the HTML would escape.
        .find((l) => l.length > 60 && /^[A-Z]/.test(l) && !/[[\]*_`<>|#&"'’]/.test(l))
        ?.slice(0, 60),
    }))
    .filter((m) => m.text);
  const { context, page, errors } = await newPage();
  // The scripts the page requested, read back from the server here: the
  // browser's copy of a preloaded module's body is not reliably readable.
  let fetched = new Set();
  const requested = [];
  const texts = new Map();
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.host === local && url.pathname.endsWith(".js"))
      requested.push(url.href);
  });
  const settle = async () => {
    await page.waitForFunction(isMounted);
    await page.waitForLoadState("networkidle");
    for (const href of requested.splice(0)) {
      if (!texts.has(href)) texts.set(href, await (await fetch(href)).text());
      for (const m of markers)
        if (texts.get(href).includes(m.text)) fetched.add(m.path);
    }
  };

  const only = (path) => fetched.size === 1 && fetched.has(path);
  const list = () => {
    const paths = [...fetched];
    const more = paths.length > 3 ? ", ..." : "";
    return paths.length
      ? `${paths.length} articles' text (${paths.slice(0, 3).join(", ")}${more})`
      : "no article's text";
  };

  for (const route of ["/blog", "/learn", "/learn/buying"]) {
    fetched = new Set();
    requested.length = 0;
    await page.goto(BASE + route, { waitUntil: "load" });
    await settle();
    (fetched.size === 0 ? ok : bad)(`${route} downloaded ${list()}`);
  }

  const from = "/learn/buying/run-flat-tires";
  fetched = new Set();
  requested.length = 0;
  errors.length = 0;
  await page.goto(BASE + from, { waitUntil: "load" });
  await settle();
  (only(from) && errors.length === 0 ? ok : bad)(
    `${from} downloaded ${list()} ${errors.join(" | ")}`,
  );

  await page.evaluate(() => {
    window.__sameDocument = true;
  });
  const to = await page.evaluate(
    () =>
      [...document.querySelectorAll('section[aria-labelledby="related"] a')]
        .map((a) => a.getAttribute("href"))
        .find((href) => /^\/(learn\/[^/]+|blog)\/[^/]+$/.test(href)) ?? null,
  );
  if (!to) bad(`${from}: no related article link to follow`);
  else {
    fetched = new Set();
    requested.length = 0;
    await page.locator(`section[aria-labelledby="related"] a[href="${to}"]`).first().click();
    await page.waitForURL(BASE + to);
    await page.waitForFunction(
      (path) =>
        document.querySelector('link[rel="canonical"]')?.href.endsWith(path) &&
        (document.querySelector(".prose-article")?.textContent.length ?? 0) > 500,
      to,
    );
    await settle();
    const same = await page.evaluate(() => window.__sameDocument === true);
    (same && only(to) && errors.length === 0 ? ok : bad)(
      `client nav ${from} -> ${to}: same document ${same}, body rendered, ` +
        `downloaded ${list()} ${errors.join(" | ")}`,
    );
  }
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
