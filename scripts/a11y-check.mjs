/**
 * axe-core over the built site's key routes, at phone and desktop width.
 *
 *   npm run build && npm run check:a11y
 *
 * Fails on any serious or critical violation; moderate and minor ones are
 * listed but do not fail the run. ROUTES run at both widths; PHONE_ROUTES
 * (more pages on templates ROUTES already cover at 1280) at 390 only, to keep
 * the run short. "/compare#filled" queues two tires first, so the full
 * comparison table is checked and the compare tray shows on the next routes. Also checks that the skip link is the first
 * thing Tab reaches and that it moves focus to <main id="main">, and the
 * keyboard behaviour axe cannot see (keyboardChecks below): the phone menu
 * and filter sheets keep Tab inside and close on Escape, focus never hides
 * behind the phone action bar, and the desktop nav dropdowns close once focus
 * moves past them or on Escape. At 390 it also measures every link and button
 * in the phone header and the open menu drawer (tapTargetChecks below): each
 * must be at least 44x44 px, and the page must not scroll sideways.
 *
 * Starts `vite preview` on A11Y_PORT (default 4320), or tests A11Y_BASE when
 * that is set to an already running server. Every /api call is mocked and
 * third-party hosts are answered empty, as in prerender-check.mjs.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.A11Y_PORT ?? 4320);
const WIDTHS = [390, 1280];

/** The first prerendered page in a dist/ folder, as a route. */
function firstIn(dir) {
  const file = readdirSync(`dist/${dir}`)
    .filter((f) => f.endsWith(".html"))
    .sort()[0];
  if (!file) throw new Error(`no prerendered page in dist/${dir}`);
  return `/${dir}/${file.replace(/\.html$/, "")}`;
}

/* ------------------------------ preview ------------------------------ */

// vite preview runs as its own process group so the whole tree can be
// stopped; Windows has no process groups, and there the server is the
// child itself (node runs vite directly rather than through npx).
const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.A11Y_BASE;
if (!BASE) {
  if (!existsSync("dist/tires.html")) {
    console.error("No prerendered build in dist/. Run `npm run build` first.");
    process.exit(1);
  }
  BASE = `http://localhost:${PORT}`;
  server = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "preview", "--port", String(PORT), "--strictPort"],
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

const learnHubs = readdirSync("dist/learn", { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
const learnHub = learnHubs[0];

const ROUTES = [
  "/",
  "/tires",
  firstIn("tires"),
  "/cart",
  "/checkout",
  "/track",
  "/schedule",
  "/mobile-service",
  firstIn("mobile-service"),
  // The Spanish test pages (built even while they are noindex).
  "/es/instalacion-movil",
  "/es/instalacion-movil/hialeah-fl",
  "/tires-shipped",
  firstIn("tires-shipped"),
  "/local-delivery", // the inline SVG map and the ZIP checker
  firstIn(`learn/${learnHub}`),
  "/tire-size",
  "/tire-size-finder",
  "/contact",
  // Second pass (2026-10-02): heading order on the Learn and Blog indexes,
  // /wheels and /compare, and the UTQG article's tables.
  "/learn",
  `/learn/${learnHub}`,
  "/blog",
  "/compare",
  "/wheels", // between the two, so "#filled" is a real page load
  "/compare#filled",
  "/learn/sidewall/utqg-ratings",
];

const PHONE_ROUTES = [
  ...learnHubs.slice(1).map((hub) => `/learn/${hub}`),
  firstIn("blog"),
  firstIn("wheels"),
  "/about",
  "/shipping",
  "/install",
  "/find-my-tires",
  "/financing",
  "/locations",
  "/auto-service",
  "/load-speed-check",
];

/** Two real tire slugs for the "/compare#filled" visit. */
const COMPARE_PICKS = readdirSync("dist/tires")
  .filter((f) => f.endsWith(".html"))
  .sort()
  .slice(0, 2)
  .map((f) => f.replace(/\.html$/, ""));

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

async function newPage(width, reducedMotion = "reduce") {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion,
  });
  await context.addInitScript((picks) => {
    if (location.hash === "#filled")
      localStorage.setItem("tiredrop.compare.v1", JSON.stringify(picks));
  }, COMPARE_PICKS);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
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
        newsletter: "on",
        forms: "on",
        version: "test",
      },
    }),
  );
  await page.route("**/api/tires**", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  return { context, page };
}

