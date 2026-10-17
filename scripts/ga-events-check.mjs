/**
 * GA4 conversion events in Chromium (src/lib/analytics.js).
 *
 * gtag.js is blocked like every third-party host, so window.gtag is the
 * stub from index.html's snippet, which only pushes each call onto
 * window.dataLayer. An init script records those calls; the checks walk a
 * real funnel and assert the events and their shape:
 *
 *   product page  view_item, then Add to Cart → add_to_cart
 *   /cart         view_cart
 *   /checkout     begin_checkout, then the delivery step → add_shipping_info
 *   /contact      a sent message → generate_lead { form_name: "contact" }
 *   /tires        a vehicle with nothing in its size → view_search_results
 *                 { results: 0 }, and its quote form → generate_lead
 *                 { form_name: "size-quote" }
 *   /             tel: links → phone_click { placement } (header, a home
 *                 section, footer); the hero size search → search with
 *                 placement "home_hero"; a link to /install in the install
 *                 section → install_cta_click; the hero scan tap → scan_tap
 *   /tires        the finder's search → search with placement "tires"
 *   footer        the newsletter form → newsletter_signup (and NOT
 *                 generate_lead)
 *   /find-my-tires  step one → quiz_start, the shortlist → quiz_complete,
 *                 a link on it → quiz_result_click
 *
 * and that nothing typed into a form (name, email, phone, message) appears
 * in any call.
 *
 *   npm run build && npm run check:ga
 *
 * Starts `vite preview` on GA_CHECK_PORT (default 4330; set another if it is
 * busy), or tests GA_CHECK_BASE when that is set to a running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.GA_CHECK_PORT ?? 4330);

/* ------------------------------ preview ------------------------------ */

// vite preview runs as its own process group so the whole tree can be
// stopped; Windows has no process groups, and there the server is the
// child itself (node runs vite directly rather than through npx).
const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.GA_CHECK_BASE;
if (!BASE) {
  if (!existsSync("dist/tires.html")) {
    console.error("No prerendered build in dist/. Run `npm run build` first.");
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
      console.error(`vite preview did not come up on ${BASE} (port busy? set GA_CHECK_PORT)`);
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

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;

async function open() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.route(
    (url) => url.host !== local,
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: { atd: "sample", shopify: "live", checkout: "request", newsletter: "on", forms: "on", scanner: "on", version: "test" },
    }),
  );
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route("**/api/forms", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/newsletter", (route) => route.fulfill({ json: { ok: true } }));
  // A tel: tap must not try to dial from the browser under test. This runs
  // after analytics' capture-phase listener, which is what is being checked.
  await page.addInitScript(() => {
    document.addEventListener("click", (e) => {
      if (e.target.closest?.('a[href^="tel:"]')) e.preventDefault();
    });
  });
  // Every gtag() call, as an array, survives reloads in sessionStorage.
  await page.addInitScript(() => {
    const KEY = "__gaCalls";
    const dl = (window.dataLayer = window.dataLayer || []);
    const push = dl.push.bind(dl);
    dl.push = (entry) => {
      try {
        const calls = JSON.parse(sessionStorage.getItem(KEY) || "[]");
        calls.push(Array.from(entry));
        sessionStorage.setItem(KEY, JSON.stringify(calls));
      } catch {
        /* storage blocked */
      }
      return push(entry);
    };
  });
  const events = async () =>
    (await page.evaluate(() => JSON.parse(sessionStorage.getItem("__gaCalls") || "[]"))).filter(
      (c) => c[0] === "event",
    );
  const waitEvent = async (name) => {
    const deadline = Date.now() + 8000;
    for (;;) {
      const found = (await events()).filter((c) => c[1] === name);
      if (found.length) return found;
      if (Date.now() > deadline) throw new Error(`no ${name} event; saw ${(await events()).map((c) => c[1]).join(", ") || "none"}`);
      await page.waitForTimeout(100);
    }
  };
  return { context, page, errors, events, waitEvent };
}

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

function assertItem(item, label) {
  assert.equal(typeof item.item_id, "string", `${label}: item_id`);
  assert.ok(item.item_id.length > 0, `${label}: item_id set`);
  for (const k of ["item_name", "item_brand"]) assert.equal(typeof item[k], "string", `${label}: ${k}`);
  assert.equal(typeof item.price, "number", `${label}: price`);
  assert.ok(item.price > 0, `${label}: price > 0`);
  assert.equal(typeof item.quantity, "number", `${label}: quantity`);
  for (const k of Object.keys(item)) {
    assert.ok(
      ["item_id", "item_name", "item_brand", "item_category", "item_variant", "price", "quantity"].includes(k),
      `${label}: unexpected item key ${k}`,
    );
  }
}

