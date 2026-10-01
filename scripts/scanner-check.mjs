/**
 * Tire Size Finder check (/tire-size-finder). Drives the built site in
 * Chromium at 390px and 1440px with every /api request mocked (no Claude call,
 * no vPIC call, no cost) and walks all four ways in:
 *
 *   - door sticker (staggered): the photo is shrunk on the device to a JPEG
 *     of at most 1600 px on its long edge before it is sent; the confirm step
 *     shows front, rear and "the pressure printed on your sticker"; "Use these
 *     sizes" saves front + rear in the vehicle store (tiredrop.fitment.v1) and
 *     /tires shows that size with the staggered note;
 *   - tire sidewall: one size, saved as the size being shopped for;
 *   - VIN: typed (a check-digit typo is caught on the page, nothing sent) and
 *     scanned; the decoded car is shown and the page asks for the door
 *     sticker (no size is invented); the sticker sizes are then saved WITH
 *     that car;
 *   - type my size;
 *   - "Couldn't read it clearly", and the scan errors;
 *   - photo scans off (/api/status scanner "off", or a 503 from the scan):
 *     "Photo scan coming soon", while typing a VIN or a size still works;
 *   - entry points: "Scan your tire size" on /tires and in the product page's
 *     Check fitment panel;
 *   - no console errors, no sideways scroll at 390px, 44px targets.
 *
 *   npm run build && npm run check:scanner
 *
 * Starts `vite preview` on SCANNER_PORT (default 4341), or tests SCANNER_BASE
 * when that is set to a running server. Screenshots land in SCANNER_SHOTS
 * (default /tmp/scanner-check): the tool home, the confirm step and the
 * coming-soon state at each width.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { Buffer } from "node:buffer";
import { crc32, deflateSync } from "node:zlib";
import assert from "node:assert/strict";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.SCANNER_PORT ?? 4341);
const SHOTS = process.env.SCANNER_SHOTS ?? "/tmp/scanner-check";
mkdirSync(SHOTS, { recursive: true });

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.SCANNER_BASE;
if (!BASE) {
  if (!existsSync("dist/tire-size-finder.html")) {
    console.error("No prerendered /tire-size-finder in dist/. Run `npm run build` first.");
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
      console.error(`vite preview did not come up on ${BASE} (port busy? set SCANNER_PORT)`);
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

/* ------------------------------ fixtures ------------------------------ */

/** A real (decodable) PNG of one colour, `w` x `h`. */
function png(w, h) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x += 1) row.set([233, 227, 208], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
// A phone-sized photo (3000 x 2000), to see it shrink to 1600 x 1067.
const PHOTO = { name: "IMG_2041.png", mimeType: "image/png", buffer: png(3000, 2000) };

/** Width and height from a JPEG's SOF marker. */
function jpegSize(bytes) {
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    const len = bytes.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

const DOOR_STAGGERED = {
  ok: true,
  mode: "door",
  status: "read",
  confidence: "high",
  image_type: "door_sticker",
  front: { size: "225/40R19", load_index: "93", speed_rating: "Y" },
  rear: { size: "255/35R19", load_index: "96", speed_rating: "Y" },
  spare: null,
  pressure_front_psi: 35,
  pressure_rear_psi: 38,
};
const SIDEWALL = {
  ok: true,
  mode: "sidewall",
  status: "read",
  confidence: "medium",
  image_type: "tire_sidewall",
  tire: { size: "245/75R16", load_index: "111", speed_rating: "S", dot_week_year: "2319" },
};
const BMW = {
  year: "2021",
  make: "BMW",
  model: "M340i",
  series: "xDrive",
  trim: "",
  drive: "AWD",
  body: "Sedan",
};
const VIN = "3MW5U9J03M8B12345";
const VIN_PHOTO = {
  ok: true,
  mode: "vin",
  status: "read",
  confidence: "high",
  image_type: "vin",
  vin: VIN,
  vehicle: BMW,
  decode: "ok",
};
const BLURRY = {
  ok: true,
  mode: "door",
  status: "unreadable",
  reason: "blurry",
  confidence: "low",
  image_type: "door_sticker",
};

const STATUS = {
  atd: "sample",
  shopify: "off",
  checkout: "request",
  newsletter: "off",
  forms: "off",
  scanner: "on",
  version: "test",
};

/* ------------------------------ harness ------------------------------ */

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
    console.log(`FAIL ${name}\n     ${String(err.stack || err.message).split("\n").slice(0, 6).join("\n     ")}`);
  }
}

