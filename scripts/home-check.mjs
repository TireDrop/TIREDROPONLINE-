/**
 * The home page's flow and scroll reveal, on the built site.
 *
 *   npm run build && npm run check:home
 *
 * 1. Prerendered HTML: every section in story order, the hero's scan button
 *    and its link to the 5-question quiz, 3-6 Learn cards linking real guides or posts, and no hidden reveal
 *    state baked into the markup.
 * 2. JavaScript off: every reveal target is fully visible.
 * 3. Reduced motion: hydrated, scrolled top to bottom, nothing is ever hidden.
 * 4. Full motion at 390px and 1440px: below-the-fold targets start hidden,
 *    the hero never does, and scrolling reveals every one; no sideways
 *    scroll, no layout shift from the reveal (CLS under 0.1) and no console
 *    errors.
 *
 * Starts `vite preview` on HOME_PORT (default 4352), or tests HOME_BASE when
 * that is set to a running server. /api calls are mocked and third-party
 * hosts answered empty, as in the other Chromium checks.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.HOME_PORT ?? 4352);

const ORDER = [
  "hero",
  "trust",
  "shop",
  "how",
  "install",
  "tools",
  "learn",
  "nationwide",
  "faq",
  "cta",
];

let failures = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
const bad = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};
const check = (cond, msg) => (cond ? ok : bad)(msg);

/* ------------------------- 1. prerendered HTML ------------------------- */

if (!existsSync("dist/index.html")) {
  console.error("No build in dist/. Run `npm run build` first.");
  process.exit(1);
}
const html = readFileSync("dist/index.html", "utf8");
const found = [...html.matchAll(/data-home-section="([a-z]+)"/g)].map((m) => m[1]);
check(
  JSON.stringify(found) === JSON.stringify(ORDER),
  `prerendered sections in order: ${found.join(" > ")}`,
);
check(html.includes('data-testid="hero-scan"'), "prerendered hero has the scan button");
const heroHtml = /data-home-section="hero"[\s\S]*?data-home-section="trust"/.exec(html)?.[0] ?? "";
const quizLink = /href="\/find-my-tires"[^>]*>([\s\S]*?)<\/a>/.exec(heroHtml)?.[1] ?? "";
check(
  quizLink.replace(/<[^>]*>/g, "") === "Not sure which tire? Answer 5 quick questions →",
  "prerendered hero links the quiz under the scan button",
);
check(!/data-rv=/.test(html), "no reveal state in the prerendered markup");
const learnHtml = /data-home-section="learn"[\s\S]*?data-home-section="nationwide"/.exec(html)?.[0] ?? "";
const cards = [...learnHtml.matchAll(/href="(\/(?:learn\/[^/"]+|blog)\/[^"]+)"/g)].map((m) => m[1]);
check(
  cards.length >= 3 && cards.length <= 6 &&
    cards.every((c) => existsSync(`dist${c}.html`)),
  `Learn shows ${cards.length} prerendered articles: ${cards.join(", ")}`,
);

// The local delivery teaser sits in "How it works" and links the ZIP check.
const howHtml = /data-home-section="how"[\s\S]*?data-home-section="install"/.exec(html)?.[0] ?? "";
const zipLink = /href="\/local-delivery#zip-check"[^>]*>([\s\S]*?)<\/a>/.exec(howHtml)?.[1] ?? "";
check(
  zipLink.replace(/<[^>]*>/g, "").trim() === "Check your ZIP" &&
    /data-home-local-delivery[\s\S]*?<svg[^>]*role="img"[^>]*aria-label="Map of the U\.S\. with \d+ local delivery hubs"/.test(howHtml),
  "prerendered How it works has the local delivery map and a Check your ZIP link",
);

/* ------------------------------ preview ------------------------------ */