const isMounted = () =>
  Object.keys(document.getElementById("root")).some((k) =>
    k.startsWith("__reactContainer"),
  );

const MODAL = '[role="dialog"][aria-modal="true"]';

/**
 * Keyboard behaviour axe cannot see. Prints an ok line per passing check and
 * returns the failures.
 *   phone:   the menu drawer and the /tires and /wheels filter sheets keep
 *            Tab and Shift+Tab inside, and Escape closes them with focus back
 *            on their button; tabbing down the home page never leaves the
 *            focused control behind the fixed action bar (WCAG 2.4.11).
 *   desktop: a nav dropdown opened by focus closes once focus moves on past
 *            it, and Escape closes it with focus on its own link.
 */
async function keyboardChecks(page, width) {
  const problems = [];
  const load = async (route) => {
    await page.goto(BASE + route, { waitUntil: "load" });
    await page.waitForFunction(isMounted);
    await page.waitForLoadState("networkidle");
  };

  if (width < 1024) {
    for (const [route, trigger, name] of [
      ["/", 'button[aria-label="Open menu"]', "menu drawer"],
      ["/tires", 'button[aria-haspopup="dialog"]:visible:has-text("Filters")', "/tires filter sheet"],
      ["/wheels", 'button:visible:has-text("Filters")', "/wheels filter sheet"],
    ]) {
      await load(route);
      const button = page.locator(trigger).first();
      await button.click();
      await page.locator(MODAL).waitFor();
      let escaped = "";
      for (const key of [...Array(60).fill("Tab"), ...Array(15).fill("Shift+Tab")]) {
        await page.keyboard.press(key);
        const where = await page.evaluate(
          (modal) =>
            document.activeElement?.closest(modal)
              ? ""
              : (document.activeElement?.textContent || document.activeElement?.tagName || "").trim().slice(0, 40),
          MODAL,
        );
        if (where && !escaped) escaped = `${key} reached "${where}"`;
      }
      await page.keyboard.press("Escape");
      const closed = (await page.locator(MODAL).count()) === 0;
      const back = await button.evaluate((el) => el === document.activeElement);
      if (escaped) problems.push(`${name} @${width}: focus left the open dialog (${escaped})`);
      else if (!closed || !back)
        problems.push(`${name} @${width}: Escape ${closed ? "closed it but focus did not return to its button" : "did not close it"}`);
      else console.log(`ok   ${name} @${width}: Tab stays inside, Escape closes it and returns focus`);
    }

    await load("/");
    const hidden = [];
    for (let i = 0; i < 80; i += 1) {
      await page.keyboard.press("Tab");
      const seen = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el.closest('[style*="position: fixed"], .fixed')) return null;
        const box = el.getBoundingClientRect();
        // The top edge of whatever is pinned to the bottom of the screen.
        let floor = innerHeight;
        for (const bar of document.querySelectorAll(".fixed")) {
          const r = bar.getBoundingClientRect();
          if (r.height > 0 && r.height < 240 && r.bottom >= innerHeight - 1) floor = Math.min(floor, r.top);
        }
        // Only what can fit above the bar can be shown whole.
        return box.height < floor - 120 && box.bottom > floor + 1
          ? `"${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40)}"`
          : null;
      });
      if (seen && !hidden.includes(seen)) hidden.push(seen);
    }
    if (hidden.length)
      problems.push(`focus not obscured @${width}: behind the action bar on /: ${hidden.slice(0, 4).join(", ")}`);
    else console.log(`ok   focus not obscured @${width}: 80 Tab stops on / all clear of the action bar`);
  } else {
    await load("/");
    let opened = false;
    let stuck = "";
    for (let i = 0; i < 90 && !stuck; i += 1) {
      await page.keyboard.press("Tab");
      const state = await page.evaluate(() => ({
        inNav: Boolean(document.activeElement?.closest('nav[aria-label="Main"]')),
        menus: document.querySelectorAll('nav[aria-label="Main"] li > div.absolute').length,
        text: (document.activeElement?.textContent || "").trim().slice(0, 30),
      }));
      if (state.menus) opened = true;
      if (!state.inNav && state.menus) stuck = `still open with focus on "${state.text}"`;
    }
    // Escape, from inside an open menu.
    await load("/");
    const tires = page.locator('nav[aria-label="Main"] a[aria-expanded]').first();
    await tires.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    const esc = await page.evaluate(() => ({
      menus: document.querySelectorAll('nav[aria-label="Main"] li > div.absolute').length,
      expanded: document.activeElement?.getAttribute("aria-expanded"),
    }));
    if (!opened) problems.push(`nav dropdowns @${width}: focus never opened one`);
    else if (stuck) problems.push(`nav dropdowns @${width}: ${stuck}`);
    else if (esc.menus || esc.expanded !== "false")
      problems.push(`nav dropdowns @${width}: Escape left ${esc.menus} open (focus aria-expanded=${esc.expanded})`);
    else console.log(`ok   nav dropdowns @${width}: close when focus moves past them and on Escape`);
  }
  return problems;
}

