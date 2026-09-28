/**
 * Newsletter pop-up check. Drives the built site in Chromium at 390px and
 * 1440px with /api/status mocked to `newsletter: "on"` and /api/newsletter
 * mocked to succeed, and asserts the pop-up's behaviour. Nothing reaches
 * Shopify: every /api request is answered by the mock.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   npm run check:popup
 *
 * Screenshots land in POPUP_SHOTS (default /tmp/newsletter-popup).
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const BASE = process.env.POPUP_BASE ?? "http://localhost:4173";
const SHOTS = process.env.POPUP_SHOTS ?? "/tmp/newsletter-popup";
const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
mkdirSync(SHOTS, { recursive: true });

const STATUS_ON = {
  atd: "sample",
  shopify: "live",
  checkout: "request",
  forwarder: "off",
  newsletter: "on",
  version: "test",
};

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${err.message.split("\n").join("\n     ")}`);
  }
}

/** A fresh context with the API mocked. Returns { page, signups }. */
async function open(width, { status = STATUS_ON, reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    ignoreHTTPSErrors: true,
    reducedMotion,
    hasTouch: width < 768,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const signups = [];
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/newsletter", async (r) => {
    signups.push(JSON.parse(r.request().postData() || "{}"));
    await r.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/tires**", (r) => r.fulfill({ status: 404, body: "" }));
  return { context, page, signups };
}

const dialog = (page) => page.locator("dialog.td-nl");

async function scrollHalf(page, { expectPopup = true } = {}) {
  // Wait for the lazy route and the status answer, so the page has its
  // real height and the pop-up is armed before the scroll.
  await page.waitForLoadState("networkidle");
  if (expectPopup) await dialog(page).waitFor({ state: "attached" });
  await page.evaluate(() => {
    const el = document.scrollingElement;
    el.scrollTo(0, (el.scrollHeight - el.clientHeight) * 0.6);
  });
}

async function targetsAtLeast44(page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll("dialog.td-nl button, dialog.td-nl input:not([tabindex='-1'])")]
      .filter((el) => el.getClientRects().length)
      .map((el) => ({ label: el.getAttribute("aria-label") || el.textContent.trim() || el.id, ...el.getBoundingClientRect().toJSON() }))
      .filter((r) => r.height < 44 || r.width < 44),
  );
  assert.deepEqual(small, [], `targets under 44px: ${JSON.stringify(small)}`);
}