const PRODUCT = readdirSync("dist/tires").find((f) => f.endsWith(".html")).replace(/\.html$/, "");
const PII = ["Casey", "Tester", "casey@example.com", "9545550123", "954-555-0123", "Hello from the GA check"];

/* ------------------------------- checks ------------------------------- */

const h = await open();
try {
  await check(`/tires/${PRODUCT}: view_item, then add_to_cart with the set of four`, async () => {
    await h.page.goto(`${BASE}/tires/${PRODUCT}`);
    const [view] = await h.waitEvent("view_item");
    const p = view[2];
    assert.equal(p.currency, "USD");
    assert.equal(p.items.length, 1);
    assertItem(p.items[0], "view_item");
    assert.equal(p.items[0].quantity, 1);
    assert.equal(p.value, p.items[0].price);

    await h.page.getByRole("button", { name: "Add to Cart", exact: true }).click();
    const [add] = await h.waitEvent("add_to_cart");
    const a = add[2];
    assert.equal(a.currency, "USD");
    assert.equal(a.items.length, 1);
    assertItem(a.items[0], "add_to_cart");
    assert.equal(a.items[0].item_id, p.items[0].item_id);
    assert.equal(a.items[0].quantity, 4);
    assert.equal(a.value, Math.round(a.items[0].price * 4 * 100) / 100);
  });

  await check("/cart: view_cart once, with the cart's items", async () => {
    await h.page.goto(`${BASE}/cart`);
    const [view] = await h.waitEvent("view_cart");
    assertItem(view[2].items[0], "view_cart");
    await h.page.waitForTimeout(300);
    assert.equal((await h.events()).filter((c) => c[1] === "view_cart").length, 1);
  });

  await check("/checkout: begin_checkout, then add_shipping_info with the delivery tier", async () => {
    await h.page.goto(`${BASE}/checkout`);
    const [begin] = await h.waitEvent("begin_checkout");
    const b = begin[2];
    assert.equal(b.currency, "USD");
    assert.ok(b.value > 0);
    assert.equal(b.items.length, 1);
    assertItem(b.items[0], "begin_checkout");
    assert.equal(b.items[0].quantity, 4);

    await h.page.fill("#firstName", "Casey");
    await h.page.fill("#lastName", "Tester");
    await h.page.fill("#email", "casey@example.com");
    await h.page.fill("#phone", "9545550123");
    await h.page.getByRole("button", { name: "Continue" }).click();
    await h.page.waitForSelector("#fulfillment-pickup");
    await h.page.locator("#fulfillment-pickup").check();
    const date = new Date(Date.now() + 7 * 864e5);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    await h.page.fill("#date", date.toISOString().slice(0, 10));
    await h.page.selectOption("#timeWindow", { index: 1 });
    await h.page.getByRole("button", { name: "Continue" }).click();
    const [ship] = await h.waitEvent("add_shipping_info");
    assert.equal(ship[2].shipping_tier, "ship-to-store");
    assertItem(ship[2].items[0], "add_shipping_info");
  });

  await check("/contact: a sent message is generate_lead with the form name only", async () => {
    await h.page.goto(`${BASE}/contact`);
    await h.page.fill("#contact-name", "Casey Tester");
    await h.page.fill("#contact-phone", "954-555-0123");
    await h.page.fill("#contact-email", "casey@example.com");
    await h.page.locator('input[name="subject"]').first().check();
    await h.page.fill("#contact-message", "Hello from the GA check");
    await h.page.getByRole("button", { name: "Send Message" }).click();
    const [lead] = await h.waitEvent("generate_lead");
    assert.deepEqual(lead[2], { form_name: "contact" });
  });

  await check("/tires with a size nothing is stocked in: view_search_results { results: 0 }, then a size-quote lead", async () => {
    await h.page.goto(`${BASE}/tires?year=2019&make=toyota&model=camry`);
    const [seen] = await h.waitEvent("view_search_results");
    assert.deepEqual(seen[2], {
      search_type: "vehicle",
      search_term: "2019 Toyota Camry",
      results: 0,
    });
    await h.page.fill("#sq-name", "Casey Tester");
    await h.page.fill("#sq-phone", "954-555-0123");
    await h.page.getByRole("button", { name: "Get a quote" }).click();
    await h.page.getByText("Got it.").waitFor();
    const leads = await h.waitEvent("generate_lead");
    assert.deepEqual(leads.at(-1)[2], { form_name: "size-quote" });
    // Once per search, not once per render.
    assert.equal((await h.events()).filter((c) => c[1] === "view_search_results").length, 1);
  });

  await check("home: tel: taps are phone_click with a placement and no number", async () => {
    await h.page.goto(`${BASE}/`);
    await h.page.waitForSelector("header a[href^='tel:']");
    const before = (await h.events()).length;
    await h.page.locator("header a[href^='tel:']").first().click();
    await h.page.locator("[data-home-section] a[href^='tel:']").first().click();
    await h.page.locator("footer a[href^='tel:']").first().click();
    const calls = (await h.events()).slice(before).filter((c) => c[1] === "phone_click");
    const placements = calls.map((c) => c[2].placement);
    assert.equal(placements[0], "header");
    assert.match(placements[1], /^home_[a-z]+$/);
    assert.equal(placements[2], "footer");
    for (const c of calls) assert.deepEqual(Object.keys(c[2]), ["placement"]);
  });

  await check("home: hero size search is search { placement: home_hero }; the scan tap is scan_tap", async () => {
    await h.page.goto(`${BASE}/`);
    await h.page.getByTestId("hero-scan").click();
    const [scan] = await h.waitEvent("scan_tap");
    assert.deepEqual(scan[2], { placement: "home_hero", method: "finder" });
    await h.page.goto(`${BASE}/`);
    await h.page.getByRole("tab", { name: "Shop by Tire Size" }).click();
    await h.page.selectOption("#finder-width", "225");
    await h.page.selectOption("#finder-aspect", "50");
    await h.page.selectOption("#finder-diameter", "17");
    await h.page.getByRole("button", { name: "Search Sizes" }).click();
    const found = (await h.waitEvent("search")).at(-1);
    assert.deepEqual(found[2], { search_type: "tire_size", search_term: "225/50R17", placement: "home_hero" });
  });

  await check("/tires: the finder's search carries placement tires", async () => {
    // A fresh visitor: the walk above remembered a vehicle, and /tires then
    // opens on its results instead of the finder.
    const t = await open();
    try {
      await t.page.goto(`${BASE}/tires?search=size`);
      await t.page.selectOption("#finder-width", "225");
      await t.page.selectOption("#finder-aspect", "50");
      await t.page.selectOption("#finder-diameter", "17");
      await t.page.locator("form:has(#finder-width)").evaluate((f) => f.requestSubmit());
      const found = (await t.waitEvent("search")).at(-1);
      assert.equal(found[2].placement, "tires");
      assert.equal(found[2].search_term, "225/50R17");
    } finally {
      await t.context.close();
    }
  });

  await check("home: a link to /install inside a home section is install_cta_click", async () => {
    await h.page.goto(`${BASE}/`);
    const link = h.page.locator("[data-home-section] a[href='/install']").first();
    await link.scrollIntoViewIfNeeded();
    await link.click();
    const [cta] = await h.waitEvent("install_cta_click");
    assert.match(cta[2].placement, /^home_[a-z]+$/);
    assert.equal(cta[2].install_type, "shop");
    assert.deepEqual(Object.keys(cta[2]).sort(), ["install_type", "placement"]);
  });

  await check("footer newsletter is newsletter_signup, not generate_lead", async () => {
    await h.page.goto(`${BASE}/contact`);
    const before = (await h.events()).length;
    const box = h.page.getByTestId("newsletter-signup");
    await box.locator("input[type=email]").fill("casey@example.com");
    await box.getByRole("button").first().click();
    const [news] = await h.waitEvent("newsletter_signup");
    assert.deepEqual(news[2], { placement: "footer" });
    await h.page.waitForTimeout(300);
    const fresh = (await h.events()).slice(before);
    assert.equal(fresh.filter((c) => c[1] === "generate_lead").length, 0, "newsletter counted as a lead");
  });

  await check("/find-my-tires: quiz_start, quiz_complete, quiz_result_click, nothing typed", async () => {
    await h.page.goto(`${BASE}/find-my-tires`);
    await h.page.getByRole("button", { name: "I know my tire size" }).click();
    await h.page.fill("#quiz-size", "225/50R17");
    await h.page.getByRole("button", { name: "Continue" }).click();
    const [start] = await h.waitEvent("quiz_start");
    assert.deepEqual(start[2], {});
    for (let step = 2; step <= 5; step += 1) {
      await h.page.locator("form label:has(input)").first().click();
      await h.page.getByRole("button", { name: step === 5 ? "Show my shortlist" : "Continue" }).click();
    }
    const [done] = await h.waitEvent("quiz_complete");
    assert.deepEqual(done[2], {});
    await h.page.locator("main a[href^='/tires']").first().click();
    const [click] = await h.waitEvent("quiz_result_click");
    assert.match(click[2].method, /^(product|all_tires)$/);
    assert.equal((await h.events()).filter((c) => c[1] === "quiz_start").length, 1);
  });

  await check("no GA call carries anything typed into a form", async () => {
    const all = JSON.stringify(await h.page.evaluate(() => sessionStorage.getItem("__gaCalls")));
    for (const s of PII) assert.ok(!all.includes(s), `GA saw "${s}"`);
    assert.deepEqual(h.errors, []);
  });
} finally {
  await h.context.close();
  await browser.close();
  stopServer();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall GA event checks passed");
process.exit(failures ? 1 : 0);