/**
 * Phone tap targets (the site's 44px convention): every link and button in the
 * header, search and open menu drawer on "/" is at least 44x44 px, and neither
 * state scrolls sideways. Returns the failures.
 */
async function tapTargetChecks(page, width) {
  const problems = [];
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.waitForFunction(isMounted);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
  const measure = (inDrawer) =>
    page.evaluate((drawer) => {
      const main = document.getElementById("main");
      return [...document.querySelectorAll("a, button, input, select")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          // The skip link only shows while it has focus; it is checked above.
          if (r.width <= 1 || r.height <= 1 || el.matches('a[href="#main"]')) return false;
          if (drawer) return el.closest('[role="dialog"]') && !el.matches('[tabindex="-1"]');
          return !el.closest('[role="dialog"]') && main && el.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING;
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            name: (el.getAttribute("aria-label") || el.value || el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 30),
            w: Math.round(r.width * 10) / 10,
            h: Math.round(r.height * 10) / 10,
          };
        });
    }, inDrawer);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const verdict = (where, boxes, wide) => {
    const small = boxes.filter((b) => b.w < 44 || b.h < 44);
    if (!boxes.length) problems.push(`tap targets @${width}: found no controls in the ${where}`);
    else if (small.length)
      problems.push(
        `tap targets @${width}: ${small.length} of ${boxes.length} in the ${where} under 44x44: ${small
          .slice(0, 4)
          .map((b) => `"${b.name}" ${b.w}x${b.h}`)
          .join(", ")}`,
      );
    else console.log(`ok   tap targets @${width}: all ${boxes.length} controls in the ${where} are at least 44x44`);
    if (wide > 0) problems.push(`tap targets @${width}: the page scrolls sideways by ${wide}px with the ${where} showing`);
  };
  verdict("header", await measure(false), await overflow());
  await page.locator('button[aria-label="Open menu"]').click();
  await page.locator(MODAL).waitFor();
  verdict("open menu drawer", await measure(true), await overflow());
  return problems;
}

let failures = 0;
const report = [];

