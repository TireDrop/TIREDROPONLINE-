/**
 * The mobile-install price strip, on the built site.
 *
 *   npm run build && npm run check:mobile-price
 *
 * 1. Prerendered HTML (no JavaScript): /mobile-service and every city page
 *    in src/data/cityPages.js carry the strip with the "Tire installation
 *    from $X per tire" line taken from src/data/services.js (never a
 *    literal), a coverage line naming the city and county (or the three
 *    counties), a "Book your install" link to /schedule?service=tire-
 *    installation and a tap-to-call link; exactly one strip per page, and
 *    no fee, minimum, discount, "since" year or arrival time in it. The
 *    home page carries the compact one in the mobile card.
 * 2. The Book link resolves: /schedule has a built page.
 * 3. Chromium at 390px and 1440px: the strip's price, coverage and Book
 *    button are inside the first screen (above the phone action bar on a
 *    phone), Book and Call are at least 44px tall, no sideways scroll, and
 *    the strip does not move or resize when the page hydrates.
 *
 * Starts `vite preview` on MOBILE_PRICE_PORT (default 4372), or tests
 * MOBILE_PRICE_BASE when that is set to a running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { getService } from "../src/data/services.js";
import { SERVICE_AREA_LABEL } from "../src/data/serviceArea.js";
import { CITY_PAGES } from "../src/data/cityPages.js";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.MOBILE_PRICE_PORT ?? 4372);
const BOOK = "/schedule?service=tire-installation";
const install = getService("tire-installation");
const PRICE = `Tire installation from $${install.priceFrom} ${install.priceUnit}`;

let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failed++;
};
const text = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

/* ------------------------- 1 + 2: the built HTML ------------------------- */

const pages = [
  { path: "/mobile-service", file: "dist/mobile-service.html", coverage: `Mobile van in ${SERVICE_AREA_LABEL}`, strip: 1 },
  ...CITY_PAGES.map((c) => ({
    path: `/mobile-service/${c.slug}`,
    file: `dist/mobile-service/${c.slug}.html`,
    coverage: `Mobile van in ${c.name}, ${c.county} County`,
    strip: 1,
  })),
  { path: "/", file: "dist/index.html", coverage: `Mobile van in ${SERVICE_AREA_LABEL}`, strip: 1 },
];
for (const p of pages) {
  if (!existsSync(p.file)) {
    ok(false, `${p.path}: ${p.file} is built`);
    continue;
  }
  const html = readFileSync(p.file, "utf8");
  const n = (html.match(/data-mobile-price-strip/g) ?? []).length;
  ok(n === p.strip, `${p.path}: ${n} strip in the prerendered HTML`);
  const at = html.indexOf("data-mobile-price-strip");
  const block = at < 0 ? "" : text(html.slice(at, html.indexOf("</div></div>", at) + 12));
  ok(block.includes(PRICE), `${p.path}: price reads "${PRICE}" (from services.js)`);
  ok(block.includes(p.coverage), `${p.path}: coverage reads "${p.coverage}"`);
  ok(block.includes("Book your install"), `${p.path}: Book your install button`);
  ok(
    new RegExp(`href="${BOOK.replace(/[?]/g, "\\?")}"`).test(html.slice(at, at + 2500)),
    `${p.path}: Book links to ${BOOK}`,
  );
  if (p.path !== "/") ok(/href="tel:\+1\d{10}"/.test(html.slice(at, at + 2500)), `${p.path}: tap-to-call link in the strip`);
  ok(
    !/\bfees?\b|minimum|travel charge|discount|coupon|deal|since (19|20)\d\d|\b\d{1,2}:\d\d\b|same.day|within \d/i.test(block),
    `${p.path}: no fee, minimum, deal, "since" year or time in the strip`,
  );
}
ok(existsSync("dist/schedule.html"), "the Book link resolves: dist/schedule.html is built");

/* ------------------------------ 3: Chromium ------------------------------ */

const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.MOBILE_PRICE_BASE;
if (!BASE) {
  if (!existsSync("dist/schedule.html")) {
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
      stopPreview(server);
      console.error("vite preview did not start");
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

const browser = await chromium.launch({ executablePath: CHROME });
try {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 200, body: "" }));
    for (const p of pages.filter((x) => x.path.startsWith("/mobile-service"))) {
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(BASE + p.path, { waitUntil: "domcontentloaded" });
      const box = () =>
        page.evaluate(() => {
          const s = document.querySelector("[data-mobile-price-strip]");
          const book = s?.querySelector('a[href^="/schedule"]');
          const call = s?.querySelector('a[href^="tel:"]');
          const r = (el) => (el ? el.getBoundingClientRect() : null);
          return { s: r(s), book: r(book), call: r(call) };
        });
      const before = await box();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const after = await box();
      const label = `${p.path} @${w}`;
      // The phone action bar covers the bottom ~72px of a phone screen.
      const fold = h - (w < 768 ? 72 : 0);
      ok(after.book && after.book.bottom <= fold, `${label}: Book button is in the first screen (bottom ${Math.round(after.book?.bottom)}px of ${fold})`);
      ok(after.s && after.s.bottom <= fold, `${label}: price and coverage are in the first screen (strip bottom ${Math.round(after.s?.bottom)}px)`);
      ok(after.book?.height >= 44 && after.call?.height >= 44, `${label}: Book ${Math.round(after.book?.height)}px and Call ${Math.round(after.call?.height)}px tall (>= 44)`);
      ok(after.book?.width >= 44 && after.call?.width >= 44, `${label}: Book and Call at least 44px wide`);
      ok(
        before.s && Math.abs(before.s.top - after.s.top) < 1 && Math.abs(before.s.height - after.s.height) < 1,
        `${label}: the strip does not move or resize on hydration`,
      );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(overflow <= 0, `${label}: no sideways scroll`);
      ok(errors.length === 0, `${label}: no page errors${errors.length ? " " + errors[0] : ""}`);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  if (server) stopPreview(server);
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll mobile price strip checks passed");
process.exit(failed ? 1 : 0);