for (const width of [390, 1440]) {
  const phone = width < 768;

  await check(`${width}: opens at 50% scroll with the theme's copy, no discount wording`, async () => {
    const { context, page } = await open(width);
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle");
    await dialog(page).waitFor({ state: "attached" });
    assert.equal(await dialog(page).isVisible(), false, "hidden before a trigger");
    await scrollHalf(page);
    await dialog(page).waitFor({ state: "visible", timeout: 3000 });
    const text = await dialog(page).evaluate((d) => d.textContent);
    for (const s of ["The TireDrop list", "Tire tips that save you money", "Sign me up", "No thanks", "Unsubscribe anytime"]) {
      assert.ok(text.includes(s), `missing "${s}"`);
    }
    assert.doesNotMatch(text, /discount|coupon|% off|promo|deal|rebate|offer/i);
    await page.waitForTimeout(350); // let the entrance animation finish
    await page.screenshot({ path: `${SHOTS}/popup-${width}.png` });
    await targetsAtLeast44(page);

    const box = await dialog(page).boundingBox();
    const vw = width;
    const vh = page.viewportSize().height;
    assert.ok(box.x >= 0 && box.x + box.width <= vw, "inside the viewport horizontally");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `page scrolls sideways by ${overflow}px`);
    const isModal = await dialog(page).evaluate((d) => d.matches(":modal"));
    if (phone) {
      assert.equal(isModal, false, "non-modal card on phones");
      assert.ok(box.height <= vh * 0.6 + 1, `card is ${box.height}px of ${vh}px`);
      const bar = await page.evaluate(() => {
        const el = [...document.querySelectorAll("div.fixed.bottom-0")].find((n) => n.getClientRects().length);
        return el ? el.getBoundingClientRect().top : null;
      });
      assert.ok(bar === null || box.y + box.height <= bar, "sits above the call bar");
    } else {
      assert.equal(isModal, true, "modal on desktop");
      assert.equal(await page.evaluate(() => document.activeElement?.id), "td-nl-email", "focus on the email field");
      // Focus trap: Tab past the last control comes back round.
      const seen = new Set();
      for (let i = 0; i < 8; i += 1) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(() => document.querySelector("dialog.td-nl").contains(document.activeElement));
        assert.ok(inside, "focus left the modal");
        seen.add(await page.evaluate(() => document.activeElement.id || document.activeElement.textContent.trim()));
      }
      assert.ok(seen.has("td-nl-email") && seen.has("No thanks"), `tab cycle: ${[...seen]}`);
      assert.equal(
        await page.evaluate(() => document.documentElement.classList.contains("td-nl-locked")),
        true,
        "page scroll locked",
      );
    }
    await context.close();
  });

  await check(`${width}: Esc dismisses and it stays away for 14 days`, async () => {
    const { context, page } = await open(width);
    await page.goto(`${BASE}/tires`);
    await scrollHalf(page);
    await dialog(page).waitFor({ state: "visible", timeout: 3000 });
    await page.keyboard.press("Escape");
    await dialog(page).waitFor({ state: "hidden", timeout: 2000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("td-nl-popup")));
    assert.equal(saved.s, "dismissed");
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("td-nl-locked")),
      false,
      "scroll lock released",
    );
    await page.reload();
    await page.waitForLoadState("networkidle");
    await scrollHalf(page);
    await page.waitForTimeout(800);
    assert.equal(await dialog(page).isVisible(), false, "reopened inside 14 days");
    await context.close();
  });

  await check(`${width}: close button, "No thanks" and backdrop each dismiss`, async () => {
    for (const how of ["close", "skip", ...(phone ? [] : ["backdrop"])]) {
      const { context, page } = await open(width);
      await page.goto(`${BASE}/`);
      await scrollHalf(page);
      await dialog(page).waitFor({ state: "visible", timeout: 3000 });
      if (how === "close") await page.getByRole("button", { name: "Close" }).click();
      if (how === "skip") await page.getByRole("button", { name: "No thanks" }).click();
      if (how === "backdrop") await page.mouse.click(10, 10);
      await dialog(page).waitFor({ state: "hidden", timeout: 2000 });
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("td-nl-popup")));
      assert.equal(saved?.s, "dismissed", how);
      await context.close();
    }
  });

  await check(`${width}: sign-up posts to /api/newsletter and shows the success state`, async () => {
    const { context, page, signups } = await open(width, { reducedMotion: "reduce" });
    await page.goto(`${BASE}/`);
    await scrollHalf(page);
    await dialog(page).waitFor({ state: "visible", timeout: 3000 });
    // Invalid first: an inline error, nothing sent.
    await page.fill("#td-nl-email", "not-an-email");
    await page.getByRole("button", { name: "Sign me up" }).click();
    await page.getByText("Enter a valid email address.").waitFor();
    assert.equal(signups.length, 0);
    await page.fill("#td-nl-email", "driver@example.com");
    await page.getByRole("button", { name: "Sign me up" }).click();
    await page.getByText("You're on the list. Watch your inbox.").waitFor();
    assert.deepEqual(signups, [{ email: "driver@example.com", source: "popup", website: "" }]);
    await page.screenshot({ path: `${SHOTS}/popup-${width}-success.png` });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("td-nl-popup")));
    assert.equal(saved.s, "subscribed");
    await page.getByRole("button", { name: "Keep browsing" }).click();
    await dialog(page).waitFor({ state: "hidden", timeout: 2000 });
    await context.close();
  });

  await check(`${width}: never on cart, checkout, contact, financing, commercial pages`, async () => {
    const { context, page } = await open(width);
    for (const path of ["/cart", "/checkout", "/contact", "/financing", "/commercial-tires"]) {
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState("networkidle");
      await scrollHalf(page);
      await page.waitForTimeout(500);
      assert.equal(await dialog(page).isVisible(), false, path);
    }
    await context.close();
  });

  await check(`${width}: not rendered at all when status says the newsletter is off`, async () => {
    const { context, page } = await open(width, { status: { ...STATUS_ON, newsletter: "off" } });
    await page.goto(`${BASE}/`);
    await scrollHalf(page, { expectPopup: false });
    await page.waitForTimeout(500);
    assert.equal(await dialog(page).count(), 0);
    await context.close();
  });
}

await check("1440: exit intent through the top of the window opens it", async () => {
  const { context, page } = await open(1440);
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("networkidle");
  await dialog(page).waitFor({ state: "attached" });
  await page.mouse.move(700, 300);
  await page.mouse.move(700, -5);
  await page.evaluate(() =>
    document.dispatchEvent(new MouseEvent("mouseout", { clientX: 700, clientY: -1, relatedTarget: null, bubbles: true })),
  );
  await dialog(page).waitFor({ state: "visible", timeout: 3000 });
  await context.close();
});

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
