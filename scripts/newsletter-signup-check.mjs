/**
 * Newsletter sign-up check. Drives the built site in Chromium at 390px and
 * 1440px with every /api request mocked (nothing reaches Shopify) and checks
 * that the newsletter is only an inline form in the footer:
 *
 *   - no pop-up, ever: with newsletter "on", wait 20 seconds, scroll to 60%
 *     of the page and move the pointer out through the top of the window,
 *     and no dialog or floating sign-up appears;
 *   - the old pop-up's localStorage entry (td-nl-popup) is cleaned up and
 *     nothing new is written;
 *   - the footer form validates, submits `{ email, source: "footer",
 *     website }` and shows the success message; a failed send shows an
 *     honest retry message;
 *   - 44px targets, labelled field, no sideways scroll at 390px;
 *   - with newsletter "off", the form is not rendered at all.
 *
 *   npm run build && npm run check:newsletter
 *
 * It starts `vite preview` itself on NL_PORT (default 4182), or tests NL_BASE
 * when that is set to an already running server. Screenshots land in
 * NL_SHOTS (default /tmp/newsletter-signup).
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { inspectSubmission } from "../api/_lib/spam.js";
import { readFillToken } from "../src/data/formGuard.js";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.NL_PORT ?? 4182);
const SHOTS = process.env.NL_SHOTS ?? "/tmp/newsletter-signup";
const QUIET_WAIT_MS = Number(process.env.NL_WAIT_MS ?? 20000);
mkdirSync(SHOTS, { recursive: true });

/* ------------------------------ preview ------------------------------ */

// vite preview runs as its own process group so the whole tree can be
// stopped; Windows has no process groups, and there the server is the
// child itself (node runs vite directly rather than through npx).
const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.NL_BASE;
if (!BASE) {
  if (!existsSync("dist/index.html")) {
    console.error("No build in dist/. Run `npm run build` first.");
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
      console.error(`vite preview did not come up on ${BASE}`);
      stopPreview(server);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}
function stopServer() {
  if (server) {
    try {
      stopPreview(server);
    } catch {
      /* already gone */
    }
  }
}

/* ------------------------------ harness ------------------------------ */

const STATUS = {
  atd: "sample",
  shopify: "live",
  checkout: "request",
  newsletter: "on",
  forms: "on",
  version: "test",
};

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});

let failures = 0;
let passes = 0;
async function check(name, fn) {
  try {
    await fn();
    passes += 1;
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err.message).split("\n").join("\n     ")}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A fresh context with the API mocked. `newsletter` answers POST
 * /api/newsletter: "ok" or an HTTP status to fail with.
 */
async function open(width, { status = STATUS, newsletter = "ok", legacy = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    hasTouch: width < 768,
    ignoreHTTPSErrors: true,
  });
  if (legacy) {
    // A visitor who closed the old pop-up still has its entry.
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("td-nl-popup", JSON.stringify({ s: "dismissed", t: Date.now() }));
        sessionStorage.setItem("seeded", "1");
      }
    });
  }
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const signups = [];
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/newsletter", async (r) => {
    signups.push(JSON.parse(r.request().postData() || "{}"));
    if (newsletter === "ok") await r.fulfill({ json: { ok: true } });
    else await r.fulfill({ status: newsletter, json: { error: "Shopify refused." } });
  });
  const local = new URL(BASE).host;
  await page.route(
    (url) => url.host !== local,
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));

  return { context, page, signups, errors };
}

const FORM = 'footer [data-testid="newsletter-signup"]';

/** Anything that looks like a pop-up: an open dialog, or a fixed box with an email field. */
async function popups(page) {
  return page.evaluate(() => {
    const found = [];
    for (const el of document.querySelectorAll('dialog, [role="dialog"], [aria-modal="true"]')) {
      if (el.open || el.getClientRects().length) found.push(el.outerHTML.slice(0, 120));
    }
    for (const input of document.querySelectorAll('input[type="email"]')) {
      for (let n = input; n && n !== document.body; n = n.parentElement) {
        const pos = getComputedStyle(n).position;
        if (pos === "fixed" || pos === "sticky") {
          found.push(`floating email field in <${n.tagName.toLowerCase()} class="${n.className}">`);
          break;
        }
      }
    }
    if (document.querySelector(".td-nl, [data-testid='newsletter-popup']")) found.push("old pop-up markup");
    return found;
  });
}

/* ------------------------------ checks ------------------------------ */

