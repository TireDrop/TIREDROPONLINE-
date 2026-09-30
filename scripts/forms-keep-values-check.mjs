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
 * (request mode, ship-to-store pickup), the footer newsletter sign-up, and the Find
 * My Tires size prefill. Also the install booking for a paid order:
 * /schedule?order= (the order read-only and sent, nothing personal taken
 * from the URL), and /track's "Schedule your install" button, both to
 * /schedule with the verified order's details and to an INSTALL_BOOKING_URL
 * link. The Year / Make / Model dropdowns (VehicleSelect)
 * are picked from, including "Other / not listed", a silent pick taken in on
 * the next render, the NHTSA-down fallback, and the finder's vehicle
 * prefilling the booking form. vPIC is mocked in its own JSON shape
 * (scripts/vpic-mock.mjs). Also: start over clears, validation errors clear as
 * you type, the honeypot still reaches the server, no console errors.
 *
 * /track (order lookup): the three modes with a late /api/status, a late
 * (slow) /api/track answer, and the values still on screen after it. And
 * before the app starts: the page's JavaScript is held back while the
 * prerendered form is typed into, then released. The values must survive
 * the start — a hydration on /track and /track?utm_source=…, a fresh render
 * (which replaces the markup) on /track?ref=… — and be the ones submitted.
 * /contact and /schedule get the same before-the-app check.
 *
 * Every /api request is answered by a mock; nothing reaches Shopify.
 *
 *   npm run build && npm run check:forms
 *
 * It starts `vite preview` itself on FORMS_PORT (default 4181), or tests
 * FORMS_BASE when that is set to an already running server. FORMS_ONLY=<regex>
 * runs only the checks whose name matches, e.g. FORMS_ONLY=/track.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

import { mockVpic } from "./vpic-mock.mjs";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.FORMS_PORT ?? 4181);
const STATUS_DELAY_MS = 1500;

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
async function check(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
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
    await route.fulfill({ json: { ok: true } });
  });
  await page.route("**/api/checkout", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    sent.checkout.push(body);
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
      assert.deepEqual(h.sent.newsletter[0], {
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
    // The hand-off from the hero's vehicle picker.
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
    await page.locator('#finder-model option[value="Tacoma"]').waitFor({ state: "attached" });
    await page.selectOption("#finder-model", "Tacoma");
    await page.getByRole("button", { name: "Find Tires" }).click();
    await page.waitForURL(/find-my-tires/);

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

  await check(`${width} /schedule?order=: a malformed order is ignored and never sent`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    await page.goto(`${BASE}/schedule?order=%3Cscript%3E1%3C%2Fscript%3E`);
    await page.waitForSelector("#service-tire-installation");
    assert.equal(await page.locator("#booking-order").count(), 0);
    noErrors(h.errors);
    await h.context.close();
  });

  await check(`${width} /track → Schedule your install (no booking link): /schedule?order= with the verified vehicle and contact`, async () => {
    const h = await open(width, { delay: 0 });
    const { page } = h;
    const asked = await mockTrack(page, {
      found: true,
      kind: "order",
      order: {
        ...PAID_STORE_ORDER,
        booking: {
          mode: "internal",
          ref: "TD-260920-ABCDEF",
          path: "/schedule?order=TD-260920-ABCDEF",
          install: "shop",
          prefill: { name: "Buyer Person", email: "buyer@example.com", phone: "+19545550199", vehicle: "2020 Toyota Camry" },
        },
      },
    });
    // The confirmation email links to /track?order=%231002: the number is filled in, the email is not.
    await page.goto(`${BASE}/track?order=%231002`);
    await page.waitForSelector("#track-order");
    await expectDom(page, [["#track-order", "#1002"], ["#track-email", ""]], "(order from the link)");
    await fill(page, "typing", [["#track-email", "buyer@example.com"]]);
    await page.getByRole("button", { name: "Track Order" }).click();
    const cta = page.getByRole("link", { name: "Schedule your install" });
    await cta.waitFor();
    assert.deepEqual(asked, [{ order: "#1002", email: "buyer@example.com", website: "" }]);
    assert.equal(await cta.getAttribute("target"), null, "stays on the site");
    await cta.click();
    await page.waitForURL(/\/schedule\?order=TD-260920-ABCDEF$/);
    await page.waitForSelector("#booking-order");
    assert.equal(await page.inputValue("#booking-order"), "TD-260920-ABCDEF");
    // Nothing personal is in the URL.
    assert.ok(!/Buyer|example|555|Camry/.test(page.url()), page.url());

    const flow = await bookThroughToContact(page, nextWeekday());
    await modelsLoaded(page);
    await expectDom(page, [["#year", "2020"], ["#make", "Toyota"], ["#model", "Camry"]], "(vehicle from the order)");
    await flow.toContact();
    await expectDom(page, [["#name", "Buyer Person"], ["#phone", "+19545550199"], ["#email", "buyer@example.com"]], "(contact from the order)");
    await page.getByRole("button", { name: "Request appointment" }).click();
    await waitFor(() => h.sent.forms.length === 1, "/api/forms");
    assertIncludes(h.sent.forms[0], {
      form: "booking",
      order: "TD-260920-ABCDEF",
      service: "tire-installation",
      locationType: "shop",
      year: "2020",
      make: "Toyota",
      model: "Camry",
      name: "Buyer Person",
      phone: "+19545550199",
      email: "buyer@example.com",
    }, "booking from /track");
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
}

await browser.close();
stopServer();
console.log(
  failures ? `\n${failures} of ${passes + failures} check(s) failed` : `\nall ${passes} checks passed`,
);
process.exit(failures ? 1 : 0);