try {
  for (const width of WIDTHS) {
    const { context, page } = await newPage(width);
    for (const route of width === 390 ? [...ROUTES, ...PHONE_ROUTES] : ROUTES) {
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForFunction(isMounted);
      await page.waitForLoadState("networkidle");
      // The truck layer is imported when the page is idle: scan the page with it on.
      if (route === "/local-delivery") await page.waitForSelector("svg [data-truck]", { state: "attached" });
      // Let colour transitions settle, or axe measures a half-faded state.
      await page.waitForTimeout(300);
      if (!(await page.evaluate(() => Boolean(window.axe))))
        await page.addScriptTag({ content: AXE });
      const result = await page.evaluate(() =>
        window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
          },
        }),
      );
      const blocking = result.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );
      for (const v of result.violations) {
        report.push({ route, width, ...v });
        const where = v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(" "))
          .join(" | ");
        console.log(
          `${blocking.includes(v) ? "FAIL" : "note"} ${route} @${width}: ${v.id} [${v.impact}] x${v.nodes.length} ${where}`,
        );
      }
      if (blocking.length) failures += blocking.length;
      else console.log(`ok   ${route} @${width}: no serious or critical issues`);
    }

    // /local-delivery with motion on, then zoomed to a ZIP with a hub bubble
    // open: the live layer (counter, 105 hub buttons, pin, "Show whole map")
    // at its busiest. The routes above scan it with reduced motion.
    {
      const live = await newPage(width, "no-preference");
      const lp = live.page;
      await lp.goto(BASE + "/local-delivery", { waitUntil: "load" });
      await lp.waitForFunction(isMounted);
      await lp.waitForSelector("svg [data-truck]", { state: "attached" });
      await lp.getByLabel("ZIP code").fill("33351");
      await lp.getByRole("button", { name: "Check my ZIP" }).click();
      await lp.getByRole("button", { name: "Show whole map" }).waitFor();
      await lp.locator('[aria-label^="Delivery hub 1 of"]').focus();
      await lp.keyboard.press("Enter");
      await lp.waitForTimeout(900);
      if (!(await lp.evaluate(() => Boolean(window.axe)))) await lp.addScriptTag({ content: AXE });
      const result = await lp.evaluate(() =>
        window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
        }),
      );
      const blocking = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      for (const v of result.violations) {
        report.push({ route: "/local-delivery (zoomed, bubble open)", width, ...v });
        console.log(
          `${blocking.includes(v) ? "FAIL" : "note"} /local-delivery (zoomed) @${width}: ${v.id} [${v.impact}] x${v.nodes.length} ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`,
        );
      }
      if (blocking.length) failures += blocking.length;
      else console.log(`ok   /local-delivery with motion, zoomed, hub bubble open @${width}: no serious or critical issues`);
      await live.context.close();
    }

    // The skip link: first Tab stop, and it lands focus on <main>.
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForFunction(isMounted);
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => ({
      text: document.activeElement?.textContent.trim(),
      href: document.activeElement?.getAttribute("href"),
    }));
    await page.keyboard.press("Enter");
    const landed = await page.evaluate(() => document.activeElement?.id);
    if (first.text === "Skip to main content" && first.href === "#main" && landed === "main")
      console.log(`ok   skip link @${width}: first Tab stop, focus moves to <main>`);
    else {
      failures += 1;
      console.log(
        `FAIL skip link @${width}: first Tab stop "${first.text}" (${first.href}), focus after Enter on #${landed}`,
      );
    }

    for (const problem of await keyboardChecks(page, width)) {
      failures += 1;
      console.log(`FAIL ${problem}`);
    }
    if (width < 1024)
      for (const problem of await tapTargetChecks(page, width)) {
        failures += 1;
        console.log(`FAIL ${problem}`);
      }
    await context.close();
  }
} finally {
  await browser.close();
  stopServer();
}

const notes = report.filter((v) => !["serious", "critical"].includes(v.impact));
console.log(
  `\n${ROUTES.length} routes x ${WIDTHS.length} widths + ${PHONE_ROUTES.length} at 390: ${failures} serious/critical, ${notes.length} moderate/minor noted`,
);
process.exit(failures ? 1 : 0);
