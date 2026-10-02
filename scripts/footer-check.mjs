/**
 * The site footer on the built site, at 390px and 1440px.
 *
 *   npm run build && npm run check:footer
 *
 * - Every footer link (FOOTER_COLUMNS, the legal row, socials, call, email,
 *   directions) is in the footer, or, for the Tools & Guides links the footer
 *   trims, on the prerendered /learn or /sitemap page.
 * - The newsletter form sits inside <footer>, and no sideways scroll.
 * - 390px: the link groups are closed <details>, their summaries and the
 *   contact buttons are at least 44px tall, and a summary opens and closes
 *   its group, with JavaScript on and off.
 * - 1440px: every link group is visible without a click, the chevrons are
 *   hidden, and the footer is the same height with JavaScript off and on
 *   (nothing shifts when it hydrates).
 * - No console errors.
 *
 * Starts `vite preview` on FOOTER_PORT (default 4371), or tests FOOTER_BASE
 * when that is set to a running server. /api calls are mocked (newsletter
 * "on") and third-party hosts answered empty, as in the other Chromium checks.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { BUSINESS, FOOTER_COLUMNS, SOCIAL } from "../src/data/business.js";

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.FOOTER_PORT ?? 4371);

let failures = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
const bad = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};
const check = (cond, msg) => (cond ? ok : bad)(msg);

if (!existsSync("dist/learn.html") || !existsSync("dist/sitemap.html")) {
  console.error("No prerendered build in dist/. Run `npm run build` first.");
  process.exit(1);
}

/* ------------------------- the links to expect ------------------------- */

const LEGAL = ["/terms", "/privacy", "/privacy#choices", "/accessibility", "/sitemap"];
const ALL_HREFS = [
  ...FOOTER_COLUMNS.flatMap((c) => c.links.map((l) => l.href ?? l.to)),
  ...LEGAL,
  ...Object.values(SOCIAL).filter(Boolean),
  BUSINESS.phoneHref,
  `mailto:${BUSINESS.email}`,
  BUSINESS.mapsHref,
];
const hrefsIn = (file) =>
  new Set(
    [...readFileSync(file, "utf8").matchAll(/href="([^"]+)"/g)].map((m) =>
      m[1].replaceAll("&amp;", "&"),
    ),
  );
const ELSEWHERE = new Set([...hrefsIn("dist/learn.html"), ...hrefsIn("dist/sitemap.html")]);

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.FOOTER_BASE;
if (!BASE) {
  BASE = `http://localhost:${PORT}`;
  server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
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

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

async function newPage(width, js = true) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 844 : 900 },
    javaScriptEnabled: js,
    hasTouch: width < 800,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  // A 404 is the mocked /api or the vPIC snapshot this sandbox cannot write.
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route((url) => url.host !== local, (r) => r.fulfill({ status: 200, body: "" }));
  await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { atd: "sample", shopify: "live", checkout: "request", newsletter: "on", forms: "on", version: "test" } }),
  );
  await page.goto(BASE + "/", { waitUntil: "load" });
  return { context, page, errors };
}

const footerHeight = (page) =>
  page.locator("footer").evaluate((el) => el.getBoundingClientRect().height);

try {
  for (const width of [390, 1440]) {
    const { context, page, errors } = await newPage(width);
    await page.locator('footer [data-testid="newsletter-signup"]').waitFor();
    await page.waitForLoadState("networkidle");
    ok(`${width}: newsletter form is inside <footer>`);

    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(sideways <= 0, `${width}: no sideways scroll (${sideways}px over)`);

    const inFooter = new Set(
      await page.$$eval("footer a[href]", (as) => as.map((a) => a.getAttribute("href"))),
    );
    const missing = ALL_HREFS.filter((h) => !inFooter.has(h) && !ELSEWHERE.has(h));
    const moved = ALL_HREFS.filter((h) => !inFooter.has(h) && ELSEWHERE.has(h));
    check(
      missing.length === 0,
      `${width}: all ${ALL_HREFS.length} footer links reachable (${moved.length} via /learn or /sitemap: ${moved.join(" ")})${missing.length ? ` MISSING ${missing.join(" ")}` : ""}`,
    );
    check(inFooter.has("/learn") && inFooter.has("/sitemap"), `${width}: footer links /learn and /sitemap`);

    const groups = page.locator("footer details");
    const count = await groups.count();
    check(count === FOOTER_COLUMNS.length, `${width}: ${count} link groups as <details>`);

    if (width === 390) {
      const open = await groups.evaluateAll((ds) => ds.filter((d) => d.open).length);
      check(open === 0, `390: every group closed by default (${open} open)`);
      const small = await page.evaluate(() =>
        [
          ...document.querySelectorAll("footer details > summary"),
          ...[...document.querySelectorAll("footer a[href^='tel:'], footer a[href^='mailto:'], footer a[href*='google.com/maps']")],
        ]
          .map((el) => [el.textContent.trim(), Math.round(el.getBoundingClientRect().height), Math.round(el.getBoundingClientRect().width)])
          .filter(([, h, w]) => h < 44 || w < 44),
      );
      check(small.length === 0, `390: summaries and call/email/directions are 44px+ ${JSON.stringify(small)}`);

      const first = groups.nth(0);
      const firstLink = first.locator("a").first();
      check(!(await firstLink.isVisible()), "390: a closed group's links are hidden");
      await first.locator("summary").click();
      check(
        (await first.evaluate((d) => d.open)) && (await firstLink.isVisible()),
        "390: tapping a summary opens its group",
      );
      await first.locator("summary").click();
      check(!(await first.evaluate((d) => d.open)), "390: tapping it again closes it");
    } else {
      const hidden = await page.$$eval("footer details a[href]", (as) =>
        as.filter((a) => !a.getClientRects().length || a.getBoundingClientRect().height === 0).map((a) => a.getAttribute("href")),
      );
      check(hidden.length === 0, `1440: every group link visible without a click ${hidden.join(" ")}`);
      const chevrons = await page.$$eval("footer .footer-chevron", (cs) =>
        cs.filter((c) => c.getClientRects().length).length,
      );
      check(chevrons === 0, `1440: no accordion chevrons (${chevrons} shown)`);

      const hydratedH = await footerHeight(page);
      const off = await newPage(1440, false);
      const staticH = await footerHeight(off.page);
      // Same newsletter state for both: JS off never renders the form.
      const nlH = await page
        .locator('footer [data-testid="newsletter-signup"]')
        .evaluate((el) => el.closest("footer > div").getBoundingClientRect().height);
      const offNlH = await off.page
        .locator("footer > div")
        .first()
        .evaluate((el) => el.getBoundingClientRect().height);
      check(
        Math.abs(hydratedH - nlH - (staticH - offNlH)) < 1,
        `1440: footer (links and contact) the same height with JS off and on: ${staticH - offNlH} vs ${hydratedH - nlH}`,
      );
      await off.context.close();
    }

    check(errors.length === 0, `${width}: no console errors ${errors.join(" | ")}`);
    await context.close();
  }

  /* -------------------- JavaScript off, phone width -------------------- */
  {
    const { context, page } = await newPage(390, false);
    const first = page.locator("footer details").first();
    const closed = !(await first.evaluate((d) => d.open));
    await first.locator("summary").click();
    check(
      closed && (await first.evaluate((d) => d.open)) && (await first.locator("a").first().isVisible()),
      "390, JS off: groups start closed and open on tap",
    );
    await context.close();
  }
} finally {
  await browser.close();
  stopServer();
}

console.log(failures ? `\n${failures} footer check(s) failed` : "\nfooter: all checks passed");
process.exit(failures ? 1 : 0);
