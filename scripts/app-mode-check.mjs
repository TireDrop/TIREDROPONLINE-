/**
 * App mode (the installed app's shell) on the built site.
 *
 *   npm run build && npm run check:app-mode
 *
 * Standalone is emulated two ways, one per run of each size: a display-mode
 * media query (matchMedia override) and iOS's navigator.standalone.
 *
 * Standalone at 390x844, 360x640, 320x568 and 844x390 (landscape), and 820x1180:
 *  - <html data-app="standalone"> is set, the tab bar shows (Shop, Size,
 *    My Orders, Call, More), sits on the bottom edge, every tab is 44px or
 *    more each way, the phone call bar is gone, no sideways scroll.
 *  - The bar is compact in landscape; its safe-area inset is in its style.
 *  - Shop, Size and My Orders navigate and take aria-current; Call is the
 *    shop's tel: link; More opens a sheet with its links, Esc closes it.
 *  - Nothing overlaps the bar: the compare tray, the chat bubble and a
 *    product page's buy bar all end above it, and the page's last content is
 *    not hidden under it.
 *  - Utility strip is out, one sticky masthead row, no console errors.
 *
 * The website is unchanged:
 *  - A normal phone browser (no emulation): no data-app, no tab bar, the call
 *    bar is there, --call-bar-h is still 68px, the utility strip shows.
 *  - 1440px, normal and standalone-emulated: no tab bar, and the header,
 *    main and footer boxes are identical.
 *  - 1024px standalone: the bar stays away (desktop breakpoint).
 *  - APP_MODE_SNAPSHOT=file writes the normal-site layout boxes (every size,
 *    several pages); APP_MODE_COMPARE=file compares against such a file. Run
 *    the snapshot on the pre-change build and the compare on this one to
 *    prove the normal site did not move. APP_MODE_SNAPSHOT_ONLY=1 does just
 *    the snapshot (for a build that has no app mode).
 *
 * Starts `vite preview` on APP_MODE_PORT (default 4702), or tests
 * APP_MODE_BASE when set. /api is mocked, third-party hosts answered empty.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { TIRES } from "../src/data/products.js";
import { BUSINESS } from "../src/data/business.js";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.APP_MODE_PORT ?? 4702);

let failures = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
const bad = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};
const check = (cond, msg) => (cond ? ok : bad)(msg);

if (!existsSync("dist/index.html")) {
  console.error("No build in dist/. Run `npm run build` first.");
  process.exit(1);
}

const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.APP_MODE_BASE;
if (!BASE) {
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

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

const SLUGS = TIRES.slice(0, 2).map((t) => t.slug);
const PRODUCT = `/tires/${TIRES[0].slug}`;

/** mode: "browser" | "display-mode" | "ios" */
async function open(width, height, mode, path = "/", { compare = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: width < 1024,
    isMobile: width < 1024,
  });
  if (mode === "display-mode") {
    await context.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = (q) => {
        const mql = real(/display-mode:\s*standalone/.test(q) ? "all" : q);
        if (/display-mode:\s*standalone/.test(q)) {
          Object.defineProperty(mql, "matches", { value: true });
        }
        return mql;
      };
    });
  } else if (mode === "ios") {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { value: true });
    });
  }
  if (compare) {
    await context.addInitScript((slugs) => {
      localStorage.setItem("tiredrop.compare.v1", JSON.stringify(slugs));
    }, SLUGS);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404/.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route((url) => url.host !== local, (r) => r.fulfill({ status: 200, body: "" }));
  await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
  await page.route("**/api/status", (r) =>
    r.fulfill({
      json: {
        atd: "sample", shopify: "live", checkout: "request", newsletter: "on",
        forms: "on", scanner: "on", chat: "on", version: "t",
      },
    }),
  );
  await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  return { context, page, errors };
}

const rectOf = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom,
      shown: cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0,
    };
  }, sel);

const overlap = (a, b) =>
  a && b && a.shown && b.shown &&
  a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 &&
  a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

const TABBAR = "[data-app-tabbar]";
const CALLBAR = ".mobile-call-bar";
const TRAY = 'aside[aria-label="Tire comparison"]';
const CHAT = 'button[aria-haspopup="dialog"][aria-label*="TireDrop" i]';