async function runWidth(width) {
  await check(`${width} no pop-up: 20s, 60% scroll, pointer out the top`, async () => {
    const { page, context, errors } = await open(width, { legacy: true });
    await page.goto(`${BASE}/tires`);
    await page.locator(FORM).waitFor({ state: "attached" });
    // The old entry is gone and nothing replaced it.
    const stored = await page.evaluate(() => Object.keys(localStorage));
    assert.ok(!stored.includes("td-nl-popup"), `td-nl-popup still in localStorage: ${stored}`);

    await page.evaluate(() => {
      const el = document.scrollingElement;
      el.scrollTo(0, (el.scrollHeight - el.clientHeight) * 0.6);
    });
    await sleep(500);
    assert.deepEqual(await popups(page), [], "after scrolling to 60%");

    // Exit intent: pointer to the top edge, then out of the window.
    await page.mouse.move(width / 2, 200);
    await page.mouse.move(width / 2, 0, { steps: 5 });
    await page.evaluate(() =>
      document.dispatchEvent(
        new MouseEvent("mouseout", { bubbles: true, clientX: 300, clientY: -1, relatedTarget: null }),
      ),
    );
    await sleep(500);
    assert.deepEqual(await popups(page), [], "after the pointer left through the top");

    await sleep(QUIET_WAIT_MS);
    assert.deepEqual(await popups(page), [], `after ${QUIET_WAIT_MS / 1000}s`);
    const later = await page.evaluate(() => Object.keys(localStorage));
    assert.ok(!later.some((k) => k.startsWith("td-nl")), `newsletter keys written: ${later}`);
    await page.screenshot({ path: `${SHOTS}/${width}-after-20s.png` });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} footer form: validates, submits, shows success`, async () => {
    const { page, context, signups, errors } = await open(width);
    await page.goto(`${BASE}/`);
    const form = page.locator(FORM);
    await form.waitFor();
    await form.scrollIntoViewIfNeeded();

    // It is above the link columns.
    const order = await page.evaluate((sel) => {
      const nl = document.querySelector(sel);
      // The first footer heading outside the sign-up: the link columns'.
      const cols = [...document.querySelectorAll("footer h2, footer h3")].find(
        (h) => !nl.contains(h),
      );
      return nl.compareDocumentPosition(cols) & Node.DOCUMENT_POSITION_FOLLOWING;
    }, FORM);
    assert.ok(order, "sign-up comes before the footer link columns");

    await form.getByRole("heading", { name: "TireDrop emails" }).waitFor();
    const email = form.getByLabel("Email address");
    const button = form.getByRole("button", { name: "Sign up" });
    const sizes = await Promise.all([email.boundingBox(), button.boundingBox()]);
    for (const box of sizes) assert.ok(box.height >= 44, `target ${box.height}px tall`);
    const link = form.getByRole("link", { name: "Privacy Policy" });
    assert.equal(await link.getAttribute("href"), "/privacy");
    const text = (await form.innerText()).toLowerCase();
    for (const banned of ["discount", "deal", "coupon", "% off", "offer", "save "]) {
      assert.ok(!text.includes(banned), `copy mentions "${banned}"`);
    }
    assert.ok(text.includes("unsubscribe anytime"), "says unsubscribe anytime");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 0, `page scrolls sideways by ${overflow}px`);
    await form.screenshot({ path: `${SHOTS}/${width}-footer-form.png` });
    await page.screenshot({ path: `${SHOTS}/${width}-footer-page.png`, fullPage: false });

    await email.fill("not-an-email");
    await button.click();
    await form.getByText("Enter a valid email address.").waitFor();
    assert.equal(await email.getAttribute("aria-invalid"), "true");
    assert.equal(signups.length, 0, "nothing sent for a bad address");
    await form.screenshot({ path: `${SHOTS}/${width}-footer-invalid.png` });

    await email.fill("driver@example.com");
    await button.click();
    await form.getByText("You're on the list. Watch your inbox.").waitFor();
    // What the page sends, minus the fill-time token, which is checked with
    // the server's own guard (test mode: only the 2 s minimum is off).
    assert.deepEqual(
      signups.map(({ ft: _ft, ...rest }) => rest),
      [{ email: "driver@example.com", source: "footer", website: "" }],
    );
    assert.ok(readFillToken(signups[0].ft), "a valid fill-time token is sent");
    assert.deepEqual(inspectSubmission(signups[0], { env: { SPAM_GUARD_TEST_MODE: "1" } }), { verdict: "ok" });
    const live = await form.locator("[aria-live]").innerText();
    assert.match(live, /You're on the list/, "success is in the live region");
    await form.screenshot({ path: `${SHOTS}/${width}-footer-success.png` });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} footer form: a failed send says so and can be retried`, async () => {
    const { page, context, signups } = await open(width, { newsletter: 502 });
    await page.goto(`${BASE}/`);
    const form = page.locator(FORM);
    await form.waitFor();
    await form.scrollIntoViewIfNeeded();
    await form.getByLabel("Email address").fill("driver@example.com");
    await form.getByRole("button", { name: "Sign up" }).click();
    await form.getByText(/couldn't sign you up just now.*try again/i).waitFor();
    assert.equal(signups.length, 1);
    // The address is still there and the button still works.
    assert.equal(await form.getByLabel("Email address").inputValue(), "driver@example.com");
    await form.getByRole("button", { name: "Sign up" }).click();
    await sleep(500);
    assert.equal(signups.length, 2, "retry sends again");
    await form.screenshot({ path: `${SHOTS}/${width}-footer-error.png` });
    await context.close();
  });

  await check(`${width} newsletter "off": no form anywhere`, async () => {
    const { page, context, signups, errors } = await open(width, {
      status: { ...STATUS, newsletter: "off" },
    });
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle");
    await sleep(500);
    assert.equal(await page.locator('[data-testid="newsletter-signup"]').count(), 0);
    assert.equal(await page.locator('footer input[type="email"]').count(), 0);
    assert.deepEqual(await popups(page), []);
    assert.equal(signups.length, 0);
    await page.locator("footer").screenshot({ path: `${SHOTS}/${width}-footer-off.png` });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });
}

await Promise.all([runWidth(390), runWidth(1440)]);

await browser.close();
stopServer();
console.log(
  failures ? `\n${failures} of ${passes + failures} check(s) failed` : `\nall ${passes} checks passed`,
);
process.exit(failures ? 1 : 0);
