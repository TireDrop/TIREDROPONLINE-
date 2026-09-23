/**
 * Mobile audit. Loads every route at phone width in Chromium and reports
 * horizontal overflow, tap targets under the WCAG 2.5.8 minimum, and tiny text.
 *
 *   npx vite preview --port 4173 &
 *   node scripts/mobile-audit.mjs
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:4173";
const SHOTS = process.env.AUDIT_SHOTS ?? "/tmp/mobile-audit";
const WIDTH = Number(process.env.AUDIT_WIDTH ?? 390);

const ROUTES = [
  "/",
  "/tires",
  "/tires/continental-extremecontact-dws06-plus-225-50r17",
  "/wheels",
  "/commercial-tires",
  "/cart",
  "/checkout",
  "/coupons",
  "/shipping",
  "/install",
  "/mobile-service",
  "/auto-service",
  "/services/tire-installation",
  "/schedule",
  "/about",
  "/locations",
  "/contact",
  "/reviews",
  "/financing",
  "/tire-care",
  "/gallery",
  "/sitemap",
  "/terms",
  "/privacy",
  "/accessibility",
  "/nope-404",
];

/** Runs in the page: finds elements that break the viewport or are hard to tap. */
function collect(viewportWidth) {
  const docWidth = document.documentElement.scrollWidth;

  // An element only matters if nothing between it and the root clips it.
  const isClipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p);
      if (/hidden|clip|auto|scroll/.test(o.overflowX + o.overflow)) return true;
    }
    return false;
  };

  const overflowing = [];
  for (const el of document.querySelectorAll("body *")) {
    // SVG internals are clipped by the viewBox, not the layout box.
    if (el.ownerSVGElement || el.tagName.toLowerCase() === "svg") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (style.position === "fixed") continue;
    if (r.right > viewportWidth + 1 || r.left < -1) {
      if (isClipped(el)) continue;
      overflowing.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className?.toString?.() ?? "").slice(0, 70),
        text: (el.textContent ?? "").trim().slice(0, 40),
        left: Math.round(r.left),
        right: Math.round(r.right),
      });
    }
  }

  // Only standalone controls need a comfortable tap height. A link inside a
  // sentence is expected to be text-sized and is not a defect.
  const smallTargets = [];
  for (const el of document.querySelectorAll("a, button, input, select, textarea")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const display = getComputedStyle(el).display;
    const isInlineLink = el.tagName === "A" && display === "inline";
    if (isInlineLink) continue;
    // Visually-hidden inputs (the `peer sr-only` radio pattern) are driven by
    // a styled label, which is the real tap target.
    if (r.width <= 2 || r.height <= 2) continue;
    if (r.height < 24) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        h: Math.round(r.height),
        text: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 40),
      });
    }
  }

  const tinyText = [];
  for (const el of document.querySelectorAll("p, li, span, td, label, div")) {
    if (!el.children.length && el.textContent.trim().length > 12) {
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size && size < 11) {
        tinyText.push({ size, text: el.textContent.trim().slice(0, 40) });
      }
    }
  }

  return {
    docWidth,
    overflowing: overflowing.slice(0, 8),
    overflowCount: overflowing.length,
    smallTargets: smallTargets.slice(0, 6),
    smallTargetCount: smallTargets.length,
    tinyText: tinyText.slice(0, 4),
    tinyTextCount: tinyText.length,
  };
}

// The sandbox ships its own Chromium, which may not match the version this
// playwright build expects. Point at it explicitly when it is present.
const CHROME = process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const page = await browser.newPage({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

mkdirSync(SHOTS, { recursive: true });

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120));
});
page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR ${e.message}`.slice(0, 120)));

let problems = 0;
console.log(`Auditing ${ROUTES.length} routes at ${WIDTH}px\n`);

for (const route of ROUTES) {
  const before = consoleErrors.length;
  await page.goto(`${BASE}/#${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);

  const r = await page.evaluate(collect, WIDTH);
  const name = route.replace(/\//g, "_") || "_home";
  await page.screenshot({ path: `${SHOTS}/${WIDTH}${name}.png`, fullPage: true });

  const issues = [];
  if (r.docWidth > WIDTH + 1) issues.push(`H-SCROLL doc=${r.docWidth}px`);
  if (r.overflowCount) issues.push(`${r.overflowCount} overflowing`);
  if (r.smallTargetCount) issues.push(`${r.smallTargetCount} targets <24px`);
  if (r.tinyTextCount) issues.push(`${r.tinyTextCount} text <11px`);
  const errs = consoleErrors.slice(before);
  if (errs.length) issues.push(`${errs.length} console errors`);

  if (issues.length) {
    problems++;
    console.log(`FAIL ${route}\n     ${issues.join(" | ")}`);
    for (const o of r.overflowing)
      console.log(`       overflow <${o.tag}> ${o.left}..${o.right} "${o.text}" .${o.cls}`);
    for (const t of r.smallTargets)
      console.log(`       small <${t.tag}> ${t.h}px "${t.text}"`);
    for (const t of r.tinyText)
      console.log(`       tiny ${t.size}px "${t.text}"`);
    for (const e of errs) console.log(`       err ${e}`);
  } else {
    console.log(`ok   ${route}`);
  }
}

console.log(`\n${ROUTES.length - problems}/${ROUTES.length} clean. Shots in ${SHOTS}`);
await browser.close();
process.exit(problems ? 1 : 0);