/**
 * A fresh context with /api mocked. `scan(body)` answers POST
 * /api/scan-tire-size: `{ status?, json }`. Every request body is kept.
 */
async function open(width, { status = STATUS, scan } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    hasTouch: width < 768,
    isMobile: width < 768,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  const sent = [];
  const local = new URL(BASE).host;
  await page.route(
    (url) => url.host !== local,
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  await page.route("**/api/tires**", (r) =>
    r.fulfill({ json: { source: "sample", items: [], query: null } }),
  );
  await page.route("**/api/scan-tire-size", async (r) => {
    const body = JSON.parse(r.request().postData() || "{}");
    sent.push(body);
    const answer = scan
      ? scan(body)
      : body.vin
        ? { json: { ok: true, mode: "vin", source: "typed", vin: body.vin, vehicle: BMW, decode: "ok" } }
        : body.mode === "door"
          ? { json: DOOR_STAGGERED }
          : body.mode === "sidewall"
            ? { json: SIDEWALL }
            : { json: VIN_PHOTO };
    await (answer.json === undefined
      ? r.fulfill({ status: answer.status ?? 200, body: answer.body ?? "", contentType: answer.contentType })
      : r.fulfill({ status: answer.status ?? 200, json: answer.json }));
  });
  return { context, page, sent, errors };
}

const finder = (page) => page.locator('[data-testid="finder"]');
const step = (page) => finder(page).getAttribute("data-step");

async function waitStep(page, name) {
  await page.waitForFunction(
    (n) => document.querySelector('[data-testid="finder"]')?.dataset.step === n,
    name,
  );
}

async function gotoFinder(page, { photo = "on" } = {}) {
  await page.goto(`${BASE}/tire-size-finder`);
  await page.waitForFunction(
    (p) => document.querySelector('[data-testid="finder"]')?.dataset.photo === p,
    photo,
  );
}

async function noSideScroll(page) {
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(over <= 0, `page scrolls sideways by ${over}px`);
}

/** Every visible button and link in the finder card is at least 44px tall. */
async function targets(page) {
  const small = await finder(page).evaluate((root) =>
    [...root.querySelectorAll("button, a, input:not([type=hidden]):not([type=file]), label:has(input[type=radio])")]
      .filter((el) => el.getClientRects().length)
      .map((el) => ({ h: el.getBoundingClientRect().height, t: (el.textContent || el.name || "").trim().slice(0, 30) }))
      .filter((x) => x.h < 43.5),
  );
  assert.deepEqual(small, [], "targets under 44px");
}

const selection = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("tiredrop.fitment.v1") || "null"));

const shoppingFor = (page) => page.locator('[data-testid="shopping-for-text"]').innerText();

/* ------------------------------ checks ------------------------------ */

