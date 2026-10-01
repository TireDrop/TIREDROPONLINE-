/**
 * Shop Tires remembers, and /tires keeps its state in the address bar.
 * Drives the built site in Chromium at 390px and 1440px:
 *
 *   Remember (src/data/vehicles.js, tiredrop.fitment.v1)
 *   - first visit: Shop Tires opens the finder (the "pop-up");
 *   - picking a vehicle saves it (with its version field) and shows its
 *     results, with the vehicle in the URL; after a reload, Shop Tires from
 *     every entry point (header or menu, the phone's bottom bar, the home
 *     hero, a Learn article's call to action) goes straight to the results:
 *     the finder never appears, the Shopping-for bar does;
 *   - Change reopens the finder prefilled; Cancel puts it away;
 *   - "Shopping for a different car?" wipes it, and Shop Tires shows the
 *     finder again;
 *   - a door-jamb size (front, and rear when staggered) is saved with the
 *     vehicle, goes in the URL (size=…&rear=…) and survives a reload;
 *   - a URL with a vehicle or size wins over the saved one and is saved;
 *   - cleared site data, or storage that throws (private mode): the finder
 *     again, and nothing breaks.
 *   Filters (src/data/tireFacets.js, src/lib/tiresUrl.js)
 *   - desktop sidebar and the phone's sheet write readable params, counts
 *     update, a reload keeps them, Back from a product restores them, chips
 *     remove one, Clear all removes all, and zero results offers Clear
 *     filters and the phone number;
 *   - a hard load of a filtered URL hydrates with no mismatch.
 *   No console errors anywhere (the /api/tires 404 the harness answers
 *   aside), and no hydration warnings.
 *
 * Screenshots go to REMEMBER_SHOTS (default .scratch/remember/).
 *
 *   npm run build && npm run check:remember
 *
 * Starts `vite preview` on REMEMBER_PORT (default 4351), or tests
 * REMEMBER_BASE when that is set to an already running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.REMEMBER_PORT ?? 4351);
const SHOTS = process.env.REMEMBER_SHOTS ?? ".scratch/remember";
mkdirSync(SHOTS, { recursive: true });

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.REMEMBER_BASE;
if (!BASE) {
  if (!existsSync("dist/tires.html")) {
    console.error("No prerendered build in dist/. Run `npm run build` first.");
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
const stopServer = () => {
  try {
    if (server) process.kill(-server.pid);
  } catch {
    /* already gone */
  }
};

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;
const KEY = "tiredrop.fitment.v1";

async function open(width, { blockStorage = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" || /hydrat/i.test(m.text())) errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  await page.route((url) => url.host !== local, (route) => route.fulfill({ status: 200, body: "" }));
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: { atd: "sample", shopify: "live", checkout: "request", newsletter: "off", forms: "on", version: "test" },
    }),
  );
  // No API: the sample catalog answers, as on a preview without ATD.
  await page.route("**/api/tires**", (route) => route.fulfill({ status: 404, body: "" }));
  if (blockStorage) {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      };
      Object.defineProperty(window, "localStorage", { get: blocked, configurable: true });
    });
  }
  // Notes whether the finder ever appears, and the <h1> the HTML arrived with.
  await page.addInitScript(() => {
    window.__finderSeen = false;
    new MutationObserver(() => {
      if (document.querySelector('[data-testid="tire-finder"]')) window.__finderSeen = true;
    }).observe(document, { childList: true, subtree: true });
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "interactive") window.__servedH1 = document.querySelector("h1");
    });
  });
  return { context, page, errors };
}