async function waitBar(page) {
  await page.locator(TABBAR).waitFor({ state: "visible" });
}

/* ------------------------------ standalone ------------------------------ */

const SIZES = [
  [390, 844, "phone"],
  [360, 640, "small phone"],
  [320, 568, "tiny phone"],
  [844, 390, "landscape phone"],
  [820, 1180, "tablet"],
];

/* ------------------------- layout snapshot / compare ------------------------- */

async function layoutSnapshot() {
  const PAGES = ["/", "/tires", PRODUCT, "/track", "/cart", "/contact"];
  const SNAP_SIZES = [[390, 844], [360, 640], [320, 568], [844, 390], [820, 1180], [1440, 900]];
  if (process.env.APP_MODE_SNAPSHOT || process.env.APP_MODE_COMPARE) {
    const snap = {};
    for (const [w, h] of SNAP_SIZES) {
      for (const p of PAGES) {
        const { context, page } = await open(w, h, "browser", p);
        const key = `${w}x${h} ${p}`;
        snap[key] = {
          scrollHeight: await page.evaluate(() => document.documentElement.scrollHeight),
          scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
        };
        for (const sel of ["header", "main", "footer", 'nav[aria-label="Quick actions"]', "h1", ".sticky"]) {
          const r = await rectOf(page, sel);
          snap[key][sel] = r && { x: r.x, y: r.y, w: r.w, h: r.h };
        }
        await context.close();
      }
    }
    if (process.env.APP_MODE_SNAPSHOT) {
      writeFileSync(process.env.APP_MODE_SNAPSHOT, JSON.stringify(snap, null, 1));
      ok(`wrote ${Object.keys(snap).length} layout snapshots to ${process.env.APP_MODE_SNAPSHOT}`);
    }
    if (process.env.APP_MODE_COMPARE) {
      const base = JSON.parse(readFileSync(process.env.APP_MODE_COMPARE, "utf8"));
      let diffs = 0;
      for (const key of Object.keys(base)) {
        if (JSON.stringify(base[key]) !== JSON.stringify(snap[key])) {
          diffs++;
          console.log(`     differs: ${key}`);
        }
      }
      check(diffs === 0, `normal site layout identical to the snapshot (${Object.keys(base).length} page/size boxes)`);
    }
  }
}

