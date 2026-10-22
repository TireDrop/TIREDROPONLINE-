/**
 * The /app page and its "Add to Home Screen" button, on the built site.
 *
 *   npm run build && npm run check:app-page
 *
 * - iPhone Safari: the tap opens a guide (Share, then Add to Home Screen),
 *   "Open the Share menu" calls navigator.share, Escape closes it and focus
 *   returns to the button.
 * - Android Chrome with an install event: the tap opens the browser's own
 *   install dialog (prompt() is called) and no guide.
 * - Android and desktop without an install event: the guide with that
 *   browser's steps. Instagram's browser: "open it in your browser first"
 *   and a copy-link button.
 * - Running as the app: no button.
 * - 320px: no sideways scroll, the guide fits the screen, targets are 44px.
 * - No console errors.
 *
 * Starts `vite preview` on APP_PAGE_PORT (default 4803), or tests
 * APP_PAGE_BASE when that is set to a running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const CHROME = process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.APP_PAGE_PORT ?? 4803);
const BASE = process.env.APP_PAGE_BASE ?? `http://localhost:${PORT}`;

const UA = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  instagram: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
  desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
};

if (!process.env.APP_PAGE_BASE && !existsSync("dist/app.html")) {
  console.error("No build in dist/. Run `npm run build` first.");
  process.exit(1);
}

let server = null;
if (!process.env.APP_PAGE_BASE) {
  server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
let failures = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
async function check(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err.message ?? err).split("\n").join("\n     ")}`);
  }
}

async function open({ ua, width = 390, height = 844, init, standalone = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    userAgent: ua,
    isMobile: width < 700,
    hasTouch: width < 700,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/google|ERR_|net::|Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
  if (init) await page.addInitScript(init);
  if (standalone) {
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : real(q));
    });
  }
  await page.goto(`${BASE}/app`, { waitUntil: "load" });
  await page.waitForFunction(() => Object.keys(document.getElementById("root")).some((k) => k.startsWith("__reactContainer")));
  return { context, page, errors };
}

const button = (page) => page.locator('[data-testid="add-to-home"]').first();
const guide = (page) => page.locator('[data-testid="add-to-home-guide"]');

await check("iPhone Safari: the tap opens the Share / Add to Home Screen guide; the Share menu opens; Escape returns focus", async () => {
  const { context, page, errors } = await open({
    ua: UA.iphone,
    init: () => {
      window.__shared = [];
      Object.defineProperty(navigator, "share", { value: (d) => (window.__shared.push(d), Promise.resolve()), configurable: true });
    },
  });
  await button(page).click();
  await guide(page).waitFor();
  const text = await guide(page).innerText();
  assert.match(text, /Share/);
  assert.match(text, /Add to Home Screen/);
  await page.getByRole("button", { name: "Open the Share menu" }).click();
  const shared = await page.evaluate(() => window.__shared);
  assert.equal(shared.length, 1);
  assert.equal(shared[0].title, "TireDrop");
  await page.keyboard.press("Escape");
  await guide(page).waitFor({ state: "detached" });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("data-testid")), "add-to-home");
  assert.deepEqual(errors, []);
  await context.close();
});

await check("Android Chrome with an install event: the tap opens the browser's install dialog, no guide", async () => {
  const { context, page, errors } = await open({ ua: UA.android });
  await page.evaluate(() => {
    window.__prompted = 0;
    const e = new Event("beforeinstallprompt");
    e.prompt = () => (window.__prompted++, Promise.resolve());
    e.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(e);
  });
  await button(page).click();
  assert.equal(await page.evaluate(() => window.__prompted), 1, "prompt() was called once");
  assert.equal(await guide(page).count(), 0, "no guide when the browser has its own dialog");
  assert.deepEqual(errors, []);
  await context.close();
});

await check("Android without an install event: the guide with Install app", async () => {
  const { context, page } = await open({ ua: UA.android });
  await button(page).click();
  await guide(page).waitFor();
  assert.match(await guide(page).innerText(), /Install app/);
  await context.close();
});

await check("desktop Chrome without an install event: the address-bar guide", async () => {
  const { context, page } = await open({ ua: UA.desktop, width: 1440, height: 900 });
  await button(page).click();
  await guide(page).waitFor();
  assert.match(await guide(page).innerText(), /address bar/);
  await context.close();
});

await check("Instagram's browser: open it in your browser first, with a copy-link button", async () => {
  const { context, page } = await open({ ua: UA.instagram });
  await button(page).click();
  await guide(page).waitFor();
  assert.match(await guide(page).innerText(), /Open TireDrop in your browser first/i);
  assert.equal(await page.getByRole("button", { name: /Copy the link/ }).count(), 1);
  await context.close();
});

await check("running as the app: no Add to Home Screen button", async () => {
  const { context, page } = await open({ ua: UA.android, standalone: true });
  await page.waitForTimeout(500);
  assert.equal(await page.locator('[data-testid="add-to-home"]').count(), 0);
  await context.close();
});

await check("320x568: no sideways scroll, the guide fits, every guide button is 44px", async () => {
  const { context, page } = await open({ ua: UA.iphone, width: 320, height: 568 });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(wide <= 0, `page is ${wide}px too wide`);
  await button(page).click();
  await guide(page).waitFor();
  const box = await guide(page).boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 321, `guide spans ${box.x}..${box.x + box.width}`);
  const heights = await guide(page).locator("button").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  assert.ok(heights.every((h) => h >= 44), `button heights ${heights}`);
  // Tab stays inside the guide.
  for (let i = 0; i < 6; i += 1) await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[data-testid="add-to-home-guide"]')), true);
  await context.close();
});

await browser.close();
if (server) server.kill();
if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll app-page checks passed.");