// vite preview runs as its own process group so the whole tree can be
// stopped; Windows has no process groups, and there the server is the
// child itself (node runs vite directly rather than through npx).
const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.HOME_BASE;
if (!BASE) {
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

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

async function newPage({ width, js = true, reducedMotion = "no-preference" }) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 844 : 900 },
    javaScriptEnabled: js,
    reducedMotion,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  // A 404 is the mocked /api or the vPIC snapshot this sandbox cannot
  // write; prerender-check.mjs ignores them the same way.
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  // The local delivery teaser is static: its zone list and location lookup
  // belong to /local-delivery, never the home page's load.
  page.on("request", (r) => {
    if (/\/api\/geo|local-delivery-zips/.test(r.url())) errors.push(`home page requested ${r.url()}`);
  });
  await page.route((url) => url.host !== local, (r) => r.fulfill({ status: 200, body: "" }));
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { atd: "sample", shopify: "live", checkout: "request", newsletter: "on", forms: "on", version: "test" } }),
  );
  await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
  if (js) {
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
  }
  return { context, page, errors };
}

const isMounted = () =>
  Object.keys(document.getElementById("root")).some((k) => k.startsWith("__reactContainer"));

/** Every reveal target's opacity and whether it is marked hidden. */
const revealState = () =>
  [...document.querySelectorAll("[data-reveal]")].map((el) => ({
    hidden: el.getAttribute("data-rv") === "hide",
    opacity: Number(getComputedStyle(el).opacity),
    inHero: Boolean(el.closest('[data-home-section="hero"]')),
  }));

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 90));
    }
  });
  // Longest stagger (6 x 70ms) plus the 600ms transition.
  await page.waitForTimeout(1400);
}

try {
  /* ---------------------------- 2. JS off ---------------------------- */
  {
    const { context, page } = await newPage({ width: 390, js: false });
    await page.goto(BASE + "/", { waitUntil: "load" });
    const state = await page.evaluate(revealState);
    check(
      state.length > 10 && state.every((s) => !s.hidden && s.opacity === 1),
      `JS off: all ${state.length} reveal targets visible`,
    );
    await context.close();
  }

  /* ------------------------- 3. reduced motion ------------------------- */
  {
    const { context, page, errors } = await newPage({ width: 390, reducedMotion: "reduce" });
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForFunction(isMounted);
    const before = await page.evaluate(revealState);
    await scrollThrough(page);
    const after = await page.evaluate(revealState);
    check(
      [...before, ...after].every((s) => !s.hidden && s.opacity === 1),
      "reduced motion: nothing hidden before or after scrolling",
    );
    check(errors.length === 0, `reduced motion: no console errors ${errors.join(" | ")}`);
    await context.close();
  }

  /* --------------------------- 4. full motion --------------------------- */
  for (const width of [390, 1440]) {
    const { context, page, errors } = await newPage({ width });
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForFunction(isMounted);
    await page.waitForLoadState("networkidle");

    const order = await page.evaluate(() =>
      [...document.querySelectorAll("[data-home-section]")].map((el) => el.dataset.homeSection),
    );
    check(JSON.stringify(order) === JSON.stringify(ORDER), `${width}: sections in order after hydration`);

    const start = await page.evaluate(revealState);
    check(start.some((s) => s.hidden), `${width}: below-the-fold targets wait to reveal`);
    check(start.every((s) => !(s.inHero && s.hidden)), `${width}: the hero is never hidden`);
    check(
      await page.locator('[data-testid="hero-scan"]').isVisible(),
      `${width}: hero scan button visible`,
    );

    await scrollThrough(page);
    const end = await page.evaluate(revealState);
    const left = end.filter((s) => s.hidden || s.opacity < 1).length;
    check(left === 0, `${width}: every target revealed after scrolling (${left} left)`);

    const { sw, iw, cls } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
      cls: window.__cls,
    }));
    check(sw <= iw, `${width}: no sideways scroll (${sw} <= ${iw})`);
    check(cls < 0.1, `${width}: cumulative layout shift ${cls.toFixed(4)} < 0.1`);
    check(errors.length === 0, `${width}: no console errors ${errors.join(" | ")}`);
    await context.close();
  }
} finally {
  await browser.close();
  stopServer();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall home checks passed");
process.exit(failures ? 1 : 0);