try {
  if (process.env.APP_MODE_SNAPSHOT_ONLY) {
    await layoutSnapshot();
    await browser.close();
    stopServer();
    process.exit(failures ? 1 : 0);
  }
  for (const [w, h, name] of SIZES) {
    for (const mode of ["display-mode", "ios"]) {
      const tag = `${w}x${h} ${name} (${mode})`;
      const { context, page, errors } = await open(w, h, mode, "/tires", { compare: true });
      await waitBar(page);
      check(
        (await page.evaluate(() => document.documentElement.dataset.app)) === "standalone",
        `${tag}: <html data-app="standalone">`,
      );
      const bar = await rectOf(page, TABBAR);
      check(bar && bar.shown, `${tag}: tab bar shows`);
      check(Math.abs(bar.b - h) < 1, `${tag}: bar sits on the bottom edge`);
      check(
        (await page.locator(`${TABBAR} > div > *`).allTextContents())
          .map((t) => t.trim())
          .join("|") === "Shop|Size|My Orders|Call|More",
        `${tag}: tabs are Shop, Size, My Orders, Call, More`,
      );
      const tabs = await page.locator(`${TABBAR} > div > *`).evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return [r.width, r.height];
        }),
      );
      check(
        tabs.every(([tw, th]) => tw >= 44 && th >= 44),
        `${tag}: every tab is 44px or more each way (${tabs.map(([a, b]) => `${Math.round(a)}x${Math.round(b)}`).join(" ")})`,
      );
      if (h < 500) check(bar.h <= 48, `${tag}: landscape bar is compact (${Math.round(bar.h)}px)`);
      else check(bar.h <= 70, `${tag}: bar height ${Math.round(bar.h)}px`);
      check(
        /safe-area-inset-bottom/.test((await page.locator(TABBAR).getAttribute("style")) ?? ""),
        `${tag}: bar pads for the bottom safe-area inset`,
      );
      const call = await rectOf(page, CALLBAR);
      check(!call || !call.shown, `${tag}: phone call bar is gone`);
      const utility = await rectOf(page, ".app-utility-bar");
      check(!utility || !utility.shown, `${tag}: utility strip is out`);
      const sticky = await page.evaluate(
        () =>
          [...document.querySelectorAll("body *")].filter((el) => {
            const cs = getComputedStyle(el);
            return cs.position === "sticky" && cs.top === "0px" && el.offsetHeight > 0;
          }).length,
      );
      check(sticky <= 1, `${tag}: one sticky masthead row (${sticky})`);
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
        `${tag}: no sideways scroll`,
      );

      // Compare tray (two picks) and chat bubble sit above the bar.
      await page.locator(TRAY).waitFor({ state: "visible" });
      await page.waitForTimeout(500); // the tray's slide-in
      await page.mouse.wheel(0, 300);
      await page.locator(CHAT).waitFor({ state: "visible", timeout: 8000 });
      const tray = await rectOf(page, TRAY);
      const chat = await rectOf(page, CHAT);
      check(tray.b <= bar.y + 1, `${tag}: compare tray ends above the bar`);
      check(chat.b <= bar.y + 1, `${tag}: chat bubble ends above the bar`);
      check(!overlap(chat, bar) && !overlap(tray, bar), `${tag}: nothing overlaps the bar`);
      check(!overlap(chat, tray), `${tag}: chat bubble clear of the compare tray`);

      // The page's last content clears the bar.
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
      await page.waitForTimeout(150);
      const foot = await page.evaluate(() => {
        const el = document.querySelector("footer");
        const r = el.getBoundingClientRect();
        return r.bottom;
      });
      const barNow = await rectOf(page, TABBAR);
      check(foot <= barNow.y + 1, `${tag}: end of page is not under the bar`);

      if (name === "phone" || name === "landscape phone") {
        // Navigation, active state, Call, More.
        await page.evaluate(() => window.scrollTo(0, 0));
        const go = async (label, url) => {
          await page.locator(`${TABBAR} >> text="${label}"`).click();
          await page.waitForURL(`**${url}`);
          await waitBar(page);
          const cur = await page.locator(`${TABBAR} [aria-current="page"]`).allTextContents();
          check(
            cur.length === 1 && cur[0].trim() === label,
            `${tag}: ${label} goes to ${url} and is the active tab`,
          );
        };
        await go("Size", "/tire-size-finder");
        await go("My Orders", "/track");
        await go("Shop", "/tires");
        const href = await page.locator(`${TABBAR} a[href^="tel:"]`).getAttribute("href");
        check(href === BUSINESS.phoneHref, `${tag}: Call is the shop's tel: link`);

        await page.locator(`${TABBAR} button:has-text("More")`).click();
        const sheet = page.locator('[role="dialog"][aria-label="More"]');
        await sheet.waitFor({ state: "visible" });
        const links = await sheet.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
        check(
          ["/schedule", "/contact", "/learn", "/financing", "/about", "/brands", "/reviews"].every((l) => links.includes(l)),
          `${tag}: More sheet has Book an install, Contact, Learn, Financing, About, Brands, Reviews`,
        );
        const sr = await rectOf(page, '[role="dialog"][aria-label="More"]');
        check(sr.b <= h + 1 && sr.y >= 0, `${tag}: More sheet fits the screen`);
        const small = await sheet.locator("a, button").evaluateAll((els) =>
          els.filter((e) => e.getBoundingClientRect().height < 44).length,
        );
        check(small === 0, `${tag}: More sheet targets are 44px or more`);
        await page.keyboard.press("Escape");
        await sheet.waitFor({ state: "hidden" });
        ok(`${tag}: Esc closes the More sheet`);
        await page.locator(`${TABBAR} button:has-text("More")`).click();
        await sheet.locator('a[href="/contact"]').click();
        await page.waitForURL("**/contact");
        check(await sheet.count() === 0, `${tag}: choosing a link closes the sheet`);
        check(
          (await page.locator(`${TABBAR} [aria-current="page"]`).count()) === 0,
          `${tag}: no tab is lit on a More page`,
        );
      }
      check(errors.length === 0, `${tag}: no console errors${errors.length ? " " + errors[0] : ""}`);
      await context.close();
    }
  }

  // Product page: the buy bar sits on the tab bar, the chat bubble above both.
  for (const [w, h] of [[390, 844], [360, 640]]) {
    const tag = `${w}x${h} product page`;
    const { context, page } = await open(w, h, "display-mode", PRODUCT);
    await waitBar(page);
    const buy = await page.evaluate(() => {
      const el = [...document.querySelectorAll("div.fixed")].find((d) =>
        d.className.includes("z-30") && d.className.includes("lg:hidden"),
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, shown: r.width > 0 };
    });
    const bar = await rectOf(page, TABBAR);
    check(buy && buy.b <= bar.y + 1, `${tag}: buy bar ends above the tab bar`);
    check(buy && !overlap(buy, bar), `${tag}: buy bar and tab bar do not overlap`);
    await page.mouse.wheel(0, 300);
    await page.locator(CHAT).waitFor({ state: "visible", timeout: 8000 });
    const chat = await rectOf(page, CHAT);
    check(buy && chat.b <= buy.y + 1, `${tag}: chat bubble ends above the buy bar`);
    await context.close();
  }

  /* --------------------------- the normal website --------------------------- */

  // A phone browser tab: nothing of app mode.
  {
    const tag = "390x844 browser tab";
    const { context, page, errors } = await open(390, 844, "browser", "/");
    check(
      (await page.evaluate(() => document.documentElement.dataset.app)) === undefined,
      `${tag}: no data-app`,
    );
    check((await page.locator(TABBAR).count()) === 0, `${tag}: no tab bar`);
    const call = await rectOf(page, CALLBAR);
    check(call && call.shown, `${tag}: call bar is there`);
    check(
      (await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--call-bar-h").trim(),
      )) === "68px",
      `${tag}: --call-bar-h is 68px`,
    );
    const utility = await rectOf(page, ".app-utility-bar");
    check(utility && utility.shown, `${tag}: utility strip shows`);
    check(
      /viewport-fit/.test(await page.locator('meta[name="viewport"]').getAttribute("content")) === false,
      `${tag}: viewport tag untouched`,
    );
    check(errors.length === 0, `${tag}: no console errors`);
    await context.close();
  }

  // Desktop: standalone changes nothing.
  {
    const boxes = async (mode) => {
      const { context, page } = await open(1440, 900, mode, "/");
      const out = {};
      for (const sel of [".app-header-sticky", ".app-utility-bar", "main", "footer"]) {
        out[sel] = await rectOf(page, sel);
      }
      const tb = await rectOf(page, TABBAR);
      out.barShown = !!(tb && tb.shown);
      const cb = await rectOf(page, CALLBAR);
      out.callShown = !!(cb && cb.shown); // hidden from lg up either way
      out.sw = await page.evaluate(() => document.documentElement.scrollWidth);
      await context.close();
      return out;
    };
    const normal = await boxes("browser");
    const app = await boxes("display-mode");
    for (const k of Object.keys(normal)) {
      if (JSON.stringify(normal[k]) !== JSON.stringify(app[k])) {
        console.log(`     ${k}: browser ${JSON.stringify(normal[k])} / standalone ${JSON.stringify(app[k])}`);
      }
    }
    check(!app.barShown, "1440x900 standalone: no tab bar showing");
    check(
      JSON.stringify(normal) === JSON.stringify(app),
      "1440x900: header, utility strip, main and footer boxes identical to the browser site",
    );
    check(!normal.barShown && !normal.callShown, "1440x900 browser: no tab bar, no call bar");
  }
  {
    const { context, page } = await open(1024, 768, "display-mode", "/");
    check((await page.locator(TABBAR).count()) === 0 || !(await rectOf(page, TABBAR)).shown, "1024x768 standalone: bar stays away");
    await context.close();
  }

  /* ------------------------- layout snapshot / compare ------------------------- */

  await layoutSnapshot();
} finally {
  await browser.close();
  stopServer();
}

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\napp-mode check passed");