const real = (errors) => errors.filter((e) => !/status of 404/.test(e));

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err?.message ?? err).split("\n").slice(0, 6).join("\n     ")}`);
  }
}

const mounted = () =>
  Object.keys(document.getElementById("root") ?? {}).some((k) => k.startsWith("__reactContainer"));

const barText = (page) => page.locator('[data-testid="shopping-for-text"]').innerText();
const waitBar = (page, re) =>
  page.waitForFunction(
    (src) => new RegExp(src).test(document.querySelector('[data-testid="shopping-for-text"]')?.textContent ?? ""),
    re.source,
  );
const finder = (page) => page.locator('[data-testid="tire-finder"]');
const stored = (page) =>
  page.evaluate((k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch {
      return "blocked";
    }
  }, KEY);
const query = (page) => new URL(page.url()).search;

/** The Shop Tires a shopper at this width reaches first. */
async function clickShopTires(page, width, via = "header") {
  await page.evaluate(() => (window.__finderSeen = false));
  if (via === "hero") {
    await page.locator("main section").first().getByRole("link", { name: /^Shop Tires/ }).click();
  } else if (via === "cta") {
    await page.locator('section[aria-labelledby="content-cta"]').getByRole("link", { name: /^Shop tires/i }).first().click();
  } else if (via === "menu") {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Site menu" }).locator('a[href="/tires"]').last().click();
  } else if (via === "bottom-bar") {
    // The phone's bottom bar comes last in the document.
    await page.locator('a[href="/tires"]:visible').last().click();
  } else if (width >= 1024) {
    await page.locator("div.sticky").getByRole("link", { name: "Shop Tires", exact: true }).click();
  } else {
    await page.locator('a[href="/tires"]:visible').last().click();
  }
  await page.waitForURL(/\/tires(\?|$)/);
}

async function pickVehicleInFinder(page, { year, make, model }) {
  await page.waitForSelector("#finder-year");
  await page.selectOption("#finder-year", year);
  await page.selectOption("#finder-make", make);
  await page.locator(`#finder-model option[value="${model}"]`).waitFor({ state: "attached" });
  await page.selectOption("#finder-model", model);
  await page.getByRole("button", { name: "Find Tires" }).click();
}

/* ------------------------------- remember ------------------------------ */

for (const width of [390, 1440]) {
  await check(`${width} first visit: Shop Tires opens the finder; picking a vehicle saves it and shows its results`, async () => {
    const { context, page, errors } = await open(width);
    await page.goto(`${BASE}/`);
    await page.waitForFunction(mounted);
    await clickShopTires(page, width);
    await finder(page).waitFor();
    await page.locator("#finder-year").waitFor();
    // The bar has loaded (nothing saved) and the finder is still up.
    await waitBar(page, /no vehicle picked yet/);
    assert.equal(await finder(page).count(), 1);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SHOTS}/popup-first-visit-${width}.png` });

    await pickVehicleInFinder(page, { year: "2019", make: "Ford", model: "F-150" });
    await waitBar(page, /2019 Ford F-150 \(265\/70R17\)/);
    await page.waitForFunction(() => /year=2019&make=ford&model=f-150/.test(location.search));
    assert.equal(await finder(page).count(), 0, "finder put away once saved");
    assert.deepEqual(await stored(page), { v: 1, type: "vehicle", year: "2019", make: "Ford", model: "F-150" });
    await page.getByRole("heading", { name: "In the size for your 2019 Ford F-150" }).waitFor();

    // Reload, then Shop Tires from every entry point: straight to results.
    await page.reload();
    await page.waitForFunction(mounted);
    const routes = width >= 1024
      ? [["/", "header"], ["/", "hero"], ["/learn/sidewall/dot-date-code", "cta"]]
      : [["/", "bottom-bar"], ["/", "menu"], ["/", "hero"], ["/learn/sidewall/dot-date-code", "cta"]];
    for (const [from, via] of routes) {
      await page.goto(`${BASE}${from}`);
      await page.waitForFunction(mounted);
      await page.waitForLoadState("networkidle");
      await clickShopTires(page, width, via);
      await waitBar(page, /2019 Ford F-150 \(265\/70R17\)/);
      await page.waitForFunction(() => /year=2019&make=ford&model=f-150/.test(location.search));
      assert.equal(await page.evaluate(() => window.__finderSeen), false, `no finder via ${via} from ${from}`);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${SHOTS}/saved-bar-${width}.png` });
    assert.deepEqual(real(errors), []);
    await context.close();
  });

  await check(`${width} Change reopens the finder prefilled; Cancel; a new pick is a new history entry; Clear brings the finder back`, async () => {
    const { context, page, errors } = await open(width);
    await page.addInitScript(
      ([k]) => {
        if (!sessionStorage.getItem("seeded")) {
          sessionStorage.setItem("seeded", "1");
          localStorage.setItem(k, JSON.stringify({ v: 1, type: "vehicle", year: "2019", make: "Ford", model: "F-150" }));
        }
      },
      [KEY],
    );
    await page.goto(`${BASE}/tires`);
    await waitBar(page, /2019 Ford F-150/);
    await page.waitForFunction(() => /year=2019/.test(location.search));
    assert.equal(await finder(page).count(), 0);

    await page.locator('[data-testid="shopping-for"]').getByRole("button", { name: "Change", exact: true }).click();
    await finder(page).waitFor();
    assert.equal(await page.inputValue("#finder-year"), "2019");
    assert.equal(await page.inputValue("#finder-make"), "Ford");
    assert.equal(await page.inputValue("#finder-model"), "F-150");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "finder-year", "focus moves into the finder");
    await finder(page).getByRole("button", { name: "Cancel" }).click();
    await finder(page).waitFor({ state: "detached" });

    // A different vehicle: pushed, so Back returns to the F-150.
    await page.locator('[data-testid="shopping-for"]').getByRole("button", { name: "Change", exact: true }).click();
    await pickVehicleInFinder(page, { year: "2009", make: "Ford", model: "F-150" });
    await waitBar(page, /2009 Ford F-150 \(235\/75R17\)/);
    await page.goBack();
    await waitBar(page, /2019 Ford F-150 \(265\/70R17\)/);
    assert.equal((await stored(page)).year, "2019", "Back restores, and saves, the URL's vehicle");

    await page.getByRole("button", { name: "Shopping for a different car?" }).first().click();
    await finder(page).waitFor();
    await waitBar(page, /no vehicle picked yet/);
    assert.equal(await page.inputValue("#finder-year"), "", "cleared, not prefilled");
    assert.equal(await stored(page), null);
    await page.waitForFunction(() => !/year=/.test(location.search));

    await page.goto(`${BASE}/`);
    await page.waitForFunction(mounted);
    await clickShopTires(page, width);
    await finder(page).waitFor();
    await waitBar(page, /no vehicle picked yet/);
    assert.deepEqual(real(errors), []);
    await context.close();
  });
}

