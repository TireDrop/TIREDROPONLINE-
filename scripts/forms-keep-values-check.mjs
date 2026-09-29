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
 * (request mode, ship-to-store pickup), the newsletter pop-up, and the Find
 * My Tires size prefill. Also: start over clears, validation errors clear as
 * you type, the honeypot still reaches the server, no console errors.
 *
 * Every /api request is answered by a mock; nothing reaches Shopify.
 *
 *   npm run build && npm run check:forms
 *
 * It starts `vite preview` itself on FORMS_PORT (default 4181), or tests
 * FORMS_BASE when that is set to an already running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

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
 * A fresh context with the API mocked. /api/status answers after `delay`,
 * so a form can be filled before the forms-on flip re-renders it.
 */
async function open(width, { status = STATUS, delay = STATUS_DELAY_MS, cart = null } = {}) {
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

  const sent = { forms: [], checkout: [], newsletter: [] };
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
  // Third-party hosts (Google Fonts, Google Analytics) are answered empty,
  // so a slow or blocked host cannot stall a load or log an error; the
  // checks are about fields. vPIC is mocked below.
  const local = new URL(BASE).host;
  await page.route(
    (url) => url.host !== local && url.host !== "vpic.nhtsa.dot.gov",
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route("https://vpic.nhtsa.dot.gov/**", (route) =>
    route.fulfill({
      json: { Results: [{ Model_Name: "Camry" }, { Model_Name: "Corolla" }] },
      headers: { "access-control-allow-origin": "*" },
    }),
  );

  return {
    context,
    page,
    sent,
    errors,
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

      // Step 2: vehicle; tire size typed for real (another render).
      await page.waitForSelector("#year");
      const vehicle = [
        ["#year", "2020"],
        ["#make", "Toyota"],
        ["#model", "Camry"],
      ];
      await fill(page, mode, vehicle);
      await page.locator("#tireSize").pressSequentially("215/55R17");
      await expectDom(page, vehicle, "(step 2)");
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
      const vehicle = [
        ["#year", "2020"],
        ["#make", "Toyota"],
        ["#model", "Camry"],
      ];
      await fill(page, mode, vehicle);
      await page.locator("#trim").pressSequentially("SE");
      await expectDom(page, vehicle, "(vehicle)");
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
      await expectDom(page, vehicle, "(back to vehicle)");
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

  /* ---------------- Newsletter pop-up ---------------- */
  for (const mode of MODES) {
    await check(`${width} newsletter pop-up: ${mode} email is kept and sent`, async () => {
      const h = await open(width, { status: { ...STATUS, newsletter: "on" }, delay: 0 });
      const { page } = h;
      await page.goto(`${BASE}/`);
      await page.waitForLoadState("networkidle");
      const dialog = page.locator("dialog.td-nl");
      await dialog.waitFor({ state: "attached" });
      await page.evaluate(() => {
        const el = document.scrollingElement;
        el.scrollTo(0, (el.scrollHeight - el.clientHeight) * 0.6);
      });
      await dialog.waitFor({ state: "visible", timeout: 3000 });
      // A render first: a bad address typed for real shows an error.
      await page.locator("#td-nl-email").fill("bad");
      await page.getByRole("button", { name: "Sign me up" }).click();
      await page.getByText("Enter a valid email address.").waitFor();
      const fields = [["#td-nl-email", "driver@example.com"]];
      if (mode === "typing") await page.locator("#td-nl-email").fill("driver@example.com");
      else await fill(page, mode, fields);
      await expectDom(page, fields, `(${mode})`);
      await page.getByRole("button", { name: "Sign me up" }).click();
      await waitFor(() => h.sent.newsletter.length === 1, "/api/newsletter");
      assert.deepEqual(h.sent.newsletter[0], {
        email: "driver@example.com",
        source: "popup",
        website: "",
      });
      await page.getByText("You're on the list. Watch your inbox.").waitFor();
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
}

await browser.close();
stopServer();
console.log(
  failures ? `\n${failures} of ${passes + failures} check(s) failed` : `\nall ${passes} checks passed`,
);
process.exit(failures ? 1 : 0);