async function runWidth(width) {
  await check(`${width} tool home: heading, four ways in, no sideways scroll`, async () => {
    const { page, context, errors } = await open(width);
    await gotoFinder(page);
    assert.equal(await page.locator("h1").innerText(), "What size tires does my car have?");
    for (const label of ["Scan door sticker", "Scan tire sidewall", "Enter or scan VIN", "Type my size"]) {
      const b = finder(page).getByRole("button", { name: new RegExp(label) });
      assert.equal(await b.count(), 1, label);
      assert.equal(await b.isEnabled(), true, label);
    }
    assert.match(await finder(page).innerText(), /Tire and Loading Information/);
    await noSideScroll(page);
    await targets(page);
    await page.screenshot({ path: `${SHOTS}/${width}-home.png`, fullPage: false });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} door sticker (staggered): shrunk to 1600px JPEG, confirm, Use these sizes -> /tires front + rear`, async () => {
    const { page, context, sent, errors } = await open(width);
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Scan door sticker/ }).click();
    await waitStep(page, "camera");
    assert.match(await finder(page).locator("h2").innerText(), /door sticker/);
    assert.match(await finder(page).innerText(), /Photos are read once and never saved/);
    const input = page.locator('[data-testid="scan-camera"]');
    assert.equal(await input.getAttribute("accept"), "image/*");
    assert.equal(await input.getAttribute("capture"), "environment");
    await input.setInputFiles(PHOTO);
    await waitStep(page, "result");

    // What was sent: one JPEG, long edge 1600.
    assert.equal(sent.length, 1);
    assert.equal(sent[0].mode, "door");
    assert.match(sent[0].image, /^data:image\/jpeg;base64,/);
    const bytes = Buffer.from(sent[0].image.split(",")[1], "base64");
    const dims = jpegSize(bytes);
    assert.deepEqual(dims, { width: 1600, height: 1067 }, "downscaled on the device");
    assert.deepEqual(Object.keys(sent[0]).sort(), ["image", "mode"], "nothing else is sent");

    const card = await finder(page).innerText();
    assert.match(card, /Read clearly/);
    assert.match(card, /Here's what your sticker says/);
    assert.match(card, /225\/40R19 93Y/);
    assert.match(card, /255\/35R19 96Y/);
    assert.match(card, /35 psi front · 38 psi rear/);
    assert.match(card, /the pressure printed on your sticker/);
    assert.match(card, /2 front \+ 2 rear/);
    assert.doesNotMatch(card, /\b(safe|OK|fine)\b/i);
    await noSideScroll(page);
    await targets(page);
    await finder(page).screenshot({ path: `${SHOTS}/${width}-confirm.png` });
    await page.screenshot({ path: `${SHOTS}/${width}-confirm-page.png` });

    await finder(page).getByRole("button", { name: /Use these sizes/ }).click();
    await page.waitForURL(/\/tires$/);
    await page.locator('[data-testid="shopping-for-text"]').waitFor();
    assert.match(await shoppingFor(page), /front 225\/40R19, rear 255\/35R19/);
    assert.match(await page.locator('[data-testid="staggered-note"]').innerText(), /2 front \+ 2 rear/);
    assert.deepEqual(await selection(page), { v: 1, type: "size", size: "225/40R19", rear: "255/35R19" });
    // The tires in those sizes are grouped first.
    assert.match(await page.locator("main").innerText(), /In your size/);
    await page.screenshot({ path: `${SHOTS}/${width}-tires-after.png` });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} sidewall: one size, Use this size -> /tires`, async () => {
    const { page, context, sent, errors } = await open(width);
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Scan tire sidewall/ }).click();
    await waitStep(page, "camera");
    assert.match(await finder(page).locator("h2").innerText(), /sidewall/);
    await page.locator('[data-testid="scan-upload"]').setInputFiles(PHOTO);
    await waitStep(page, "result");
    assert.equal(sent[0].mode, "sidewall");
    const card = await finder(page).innerText();
    assert.match(card, /Here's what your tire says/);
    assert.match(card, /245\/75R16 111S/);
    assert.match(card, /Week 23 of 2019/);
    assert.match(card, /check it against your tire/, "medium confidence asks for a check");
    await finder(page).getByRole("button", { name: /Use this size/ }).click();
    await page.waitForURL(/\/tires$/);
    await page.locator('[data-testid="shopping-for-text"]').waitFor();
    assert.match(await shoppingFor(page), /245\/75R16/);
    assert.deepEqual(await selection(page), { v: 1, type: "size", size: "245/75R16" });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} VIN typed: typo caught on the page; decoded car, no invented size; sticker saved with the car`, async () => {
    const { page, context, sent, errors } = await open(width);
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Enter or scan VIN/ }).click();
    await waitStep(page, "vin");
    const vinBox = page.getByLabel("VIN (17 characters)");
    await vinBox.fill("3MW5U9J04M8B12345");
    await finder(page).getByRole("button", { name: "Look up my car" }).click();
    assert.match(await finder(page).getByRole("alert").innerText(), /doesn't add up/);
    assert.equal(sent.length, 0, "a check-digit typo is never sent");

    await vinBox.fill(VIN.toLowerCase());
    await finder(page).getByRole("button", { name: "Look up my car" }).click();
    await page.locator('[data-testid="vin-vehicle"]').waitFor();
    assert.deepEqual(sent[0], { mode: "vin", vin: VIN });
    const card = await finder(page).innerText();
    assert.match(card, /Found: 2021 BMW M340i xDrive/);
    assert.match(card, /AWD · Sedan/);
    assert.match(card, /Scan your door sticker for the exact size/);
    assert.doesNotMatch(card, /\d{3}\/\d{2}R\d{2}/, "no size is offered for the VIN alone");

    await finder(page).getByRole("button", { name: /Scan your door sticker/ }).click();
    await waitStep(page, "camera");
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await waitStep(page, "result");
    assert.match(await finder(page).innerText(), /keep your 2021 BMW M340i xDrive/);
    await finder(page).getByRole("button", { name: /Use these sizes/ }).click();
    await page.waitForURL(/\/tires$/);
    await page.locator('[data-testid="shopping-for-text"]').waitFor();
    const bar = await shoppingFor(page);
    assert.match(bar, /2021 BMW M340i/);
    assert.match(bar, /front 225\/40R19, rear 255\/35R19/);
    assert.deepEqual(await selection(page), {
      v: 1,
      type: "vehicle",
      year: "2021",
      make: "BMW",
      model: "M340i",
      size: "225/40R19",
      rear: "255/35R19",
    });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} VIN scanned: the photo's VIN is decoded and shown`, async () => {
    const { page, context, sent, errors } = await open(width);
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Enter or scan VIN/ }).click();
    await waitStep(page, "vin");
    await finder(page).getByRole("button", { name: /Scan my VIN/ }).click();
    await waitStep(page, "camera");
    assert.match(await finder(page).locator("h2").innerText(), /VIN/);
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await waitStep(page, "vin");
    assert.equal(sent[0].mode, "vin");
    assert.ok(sent[0].image);
    assert.equal(await page.getByLabel("VIN (17 characters)").inputValue(), VIN);
    assert.match(await page.locator('[data-testid="vin-vehicle"]').innerText(), /2021 BMW M340i xDrive/);
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} type my size: a bad size is refused; front + rear -> /tires`, async () => {
    const { page, context, errors } = await open(width);
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Type my size/ }).click();
    await waitStep(page, "type");
    await page.getByLabel("Front (or all four)").fill("225/45 17");
    await finder(page).getByRole("button", { name: "Show tires that fit" }).click();
    assert.match(await finder(page).getByRole("alert").innerText(), /not a size we can read/);
    await page.getByLabel("Front (or all four)").fill("p225/45r17");
    await page.getByLabel("Rear, if different (optional)").fill("245/40R17");
    await finder(page).getByRole("button", { name: "Show tires that fit" }).click();
    await page.waitForURL(/\/tires$/);
    await page.locator('[data-testid="shopping-for-text"]').waitFor();
    assert.deepEqual(await selection(page), { v: 1, type: "size", size: "225/45R17", rear: "245/40R17" });
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} couldn't read it clearly: no sizes, retake or type`, async () => {
    const { page, context, errors } = await open(width, { scan: () => ({ json: BLURRY }) });
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Scan door sticker/ }).click();
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await waitStep(page, "unclear");
    const card = await finder(page).innerText();
    assert.match(card, /Couldn.t read it clearly/);
    assert.match(card, /That photo is too blurry to be sure/);
    assert.match(card, /We won't guess your tire size/);
    assert.doesNotMatch(card, /\d{3}\/\d{2}R\d{2}/);
    await finder(page).screenshot({ path: `${SHOTS}/${width}-unclear.png` });
    await finder(page).getByRole("button", { name: /Type it instead/ }).click();
    await waitStep(page, "type");
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} scan errors: rate limit and an unreachable scanner say so`, async () => {
    let answer = { status: 429, json: { error: "rate_limited" } };
    const { page, context, errors } = await open(width, { scan: () => answer });
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Scan door sticker/ }).click();
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await finder(page).getByRole("alert").waitFor();
    assert.match(await finder(page).getByRole("alert").innerText(), /Wait about ten minutes/);
    // Anthropic's rate or spend limit (429/529) answers 503 scanner_busy.
    answer = { status: 503, json: { error: "scanner_busy" } };
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await page.waitForFunction(() =>
      /scanner is busy/.test(document.querySelector('[data-testid="finder"] [role="alert"]')?.textContent || ""),
    );
    assert.equal(await step(page), "camera", "a busy scanner is not 'coming soon'");
    // A refused key or an unreachable Claude: 502 scanner_unavailable.
    answer = { status: 502, json: { error: "scanner_unavailable" } };
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await page.waitForFunction(() =>
      /isn't working right now/.test(document.querySelector('[data-testid="finder"] [role="alert"]')?.textContent || ""),
    );
    // Vercel's own 413 page (not JSON) still reads as "too large".
    answer = { status: 413, body: "Request Entity Too Large", contentType: "text/plain" };
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await page.waitForFunction(() =>
      /too large to send/.test(document.querySelector('[data-testid="finder"] [role="alert"]')?.textContent || ""),
    );
    assert.equal(await step(page), "camera");
    // The browser itself logs the mocked 429/503/502/413 responses.
    assert.deepEqual(errors.filter((e) => !/status of (429|503|502|413)/.test(e)), [], "console errors");
    await context.close();
  });

  await check(`${width} photo scans off: "Photo scan coming soon", VIN and size typing still work`, async () => {
    const { page, context, sent, errors } = await open(width, { status: { ...STATUS, scanner: "off" } });
    await gotoFinder(page, { photo: "off" });
    for (const label of ["Scan door sticker", "Scan tire sidewall"]) {
      const b = finder(page).getByRole("button", { name: new RegExp(label) });
      assert.equal(await b.isDisabled(), true, label);
      assert.match(await b.innerText(), /Photo scan coming soon/);
    }
    await noSideScroll(page);
    await page.screenshot({ path: `${SHOTS}/${width}-coming-soon.png` });

    await finder(page).getByRole("button", { name: /Enter or scan VIN/ }).click();
    await waitStep(page, "vin");
    assert.equal(await finder(page).getByRole("button", { name: /Photo scan coming soon/ }).isDisabled(), true);
    await page.getByLabel("VIN (17 characters)").fill(VIN);
    await finder(page).getByRole("button", { name: "Look up my car" }).click();
    await page.locator('[data-testid="vin-vehicle"]').waitFor();
    assert.match(await finder(page).innerText(), /Found: 2021 BMW M340i xDrive/);
    assert.equal(await finder(page).getByRole("button", { name: /Photo scan coming soon/ }).count(), 2);
    await finder(page).screenshot({ path: `${SHOTS}/${width}-coming-soon-vin.png` });
    await finder(page).getByRole("button", { name: /Type my size/ }).click();
    await waitStep(page, "type");
    await page.getByLabel("Front (or all four)").fill("225/40R19");
    await page.getByLabel("Rear, if different (optional)").fill("255/35R19");
    await finder(page).getByRole("button", { name: "Show tires that fit" }).click();
    await page.waitForURL(/\/tires$/);
    await page.locator('[data-testid="shopping-for-text"]').waitFor();
    assert.equal((await selection(page)).model, "M340i", "the decoded car is kept");
    assert.ok(sent.every((b) => !b.image), "no photo was sent");
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });

  await check(`${width} a 503 from the scan flips the page to "coming soon"`, async () => {
    const { page, context, errors } = await open(width, {
      scan: () => ({ status: 503, json: { error: "scanner_not_configured" } }),
    });
    await gotoFinder(page);
    await finder(page).getByRole("button", { name: /Scan door sticker/ }).click();
    await page.locator('[data-testid="scan-camera"]').setInputFiles(PHOTO);
    await page.waitForFunction(() => document.querySelector('[data-testid="finder"]')?.dataset.photo === "off");
    assert.match(await finder(page).innerText(), /Photo scan coming soon/);
    await finder(page).getByRole("button", { name: /Type my size/ }).click();
    await waitStep(page, "type");
    assert.deepEqual(errors.filter((e) => !/status of 503/.test(e)), [], "console errors");
    await context.close();
  });

  await check(`${width} entry points: /tires and the product page's Check fitment panel`, async () => {
    const { page, context, errors } = await open(width);
    await page.goto(`${BASE}/tires`);
    const link = page.locator('[data-testid="scan-size-link"]');
    assert.match(await link.innerText(), /Scan your tire size/);
    await link.click();
    await page.waitForURL(/\/tire-size-finder$/);

    const product = await page.evaluate(async () => {
      const res = await fetch("/sitemap.xml");
      const xml = await res.text();
      return /<loc>https:\/\/tiredroponline\.com(\/tires\/[^<]+)<\/loc>/.exec(xml)?.[1] ?? null;
    });
    assert.ok(product, "a product page");
    await page.goto(`${BASE}${product}`);
    const panel = page.locator('[data-testid="fit-panel"]');
    await panel.waitFor();
    assert.match(await panel.innerText(), /Check fitment/);
    await panel.locator('[data-testid="fit-scan-link"]').click();
    await page.waitForURL(/\/tire-size-finder$/);
    // In the menus too.
    assert.ok(await page.locator('footer a[href="/tire-size-finder"]').count());
    assert.deepEqual(errors, [], "console errors");
    await context.close();
  });
}

await runWidth(390);
await runWidth(1440);

await browser.close();
stopServer();
console.log(
  failures ? `\n${failures} of ${passes + failures} check(s) failed` : `\nall ${passes} checks passed`,
);
process.exit(failures ? 1 : 0);