await check("1440 a door-jamb size, front and rear, is saved (v: 1), goes in the URL, and survives a reload", async () => {
  const { context, page, errors } = await open(1440);
  await page.addInitScript(([k]) => {
    if (!sessionStorage.getItem("seeded")) {
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(k, JSON.stringify({ v: 1, type: "vehicle", year: "2019", make: "BMW", model: "3 Series" }));
    }
  }, [KEY]);
  await page.goto(`${BASE}/tires`);
  await waitBar(page, /2019 BMW 3 Series \(225\/45R18\)/);
  await page.getByRole("button", { name: "Know your exact size? Enter it from your door-jamb sticker" }).click();
  await page.locator("#sticker-front").fill("225/40R19");
  await page.locator("#sticker-rear").fill("255/35R19");
  assert.equal(await finder(page).count(), 0, "the sticker form is the bar's, not the finder");
  await page.getByRole("button", { name: "Save my size" }).click();
  await waitBar(page, /2019 BMW 3 Series · front 225\/40R19, rear 255\/35R19/);
  const saved = await stored(page);
  assert.deepEqual(
    { v: saved.v, type: saved.type, year: saved.year, make: saved.make, size: saved.size, rear: saved.rear },
    { v: 1, type: "vehicle", year: "2019", make: "BMW", size: "225/40R19", rear: "255/35R19" },
  );
  await page.waitForFunction(() => /size=225-40r19&rear=255-35r19/.test(location.search));
  await page.reload();
  await waitBar(page, /2019 BMW 3 Series · front 225\/40R19, rear 255\/35R19/);
  assert.equal(await finder(page).count(), 0);
  assert.equal((await stored(page)).rear, "255/35R19");
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("1440 a URL with a vehicle or size wins over the saved one, and is saved", async () => {
  const { context, page, errors } = await open(1440);
  await page.addInitScript(([k]) => {
    if (!sessionStorage.getItem("seeded")) {
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(k, JSON.stringify({ v: 1, type: "vehicle", year: "2019", make: "Ford", model: "F-150" }));
    }
  }, [KEY]);
  await page.goto(`${BASE}/tires?size=225-45r17`);
  await waitBar(page, /Shopping for size 225\/45R17/);
  assert.deepEqual(await stored(page), { v: 1, type: "size", size: "225/45R17" });
  assert.equal(await finder(page).count(), 0);

  await page.goto(`${BASE}/tires?year=2020&make=toyota&model=tacoma&sort=price-asc`);
  await waitBar(page, /2020 Toyota Tacoma/);
  assert.equal((await stored(page)).model, "Tacoma");
  assert.equal(await page.inputValue("#tire-sort"), "price-asc");

  // Older links still land, in the readable spelling.
  await page.goto(`${BASE}/tires?vy=2019&vmk=Ford&vmd=F-150&brands=Continental`);
  await waitBar(page, /2019 Ford F-150/);
  await page.waitForFunction(() => location.search === "?year=2019&make=ford&model=f-150&brand=continental");

  // Junk is dropped, never guessed at; a campaign id is kept for analytics.
  await page.goto(`${BASE}/tires?size=banana&year=1850&make=%3Cb%3E&season=monsoon&sort=random&utm_source=x`);
  await waitBar(page, /2019 Ford F-150/);
  await page.waitForFunction(() => location.search === "?year=2019&make=ford&model=f-150&utm_source=x");
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("390 cleared site data: Shop Tires shows the finder again", async () => {
  const { context, page, errors } = await open(390);
  await page.goto(`${BASE}/tires`);
  await pickVehicleInFinder(page, { year: "2019", make: "Ford", model: "F-150" });
  await waitBar(page, /2019 Ford F-150/);
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/`);
  await page.waitForFunction(mounted);
  await clickShopTires(page, 390);
  await finder(page).waitFor();
  await waitBar(page, /no vehicle picked yet/);
  assert.equal(await page.evaluate(() => location.search), "");
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("390 storage blocked (private mode): remembered for the visit, finder again after a reload, no errors", async () => {
  const { context, page, errors } = await open(390, { blockStorage: true });
  await page.goto(`${BASE}/tires`);
  await pickVehicleInFinder(page, { year: "2019", make: "Ford", model: "F-150" });
  await waitBar(page, /2019 Ford F-150/);
  assert.equal(await stored(page), "blocked");
  // Within the visit it is remembered in memory.
  await page.locator('a[href="/"]').first().click();
  await page.waitForURL(`${BASE}/`);
  await clickShopTires(page, 390);
  await waitBar(page, /2019 Ford F-150/);
  assert.equal(await page.evaluate(() => window.__finderSeen), false);
  // A reload forgets it.
  await page.goto(`${BASE}/tires`);
  await finder(page).waitFor();
  await waitBar(page, /no vehicle picked yet/);
  assert.deepEqual(real(errors), []);
  await context.close();
});

/* ------------------------------- filters ------------------------------- */

await check("1440 filters: sidebar writes readable params, counts update, reload keeps them, Back restores, chips, Clear all", async () => {
  const { context, page, errors } = await open(1440);
  await page.goto(`${BASE}/tires`);
  await page.waitForFunction(mounted);
  const side = page.locator('[data-testid="tire-filters"]');
  const total = Number(await side.locator("p.tnum span").first().innerText());
  assert.equal(total, 20);

  await side.getByRole("checkbox", { name: /^All-season/ }).check();
  await page.waitForFunction(() => location.search === "?season=all-season");
  await side.getByRole("checkbox", { name: /^Continental/ }).check();
  await page.waitForFunction(() => location.search === "?season=all-season&brand=continental");
  await side.getByRole("button", { name: "Treadwear warranty" }).click();
  await side.getByRole("radio", { name: /^70,000\+ miles/ }).check();
  await page.waitForFunction(() => /warranty=70000/.test(location.search));
  await page.selectOption("#tire-sort", "warranty");
  await page.waitForFunction(() => /sort=warranty$/.test(location.search));
  const n = Number(await side.locator("p.tnum span").first().innerText());
  assert.ok(n > 0 && n < total, `filtered count ${n}`);
  assert.equal(await page.locator("article").count(), n);
  // A brand's count does not shrink for its own group.
  assert.match(await side.getByRole("checkbox", { name: /^Pirelli/ }).locator("..").innerText(), /\d/);
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    const top = document.querySelector('[data-testid="tire-filters"]').getBoundingClientRect().top;
    window.scrollBy(0, top - 180);
  });
  await page.screenshot({ path: `${SHOTS}/filters-sidebar-1440.png`, fullPage: false });

  const url = page.url();
  await page.reload();
  await page.waitForFunction(mounted);
  assert.equal(page.url(), url);
  assert.ok(await side.getByRole("checkbox", { name: /^All-season/ }).isChecked());
  assert.equal(await page.locator("article").count(), n);

  // Into a product and Back: the filtered list again.
  await page.locator("article a[href^='/tires/']").first().click();
  await page.waitForURL(/\/tires\/[a-z0-9-]+$/);
  await page.goBack();
  await page.waitForURL(url);
  assert.ok(await side.getByRole("checkbox", { name: /^Continental/ }).isChecked());

  // A chip removes its one filter; Clear all the rest.
  await page.getByRole("button", { name: "Remove filter Continental" }).click();
  await page.waitForFunction(() => !/brand=/.test(location.search));
  await page.getByRole("button", { name: "Clear all" }).last().click();
  await page.waitForFunction(() => location.search === "?sort=warranty");
  assert.equal(await page.locator("article").count(), 20);

  // Nothing matches: Clear filters and the phone number.
  await page.goto(`${BASE}/tires?season=winter&type=commercial`);
  await page.getByRole("heading", { name: "No tires match those filters" }).waitFor();
  assert.equal(await page.locator('a[href="tel:+19547731896"]').filter({ hasText: "Call (954) 773-1896" }).count() >= 1, true);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.waitForFunction(() => location.search === "");
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("390 filters: the sheet, Show N tires, chips, Clear all", async () => {
  const { context, page, errors } = await open(390);
  await page.goto(`${BASE}/tires`);
  await page.waitForFunction(mounted);
  await page.getByRole("button", { name: /^Filters/ }).click();
  const sheet = page.getByRole("dialog", { name: "Filter tires" });
  await sheet.waitFor();
  await sheet.getByRole("checkbox", { name: /^Winter/ }).check();
  await page.waitForFunction(() => location.search === "?season=winter");
  await sheet.getByRole("button", { name: "Show 2 tires" }).waitFor();
  await sheet.getByRole("checkbox", { name: /^Summer/ }).check();
  await page.waitForFunction(() => location.search === "?season=summer,winter");
  await sheet.getByRole("button", { name: /^Show 5 tires/ }).waitFor();
  await page.screenshot({ path: `${SHOTS}/filter-sheet-390.png` });
  // Each target is at least 44px tall.
  const small = await sheet.locator("label:has(input), button").evaluateAll((els) =>
    els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim()),
  );
  assert.deepEqual(small, []);
  await sheet.getByRole("button", { name: /^Show 5 tires/ }).click();
  await sheet.waitFor({ state: "detached" });
  assert.equal(await page.locator("article").count(), 5);
  await page.reload();
  await page.waitForFunction(mounted);
  assert.equal(await page.locator("article").count(), 5);
  await page.getByRole("button", { name: "Remove filter Summer" }).click();
  await page.waitForFunction(() => location.search === "?season=winter");
  await page.getByRole("button", { name: /^Filters \(1\)/ }).click();
  await sheet.getByRole("button", { name: "Clear all" }).click();
  await page.waitForFunction(() => location.search === "");
  await sheet.getByRole("button", { name: "Show 20 tires" }).waitFor();
  assert.deepEqual(real(errors), []);
  await context.close();
});

await check("hard loads: bare /tires hydrates in place with a saved vehicle, filtered URLs render fresh; no errors or hydration warnings", async () => {
  const { context, page, errors } = await open(1440);
  await page.addInitScript(([k]) => {
    localStorage.setItem(k, JSON.stringify({ v: 1, type: "vehicle", year: "2019", make: "Ford", model: "F-150" }));
  }, [KEY]);
  // The prerendered /tires is the nothing-saved page; the saved vehicle
  // arrives after hydration and is written into the URL.
  for (const q of ["", "?utm_source=mail"]) {
    errors.length = 0;
    await page.goto(`${BASE}/tires${q}`, { waitUntil: "load" });
    await page.waitForFunction(mounted);
    await page.waitForLoadState("networkidle");
    await waitBar(page, /2019 Ford F-150/);
    assert.ok(await page.evaluate(() => window.__servedH1 === document.querySelector("h1")), `hydrated in place: /tires${q}`);
    assert.equal(query(page), `?year=2019&make=ford&model=f-150${q ? "&utm_source=mail" : ""}`);
    assert.deepEqual(real(errors), [], q);
  }
  // A page query renders fresh (src/main.jsx), so it can never mismatch.
  for (const q of [
    "?year=2019&make=ford&model=f-150&brand=continental",
    "?season=all-season&price=100-200&sort=price-asc",
    "?size=265-70r17&type=all-terrain",
  ]) {
    errors.length = 0;
    await page.goto(`${BASE}/tires${q}`, { waitUntil: "load" });
    await page.waitForFunction(mounted);
    await page.waitForLoadState("networkidle");
    await page.locator('[data-testid="shopping-for-text"]').waitFor();
    assert.deepEqual(real(errors), [], q);
  }
  // The canonical stays /tires, whatever the query.
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://tiredroponline.com/tires",
  );
  await context.close();
});

await browser.close();
stopServer();
if (failures) {
  console.log(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nall remember checks passed");
