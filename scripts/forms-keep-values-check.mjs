/**
 * Forms keep what is in them. Drives the built site in Chromium at 390px and
 * 1440px and checks that every form that sends something keeps — and sends —
 * a value however it got into the field:
 *
 *   typing     real keystrokes / Playwright fill (input events fire);
 *   automation `el.value = "X"` with no event at all, the way browser
 *              automation and some password managers fill a field. The
 *              values go in before /api/status answers (delayed 1.5s), so the
 *              forms-on flip re-renders the form after they are set, and
 *              another field is then typed into to force one more render;
 *   autofill   the native value setter plus an `input` event, as browser
 *              autofill does.
 *
 * Covers /contact, /financing, /commercial-tires, /schedule, /checkout
 * (request mode, ship-to-store pickup), the footer newsletter sign-up, the Find
 * My Tires size prefill, and the /tires size-quote card (a size nothing is
 * stocked in: the quote form sends the size and vehicle, needs a phone, and
 * keeps what was typed after a failed send and with the forms off). Also the install booking for a paid order:
 * /schedule?order= (the order read-only and sent, nothing personal taken
 * from the URL), and /track's "Schedule your install" panel: the day,
 * window and notes typed into it (three modes, a late /api/status, a slow
 * /api/book-install answer, a failed one) stay on screen and are the ones
 * sent; a booked order shows its booking instead of the form; with an
 * INSTALL_BOOKING_URL only that link is shown. The Year / Make / Model dropdowns (VehicleSelect)
 * are picked from, including "Other / not listed", a silent pick taken in on
 * the next render, the NHTSA-down fallback, and the finder's vehicle
 * prefilling the booking form. The finder's Model box (SearchPanel) lists
 * every model vPIC has (2021 BMW: 28, not the size table's 4), filters as
 * you type, takes Enter, Down and a click, takes a model typed that it does
 * not list, and says "Couldn't load models. Type your model or enter your
 * door-jamb size." when vPIC is down (on /tires that opens the bar's
 * door-jamb form). vPIC is mocked in its own JSON shape
 * (scripts/vpic-mock.mjs). Also: start over clears, validation errors clear as
 * you type, the honeypot still reaches the server, no console errors.
 *
 * Fitment (src/data/fitmentCheck.js): with no vehicle every card says "Check
 * fitment" and keeps its Add button; with only a 2019 F-150 (its typical
 * size, no exact size) the typical size says "Matches the typical factory
 * size" and every other size says "Check fitment" and KEEPS Add; once a
 * door-jamb sticker size is saved next to the Shopping-for bar, a tire in
 * another size has no Add (and links to the right size), on the cards and
 * the product pages; a model with no size on file (BMW 4 Series, Audi Q5,
 * a typed Audi S4 Avant) lands on results where every tire says "Check
 * fitment" and keeps Add, with the door-jamb prompt in the bar; a staggered
 * front/rear sticker entry answers per axle
 * with the 2 front + 2 rear note; a year change in the Shopping-for bar
 * changes the answer; "Shopping for a different car?" clears it; size-only
 * mode; Compare crowns a Best only between tires of one size; with a
 * vehicle only the cart and checkout show the soft "We'll confirm fitment
 * by phone" note, and a line that misses a confirmed size is flagged in the
 * cart and on checkout's review and still sends.
 *
 * /track (order lookup): the three modes with a late /api/status, a late
 * (slow) /api/track answer, and the values still on screen after it. And
 * before the app starts: the page's JavaScript is held back while the
 * prerendered form is typed into, then released. The values must survive
 * the start — a hydration on /track and /track?utm_source=…, a fresh render
 * (which replaces the markup) on /track?ref=… — and be the ones submitted.
 * /contact and /schedule get the same before-the-app check.
 *
 * Every /api request is answered by a mock; nothing reaches Shopify. Each
 * body sent to a write endpoint (/api/forms, /api/checkout, /api/newsletter,
 * /api/book-install) is also run through the server's real spam guard
 * (api/_lib/spam.js) with SPAM_GUARD_TEST_MODE=1, which only drops the 2 s
 * minimum fill time (Playwright fills faster than any person): every real
 * submission must carry a valid fill-time token and pass the honeypot and
 * content checks, and the one bot submission must be caught.
 *
 *   npm run build && npm run check:forms
 *
 * It starts `vite preview` itself on FORMS_PORT (default 4181), or tests
 * FORMS_BASE when that is set to an already running server. FORMS_ONLY=<regex>
 * runs only the checks whose name matches, e.g. FORMS_ONLY=/track.
 * FORMS_CONCURRENCY (default 4) is how many checks run at once, each in its
 * own browser context; results still print in declaration order.
 * FORMS_SHARD=k/n runs only every n-th check from the k-th (e.g. 1/3).
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

import { mockVpic } from "./vpic-mock.mjs";
import { inspectSubmission } from "../api/_lib/spam.js";
import { formsContent } from "../api/forms.js";
import { checkoutContent } from "../api/checkout.js";
import { readFillToken } from "../src/data/formGuard.js";

/* --------------------------- the spam guard -------------------------- */

const GUARD_ENV = { SPAM_GUARD_TEST_MODE: "1" };
const CONTENT = {
  forms: formsContent,
  checkout: checkoutContent,
  newsletter: () => null,
  "book-install": (b) => ({ texts: [b?.notes] }),
};
/** Every write the pages sent, with the real guard's verdict on it. */
const judged = [];
function judge(endpoint, body) {
  const result = inspectSubmission(body, { env: GUARD_ENV, content: CONTENT[endpoint](body) });
  judged.push({ endpoint, body, ...result, elapsedMs: readFillToken(body?.ft)?.elapsedMs ?? null });
  return result;
}

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.FORMS_PORT ?? 4181);
const STATUS_DELAY_MS = 1500;
// FORMS_SHARD=k/n runs every n-th check starting at the k-th (1-based), so
// a CI can split the suite across machines; unset runs them all. Read before
// the preview server starts, so a bad value cannot leave one running.
const SHARD = (() => {
  const raw = process.env.FORMS_SHARD;
  if (!raw) return null;
  const m = /^(\d+)\/(\d+)$/.exec(raw);
  const [k, n] = m ? [Number(m[1]), Number(m[2])] : [0, 0];
  if (!(n >= 1 && k >= 1 && k <= n)) {
    console.error(`FORMS_SHARD=${raw}: want k/n with 1 <= k <= n, e.g. 1/3`);
    process.exit(2);
  }
  return { k, n };
})();

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.FORMS_BASE;
if (!BASE) {
  if (!existsSync("dist/index.html")) {
    console.error("No build in dist/. Run `npm run build` first.");
    process.exit(1);
  }
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
function stopServer() {
  if (server) {
    try {
      process.kill(-server.pid);
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
  newsletter: "off",
  forms: "on",
  version: "test",
};

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});

let failures = 0;
let passes = 0;
// FORMS_ONLY=<regex> runs just the checks whose name matches.
const ONLY = process.env.FORMS_ONLY ? new RegExp(process.env.FORMS_ONLY) : null;
// Why a pool: every check owns its own browser context and mocks, and most of
// a check is waiting (the 1.5 s late /api/status, slow mocked answers), so
// several run side by side; serially they were ~280 s, the slowest gate.
const CONCURRENCY = Math.max(1, Number(process.env.FORMS_CONCURRENCY ?? 4) || 4);

async function runCheck(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    return { ok: true, name, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, name, ms: Date.now() - t0, err };
  }
}
function report({ ok, name, err }) {
  if (ok) {
    passes += 1;
    console.log(`ok   ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err.message).split("\n").join("\n     ")}`);
  }
}

/** Checks are queued here as they are declared and run by runQueued(). */
const queued = [];
function check(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
  queued.push({ name, fn });
}

/**
 * Runs the queued checks CONCURRENCY at a time and prints each result in
 * declaration order (a result waits for the ones above it), so the log reads
 * the same as a serial run.
 */
async function runQueued() {
  const mine = SHARD ? queued.filter((_, i) => i % SHARD.n === SHARD.k - 1) : queued;
  const results = new Array(mine.length);
  const timings = [];
  let next = 0;
  let printed = 0;
  const worker = async () => {
    while (next < mine.length) {
      const i = next++;
      results[i] = await runCheck(mine[i].name, mine[i].fn);
      timings.push(results[i]);
      while (printed < mine.length && results[printed]) report(results[printed++]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, mine.length) }, worker));
  const slow = timings.sort((a, b) => b.ms - a.ms).slice(0, 5);
  const sum = timings.reduce((s, r) => s + r.ms, 0);
  console.log(
    `     ${mine.length} checks${SHARD ? ` (shard ${SHARD.k}/${SHARD.n})` : ""}, ${CONCURRENCY} at a time; ` +
      `${(sum / 1000).toFixed(0)} s of check time. Slowest: ` +
      slow.map((r) => `${(r.ms / 1000).toFixed(1)} s ${r.name.slice(0, 60)}`).join("; "),
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A fresh context with the API mocked. /api/status answers after `delay`,
 * so a form can be filled before the forms-on flip re-renders it.
 */
async function open(
  width,
  {
    status = STATUS,
    delay = STATUS_DELAY_MS,
    cart = null,
    vpicDown = false,
    jsDelay = 0,
    trackDelay = 0,
  } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    hasTouch: width < 768,
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
  });
  if (cart) {
    await context.addInitScript((c) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("tiredrop.cart.v1", JSON.stringify(c));
        sessionStorage.setItem("seeded", "1");
      }
    }, cart);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const sent = { forms: [], checkout: [], newsletter: [], track: [] };
  let servedAt = null;
  let markServed;
  const served = new Promise((r) => (markServed = r));

  await page.route("**/api/status", async (route) => {
    await sleep(delay);
    await route.fulfill({ json: status });
    servedAt ??= Date.now();
    markServed();
  });
  await page.route("**/api/forms", async (route) => {
    sent.forms.push(JSON.parse(route.request().postData() || "{}"));
    judge("forms", sent.forms.at(-1));
    await route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/checkout", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    sent.checkout.push(body);
    judge("checkout", body);
    await route.fulfill({
      json: {
        mode: "request",
        orderRef: "TD-TEST-0001",
        total: 600,
        delivered: true,
        delivery: body.delivery,
      },
    });
  });
  await page.route("**/api/newsletter", async (route) => {
    sent.newsletter.push(JSON.parse(route.request().postData() || "{}"));
    judge("newsletter", sent.newsletter.at(-1));
    await route.fulfill({ json: { ok: true } });
  });
  // Order lookup: always "not found", after `trackDelay`.
  await page.route("**/api/track", async (route) => {
    sent.track.push(JSON.parse(route.request().postData() || "{}"));
    await sleep(trackDelay);
    await route.fulfill({ status: 404, json: { error: "Order not found." } });
  });
  // Holds the app's JavaScript back, so the prerendered HTML can be typed
  // into before React starts.
  let releaseJs = () => {};
  if (jsDelay) {
    const gate = new Promise((r) => {
      releaseJs = r;
      setTimeout(r, jsDelay);
    });
    await page.route("**/assets/*.js", async (route) => {
      await gate;
      await route.continue();
    });
  }
  // Third-party hosts (Google Fonts, Google Analytics) are answered empty,
  // so a slow or blocked host cannot stall a load or log an error; the
  // checks are about fields. vPIC is mocked below.
  const local = new URL(BASE).host;
  await page.route(
    (url) => url.host !== local && url.host !== "vpic.nhtsa.dot.gov",
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));
  await mockVpic(page, { down: vpicDown });

  return {
    context,
    page,
    sent,
    errors,
    releaseJs: () => releaseJs(),
    /** Resolves once the delayed status has been served and rendered. */
    async afterStatus() {
      await served;
      await sleep(300);
      return servedAt;
    },
  };
}

/* ------------------------------ filling ------------------------------ */

/**
 * Fields are `[selector, value]`; a boolean value checks a radio or checkbox.
 * Returns the time the values were in place.
 */
async function fill(page, mode, fields) {
  if (mode === "typing") {
    for (const [sel, value] of fields) {
      const el = page.locator(sel);
      const tag = await el.evaluate((n) => n.tagName);
      if (typeof value === "boolean") await el.setChecked(value);
      else if (tag === "SELECT") await el.selectOption(value);
      else await el.fill(value);
    }
    return Date.now();
  }
  await page.evaluate(
    ({ mode, fields }) => {
      for (const [sel, value] of fields) {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`no field ${sel}`);
        if (mode === "automation") {
          // Plain assignment, no events: what automation and some password
          // managers do.
          if (typeof value === "boolean") el.checked = value;
          else el.value = value;
          continue;
        }
        // Autofill: the browser sets the value natively, then fires events.
        if (typeof value === "boolean") {
          if (el.checked !== value) el.click();
          continue;
        }
        const proto = Object.getPrototypeOf(el);
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    },
    { mode, fields },
  );
  return Date.now();
}

/** The DOM still shows every value (after the re-renders). */
async function expectDom(page, fields, label = "") {
  const seen = await page.evaluate(
    (fields) =>
      fields.map(([sel, value]) => {
        const el = document.querySelector(sel);
        if (!el) return [sel, "<missing>"];
        return [sel, typeof value === "boolean" ? el.checked : el.value];
      }),
    fields,
  );
  assert.deepEqual(seen, fields, `field values after re-render ${label}`);
}

function assertIncludes(payload, expected, label) {
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(payload?.[key], value, `${label}: payload.${key}`);
  }
}

async function waitFor(fn, label, timeout = 5000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (fn()) return;
    await sleep(50);
  }
  throw new Error(`timed out waiting for ${label}`);
}

function noErrors(errors) {
  assert.deepEqual(errors, [], "console errors");
}

/** The 404 the /track mock answers with is logged by the browser; that one is expected. */
const trackErrors = (errors) =>
  errors.filter((e) => !/status of 404/.test(e));

/** Resolves once React owns `sel` (hydrated or freshly rendered). */
async function appStarted(page, sel) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
    },
    sel,
    { timeout: 15000 },
  );
  await sleep(300);
}

/** Types into the prerendered form while the app's JavaScript is held back. */
async function typeBeforeApp(page, fields) {
  for (const [sel, value] of fields) {
    const el = page.locator(sel);
    if (typeof value === "boolean") await el.setChecked(value);
    else {
      await el.click();
      await page.keyboard.type(value, { delay: 10 });
    }
  }
  const started = await page.evaluate(() =>
    Object.keys(document.getElementById("root").firstElementChild ?? {}).some((k) =>
      k.startsWith("__reactFiber"),
    ),
  );
  assert.equal(started, false, "the app must not have started while typing");
}

/**
 * The common shape of one run: fill the silent/autofilled fields, let the
 * forms-on flip land, type one more field for good measure, check the DOM.
 */
async function fillAndRerender(h, mode, fields, typed) {
  const setAt = await fill(h.page, mode, fields);
  const servedAt = await h.afterStatus();
  if (mode !== "typing") {
    assert.ok(setAt < servedAt, "values must go in before /api/status answers");
  }
  // One more state change: a real keystroke in a different field.
  for (const [sel, value] of typed) await h.page.locator(sel).pressSequentially(value);
  await sleep(150);
  await expectDom(h.page, fields, `(${mode})`);
}

/**
 * Year / Make / Model from the dropdowns. The model list loads for the year
 * and make, so they go in first, then a real keystroke elsewhere (`pokes[0]`)
 * re-renders the form: a silent pick is taken into state there and the
 * models load. Then the model, and another keystroke (`pokes[1]`).
 */
async function fillVehicle(page, mode, { year, make, model }, pokes) {
  const top = [
    ["#year", year],
    ["#make", make],
  ];
  await fill(page, mode, top);
  await page.locator(pokes[0][0]).pressSequentially(pokes[0][1]);
  await sleep(100);
  await expectDom(page, top, `(${mode} year and make)`);
  await page.locator(`#model option[value="${model}"]`).waitFor({ state: "attached" });
  const all = [...top, ["#model", model]];
  await fill(page, mode, [["#model", model]]);
  await page.locator(pokes[1][0]).pressSequentially(pokes[1][1]);
  await sleep(150);
  await expectDom(page, all, `(${mode} vehicle)`);
  return all;
}

/** Waits for the model list to finish loading (the select is enabled). */
const modelsLoaded = (page) =>
  page.waitForSelector("#model:not([disabled])", { state: "attached" });

/** The finder's Model box (SearchPanel) once its list has loaded. */
const finderModelReady = (page) => page.waitForSelector("#finder-model:not([disabled])");

/** The models the finder's Model box lists for what is typed in it now. */
async function finderOptions(page) {
  const list = page.locator("#finder-model-list");
  if (await list.isHidden()) return [];
  return list.getByRole("option").allInnerTexts();
}

/**
 * Picks a model in the finder's Model box: types part of it, then takes it
 * from the filtered list with a click.
 */
async function pickFinderModel(page, model, typed = model.slice(0, -1) || model) {
  await finderModelReady(page);
  const box = page.locator("#finder-model");
  await box.fill(typed);
  await page.locator("#finder-model-list").getByRole("option", { name: model, exact: true }).click();
  assert.equal(await box.inputValue(), model, `picked ${model}`);
}

const MODES = ["typing", "automation", "autofill"];

/* ------------------------------- dates -------------------------------- */

function isoLocal(d) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
/** A weekday (Mon–Fri) a few days out, so every window is open. */
function nextWeekday() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return isoLocal(d);
}

/* ------------------------------- checks ------------------------------- */

for (const width of [390, 1440]) {
  /* ---------------- Contact ---------------- */
  for (const mode of MODES) {
    await check(`${width} /contact: ${mode} keeps and sends every field; start over clears`, async () => {
      const h = await open(width);
      const { page } = h;
      await page.goto(`${BASE}/contact`);
      await page.waitForSelector("#contact-name");
      const fields = [
        ["#contact-name", `Alex ${mode}`],
        ["#contact-email", "alex@example.com"],
        ["#subject-orderquestion", true],
        ["#contact-message", "Where is order 12345? Camry, 215/55R17."],
      ];
      await fillAndRerender(h, mode, fields, [["#contact-phone", "9545550188"]]);
      await page.getByRole("button", { name: "Send Message" }).click();
      await waitFor(() => h.sent.forms.length === 1, "/api/forms");
      assertIncludes(
        h.sent.forms[0],
        {
          form: "contact",
          name: `Alex ${mode}`,
          email: "alex@example.com",
          phone: "9545550188",
          subject: "Order Question",
          message: "Where is order 12345? Camry, 215/55R17.",
          website: "",
        },
        "contact",
      );
      await page.getByText(`Message received, Alex.`).waitFor();
      // Start over: a fresh, empty form.
      await page.getByRole("button", { name: "Send another message" }).click();
      await page.waitForSelector("#contact-name");
      await expectDom(page, [
        ["#contact-name", ""],
        ["#contact-email", ""],
        ["#contact-phone", ""],
        ["#subject-orderquestion", false],
        ["#contact-message", ""],
      ], "(after start over)");
      noErrors(h.errors);
      await h.context.close();
    });
  }

  await check(`${width} /contact: errors clear as you type; honeypot still reaches the server`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.goto(`${BASE}/contact`);
    await h.afterStatus();
    await page.getByRole("button", { name: "Send Message" }).click();
    await page.getByText("Tell us who we are talking to.").waitFor();
    await page.locator("#contact-name").pressSequentially("Al");
    await page.getByText("Tell us who we are talking to.").waitFor({ state: "detached" });
    assert.equal(await page.getByText("We need an email to write back to.").count(), 1, "other errors stay");
    // A bot that fills the hidden field, even without events, is still caught.
    await fill(page, "automation", [["#contact-website", "http://spam.example"]]);
    await fill(page, "typing", [
      ["#contact-email", "bot@example.com"],
      ["#contact-phone", "9545550188"],
      ["#subject-somethingelse", true],
      ["#contact-message", "Buy cheap things at my site today."],
    ]);
    await page.getByRole("button", { name: "Send Message" }).click();
    await waitFor(() => h.sent.forms.length === 1, "/api/forms");
    assert.equal(h.sent.forms[0].website, "http://spam.example", "honeypot value sent");
    // This send's own verdict: other checks run alongside and judge theirs too.
    assert.equal(judged.find((j) => j.body === h.sent.forms[0])?.reason, "honeypot", "the server's guard catches it");
    assert.equal(h.sent.forms[0].name, "Al");
    noErrors(h.errors);
    await h.context.close();
  });

  /* ---------------- Financing ---------------- */
  for (const mode of MODES) {
    await check(`${width} /financing: ${mode} keeps and sends every field; start over clears`, async () => {
      const h = await open(width);
      const { page } = h;
      await page.goto(`${BASE}/financing`);
      await page.waitForSelector("#fin-name");
      const fields = [
        ["#fin-name", `Fin ${mode}`],
        ["#fin-email", "fin@example.com"],
        ["#fin-amount", "850"],
      ];
      await fillAndRerender(h, mode, fields, [["#fin-phone", "9545550188"]]);
      // The forms-on flip really did re-render the form.
      await page.getByText("This goes to us, not to a lender.").waitFor();
      await page.getByRole("button", { name: "Send Request" }).click();
      await waitFor(() => h.sent.forms.length === 1, "/api/forms");
      assertIncludes(
        h.sent.forms[0],
        {
          form: "financing",
          name: `Fin ${mode}`,
          email: "fin@example.com",
          phone: "9545550188",
          amount: "850",
          website: "",
        },
        "financing",
      );
      await page.getByText("Request received.").waitFor();
      await page.getByRole("button", { name: "Start over" }).click();
      await page.waitForSelector("#fin-name");
      await expectDom(page, [
        ["#fin-name", ""],
        ["#fin-email", ""],
        ["#fin-phone", ""],
        ["#fin-amount", ""],
      ], "(after start over)");
      noErrors(h.errors);
      await h.context.close();
    });
  }

  /* ---------------- Commercial / fleet ---------------- */
  for (const mode of MODES) {
    await check(`${width} /commercial-tires: ${mode} keeps and sends every field; start over clears`, async () => {
      const h = await open(width);
      const { page } = h;
      await page.goto(`${BASE}/commercial-tires`);
      await page.waitForSelector("#company");
      assert.equal(await page.locator("#fleetSize").inputValue(), "", "select defaults to the placeholder");
      const fields = [
        ["#company", `Fleet ${mode} LLC`],
        ["#contact", "Dana Fleet"],
        ["#email", "dana@example.com"],
        ["#fleetSize", "6–15 vehicles"],
        ["#sizes", "245/75R16, 225/75R16"],
        ["#message", "Yard in Sunrise."],
      ];
      await fillAndRerender(h, mode, fields, [["#phone", "9545550188"]]);
      await page.getByRole("button", { name: "Request fleet quote" }).click();
      await waitFor(() => h.sent.forms.length === 1, "/api/forms");
      assertIncludes(
        h.sent.forms[0],
        {
          form: "fleet-quote",
          company: `Fleet ${mode} LLC`,
          contact: "Dana Fleet",
          phone: "9545550188",
          email: "dana@example.com",
          fleetSize: "6–15 vehicles",
          sizes: "245/75R16, 225/75R16",
          message: "Yard in Sunrise.",
          website: "",
        },
        "fleet-quote",
      );
      await page.getByText("Quote request received").waitFor();
      await page.getByRole("button", { name: "Submit another vehicle list" }).click();
      await page.waitForSelector("#company");
      await expectDom(page, [
        ["#company", ""],
        ["#contact", ""],
        ["#phone", ""],
        ["#email", ""],
        ["#fleetSize", ""],
        ["#sizes", ""],
        ["#message", ""],
      ], "(after start over)");
      noErrors(h.errors);
      await h.context.close();
    });
  }

  /* ---------------- /tires: size quote on zero results ---------------- */
  // A 2019 Camry's 215/55R17 is not in the sample catalog, so the "in your
  // size" list is empty and the size-quote card takes its place.
  // /api/tires answers a bare 404 here (no API: the sample catalog answers),
  // and the browser logs it; nothing else may be logged.
  const QUOTE_URL = "/tires?year=2019&make=toyota&model=camry";
  const quoteErrors = (errors) => errors.filter((e) => !/status of 404/.test(e));
  for (const mode of MODES) {
    await check(`${width} /tires size-quote: ${mode} keeps and sends every field with the size and vehicle`, async () => {
      const h = await open(width);
      const { page } = h;
      await page.goto(`${BASE}${QUOTE_URL}`);
      await page.waitForSelector("#sq-name");
      const fields = [
        ["#sq-name", `Rae ${mode}`],
        ["#sq-email", "rae@example.com"],
      ];
      await fillAndRerender(h, mode, fields, [["#sq-phone", "9545550142"]]);
      await page.getByRole("button", { name: "Get a quote" }).click();
      await waitFor(() => h.sent.forms.length === 1, "/api/forms");
      assertIncludes(
        h.sent.forms[0],
        {
          form: "size-quote",
          name: `Rae ${mode}`,
          phone: "9545550142",
          email: "rae@example.com",
          size: "215/55R17",
          vehicle: "2019 Toyota Camry",
          website: "",
        },
        "size-quote",
      );
      await page.getByText("Got it. We’ll call you about 215/55R17.").waitFor();
      noErrors(quoteErrors(h.errors));
      await h.context.close();
    });
  }

  await check(`${width} /tires size-quote: phone required; typed values stay after a failed send and with forms off`, async () => {
    // A failed send: the server refuses it.
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.route("**/api/forms", async (route) => {
      h.sent.forms.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ status: 502, json: { error: "We could not send that just now. Please call the shop instead." } });
    });
    await page.goto(`${BASE}${QUOTE_URL}`);
    await h.afterStatus();
    await page.locator("#sq-name").fill("Rae Diaz");
    await page.getByRole("button", { name: "Get a quote" }).click();
    await page.getByText("We need a number to call with the quote.").waitFor();
    assert.equal(h.sent.forms.length, 0, "nothing sent without a phone");
    await page.locator("#sq-phone").pressSequentially("954 555 0142");
    await page.getByText("We need a number to call with the quote.").waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Get a quote" }).click();
    await waitFor(() => h.sent.forms.length === 1, "/api/forms");
    await page.getByRole("alert").getByText("Your details are still here").waitFor();
    await expectDom(page, [
      ["#sq-name", "Rae Diaz"],
      ["#sq-phone", "954 555 0142"],
      ["#sq-email", ""],
    ], "(after a failed send)");
    assert.equal(await page.getByText("Got it.").count(), 0, "no confirmation for a failed send");
    // The 502 is logged by the browser; that one is expected too.
    noErrors(quoteErrors(h.errors).filter((e) => !/status of 502/.test(e)));
    await h.context.close();

    // Forms not connected: nothing is sent, the values stay, the phone is offered.
    const off = await open(width, { delay: 0, status: { ...STATUS, forms: "off" } });
    await off.page.goto(`${BASE}${QUOTE_URL}`);
    await off.afterStatus();
    await off.page.locator("#sq-name").fill("Rae Diaz");
    await off.page.locator("#sq-phone").fill("9545550142");
    await off.page.getByRole("button", { name: "Get a quote" }).click();
    await off.page.getByRole("alert").getByText("nothing was sent").waitFor();
    assert.equal(off.sent.forms.length, 0, "nothing sent with forms off");
    await expectDom(off.page, [
      ["#sq-name", "Rae Diaz"],
      ["#sq-phone", "9545550142"],
    ], "(forms off)");
    noErrors(quoteErrors(off.errors));
    await off.context.close();
  });

  /* ---------------- Schedule / booking ---------------- */
  for (const mode of MODES) {
    await check(`${width} /schedule: ${mode} keeps every step and sends the booking`, async () => {
      const h = await open(width);
      const { page } = h;
      await page.goto(`${BASE}/schedule`);
      await page.waitForSelector("#service-tire-installation");
      const date = nextWeekday();
      const next = () => page.getByRole("button", { name: /^Next:/ }).click();

      // Step 1: the service, then the status flip lands.
      await fill(page, mode, [["#service-tire-installation", true]]);
      await h.afterStatus();
      await expectDom(page, [["#service-tire-installation", true]], "(step 1)");
      await next();

      // Step 2: vehicle from the dropdowns; tire size typed for real in
      // two goes (the re-renders).
      await page.waitForSelector("#year");
      await fillVehicle(
        page,
        mode,
        { year: "2020", make: "Toyota", model: "Camry" },
        [
          ["#tireSize", "215/55"],
          ["#tireSize", "R17"],
        ],
      );
      await next();

      // Step 3: mobile address; parking notes typed for real.
      await page.waitForSelector("#address");
      const place = [
        ["#address", "123 Main St"],
        ["#city", "Sunrise"],
        ["#zip", "33351"],
      ];
      await fill(page, mode, place);
      await page.locator("#parkingNotes").pressSequentially("Gate 42");
      await expectDom(page, place, "(step 3)");
      await next();

      // Step 4: date and window.
      await page.waitForSelector("#date");
      const when = [
        ["#date", date],
        ["#window-10-12pm", true],
      ];
      await fill(page, mode, when);
      await expectDom(page, when, "(step 4)");
      await next();

      // Step 5: contact; notes typed for real.
      await page.waitForSelector("#name");
      const who = [
        ["#name", `Sam ${mode}`],
        ["#phone", "9545550134"],
        ["#email", "sam@example.com"],
      ];
      await fill(page, mode, who);
      await page.locator("#notes").pressSequentially("Locking lugs");
      await expectDom(page, who, "(step 5)");

      // Back and forward again: nothing is lost across the round trip.
      await page.getByRole("button", { name: "Back" }).click();
      await page.waitForSelector("#date");
      await expectDom(page, when, "(back to step 4)");
      await next();
      await page.waitForSelector("#name");
      await expectDom(page, who, "(return to step 5)");

      await page.getByRole("button", { name: "Request appointment" }).click();
      await waitFor(() => h.sent.forms.length === 1, "/api/forms");
      assertIncludes(
        h.sent.forms[0],
        {
          form: "booking",
          service: "tire-installation",
          year: "2020",
          make: "Toyota",
          model: "Camry",
          tireSize: "215/55R17",
          locationType: "mobile",
          address: "123 Main St",
          city: "Sunrise",
          zip: "33351",
          parkingNotes: "Gate 42",
          date,
          window: "10-12pm",
          name: `Sam ${mode}`,
          phone: "9545550134",
          email: "sam@example.com",
          notes: "Locking lugs",
          website: "",
        },
        "booking",
      );
      assert.match(h.sent.forms[0].reference, /^TD-\d{6}-[A-Z0-9]{4}$/);
      await page.getByRole("heading", { name: "Appointment requested" }).waitFor();
      noErrors(h.errors);
      await h.context.close();
    });
  }

  /* ---------------- Checkout (request mode, pickup) ---------------- */
  const CART = {
    lines: [
      {
        id: "test-tire",
        key: "test-tire:n",
        sku: "TEST-SKU",
        kind: "tire",
        name: "Test Touring",
        brand: "Testco",
        size: "215/55R17",
        price: 150,
        installPrice: 25,
        install: false,
        qty: 4,
      },
    ],
  };
  for (const mode of MODES) {
    await check(`${width} /checkout: ${mode} keeps every step and sends the pickup request`, async () => {
      const h = await open(width, { cart: CART });
      const { page } = h;
      await page.goto(`${BASE}/checkout`);
      await page.waitForSelector("#firstName");
      const cont = () => page.getByRole("button", { name: "Continue" }).click();
      const date = nextWeekday();

      const contact = [
        ["#firstName", `Casey${mode}`],
        ["#lastName", "Checkout"],
        ["#email", "casey@example.com"],
      ];
      await fillAndRerender(h, mode, contact, [["#phone", "9545550123"]]);
      await cont();

      // Delivery: choosing pickup is a real click (it changes what renders);
      // the date and window go in by `mode`.
      await page.waitForSelector("#fulfillment-pickup");
      await page.locator("#fulfillment-pickup").check();
      await page.waitForSelector("#date");
      assert.equal(await page.locator("#timeWindow").inputValue(), "", "window select defaults to the placeholder");
      const when = [
        ["#date", date],
        ["#timeWindow", "10-12"],
      ];
      await fill(page, mode, when);
      await expectDom(page, when, "(delivery)");
      await cont();

      await page.waitForSelector("#year");
      const vehicle = await fillVehicle(
        page,
        mode,
        { year: "2020", make: "Toyota", model: "Camry" },
        [
          ["#trim", "S"],
          ["#trim", "E"],
        ],
      );
      await cont();

      // Review: the fields read back from the DOM show up in the summary.
      await page.waitForSelector("#agree");
      const review = await page.locator("form", { has: page.locator("#agree") }).innerText();
      for (const s of [`Casey${mode} Checkout`, "casey@example.com", "2020 Toyota Camry"]) {
        assert.ok(review.includes(s), `review shows "${s}"`);
      }
      // Edit round trip: back to contact and forward keeps everything.
      await page.getByRole("button", { name: "Back" }).click();
      await page.waitForSelector("#year");
      await modelsLoaded(page);
      await expectDom(page, [...vehicle, ["#trim", "SE"]], "(back to vehicle)");
      await cont();
      await page.waitForSelector("#agree");

      await fill(page, mode, [["#agree", true]]);
      await page.getByRole("button", { name: "Place Order Request" }).click();
      await waitFor(() => h.sent.checkout.length === 1, "/api/checkout");
      const order = h.sent.checkout[0];
      assert.equal(order.delivery, "pickup");
      assert.deepEqual(order.customer, {
        name: `Casey${mode} Checkout`,
        email: "casey@example.com",
        phone: "9545550123",
      });
      assert.deepEqual(order.items, [{ sku: "TEST-SKU", qty: 4 }]);
      assert.match(order.notes, /Vehicle: 2020 Toyota Camry SE/);
      assert.match(order.notes, /Preferred install: .+, 10:00 AM – 12:00 PM/);
      await page.getByRole("heading", { name: "Your order request is in" }).waitFor();
      noErrors(h.errors);
      await h.context.close();
    });
  }

  /* ---------------- Track Order ---------------- */
  const TRACK_FIELDS = [
    ["#track-order", "#1001"],
    ["#track-email", "driver@example.com"],
  ];
  for (const mode of MODES) {
    await check(`${width} /track: ${mode} values survive late status and a slow lookup, and are sent`, async () => {
      const h = await open(width, { trackDelay: 1200 });
      const { page } = h;
      await page.goto(`${BASE}/track`);
      await page.waitForSelector("#track-order");
      const setAt = await fill(page, mode, TRACK_FIELDS);
      const servedAt = await h.afterStatus();
      if (mode !== "typing") assert.ok(setAt < servedAt, "values must go in before /api/status answers");
      await expectDom(page, TRACK_FIELDS, `(${mode}, after status)`);
      await page.getByRole("button", { name: "Track Order" }).click();
      await waitFor(() => h.sent.track.length === 1, "/api/track");
      assert.deepEqual(h.sent.track[0], {
        order: "#1001",
        email: "driver@example.com",
        website: "",
      });
      // While the lookup is out, and after the answer lands.
      await expectDom(page, TRACK_FIELDS, `(${mode}, lookup in flight)`);
      await page.getByText("We couldn't find that order").waitFor();
      await sleep(300);
      await expectDom(page, TRACK_FIELDS, `(${mode}, after the answer)`);
      // A second lookup sends the same values again.
      await page.getByRole("button", { name: "Track Order" }).click();
      await waitFor(() => h.sent.track.length === 2, "second /api/track");
      assert.deepEqual(h.sent.track[1], h.sent.track[0]);
      noErrors(trackErrors(h.errors));
      await h.context.close();
    });
  }

  for (const [path, how] of [
    ["/track", "hydrates"],
    ["/track?utm_source=email&utm_medium=order", "hydrates"],
    ["/track?ref=confirmation", "renders fresh"],
  ]) {
    await check(`${width} ${path}: typed before the app starts (${how}); kept and sent`, async () => {
      const h = await open(width, { jsDelay: 8000, delay: 2500 });
      const { page } = h;
      await page.goto(`${BASE}${path}`, { waitUntil: "commit" });
      await page.waitForSelector("#track-order");
      // The first field typed is the one still focused when the app starts.
      await typeBeforeApp(page, [...TRACK_FIELDS].reverse());
      h.releaseJs();
      await appStarted(page, "#track-order");
      await expectDom(page, TRACK_FIELDS, "(after the app started)");
      const focused = await page.evaluate(() => document.activeElement?.id);
      assert.equal(focused, "track-order", "focus stays in the field");
      await h.afterStatus();
      await expectDom(page, TRACK_FIELDS, "(after status)");
      await page.getByRole("button", { name: "Track Order" }).click();
      await waitFor(() => h.sent.track.length === 1, "/api/track");
      assert.deepEqual(h.sent.track[0], {
        order: "#1001",
        email: "driver@example.com",
        website: "",
      });
      await page.getByText("We couldn't find that order").waitFor();
      await expectDom(page, TRACK_FIELDS, "(after the answer)");
      noErrors(trackErrors(h.errors));
      await h.context.close();
    });
  }

  await check(`${width} /track?order=%231001 (email link): email typed before the app starts is kept beside the filled-in number`, async () => {
    const h = await open(width, { jsDelay: 8000, delay: 2500 });
    const { page } = h;
    await page.goto(`${BASE}/track?order=%231001`, { waitUntil: "commit" });
    await page.waitForSelector("#track-email");
    await typeBeforeApp(page, [["#track-email", "driver@example.com"]]);
    h.releaseJs();
    await appStarted(page, "#track-order");
    await h.afterStatus();
    await expectDom(page, TRACK_FIELDS, "(after the app started)");
    await page.getByRole("button", { name: "Track Order" }).click();
    await waitFor(() => h.sent.track.length === 1, "/api/track");
    assert.deepEqual(h.sent.track[0], {
      order: "#1001",
      email: "driver@example.com",
      website: "",
    });
    noErrors(trackErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} /contact, /schedule: typed before the app starts survives hydration`, async () => {
    for (const [path, fields, ready] of [
      [
        "/contact",
        [
          ["#contact-name", "Early Bird"],
          ["#contact-email", "early@example.com"],
          ["#subject-orderquestion", true],
          ["#contact-message", "Typed before the page finished loading."],
        ],
        "#contact-name",
      ],
      ["/schedule", [["#service-tire-rotation", true]], "#service-tire-rotation"],
      // A page query renders fresh: the markup is replaced, the values carried over.
      [
        "/contact?from=footer",
        [
          ["#contact-name", "Fresh Render"],
          ["#contact-message", "Still here after the swap."],
        ],
        "#contact-name",
      ],
    ]) {
      const h = await open(width, { jsDelay: 8000, delay: 2000 });
      const { page } = h;
      await page.goto(`${BASE}${path}`, { waitUntil: "commit" });
      await page.waitForSelector(ready);
      await typeBeforeApp(page, fields);
      h.releaseJs();
      await appStarted(page, ready);
      await h.afterStatus();
      await expectDom(page, fields, `(${path}, after the app started)`);
      noErrors(h.errors);
      await h.context.close();
    }
  });

  /* ---------------- Newsletter sign-up (footer) ---------------- */
  for (const mode of MODES) {
    await check(`${width} footer newsletter sign-up: ${mode} email is kept and sent`, async () => {
      // Status answers late, so the form mounts (and re-renders) after load.
      const h = await open(width, { status: { ...STATUS, newsletter: "on" } });
      const { page } = h;
      await page.goto(`${BASE}/`);
      const form = page.locator('footer [data-testid="newsletter-signup"]');
      await form.waitFor({ state: "attached", timeout: 5000 });
      await form.scrollIntoViewIfNeeded();
      const email = form.locator('input[name="email"]');
      // The field's id comes from useId, so it is found by name instead.
      const sel = 'footer [data-testid="newsletter-signup"] input[name="email"]';
      const button = form.getByRole("button", { name: "Sign up" });
      // A render first: a bad address typed for real shows an error.
      await email.fill("bad");
      await button.click();
      await form.getByText("Enter a valid email address.").waitFor();
      const fields = [[sel, "driver@example.com"]];
      if (mode === "typing") await email.fill("driver@example.com");
      else await fill(page, mode, fields);
      await expectDom(page, fields, `(${mode})`);
      await button.click();
      await waitFor(() => h.sent.newsletter.length === 1, "/api/newsletter");
      // The fill-time token is checked by the spam-guard check at the end.
      const { ft, ...signup } = h.sent.newsletter[0];
      assert.ok(ft, "a fill-time token is sent");
      assert.deepEqual(signup, {
        email: "driver@example.com",
        source: "footer",
        website: "",
      });
      await form.getByText("You're on the list. Watch your inbox.").waitFor();
      noErrors(h.errors);
      await h.context.close();
    });
  }

  /* ---------------- Find My Tires size prefill ---------------- */
  await check(`${width} /find-my-tires: vehicle hand-off and picks prefill the size; a silent size is kept`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    // A vehicle handed over in the address (the vy/vmk/vmd keys the quiz reads).
    await page.goto(`${BASE}/find-my-tires?vy=2020&vmk=Toyota&vmd=Camry`);
    await page.waitForSelector("#quiz-size");
    await h.afterStatus();
    assert.equal(await page.locator("#quiz-size").inputValue(), "215/55R17", "size from the hand-off");
    // Picking a vehicle here fills it in too.
    await page.goto(`${BASE}/find-my-tires`);
    await page.waitForSelector("#quiz-year");
    await page.selectOption("#quiz-year", "2020");
    await page.selectOption("#quiz-make", "Toyota");
    await page.locator("#quiz-model option[value='Camry']").waitFor({ state: "attached" });
    await page.selectOption("#quiz-model", "Camry");
    await sleep(100);
    assert.equal(await page.locator("#quiz-size").inputValue(), "215/55R17", "size from the picks");
    // A size set without events survives a re-render and is what Continue reads.
    await fill(page, "automation", [["#quiz-size", "225/50R17"]]);
    await page.getByRole("button", { name: "I know my tire size" }).click();
    await expectDom(page, [["#quiz-size", "225/50R17"]], "(size mode)");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/q=2/);
    assert.match(page.url(), /size=225%2F50R17/);
    noErrors(h.errors);
    await h.context.close();
  });

  /* ---------------- Vehicle dropdowns: Other, silent picks, fallback ---------------- */

  /** Contact and ship-to-store pickup typed in, landing on the vehicle step. */
  async function checkoutToVehicle(h) {
    const { page } = h;
    await page.goto(`${BASE}/checkout`);
    await page.waitForSelector("#firstName");
    await fill(page, "typing", [
      ["#firstName", "Robin"],
      ["#lastName", "Other"],
      ["#email", "robin@example.com"],
      ["#phone", "9545550177"],
    ]);
    await h.afterStatus();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("#fulfillment-pickup");
    await page.locator("#fulfillment-pickup").check();
    await page.waitForSelector("#date");
    await fill(page, "typing", [
      ["#date", nextWeekday()],
      ["#timeWindow", "10-12"],
    ]);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("#year");
  }

  async function placeCheckout(h) {
    const { page } = h;
    await page.waitForSelector("#agree");
    await page.locator("#agree").check();
    await page.getByRole("button", { name: "Place Order Request" }).click();
    await waitFor(() => h.sent.checkout.length === 1, "/api/checkout");
    return h.sent.checkout[0];
  }

  await check(`${width} /checkout vehicle: select errors, "Other / not listed" model opens a text box and is sent`, async () => {
    const h = await open(width, { cart: CART, delay: 0 });
    const { page } = h;
    await checkoutToVehicle(h);
    const cont = () => page.getByRole("button", { name: "Continue" }).click();

    // Nothing picked: the select-worded errors, tied to their selects.
    await cont();
    await page.getByText("Choose the vehicle year.").waitFor();
    await page.getByText("Choose the make, like Toyota or Ford.").waitFor();
    await page.getByText("Choose the model, like Camry or F-150.").waitFor();
    assert.equal(await page.locator("#year").getAttribute("aria-describedby"), "year-error");
    assert.equal(await page.locator("#year").getAttribute("aria-invalid"), "true");
    // The model waits for a year and make.
    assert.equal(await page.locator("#model").isDisabled(), true, "model waits");

    await page.selectOption("#year", "2019");
    await page.selectOption("#make", "Toyota");
    await page.locator('#model option[value="Tacoma"]').waitFor({ state: "attached" });
    const listed = await page.locator("#model option").allTextContents();
    assert.ok(listed.includes("Tundra") && listed.includes("RAV4"), "NHTSA models listed");
    assert.ok(!listed.includes("Scion xB"), "Scion lives under its own make");
    assert.equal(listed.at(-1), "Other / not listed", "Other is last");

    await page.selectOption("#model", "Other");
    await page.waitForSelector("#model-other");
    await cont();
    await page.getByText("Type the vehicle model.").waitFor();
    assert.equal(await page.locator("#model-other").getAttribute("aria-describedby"), "model-other-error");
    await page.locator("#model-other").fill("Land Cruiser 70");
    await cont();

    await page.waitForSelector("#agree");
    const review = await page.locator("form", { has: page.locator("#agree") }).innerText();
    assert.ok(review.includes("2019 Toyota Land Cruiser 70"), "review shows the typed model");
    // Back: a model not in the list comes back as Other with its text.
    await page.getByRole("button", { name: "Back" }).click();
    await page.waitForSelector("#model-other");
    await expectDom(page, [
      ["#year", "2019"],
      ["#make", "Toyota"],
      ["#model", "Other"],
      ["#model-other", "Land Cruiser 70"],
    ], "(back to vehicle)");
    await cont();
    const order = await placeCheckout(h);
    assert.match(order.notes, /^Vehicle: 2019 Toyota Land Cruiser 70$/m);
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /checkout: an order request that doesn't reach the shop keeps the cart and says so, and a retry sends it`, async () => {
    const h = await open(width, { cart: CART, delay: 0 });
    const { page } = h;
    // The shop's API is unreachable for the first send (registered after
    // the harness's handler, so it answers first), then back.
    let down = true;
    await page.route("**/api/checkout", async (route) => {
      if (!down) return route.fallback();
      h.sent.checkout.push(JSON.parse(route.request().postData() || "{}"));
      await route.abort("connectionrefused");
    });
    await checkoutToVehicle(h);
    await page.selectOption("#year", "2019");
    await page.selectOption("#make", "Toyota");
    await page.locator('#model option[value="Tacoma"]').waitFor({ state: "attached" });
    await page.selectOption("#model", "Tacoma");
    await page.getByRole("button", { name: "Continue" }).click();
    await placeCheckout(h);

    const alert = page.getByRole("alert").filter({ hasText: "didn't reach the shop" });
    await alert.waitFor();
    assert.match(await alert.innerText(), /nothing has been charged/);
    assert.ok(await alert.locator('a[href^="tel:"]').count() === 1, "the phone number");
    assert.equal(await page.getByText("Finish this by phone").count(), 0, "no confirmation screen");
    const kept = JSON.parse(await page.evaluate(() => localStorage.getItem("tiredrop.cart.v1")));
    assert.equal(kept?.lines?.length, CART.lines.length, "the cart is kept");
    assert.equal(await page.locator("#agree").count(), 1, "still on the review step");

    // Back up: the same button sends it, and only then is the cart emptied.
    down = false;
    await page.getByRole("button", { name: "Place Order Request" }).click();
    await waitFor(() => h.sent.checkout.length === 2, "/api/checkout retry");
    await page.getByText("Your order request is in").waitFor();
    await page.waitForFunction(() => {
      const c = JSON.parse(localStorage.getItem("tiredrop.cart.v1") || "null");
      return Array.isArray(c?.lines) && c.lines.length === 0;
    });
    noErrors(h.errors.filter((e) => !/ERR_CONNECTION_REFUSED|Failed to load resource/.test(e)));
    await h.context.close();
  });

  await check(`${width} /checkout vehicle: silent picks of "Other" (year and make) and silent text are kept and sent`, async () => {
    const h = await open(width, { cart: CART, delay: 0 });
    const { page } = h;
    await checkoutToVehicle(h);

    // select.value set with no events, then a real keystroke re-renders.
    await fill(page, "automation", [
      ["#year", "Other"],
      ["#make", "Other"],
    ]);
    await page.locator("#trim").pressSequentially("Reg");
    await page.waitForSelector("#year-other");
    await page.waitForSelector("#make-other");
    // An "Other" make has no model list: the model is a text box.
    assert.equal(await page.locator("#model").evaluate((n) => n.tagName), "INPUT");
    await fill(page, "automation", [
      ["#year-other", "1978"],
      ["#make-other", "Studebaker"],
      ["#model", "Lark"],
    ]);
    await page.locator("#trim").pressSequentially("al");
    await sleep(150);
    await expectDom(page, [
      ["#year", "Other"],
      ["#year-other", "1978"],
      ["#make", "Other"],
      ["#make-other", "Studebaker"],
      ["#model", "Lark"],
      ["#trim", "Regal"],
    ], "(silent Other)");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("#agree");
    const order = await placeCheckout(h);
    assert.match(order.notes, /^Vehicle: 1978 Studebaker Lark Regal$/m);
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} vehicle: NHTSA down falls back to the size table; the hero's vehicle prefills /schedule`, async () => {
    const h = await open(width, { delay: 0, vpicDown: true });
    const { page } = h;
    await page.goto(`${BASE}/`);
    await page.waitForSelector("#finder-year");
    await page.selectOption("#finder-year", "2019");
    await page.selectOption("#finder-make", "Toyota");
    await finderModelReady(page);
    // Said plainly, with the size-table models still offered.
    assert.equal(
      await page.locator('[data-testid="finder-model-note"]').innerText(),
      "Couldn’t load models. Type your model or enter your door-jamb size.",
    );
    await page.locator("#finder-model").click();
    assert.deepEqual(
      await finderOptions(page),
      ["4Runner", "Camry", "Corolla", "Highlander", "RAV4", "Tacoma"],
      "size-table models",
    );
    await page.locator("#finder-model").press("Escape");
    assert.deepEqual(await finderOptions(page), [], "Escape closes the list");
    // "enter your door-jamb size" goes to the size tab; the vehicle stays.
    await page.getByRole("button", { name: "enter your door-jamb size" }).click();
    await page.waitForSelector("#finder-width");
    await page.getByRole("tab", { name: "Shop by Vehicle" }).click();
    assert.equal(await page.inputValue("#finder-make"), "Toyota");
    await pickFinderModel(page, "Tacoma", "tac");
    await page.getByRole("button", { name: "Find Tires" }).click();
    // The hero goes straight to the tire list, at the address /tires writes.
    await page.waitForURL(/\/tires\?year=2019&make=toyota&model=tacoma$/);

    await page.goto(`${BASE}/schedule?service=tire-installation`);
    await page.getByRole("button", { name: /^Next:/ }).click();
    await page.waitForSelector("#year");
    await modelsLoaded(page);
    await expectDom(page, [
      ["#year", "2019"],
      ["#make", "Toyota"],
      ["#model", "Tacoma"],
    ], "(prefilled from the hero)");
    const listed = await page.locator("#model option").allTextContents();
    assert.deepEqual(
      listed,
      ["Select model", "4Runner", "Camry", "Corolla", "Highlander", "RAV4", "Tacoma", "Other / not listed"],
      "size-table models plus Other",
    );
    await page.getByText("We couldn’t load the full model list.").waitFor();
    // The prefilled vehicle passes the step.
    await page.getByRole("button", { name: /^Next:/ }).click();
    await page.waitForSelector("#address, #date");
    // Only the vPIC outage itself may log.
    noErrors(h.errors.filter((e) => !/Failed to load resource/.test(e)));
    await h.context.close();
  });

  /* ------------- Install booking for a paid order (/schedule?order=) ------------- */

  /** Answers /api/track with `body` (and records what was asked). */
  async function mockTrack(page, body) {
    const asked = [];
    await page.route("**/api/track", async (route) => {
      asked.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({ json: body });
    });
    return asked;
  }

  const PAID_STORE_ORDER = {
    name: "#1002",
    createdAt: "2026-09-20T15:04:00Z",
    cancelled: false,
    financialStatus: "paid",
    fulfillmentStatus: "unfulfilled",
    delivery: "ship-to-store",
    lines: [{ title: "Michelin Defender2 215/55R17", quantity: 4 }],
    tracking: [],
    supplier: null,
  };

  /** Steps 1 to 5 of a booking whose service and place are already set. */
  async function bookThroughToContact(page, date) {
    const next = () => page.getByRole("button", { name: /^Next:/ }).click();
    await next();
    await page.waitForSelector("#year");
    return {
      next,
      async toContact() {
        await next();
        // Installed at the shop: step 3 has no address to fill.
        await page.waitForSelector("#locationType");
        assert.equal(await page.locator("#address").count(), 0, "a paid store order books an in-shop install");
        await next();
        await page.waitForSelector("#date");
        await fill(page, "typing", [["#date", date], ["#window-10-12pm", true]]);
        await next();
        await page.waitForSelector("#name");
      },
    };
  }

  await check(`${width} /schedule?order=: a bare link shows the order read-only, fills in nobody's details, and sends the order`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    // Personal details in the query string must be ignored.
    await page.goto(
      `${BASE}/schedule?order=TD-260929-ABC234&name=Mallory&email=evil%40example.com&phone=9545550000&year=1999&make=Evil&model=Car`,
    );
    await page.waitForSelector("#booking-order");
    assert.equal(await page.inputValue("#booking-order"), "TD-260929-ABC234");
    assert.equal(await page.locator("#booking-order").evaluate((el) => el.readOnly), true, "read-only");
    await expectDom(page, [["#service-tire-installation", true]], "(install preselected)");
    await h.afterStatus();

    const flow = await bookThroughToContact(page, nextWeekday());
    await expectDom(page, [["#year", ""], ["#make", ""]], "(no vehicle from the URL)");
    const vehicle = await fillVehicle(page, "typing", { year: "2020", make: "Toyota", model: "Camry" }, [
      ["#tireSize", "215/55"],
      ["#tireSize", "R17"],
    ]);
    await expectDom(page, vehicle, "(typed vehicle)");
    await flow.toContact();
    await expectDom(page, [["#name", ""], ["#phone", ""], ["#email", ""]], "(no contact from the URL)");
    await fill(page, "typing", [["#name", "Sam Buyer"], ["#phone", "9545550134"], ["#email", "sam@example.com"]]);
    await page.getByText("Paid order", { exact: true }).first().waitFor();
    await page.getByRole("button", { name: "Request appointment" }).click();
    await waitFor(() => h.sent.forms.length === 1, "/api/forms");
    assertIncludes(h.sent.forms[0], {
      form: "booking",
      order: "TD-260929-ABC234",
      service: "tire-installation",
      locationType: "shop",
      name: "Sam Buyer",
      email: "sam@example.com",
      phone: "9545550134",
      year: "2020",
      make: "Toyota",
      model: "Camry",
    }, "booking with order");
    assert.ok(!JSON.stringify(h.sent.forms[0]).includes("Mallory"), "nothing from the query string but the order");
    await page.getByText("TD-260929-ABC234").first().waitFor();
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /schedule?order=: an order that already has an install request says so and shows it`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.route("**/api/forms", async (route) => {
      h.sent.forms.push(JSON.parse(route.request().postData() || "{}"));
      await route.fulfill({
        json: {
          ok: true,
          booking: { day: "2026-10-06", window: "2-4pm", dayLabel: "Tuesday, October 6, 2026", windowLabel: "2:00 – 4:00 PM", notes: "", alreadyBooked: true },
        },
      });
    });
    await page.goto(`${BASE}/schedule?order=1002`);
    await page.waitForSelector("#booking-order");
    const flow = await bookThroughToContact(page, nextWeekday());
    await fillVehicle(page, "typing", { year: "2020", make: "Toyota", model: "Camry" }, [["#tireSize", "215/55"], ["#tireSize", "R17"]]);
    await flow.toContact();
    await fill(page, "typing", [["#name", "Sam Buyer"], ["#phone", "9545550134"], ["#email", "buyer@example.com"]]);
    await page.getByRole("button", { name: "Request appointment" }).click();
    const existing = page.locator('[data-testid="booking-existing"]');
    await existing.waitFor();
    assert.match((await existing.innerText()).replace(/\s+/g, " "), /already has an install request in: Tuesday, October 6, 2026, 2:00 – 4:00 PM/);
    assert.equal(h.sent.forms[0].order, "#1002");
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /schedule?order=: a malformed order is ignored and never sent`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.goto(`${BASE}/schedule?order=%3Cscript%3E1%3C%2Fscript%3E`);
    await page.waitForSelector("#service-tire-installation");
    assert.equal(await page.locator("#booking-order").count(), 0);
    noErrors(h.errors);
    await h.context.close();
  });

  const INTERNAL_BOOKING = {
    mode: "internal",
    ref: "TD-260920-ABCDEF",
    path: "/schedule?order=TD-260920-ABCDEF",
    install: "shop",
    prefill: { name: "Buyer Person", email: "buyer@example.com", phone: "+19545550199", vehicle: "2020 Toyota Camry" },
  };

  /** Answers /api/book-install with `answer` after `delay` (and records what was sent). */
  async function mockBookInstall(page, { delay = 0, status = 200, answer = null } = {}) {
    const sent = [];
    await page.route("**/api/book-install", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      sent.push(body);
      judge("book-install", body);
      await sleep(delay);
      await route.fulfill({
        status,
        json: answer ?? {
          ok: true,
          alreadyBooked: false,
          booking: { day: body.day, window: body.window, dayLabel: "Friday, October 9, 2026", windowLabel: "10:00 AM – 12:00 PM", notes: body.notes },
        },
      });
    });
    return sent;
  }

  /** /track, looked up, with the paid order's booking panel on screen. */
  async function openPanel(h, booking = INTERNAL_BOOKING) {
    const { page } = h;
    const asked = await mockTrack(page, { found: true, kind: "order", order: { ...PAID_STORE_ORDER, booking } });
    await page.goto(`${BASE}/track?order=%231002`);
    await page.waitForSelector("#track-order");
    await fill(page, "typing", [["#track-email", "buyer@example.com"]]);
    await page.getByRole("button", { name: "Track Order" }).click();
    await page.locator('[data-testid="schedule-install"], [data-testid="install-requested"]').first().waitFor();
    assert.deepEqual(asked, [{ order: "#1002", email: "buyer@example.com", website: "" }]);
    return asked;
  }

  for (const mode of MODES) {
    await check(`${width} /track booking panel: ${mode} day, window and notes survive a late status and a slow answer, and are sent`, async () => {
      const h = await open(width);
      const { page } = h;
      const booked = await mockBookInstall(page, { delay: 1200 });
      await openPanel(h);
      assert.equal(await page.locator("#install-day").count(), 1, "the inline form, not a link away");
      assert.equal(await page.getByRole("link", { name: "Schedule your install" }).count(), 0);
      const day = nextWeekday();
      const when = [
        ["#install-day", day],
        ["#install-window-10-12pm", true],
      ];
      await fill(page, mode, when);
      await h.afterStatus();
      // Real keystrokes in the notes: more renders over the filled values.
      await page.locator("#install-notes").pressSequentially("Locking lugs");
      await expectDom(page, [...when, ["#install-notes", "Locking lugs"]], `(${mode} panel)`);

      await page.getByRole("button", { name: "Request this day and window" }).click();
      await page.getByRole("button", { name: "Sending…" }).waitFor();
      await expectDom(page, [...when, ["#install-notes", "Locking lugs"]], "(while sending)");
      await waitFor(() => booked.length === 1, "/api/book-install");
      // The fill-time token is checked by the spam-guard check at the end.
      const { ft, ...sentFields } = booked[0];
      assert.ok(ft, "a fill-time token is sent");
      assert.deepEqual(sentFields, {
        order: "#1002",
        email: "buyer@example.com",
        day,
        window: "10-12pm",
        notes: "Locking lugs",
        website: "",
      });
      const done = page.locator('[data-testid="install-requested"]');
      await done.waitFor();
      const text = (await done.innerText()).replace(/\s+/g, " ");
      assert.match(
        text,
        /Your install request is in: Friday, October 9, 2026, 10:00 AM – 12:00 PM\. Extreme Tires, 7712 West Oakland Park Blvd, Sunrise, FL 33351 · \(954\) 773-1896\. We confirm the exact time with you before then\./,
      );
      assert.doesNotMatch(text, /\b(safe|OK|fine|guarantee|discount)\b/i);
      assert.equal(await page.locator("#install-day").count(), 0, "the form is gone");
      noErrors(h.errors);
      await h.context.close();
    });
  }

  await check(`${width} /track booking panel: a failed booking keeps what was typed and says it is not in`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    const booked = await mockBookInstall(page, { status: 502, answer: { error: "We couldn't save your install request just now, so it is not in yet." } });
    await openPanel(h);
    const day = nextWeekday();
    const typed = [
      ["#install-day", day],
      ["#install-window-2-4pm", true],
      ["#install-notes", "Call before noon"],
    ];
    await fill(page, "typing", typed);
    await page.getByRole("button", { name: "Request this day and window" }).click();
    await waitFor(() => booked.length === 1, "/api/book-install");
    await page.getByText(/not in yet/).waitFor();
    assert.equal(await page.locator('[data-testid="install-requested"]').count(), 0, "no confirmation");
    await expectDom(page, typed, "(after the failure)");
    // A day refused by the server (400 naming the field) shows on that field; the rest stays.
    await page.unroute("**/api/book-install");
    await mockBookInstall(page, { status: 400, answer: { error: "We are closed Sunday. Pick Monday through Saturday.", field: "day" } });
    await page.getByRole("button", { name: "Request this day and window" }).click();
    await page.locator("#install-day-error").waitFor();
    await expectDom(page, typed, "(after a 400)");
    noErrors(h.errors.filter((e) => !/status of (400|502)/.test(e)));
    await h.context.close();
  });

  await check(`${width} /track booking panel: the day and window are checked on the page first (Sunday, Saturday 4 – 6 PM, missing)`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    const booked = await mockBookInstall(page);
    await openPanel(h);
    await page.getByRole("button", { name: "Request this day and window" }).click();
    await page.locator("#install-day-error").waitFor();
    assert.match(await page.locator("#install-day-error").innerText(), /Pick the day/);
    // A Sunday a week or more out.
    const d = new Date();
    d.setDate(d.getDate() + 7);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    await fill(page, "typing", [["#install-day", isoLocal(d)], ["#install-window-8-10am", true]]);
    await page.getByRole("button", { name: "Request this day and window" }).click();
    await page.getByText("We are closed Sunday. Pick Monday through Saturday.").waitFor();
    // The Saturday after it: 4 – 6 PM is not offered.
    d.setDate(d.getDate() + 6);
    await fill(page, "typing", [["#install-day", isoLocal(d)]]);
    assert.equal(await page.locator("#install-window-4-6pm").isDisabled(), true);
    assert.equal(booked.length, 0, "nothing sent");
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /track: a booked order shows the requested day and window, not the form`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await openPanel(h, {
      mode: "booked",
      ref: "TD-260920-ABCDEF",
      install: "shop",
      booking: { day: "2026-10-06", window: "2-4pm", dayLabel: "Tuesday, October 6, 2026", windowLabel: "2:00 – 4:00 PM", notes: "" },
    });
    const text = (await page.locator('[data-testid="install-requested"]').innerText()).replace(/\s+/g, " ");
    assert.match(text, /Your install request is in: Tuesday, October 6, 2026, 2:00 – 4:00 PM\./);
    assert.match(text, /We confirm the exact time with you before then\./);
    assert.equal(await page.locator("#install-day").count(), 0);
    assert.equal(await page.locator('[data-testid="schedule-install"]').count(), 0);
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /track → Schedule your install with INSTALL_BOOKING_URL opens the shop's own link`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    const url = "https://book.example.com/td?ref=TD-260920-ABCDEF&n=Buyer%20Person";
    await mockTrack(page, { found: true, kind: "order", order: { ...PAID_STORE_ORDER, booking: { mode: "external", url } } });
    await page.goto(`${BASE}/track`);
    await fill(page, "typing", [["#track-order", "1002"], ["#track-email", "buyer@example.com"]]);
    await page.getByRole("button", { name: "Track Order" }).click();
    const cta = page.getByRole("link", { name: "Schedule your install" });
    await cta.waitFor();
    assert.equal(await cta.getAttribute("href"), url);
    assert.equal(await cta.getAttribute("target"), "_blank");
    assert.match(await cta.getAttribute("rel"), /noopener/);
    assert.equal(await page.locator("#install-day").count(), 0, "only the external link, no inline form");
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /track: no Schedule your install for an unpaid request or a shipped order`, async () => {
    for (const body of [
      {
        found: true,
        kind: "request",
        request: { ref: "TD-260929-HJK234", createdAt: "2026-09-29T13:00:00Z", status: "open", orderName: null, delivery: "ship-to-store", lines: [] },
      },
      { found: true, kind: "order", order: { ...PAID_STORE_ORDER, delivery: "ship" } },
    ]) {
      const h = await open(width, { delay: 0 });
      const { page } = h;
      await mockTrack(page, body);
      await page.goto(`${BASE}/track`);
      await fill(page, "typing", [["#track-order", body.kind === "request" ? "TD-260929-HJK234" : "1002"], ["#track-email", "buyer@example.com"]]);
      await page.getByRole("button", { name: "Track Order" }).click();
      await page.locator('[role="status"]').first().waitFor();
      assert.equal(await page.locator('[data-testid="schedule-install"]').count(), 0, body.kind);
      noErrors(h.errors);
      await h.context.close();
    }
  });
  /* ---------------- Fitment: badges, no Add on won't-fit, Compare ---------------- */

  const F150 = { type: "vehicle", year: "2019", make: "Ford", model: "F-150" };
  const FITS = "continental-terraincontact-at-265-70r17"; // 265/70R17, the 2019 F-150's size
  const NO_FIT = "nitto-ridge-grappler-285-70r17"; // 285/70R17

  /** Seeds what is being shopped for (and a cart / compare list) once per context. */
  async function seedFitment(page, { selection = null, cart = null, compare = null } = {}) {
    await page.addInitScript(
      ({ selection, cart, compare }) => {
        if (sessionStorage.getItem("fit-seeded")) return;
        sessionStorage.setItem("fit-seeded", "1");
        if (selection) {
          localStorage.setItem("tiredrop.fitment.v1", JSON.stringify(selection));
          if (selection.type === "vehicle") {
            const { year, make, model } = selection;
            localStorage.setItem("tiredrop.vehicle.v1", JSON.stringify({ year, make, model }));
          }
        }
        if (cart) localStorage.setItem("tiredrop.cart.v1", JSON.stringify(cart));
        if (compare) localStorage.setItem("tiredrop.compare.v1", JSON.stringify(compare));
      },
      { selection, cart, compare },
    );
  }

  // A vehicle or size search asks /api/tires, which the harness answers
  // with a bare 404 (no API: the sample catalog answers). The browser logs
  // that 404; nothing else may.
  const fitErrors = (errors) => errors.filter((e) => !/status of 404/.test(e));

  /** The product card for a catalog slug. */
  const card = (page, slug) =>
    page.locator("article", { has: page.locator(`a[href="/tires/${slug}"]`) }).first();
  const addOnCard = (page, slug) => card(page, slug).getByRole("button", { name: /^Add a set of 4/ });
  const shoppingFor = (page) => page.locator('[data-testid="shopping-for-text"]');

  await check(`${width} fitment: no vehicle → every card says Check fitment and keeps its Add button`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.goto(`${BASE}/tires`);
    await page.locator('[data-testid="card-fit"]').first().waitFor();
    const cards = await page.locator("article:has([data-testid='card-fit'])").count();
    const adds = await page.getByRole("button", { name: /^Add a set of 4/ }).count();
    assert.ok(cards >= 10, `cards with a fitment line: ${cards}`);
    assert.equal(adds, cards, "never blocked without a vehicle");
    const texts = await page.locator('[data-testid="card-fit"]').allInnerTexts();
    assert.ok(texts.every((t) => /Check fitment/.test(t)), texts.join(" | "));
    assert.match(await shoppingFor(page).innerText(), /no vehicle picked yet/);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: 2019 F-150 on /tires — vehicle only never blocks; a door-jamb size does; year-aware change; clear`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await seedFitment(page, { selection: F150 });
    await page.goto(`${BASE}/tires`);
    await page.waitForFunction(() => /2019 Ford F-150 \(265\/70R17\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));

    // Vehicle only: the typical size is said to be typical, never "Fits".
    assert.match(await card(page, FITS).locator("[data-fit]").innerText(), /Matches the typical factory size for a 2019 Ford F-150/);
    assert.equal(await addOnCard(page, FITS).count(), 1, "Add shown for the typical size");
    assert.equal(await card(page, FITS).locator('[data-fit="fits"]').count(), 1);
    // Any other size: Check fitment, and Add stays (trims and wheels vary).
    assert.match(await card(page, NO_FIT).locator("[data-fit]").innerText(), /^Check fitment$/);
    assert.equal(await card(page, NO_FIT).locator('[data-fit="check"]').count(), 1);
    assert.equal(await addOnCard(page, NO_FIT).count(), 1, "a non-typical size with a vehicle only keeps Add");
    assert.equal(await page.getByText(/Doesn't fit/).count(), 0, "nothing is called a won't-fit on a model-level guess");
    await page.getByRole("heading", { name: "In the size for your 2019 Ford F-150" }).waitFor();

    // Door-jamb sticker size, right by the bar: now a different size blocks.
    const bar = page.locator('[data-testid="shopping-for"]');
    await bar.getByRole("button", { name: "Know your exact size? Enter it from your door-jamb sticker" }).click();
    await page.locator("#sticker-front").fill("265/70R17");
    await page.getByRole("button", { name: "Save my size" }).click();
    await page.waitForFunction(() => /2019 Ford F-150 · 265\/70R17/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    assert.deepEqual(
      JSON.parse(await page.evaluate(() => localStorage.getItem("tiredrop.fitment.v1"))),
      { v: 1, type: "vehicle", year: "2019", make: "Ford", model: "F-150", size: "265/70R17" },
    );
    assert.match(await card(page, FITS).locator("[data-fit]").innerText(), /Matches your size \(265\/70R17\)/);
    assert.match(await card(page, NO_FIT).locator("[data-fit]").innerText(), /Doesn't fit your 2019 Ford F-150/);
    assert.equal(await addOnCard(page, NO_FIT).count(), 0, "no Add on a tire that misses the confirmed size");
    assert.equal(
      await card(page, NO_FIT).getByRole("link", { name: "See tires that fit" }).getAttribute("href"),
      "/tires?w=265&a=70&d=17",
    );

    // Change to a 2009 F-150: that generation is 235/75R17, and a new
    // vehicle drops the sticker size, so nothing is blocked again. On
    // /tires, Change reopens the finder Shop Tires showed first, prefilled.
    await bar.getByRole("button", { name: "Change" }).click();
    await page.waitForSelector("#finder-year");
    assert.equal(await page.inputValue("#finder-model"), "F-150");
    await page.selectOption("#finder-year", "2009");
    await page.selectOption("#finder-make", "Ford");
    await pickFinderModel(page, "F-150", "f15");
    await page.getByRole("button", { name: "Find Tires" }).click();
    await page.waitForFunction(() => /2009 Ford F-150 \(235\/75R17\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    assert.match(await card(page, FITS).locator("[data-fit]").innerText(), /^Check fitment$/);
    assert.equal(await addOnCard(page, FITS).count(), 1);

    // Shopping for a different car? clears it: everything can be added again.
    await page.getByRole("button", { name: "Shopping for a different car?" }).first().click();
    await page.waitForFunction(() => /no vehicle picked yet/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    assert.equal(await addOnCard(page, NO_FIT).count(), 1);
    assert.equal(await page.evaluate(() => localStorage.getItem("tiredrop.fitment.v1")), null);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: a model with no size on file (2021 BMW 4 Series, Audi Q5, a typed Audi) — the full list, type to filter, results say Check fitment`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.goto(`${BASE}/tires`);
    await page.waitForSelector("#finder-year");
    // The full lists: every model year and make, not the catalog's 2005-2026 and 10 makes.
    const years = await page.locator("#finder-year option").allInnerTexts();
    assert.ok(years.includes("1995") && years.includes("2027"), "years 1981-2027");
    await page.selectOption("#finder-year", "2021");
    const makes = await page.locator("#finder-make option").allInnerTexts();
    assert.ok(makes.includes("Audi") && makes.includes("Tesla") && makes.includes("Subaru"), "every make sold in 2021");
    await page.selectOption("#finder-make", "BMW");
    await finderModelReady(page);
    await page.locator("#finder-model").click();
    const all = await finderOptions(page);
    assert.equal(all.length, 28, `every BMW model vPIC lists: ${all.join(", ")}`);
    for (const m of ["3 Series", "4 Series", "5 Series", "M3", "X3", "X5", "X7", "Z4", "i4"]) {
      assert.ok(all.includes(m), m);
    }
    // Type to filter; Enter takes the best match.
    await page.locator("#finder-model").fill("4 ser");
    assert.deepEqual(await finderOptions(page), ["4 Series"]);
    await page.locator("#finder-model").press("Enter");
    assert.equal(await page.inputValue("#finder-model"), "4 Series");
    assert.deepEqual(await finderOptions(page), [], "the list closes on a pick");
    await page.getByRole("button", { name: "Find Tires" }).click();

    await page.waitForFunction(() => /2021 BMW 4 Series \(factory size not on file\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    await page.waitForFunction(() => /make=bmw&model=4\+series/.test(location.search));
    const bar = page.locator('[data-testid="shopping-for"]');
    await bar.getByText("We don’t have the factory size for this one on file.").waitFor();
    await bar.getByRole("button", { name: "Know your exact size? Enter it from your door-jamb sticker" }).waitFor();
    const everyCardChecks = async (label) => {
      await page.locator('[data-testid="card-fit"]').first().waitFor();
      const texts = await page.locator('[data-testid="card-fit"]').allInnerTexts();
      assert.ok(texts.length >= 10, `${label}: ${texts.length} cards`);
      assert.ok(texts.every((t) => /Check fitment/.test(t)), `${label}: ${texts.join(" | ")}`);
      const adds = await page.getByRole("button", { name: /^Add a set of 4/ }).count();
      assert.equal(adds, texts.length, `${label}: a vehicle alone never blocks`);
      assert.equal(await page.getByText(/Doesn't fit/).count(), 0);
    };
    await everyCardChecks("BMW 4 Series");

    // Change: the finder comes back prefilled with the full lists; an Audi.
    await bar.getByRole("button", { name: "Change", exact: true }).click();
    await finderModelReady(page);
    assert.equal(await page.inputValue("#finder-model"), "4 Series");
    await page.selectOption("#finder-make", "Audi");
    await finderModelReady(page);
    assert.equal(await page.inputValue("#finder-model"), "", "a new make clears the model");
    await page.locator("#finder-model").fill("q5");
    assert.deepEqual(await finderOptions(page), ["Q5", "SQ5"], "starts-with first");
    await page.locator("#finder-model").press("ArrowDown");
    await page.locator("#finder-model").press("Enter");
    assert.equal(await page.inputValue("#finder-model"), "SQ5", "Down then Enter takes the next one");
    await pickFinderModel(page, "Q5", "Q");
    await page.getByRole("button", { name: "Find Tires" }).click();
    await page.waitForFunction(() => /2021 Audi Q5 \(factory size not on file\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    await everyCardChecks("Audi Q5");

    // A model the list does not carry can be typed; it is sent as typed.
    await bar.getByRole("button", { name: "Change", exact: true }).click();
    await finderModelReady(page);
    await page.locator("#finder-model").fill("S4 Avant");
    assert.deepEqual(await finderOptions(page), []);
    await page.getByRole("button", { name: "Find Tires" }).click();
    await page.waitForFunction(() => /2021 Audi S4 Avant \(factory size not on file\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    assert.deepEqual(
      JSON.parse(await page.evaluate(() => localStorage.getItem("tiredrop.fitment.v1"))),
      { v: 1, type: "vehicle", year: "2021", make: "Audi", model: "S4 Avant" },
    );
    await everyCardChecks("Audi S4 Avant");
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: models can't load on /tires — said plainly; type the model, or enter the door-jamb size in the bar`, async () => {
    const h = await open(width, { delay: 0, vpicDown: true });
    const { page } = h;
    await page.goto(`${BASE}/tires`);
    await page.waitForSelector("#finder-year");
    await page.selectOption("#finder-year", "2019");
    await page.selectOption("#finder-make", "Audi");
    await finderModelReady(page);
    assert.equal(await page.locator("#finder-model").getAttribute("placeholder"), "Type your model");
    const note = page.locator('[data-testid="finder-model-note"]');
    assert.equal(await note.innerText(), "Couldn’t load models. Type your model or enter your door-jamb size.");
    assert.equal(await page.locator("#finder-model").getAttribute("aria-describedby"), "finder-model-note");
    // The door-jamb size: the Shopping-for bar's front/rear form opens.
    await note.getByRole("button", { name: "enter your door-jamb size" }).click();
    await page.locator("#sticker-front").fill("245/40R18");
    await page.getByRole("button", { name: "Save my size" }).click();
    await page.waitForFunction(() => /Shopping for size 245\/40R18/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    // Or the model, typed: results, every other size "Check fitment".
    await page.locator('[data-testid="shopping-for"]').getByRole("button", { name: "Change", exact: true }).click();
    await page.getByRole("tab", { name: "Shop by Vehicle" }).click();
    await page.selectOption("#finder-year", "2019");
    await page.selectOption("#finder-make", "Audi");
    await finderModelReady(page);
    await page.locator("#finder-model").fill("A4");
    await page.getByRole("button", { name: "Find Tires" }).click();
    await page.waitForFunction(() => /2019 Audi A4 \(factory size not on file\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    const texts = await page.locator('[data-testid="card-fit"]').allInnerTexts();
    assert.ok(texts.length >= 10 && texts.every((t) => /Check fitment/.test(t)), texts.join(" | "));
    // Only the outage itself may log.
    noErrors(h.errors.filter((e) => !/Failed to load resource|status of 404/.test(e)));
    await h.context.close();
  });

  await check(`${width} fitment: staggered door-jamb sizes — per-axle answers, the 2 + 2 note, both remembered`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await seedFitment(page, { selection: { type: "vehicle", year: "2019", make: "BMW", model: "3 Series" } });
    await page.goto(`${BASE}/tires`);
    await page.waitForFunction(() => /2019 BMW 3 Series \(225\/45R18\)/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    const REAR = "pirelli-p-zero-pz4-255-35r19"; // 255/35R19
    const TYPICAL = "pirelli-cinturato-p7-all-season-plus-3-225-45r18"; // 225/45R18
    // An M340i owner's real rear size is not blocked on the model's guess.
    assert.match(await card(page, REAR).locator("[data-fit]").innerText(), /^Check fitment$/);
    assert.equal(await addOnCard(page, REAR).count(), 1);

    await page.getByRole("button", { name: "Know your exact size? Enter it from your door-jamb sticker" }).click();
    await page.locator("#sticker-front").fill("225/40r19");
    await page.locator("#sticker-rear").fill("255/35R19");
    await page.getByRole("button", { name: "Save my size" }).click();
    await page.waitForFunction(() => /2019 BMW 3 Series · front 225\/40R19, rear 255\/35R19/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    assert.match(await page.locator('[data-testid="staggered-note"]').innerText(), /Staggered: you'll need 2 front \+ 2 rear\./);
    assert.match(await card(page, REAR).locator("[data-fit]").innerText(), /Fits your rear axle \(255\/35R19\)/);
    assert.equal(await addOnCard(page, REAR).count(), 1, "the set-of-4 Add stays as it is");
    assert.match(await card(page, TYPICAL).locator("[data-fit]").innerText(), /Doesn't fit your 2019 BMW 3 Series/);
    assert.equal(await addOnCard(page, TYPICAL).count(), 0);

    // Both sizes survive a reload, with the vehicle name.
    await page.reload();
    await page.waitForFunction(() => /2019 BMW 3 Series · front 225\/40R19, rear 255\/35R19/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem("tiredrop.fitment.v1")));
    assert.equal(saved.size, "225/40R19");
    assert.equal(saved.rear, "255/35R19");

    // The product page says which axle, with the note.
    await page.goto(`${BASE}/tires/${REAR}`);
    const panel = page.locator('[data-testid="fit-panel"]');
    await panel.waitFor();
    assert.match(await panel.innerText(), /Fits your rear axle \(255\/35R19\)/);
    assert.match(await panel.innerText(), /Staggered: you'll need 2 front \+ 2 rear\./);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: product pages — vehicle only keeps Add to Cart; a sticker size blocks a miss (with See tires that fit, Change, different car)`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await seedFitment(page, { selection: F150 });
    await page.goto(`${BASE}/tires/${FITS}`);
    const panel = page.locator('[data-testid="fit-panel"]');
    await panel.waitFor();
    assert.match(await panel.innerText(), /Matches the typical factory size for a 2019 Ford F-150/);
    assert.match(await panel.innerText(), /Matches the typical factory size on file for a 2019 Ford F-150 \(265\/70R17\)/);
    assert.match(await panel.innerText(), /We confirm fitment before your order ships\./);
    assert.equal(await page.getByRole("button", { name: "Add to Cart", exact: true }).count(), 1);

    // Vehicle only, another size: Check fitment, the typical size named, Add kept.
    await page.goto(`${BASE}/tires/${NO_FIT}`);
    await panel.waitFor();
    assert.match(await panel.innerText(), /Check fitment/);
    assert.match(await panel.innerText(), /Your 2019 Ford F-150 may use a different size by trim or wheel\. Typical: 265\/70R17\. Check the sticker on your driver's door jamb\./);
    assert.equal(await page.getByRole("button", { name: "Add to Cart", exact: true }).count(), 1, "Add kept on a model-level guess");
    await panel.getByRole("button", { name: "Enter the size from your door-jamb sticker" }).click();
    await page.locator("#sticker-front").fill("265/70R17");
    await page.getByRole("button", { name: "Save my size" }).click();

    // Confirmed: now it is a won't-fit.
    await page.waitForFunction(() => /Doesn't fit your 2019 Ford F-150/.test(document.querySelector('[data-testid="fit-panel"]')?.textContent ?? ""));
    assert.equal(await page.getByRole("button", { name: /^Add to cart$/i }).count(), 0, "no Add to Cart anywhere");
    await page.locator('[data-testid="no-add"]').waitFor();
    assert.equal(await panel.getByRole("link", { name: "See tires that fit" }).getAttribute("href"), "/tires?w=265&a=70&d=17");
    await panel.getByRole("button", { name: "Not your vehicle? Change it" }).click();
    await page.locator('[data-testid="fit-changer"]').waitFor();
    await panel.getByRole("button", { name: "Shopping for a different car?" }).click();
    await page.waitForFunction(() => /no vehicle picked yet/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    // (The phone's sticky buy bar may be up too, by now.)
    assert.ok(await page.getByRole("button", { name: /^Add to cart$/i }).count() >= 1, "back once nothing is chosen");
    assert.match(await panel.innerText(), /Check fitment/);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: size-only — Add only on that size`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await seedFitment(page, { selection: { type: "size", size: "225/45R17" } });
    await page.goto(`${BASE}/tires`);
    await page.waitForFunction(() => /Shopping for size 225\/45R17/.test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""));
    const yes = "continental-vikingcontact-7-225-45r17";
    const no = "continental-purecontact-ls-225-50r17";
    assert.equal(await addOnCard(page, yes).count(), 1);
    assert.match(await card(page, yes).locator("[data-fit]").innerText(), /Matches your size \(225\/45R17\)/);
    assert.equal(await addOnCard(page, no).count(), 0);
    assert.match(await card(page, no).locator("[data-fit]").innerText(), /Not your size \(225\/45R17\)/);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: Compare crowns a Best only between tires of one size`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await seedFitment(page, { compare: [FITS, NO_FIT] });
    await page.goto(`${BASE}/compare`);
    await page.locator('[data-testid="compare-notice"]').waitFor();
    assert.match(await page.locator('[data-testid="compare-notice"]').innerText(), /different sizes \(265\/70R17, 285\/70R17\)/);
    assert.equal(await page.locator("table").getByText("Best", { exact: true }).count(), 0, "mixed sizes: no crown");

    await page.evaluate(() =>
      localStorage.setItem(
        "tiredrop.compare.v1",
        JSON.stringify(["continental-vancontact-as-245-75r16", "bridgestone-duravis-r500-hd-245-75r16"]),
      ),
    );
    await page.reload();
    await page.locator("table").waitFor();
    await page.locator("table").getByText("Best", { exact: true }).first().waitFor();
    assert.equal(await page.locator('[data-testid="compare-notice"]').count(), 0);
    assert.equal(await page.locator("table").getByText("Best", { exact: true }).count(), 2, "set price and price each");

    // With only a vehicle, a size other than its typical one is a check:
    // the crown and the Add buttons stay.
    await page.evaluate(() =>
      localStorage.setItem("tiredrop.fitment.v1", JSON.stringify({ type: "vehicle", year: "2019", make: "Ford", model: "F-150" })),
    );
    await page.reload();
    await page.locator("table").getByText("Best", { exact: true }).first().waitFor();
    assert.equal(await page.locator('[data-testid="compare-notice"]').count(), 0);
    assert.equal(await page.locator("table").getByRole("button", { name: /^Add 4$/ }).count(), 2);

    // With a door-jamb size the shopper confirmed, those tires miss it: no crown, no Add.
    await page.evaluate(() =>
      localStorage.setItem("tiredrop.fitment.v1", JSON.stringify({ type: "vehicle", year: "2019", make: "Ford", model: "F-150", size: "265/70R17" })),
    );
    await page.reload();
    await page.locator('[data-testid="compare-notice"]').waitFor();
    assert.equal(await page.locator("table").getByText("Best", { exact: true }).count(), 0);
    assert.equal(await page.locator("table").getByRole("button", { name: /^Add 4$/ }).count(), 0);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  const cartTire = (id, slug, name, size) => ({
    key: `${id}:n`, id, sku: id, kind: "tire", name, brand: "Test", size, price: 200, installPrice: 25, install: false, slug, qty: 4,
  });

  await check(`${width} fitment: vehicle only — the cart and checkout's review show the soft phone note, no Swap it`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await seedFitment(page, {
      selection: F150,
      cart: { lines: [cartTire("t-fits", FITS, "Fits", "265/70R17"), cartTire("t-other", NO_FIT, "Wide", "285/70R17")] },
    });
    await page.goto(`${BASE}/cart`);
    const soft = page.locator('[data-testid="cart-fit-soft"]');
    await soft.waitFor();
    assert.equal(await soft.count(), 1, "only the line in another size");
    assert.equal((await soft.innerText()).trim(), "We'll confirm fitment by phone before your order ships.");
    assert.equal(await page.locator('[data-testid="cart-fit-flag"]').count(), 0, "no won't-fit flag on a model-level guess");
    assert.equal(await page.getByText("Swap it for a tire that fits").count(), 0);

    // The order summary's button (on a phone the bottom bar has one too).
    await page.locator("main").getByRole("link", { name: "Checkout" }).click();
    await page.waitForSelector("#firstName");
    const cont = () => page.getByRole("button", { name: "Continue" }).click();
    await fill(page, "typing", [["#firstName", "Fit"], ["#lastName", "Check"], ["#email", "fit@example.com"], ["#phone", "9545550123"]]);
    await cont();
    await page.locator("#fulfillment-pickup").check();
    await page.waitForSelector("#date");
    await fill(page, "typing", [["#date", nextWeekday()], ["#timeWindow", "10-12"]]);
    await cont();
    await page.waitForSelector("#year");
    await modelsLoaded(page);
    await cont();
    const review = page.locator('[data-testid="review-fit-soft"]');
    await review.waitFor();
    assert.match(await review.innerText(), /We'll confirm fitment by phone before your order ships\./);
    assert.equal(await page.locator('[data-testid="review-fit-flags"]').count(), 0);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

  await check(`${width} fitment: a line that misses the confirmed sticker size is flagged in the cart and on checkout's review, and checkout still goes through`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    const tire = cartTire;
    await seedFitment(page, {
      selection: { ...F150, size: "265/70R17" },
      cart: { lines: [tire("t-fits", FITS, "Fits", "265/70R17"), tire("t-nofit", NO_FIT, "Wide", "285/70R17")] },
    });
    await page.goto(`${BASE}/cart`);
    const flag = page.locator('[data-testid="cart-fit-flag"]');
    await flag.waitFor();
    assert.equal(await flag.count(), 1, "only the line that doesn't fit");
    assert.match(await flag.innerText(), /Doesn't fit your 2019 Ford F-150/);
    assert.equal(await flag.getByRole("link", { name: "Swap it for a tire that fits" }).getAttribute("href"), "/tires?w=265&a=70&d=17");
    await page.getByText("We check the fitment against your vehicle before").waitFor();

    // The order summary's button (on a phone the bottom bar has one too).
    await page.locator("main").getByRole("link", { name: "Checkout" }).click();
    await page.waitForSelector("#firstName");
    await page.getByText("We confirm fitment against your vehicle before your order is released.").waitFor();
    const cont = () => page.getByRole("button", { name: "Continue" }).click();
    await fill(page, "typing", [["#firstName", "Fit"], ["#lastName", "Check"], ["#email", "fit@example.com"], ["#phone", "9545550123"]]);
    await cont();
    await page.locator("#fulfillment-pickup").check();
    await page.waitForSelector("#date");
    await fill(page, "typing", [["#date", nextWeekday()], ["#timeWindow", "10-12"]]);
    await cont();
    await page.waitForSelector("#year");
    await modelsLoaded(page);
    await expectDom(page, [["#year", "2019"], ["#make", "Ford"], ["#model", "F-150"]], "(the vehicle being shopped for)");
    await cont();
    const review = page.locator('[data-testid="review-fit-flags"]');
    await review.waitFor();
    assert.match(await review.innerText(), /One item doesn't match your 2019 Ford F-150/);
    assert.match(await review.innerText(), /Test Wide · 285\/70R17/);
    await fill(page, "typing", [["#agree", true]]);
    await page.getByRole("button", { name: "Place Order Request" }).click();
    await waitFor(() => h.sent.checkout.length === 1, "/api/checkout");
    assert.match(h.sent.checkout[0].notes, /Fitment flag: Test Wide 285\/70R17 does not match 265\/70R17/);
    assert.match(h.sent.checkout[0].notes, /Size the shopper confirmed: 265\/70R17/);
    noErrors(fitErrors(h.errors));
    await h.context.close();
  });

}

await runQueued();

// Every real submission above passes the server's spam guard (with only the
// minimum fill time switched off); the honeypot one is the only block.
// It reads what every other check sent, so it runs last, on its own.
const GUARD_CHECK = "spam guard: every real submission carries a valid token and passes; the honeypot bot is caught";
if (!ONLY || ONLY.test(GUARD_CHECK)) report(await runCheck(GUARD_CHECK, async () => {
  if ((ONLY || SHARD) && !judged.length) return;
  assert.ok(judged.length > 0, "no write was sent");
  const bots = judged.filter((j) => String(j.body?.website ?? "").trim());
  const people = judged.filter((j) => !String(j.body?.website ?? "").trim());
  const blocked = people.filter((j) => j.verdict !== "ok");
  assert.deepEqual(
    blocked.map((j) => `${j.endpoint}: ${j.verdict} ${j.reason ?? ""}`),
    [],
    "real submissions the guard would block",
  );
  assert.ok(people.every((j) => j.elapsedMs !== null), "every submission sends a fill-time token");
  assert.ok(bots.every((j) => j.verdict === "bot" && j.reason === "honeypot"), "honeypot caught");
  const by = Object.groupBy(people, (j) => j.endpoint);
  console.log(
    `     guard: ${people.length} real submissions passed (${Object.entries(by).map(([e, l]) => `${e} ${l.length}`).join(", ")}), ` +
      `${bots.length} honeypot caught; shortest fill ${Math.min(...people.map((j) => j.elapsedMs))} ms`,
  );
}));

await browser.close();
stopServer();
console.log(
  failures ? `\n${failures} of ${passes + failures} check(s) failed` : `\nall ${passes} checks passed`,
);
process.exit(failures ? 1 : 0);
