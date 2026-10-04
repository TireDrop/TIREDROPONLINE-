/**
 * /local-delivery on the built site, at 360px and 1440px.
 *
 *   npm run build && npm run check:local-delivery
 *
 * - JavaScript off: the map renders with its one text alternative and a pin
 *   per hub, every pin decorative, and the ZIP form says it needs JavaScript.
 * - JavaScript on: no sideways scroll; a zone ZIP, an out-of-zone ZIP (with
 *   a /tires link) and a bad ZIP each get their answer; a ?zip= in the URL is
 *   answered on load; "Use my location" answers for a granted position and
 *   explains a denied one; a failed zone fetch says so and a retry recovers.
 * - On load, with no click (360px and 1440px): an allowed device location
 *   is answered (Miami in zone, Missoula out); a mocked /api/geo U.S. ZIP is
 *   prefilled and answered as approximate, without moving the note below;
 *   a "no" keeps the approximate answer, and a click on "Use my location"
 *   then explains how to turn it on (iPhone and desktop wording); ?zip= and
 *   typing switch the automatic check off.
 * - Place names (the geocoder host is mocked, the live call cannot be
 *   reached from CI): the connection answer names the city and state, no ZIP;
 *   an allowed device location is named from the mocked reverse geocode
 *   ("near Wynwood, Miami, FL"); a failing, empty or slow geocoder leaves
 *   "Using your device location:" with no error; the request carries only the
 *   rounded latitude, longitude and language; a ZIP or street in the reply is
 *   never shown; nothing is stored (localStorage, sessionStorage, cookies);
 *   a long name moves nothing below the answer; the home page requests the
 *   geocoder never.
 * - The live layer (src/components/delivery/deliveryTrucks.js, imported
 *   after the page is idle): the prerendered HTML and the JS-off page do not
 *   know it; with JS on, trucks run shortly after idle (about 34, fewer on a
 *   phone) with no play or pause button, the "Simulated deliveries" counter
 *   and the "Simulated. Not live tracking." legend, and moving them shifts
 *   nothing. ZIP 33351 zooms the map to its area with a "You are here" pin
 *   and "Show whole map" restores it; 99999 and other non-contiguous ZIPs do
 *   not zoom; 59801 zooms and says how far the nearest zone is (a multiple of
 *   5). An allowed device location zooms too. A hub tap (pointer or key)
 *   shows a "Delivery hub" bubble, a truck tap a simulated cargo bubble, Esc
 *   clears, and arrow keys move between the "Delivery hub N of 105" buttons.
 *   With reduced motion emulated the trucks are parked and nothing moves,
 *   with the "Animation is off…" line. The home page requests no truck
 *   module, centroid file or zone file.
 * - vercel.json still allows geolocation for our own pages (the real site's
 *   Permissions-Policy, which vite preview does not send).
 * - No console errors.
 *
 * SHOTS_DIR=<dir> also saves screenshots (hero, map, in zone, out of zone,
 * auto device, auto approximate) per width.
 *
 * Starts `vite preview` on LOCAL_DELIVERY_PORT (default 4383), or tests
 * LOCAL_DELIVERY_BASE when that is set to a running server.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.LOCAL_DELIVERY_PORT ?? 4383);
const SHOTS = process.env.SHOTS_DIR;
const MAP = JSON.parse(readFileSync("src/data/deliveryHubs.generated.json", "utf8"));
const LABEL = `Map of the U.S. showing ${MAP.hubs.length} local delivery hubs`;
const IN_ZONE = "You're in a local delivery zone.";
const N = MAP.hubs.length;

let failures = 0;
const ok = (msg) => console.log(`ok   ${msg}`);
const bad = (msg) => {
  failures++;
  console.log(`FAIL ${msg}`);
};
const check = (cond, msg) => (cond ? ok : bad)(msg);

if (!existsSync("dist/local-delivery.html")) {
  console.error("No prerendered /local-delivery in dist/. Run `npm run build` first.");
  process.exit(1);
}
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/* ------------------------------ preview ------------------------------ */

const stopPreview = (child) =>
  process.platform === "win32" ? child.kill() : process.kill(-child.pid);
let server = null;
let BASE = process.env.LOCAL_DELIVERY_BASE;
if (!BASE) {
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

async function newPage(
  width,
  { js = true, geo, path = "/local-delivery", geoApi, init, userAgent, before } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 800 : 900 },
    javaScriptEnabled: js,
    hasTouch: width < 800,
    ...(userAgent ? { userAgent } : {}),
    ...(geo ? { geolocation: geo, permissions: ["geolocation"] } : {}),
  });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of 404|Failed to load resource/.test(m.text()))
      errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route((url) => url.host !== local, (r) => r.fulfill({ status: 200, body: "" }));
  await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
  if (geoApi)
    await page.route("**/api/geo", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(geoApi) }),
    );
  if (before) await before(page);
  await page.goto(BASE + path, { waitUntil: "load" });
  return { context, page, errors };
}

const result = (page) => page.locator("#zip-check [aria-live]");
const checkZip = async (page, zip) => {
  await page.getByLabel("ZIP code").fill(zip);
  await page.getByRole("button", { name: "Check my ZIP" }).click();
};
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, name), fullPage: false });
};

try {
  /* ------------------------------ JS off ------------------------------ */
  {
    const { context, page } = await newPage(360, { js: false });
    const svg = page.locator(`svg[role="img"][aria-label="${LABEL}"]`);
    check((await svg.count()) === 1, `JS off: the map renders, labelled "${LABEL}"`);
    const pins = await svg.locator('g[aria-hidden="true"] > g').count();
    check(pins === MAP.hubs.length, `JS off: ${pins} pins for ${MAP.hubs.length} hubs`);
    const named = await svg.locator("title, text, [aria-label]:not(svg)").count();
    check(named === 0, "JS off: the map has one text alternative (no titles or text inside)");
    const html = readFileSync("dist/local-delivery.html", "utf8");
    check(/<noscript>[^<]*<p[^>]*>[^<]*needs JavaScript/.test(html), "JS off: the ZIP form says it needs JavaScript");
    check(/rolling out/i.test(await page.locator("h1").evaluate((h) => h.closest("header").textContent)), "JS off: hero copy says rolling out");
    await context.close();
  }

  for (const width of [360, 1440]) {
    const { context, page, errors } = await newPage(width);
    await page.waitForLoadState("networkidle");
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(sideways <= 0, `${width}: no sideways scroll (${sideways}px over)`);
    await shot(page, `${width}-hero.png`);

    const svg = page.locator(`svg[aria-label="${LABEL}"]`);
    await svg.scrollIntoViewIfNeeded();
    const box = await svg.boundingBox();
    check(box && box.width >= Math.min(width * 0.8, 600) && box.width <= width, `${width}: map is ${Math.round(box?.width)}px wide`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("figure").scrollIntoViewIfNeeded();
    await shot(page, `${width}-map.png`);

    const btn = page.getByRole("button", { name: "Check my ZIP" });
    const h = (await btn.boundingBox())?.height ?? 0;
    check(h >= 44, `${width}: Check my ZIP is ${h}px tall`);

    await checkZip(page, "33351");
    await result(page).getByText(IN_ZONE).waitFor();
    ok(`${width}: 33351 is in a zone`);
    await page.locator("#zip-check").scrollIntoViewIfNeeded();
    await shot(page, `${width}-in-zone.png`);

    await checkZip(page, "59801");
    await result(page).getByText("isn’t in a local delivery zone yet").waitFor();
    check(
      (await result(page).locator('a[href="/tires"]').count()) === 1,
      `${width}: 59801 is out of zone, with free shipping and a /tires link`,
    );
    await shot(page, `${width}-out-of-zone.png`);

    await checkZip(page, "123");
    await result(page).getByText("Enter a five-digit ZIP code").waitFor();
    ok(`${width}: a bad ZIP is explained`);

    check(errors.length === 0, `${width}: no console errors ${errors.join(" | ")}`);
    await context.close();
  }


  /* ---------------- trucks, zoom and tap to explore (JS on) ---------------- */
  const mapSvg = (page) => page.locator(`svg[aria-label="${LABEL}"]`);
  const viewW = (page) =>
    mapSvg(page).evaluate((el) => Number(el.getAttribute("viewBox").split(/\s+/)[2]));
  const liveReady = (page) => page.waitForSelector("svg [data-truck]", { state: "attached", timeout: 15000 });
  const shownTrucks = (page) =>
    page.evaluate(
      () => [...document.querySelectorAll("svg [data-truck]")].filter((g) => Number(g.getAttribute("opacity")) > 0.3).length,
    );
  const truckState = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll("svg [data-truck]")]
        .map((g) => `${g.getAttribute("transform")}|${g.getAttribute("opacity")}`)
        .join(";"),
    );
  const bubble = (page) => page.locator("figure div[aria-hidden='true'].shadow-lift");
  const layoutShift = (page) =>
    page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });

  for (const width of [360, 1440]) {
    const { context, page, errors } = await newPage(width, { init: () => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    } });
    const t0 = Date.now();
    await liveReady(page);
    ok(`${width}: trucks are on the map ${Date.now() - t0} ms after load (imported when idle)`);
    await page.waitForTimeout(800);
    const shown = await shownTrucks(page);
    const cap = width < 520 ? 22 : 34;
    check(shown >= 8 && shown <= cap + 1, `${width}: ${shown} trucks running (at most ${cap + 1})`);
    check(
      (await page.locator("figure").getByRole("button", { name: /play|pause/i }).count()) === 0,
      `${width}: no play or pause button`,
    );
    check((await page.locator("figure").getByText("Simulated. Not live tracking.").count()) === 1, `${width}: legend says "Simulated. Not live tracking."`);
    check((await page.locator("figure").getByText("Simulated deliveries").count()) === 1, `${width}: the "Simulated deliveries" counter is up`);
    const count = Number(await page.locator("figure b").first().textContent());
    check(count > 0, `${width}: the pre-roll already counts deliveries (${count})`);
    const named = await mapSvg(page).locator("title, [aria-label]:not(svg)").count();
    check(named === 0, `${width}: the map still has one text alternative`);
    check(
      (await page.locator("figure svg [data-trucks], figure svg [data-houses], figure svg [data-you-are-here]").evaluateAll((els) => els.every((e) => e.getAttribute("aria-hidden") === "true"))),
      `${width}: trucks, houses and the pin are aria-hidden`,
    );
    const hubBtns = page.locator('figure [aria-label^="Delivery hub "]');
    check((await hubBtns.count()) === N, `${width}: ${N} hub buttons`);
    check((await page.locator(`[aria-label="Delivery hub 1 of ${N}"]`).count()) === 1, `${width}: labelled "Delivery hub 1 of ${N}"`);
    const bh = await hubBtns.first().evaluate((b) => b.getBoundingClientRect().height);
    check(bh >= 44, `${width}: hub buttons are ${bh}px tall`);
    const cls = await page.evaluate(() => window.__cls);
    check(cls < 0.01, `${width}: layout shift ${cls.toFixed(4)} through load and trucks`);
    await shot(page, `${width}-trucks.png`);

    // Zoom: a zone ZIP, then back out.
    check((await viewW(page)) === 975, `${width}: starts on the whole map`);
    await checkZip(page, "33351");
    await result(page).getByText(IN_ZONE).waitFor();
    check(
      (await result(page).getByText("A truck is heading to a house near you.").count()) === 1,
      `${width}: an in-zone answer says a truck is heading to a house`,
    );
    await page.waitForFunction(() => Number(document.querySelector("svg[role=img]").getAttribute("viewBox").split(" ")[2]) < 200, null, { timeout: 5000 });
    const zw = await viewW(page);
    check(zw >= 130 && zw <= 400, `${width}: 33351 zooms to its area (${Math.round(zw)} units wide)`);
    const pinShown = await page.locator("figure svg [data-you-are-here]").evaluate((g) => g.style.display !== "none");
    check(pinShown, `${width}: "You are here" pin is up`);
    const back = page.getByRole("button", { name: "Show whole map" });
    await back.waitFor();
    check(((await back.boundingBox())?.height ?? 0) >= 44, `${width}: Show whole map is a 44px target`);
    await page.waitForTimeout(900);
    const zoomedPins = await page.evaluate(() => document.querySelectorAll("svg [data-trucks] [data-truck]").length);
    check(zoomedPins > 0, `${width}: trucks keep running while zoomed`);
    await shot(page, `${width}-zoomed-in-zone.png`);
    await back.click();
    await page.waitForFunction(() => Number(document.querySelector("svg[role=img]").getAttribute("viewBox").split(" ")[2]) > 974, null, { timeout: 5000 });
    check((await page.getByRole("button", { name: "Show whole map" }).count()) === 0 || !(await page.getByRole("button", { name: "Show whole map" }).isVisible()), `${width}: Show whole map hides again`);
    ok(`${width}: Show whole map restores the full map`);

    // Out of zone, but in the lower 48: zoom plus the distance (a multiple of 5).
    await checkZip(page, "59801");
    await result(page).getByText("isn’t in a local delivery zone yet").waitFor();
    const gap = /Nearest delivery zone is about (\d+) miles away\./.exec(await result(page).textContent());
    check(gap && Number(gap[1]) % 5 === 0 && Number(gap[1]) >= 5, `${width}: 59801 says how far the nearest zone is (${gap?.[1]} miles)`);
    await page.waitForFunction(() => Number(document.querySelector("svg[role=img]").getAttribute("viewBox").split(" ")[2]) < 975, null, { timeout: 5000 });
    ok(`${width}: 59801 zooms too, with no truck sent`);
    await page.getByRole("button", { name: "Show whole map" }).click();

    // Not in the lower 48: no zoom, no pin, no distance.
    await page.waitForFunction(() => Number(document.querySelector("svg[role=img]").getAttribute("viewBox").split(" ")[2]) > 974, null, { timeout: 5000 });
    await checkZip(page, "99999");
    await result(page).getByText("isn’t in a local delivery zone yet").waitFor();
    await page.waitForTimeout(900);
    check((await viewW(page)) === 975, `${width}: 99999 does not zoom`);
    check(!/Nearest delivery zone/.test(await result(page).textContent()), `${width}: 99999 gets no distance line`);
    check(
      !(await page.locator("figure svg [data-you-are-here]").evaluate((g) => g.style.display !== "none")),
      `${width}: 99999 shows no pin`,
    );

    // Tap a hub (pointer), then Esc.
    await page.locator("figure").scrollIntoViewIfNeeded();
    const box = await mapSvg(page).boundingBox();
    const isolated = MAP.hubs.findIndex((h, i) =>
      MAP.hubs.every((o, j) => i === j || Math.hypot(o.x - h.x, o.y - h.y) > 45) && h.x > 150 && h.x < 850,
    );
    const hh = MAP.hubs[isolated];
    const pinHalf = 10 * (width < 640 ? 1.5 : width < 1024 ? 1.3 : 1.2) * (box.width / 975);
    await page.mouse.click(box.x + (hh.x / 975) * box.width, box.y + (hh.y / 610) * box.height - pinHalf);
    await bubble(page).first().waitFor({ state: "visible" });
    const said = await bubble(page).first().textContent();
    check(/Delivery hub/.test(said) && /simulated deliver/i.test(said), `${width}: a hub tap shows "${said}"`);
    check(
      new RegExp(`^Delivery hub \\d+ of ${N}\\.`).test((await page.locator("figure [role=status]").textContent()).trim()),
      `${width}: the tap is announced in the live region`,
    );
    check(!/Approximate zone/.test(said) && !/[A-Z][a-z]+, [A-Z]{2}/.test(said), `${width}: the bubble names no place`);
    await shot(page, `${width}-hub-tap.png`);
    await page.keyboard.press("Escape");
    await bubble(page).first().waitFor({ state: "hidden" });
    ok(`${width}: Esc clears the bubble`);

    // Tap a truck.
    let truckSaid = null;
    for (let tries = 0; tries < 8 && !truckSaid; tries++) {
      const spot = await page.evaluate(() => {
        const svgEl = document.querySelector("svg[role=img]").getBoundingClientRect();
        const t = [...document.querySelectorAll("svg [data-truck]")].find((g) => {
          const r = g.getBoundingClientRect();
          return Number(g.getAttribute("opacity")) > 0.9 && r.width > 4 && r.left > svgEl.left + 8 && r.right < svgEl.right - 8;
        });
        if (!t) return null;
        const r = t.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      if (!spot) {
        await page.waitForTimeout(300);
        continue;
      }
      await page.mouse.click(spot.x, spot.y);
      await page.waitForTimeout(80);
      const text = (await bubble(page).first().textContent().catch(() => "")) ?? "";
      if (/Simulated$/.test(text) && (await bubble(page).first().isVisible())) truckSaid = text;
    }
    check(truckSaid && /(tire|wheel|set of 4)/i.test(truckSaid), `${width}: a truck tap shows a simulated cargo bubble ("${truckSaid}")`);
    await page.keyboard.press("Escape");

    // Keyboard: one tab stop, arrows rove, Enter selects.
    await page.locator(`[aria-label="Delivery hub 1 of ${N}"]`).focus();
    await page.keyboard.press("ArrowRight");
    check(
      (await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))) === `Delivery hub 2 of ${N}`,
      `${width}: ArrowRight moves to the next hub`,
    );
    check(
      (await page.locator('figure [aria-label^="Delivery hub "][tabindex="0"]').count()) === 1,
      `${width}: roving tabindex keeps one hub in the tab order`,
    );
    await page.keyboard.press("End");
    check(
      (await page.evaluate(() => document.activeElement?.getAttribute("aria-label"))) === `Delivery hub ${N} of ${N}`,
      `${width}: End goes to the last hub`,
    );
    await page.keyboard.press("Enter");
    await bubble(page).first().waitFor({ state: "visible" });
    check(
      (await page.locator(`[aria-label="Delivery hub ${N} of ${N}"]`).getAttribute("aria-pressed")) === "true",
      `${width}: Enter on a hub selects it (aria-pressed)`,
    );
    await page.keyboard.press("Escape");
    check(errors.length === 0, `${width}: live layer: no console errors ${errors.join(" | ")}`);
    await context.close();
  }

  {
    // Reduced motion: parked trucks, a few houses, nothing moves.
    for (const width of [360, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.route((url) => url.host !== local, (r) => r.fulfill({ status: 200, body: "" }));
      await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
      await page.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(BASE + "/local-delivery", { waitUntil: "load" });
      await liveReady(page);
      await page.waitForTimeout(500);
      const a = await truckState(page);
      await page.waitForTimeout(1500);
      const b = await truckState(page);
      const parked = await shownTrucks(page);
      check(parked >= 10, `${width}: reduced motion: ${parked} parked trucks`);
      check(a === b, `${width}: reduced motion: nothing moved in 1.5 s`);
      const houses = await page.evaluate(() => [...document.querySelectorAll("svg [data-houses] > g")].filter((g) => Number(g.getAttribute("opacity")) > 0.5).length);
      check(houses >= 3 && houses <= 12, `${width}: reduced motion: ${houses} still houses`);
      check(
        (await page.locator("figure").getByText("Animation is off because your device asks for reduced motion.").count()) === 1,
        `${width}: reduced motion: says the animation is off`,
      );
      check((await page.locator("figure").getByText("Simulated deliveries").isVisible().catch(() => false)) === false, `${width}: reduced motion: no counter`);
      await checkZip(page, "33351");
      await result(page).getByText(IN_ZONE).waitFor();
      await page.waitForFunction(() => Number(document.querySelector("svg[role=img]").getAttribute("viewBox").split(" ")[2]) < 200, null, { timeout: 2000 });
      ok(`${width}: reduced motion: the zoom still happens, at once`);
      const c = await truckState(page);
      await page.waitForTimeout(800);
      check(c === (await truckState(page)), `${width}: reduced motion: still nothing moves after the zoom`);
      check((await page.evaluate(() => window.__cls)) < 0.01, `${width}: reduced motion: no layout shift`);
      await shot(page, `${width}-reduced-motion.png`);
      await context.close();
    }
  }

  {
    // The prerendered page and the JS-off page know nothing of the live layer.
    const html = readFileSync("dist/local-delivery.html", "utf8");
    check(!/deliveryTrucks|deliverySim|local-delivery-areas/.test(html), "prerendered /local-delivery does not reference the truck module or the centroid file");
    check(!/Delivery hub \d+ of/.test(html) && !/data-truck/.test(html), "prerendered /local-delivery has no hub buttons or trucks");
    const { context, page } = await newPage(360, { js: false });
    check((await page.locator("[data-truck], [data-you-are-here]").count()) === 0, "JS off: no trucks");
    await context.close();
  }

  {
    // The home page card stays static: no truck module, centroids or zone file, ever.
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const seen = [];
    page.on("request", (r) => seen.push(r.url()));
    await page.route((url) => url.host !== local, (r) => r.fulfill({ status: 200, body: "" }));
    await page.route("**/api/**", (r) => r.fulfill({ status: 404, body: "" }));
    await page.goto(BASE + "/", { waitUntil: "load" });
    await page.waitForTimeout(3500); // well past idle
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(800);
    const bad = seen.filter((u) => /deliveryTrucks|deliverySim|local-delivery-areas|local-delivery-zips|LocalDeliveryPage/.test(u));
    check(bad.length === 0, `home page: no truck module, centroid or zone file requested (${bad.join(", ") || "none of " + seen.length + " requests"})`);
    check((await page.locator("[data-truck], [data-trucks]").count()) === 0, "home page: no trucks in the DOM");
    await context.close();
  }

  {
    // The module is fetched only after load, never in the critical path.
    const { context, page } = await newPage(1440);
    await liveReady(page);
    const late = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const res = performance.getEntriesByType("resource").find((r) => /deliveryTrucks/.test(r.name));
      return res && nav ? res.startTime - nav.loadEventStart : null;
    });
    check(late !== null && late >= -5, `the truck module is requested after the load event (${late?.toFixed(0)} ms after)`);
    await context.close();
  }

  /* --------------------------- ?zip= on load --------------------------- */
  {
    const { context, page } = await newPage(360, { path: "/local-delivery?zip=10001" });
    await result(page).getByText(IN_ZONE).waitFor();
    ok("?zip=10001 is answered on load");
    await context.close();
  }

  /* ---------------------------- geolocation ---------------------------- */
  {
    const hub = MAP.hubs[0];
    const { context, page } = await newPage(360, { geo: { latitude: hub.lat + 0.1, longitude: hub.lng } });
    await page.getByRole("button", { name: "Use my location" }).click();
    await result(page).getByText(IN_ZONE).waitFor();
    ok("location near a hub: in a zone");
    await context.close();
  }
  {
    const { context, page } = await newPage(360, { geo: { latitude: 46.87, longitude: -113.99 } });
    await page.getByRole("button", { name: "Use my location" }).click();
    await result(page).getByText("Using your device location: you aren’t in a local delivery zone yet").waitFor();
    ok("location far from every hub: out of zone");
    await context.close();
  }
  {
    // The visitor says no: the browser answers PERMISSION_DENIED (code 1).
    const { context, page } = await newPage(360, { path: "/" });
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_ok, fail) =>
        setTimeout(() => fail({ code: 1, message: "User denied Geolocation" }));
    });
    await page.goto(BASE + "/local-delivery", { waitUntil: "load" });
    await page.getByRole("button", { name: "Use my location" }).click();
    await result(page).getByText("Location access is off").waitFor();
    check(
      /address bar/.test(await result(page).textContent()),
      "location denied: explained (desktop: the address bar lock), ZIP suggested",
    );
    await context.close();
  }


  /* ------------------------ automatic, on load ------------------------ */
  {
    const policy = JSON.parse(readFileSync("vercel.json", "utf8"))
      .headers.flatMap((h) => h.headers)
      .find((h) => h.key === "Permissions-Policy")?.value;
    check(/(^|, )geolocation=\(self\)(,|$)/.test(policy ?? ""), "vercel.json: Permissions-Policy has geolocation=(self)");
  }
  const MIAMI = { latitude: 25.77, longitude: -80.19 };
  const MISSOULA = { latitude: 46.87, longitude: -113.99 };
  const DENY = () => {
    navigator.geolocation.getCurrentPosition = (_ok, fail) =>
      setTimeout(() => fail({ code: 1, message: "User denied Geolocation" }), 50);
  };
  const IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const note = (page) => page.locator("#zip-check > p").last();

  for (const width of [360, 1440]) {
    {
      const { context, page, errors } = await newPage(width, { geo: MIAMI });
      await result(page).getByText(`Using your device location: ${IN_ZONE}`).waitFor();
      ok(`${width}: allowed device location in Miami is answered on load, in zone, no click`);
      await page.locator("#zip-check").scrollIntoViewIfNeeded();
      await shot(page, `${width}-auto-device-in.png`);
      check(errors.length === 0, `${width}: auto device: no console errors ${errors.join(" | ")}`);
      await context.close();
    }
    {
      const { context, page } = await newPage(width, { geo: MISSOULA });
      await result(page)
        .getByText("Using your device location: you aren’t in a local delivery zone yet")
        .waitFor();
      ok(`${width}: allowed device location in Missoula is answered on load, out of zone`);
      await page.locator("#zip-check").scrollIntoViewIfNeeded();
      await shot(page, `${width}-auto-device-out.png`);
      await context.close();
    }
    {
      // Approximate only: the visitor says no to the device prompt.
      const { context, page, errors } = await newPage(width, {
        geoApi: { country: "US", zip: "33351", city: "Sunrise", region: "FL" },
        init: DENY,
      });
      const before = await note(page).boundingBox();
      await result(page)
        .getByText(`Based on your connection, you’re near Sunrise, FL: ${IN_ZONE}`)
        .waitFor();
      check(!/\b33351\b/.test(await result(page).textContent()), `${width}: the approximate line shows the city, no ZIP`);
      check(
        (await page.getByLabel("ZIP code").inputValue()) === "33351",
        `${width}: /api/geo ZIP 33351 is prefilled and answered as approximate`,
      );
      await page.waitForFunction(() => sessionStorage.getItem("td-geo-denied") === "1");
      await page.waitForTimeout(300);
      check(
        /Based on your connection/.test(await result(page).textContent()),
        `${width}: a "no" to the device prompt keeps the approximate answer, quietly`,
      );
      const after = await note(page).boundingBox();
      check(
        Math.abs((after?.y ?? 0) - (before?.y ?? 0)) < 1,
        `${width}: the answer moved nothing below it (${before?.y} -> ${after?.y})`,
      );
      await page.locator("#zip-check").scrollIntoViewIfNeeded();
      await shot(page, `${width}-auto-approx.png`);
      await page.getByRole("button", { name: "Use my location" }).click();
      await result(page).getByText("Location access is off").waitFor();
      check(/address bar/.test(await result(page).textContent()), `${width}: after a "no", a click explains the address bar setting`);
      check(errors.length === 0, `${width}: auto approximate: no console errors ${errors.join(" | ")}`);
      await context.close();
    }
  }
  {
    // Out of zone from the connection, and the iPhone settings path.
    const { context, page } = await newPage(360, {
      geoApi: { available: true, country: "US", zip: "59801", lat: 46.87, lng: -113.99, city: "Missoula", region: "MT" },
      init: DENY,
      userAgent: IPHONE,
    });
    await result(page)
      .getByText("Based on your connection, you’re near Missoula, MT: that area isn’t in a local delivery zone yet")
      .waitFor();
    ok("approximate ZIP out of zone is labelled as approximate");
    await page.waitForFunction(() => sessionStorage.getItem("td-geo-denied") === "1");
    await page.getByRole("button", { name: "Use my location" }).click();
    await result(page).getByText("Safari Websites").waitFor();
    ok("iPhone: a denied location points to Settings > Privacy & Security > Location Services > Safari Websites");
    // Same session: no second automatic prompt.
    let asked = 0;
    await page.exposeFunction("__asked", () => asked++);
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = () => window.__asked();
    });
    await page.reload({ waitUntil: "load" });
    await result(page).getByText("Based on your connection").waitFor();
    await page.waitForTimeout(500);
    check(asked === 0, `after a "no", the next load in the session doesn't ask again (${asked} asks)`);
    await context.close();
  }
  {
    // Outside the U.S. (or no answer): nothing shows on its own.
    const { context, page } = await newPage(360, {
      geoApi: { available: true, country: "CA", zip: null, lat: 45.4, lng: -75.7, city: "Ottawa" },
      init: DENY,
    });
    await page.waitForFunction(() => sessionStorage.getItem("td-geo-denied") === "1");
    check((await result(page).textContent()).trim() === "", "outside the U.S.: no automatic answer");
    await context.close();
  }
  {
    // ?zip= wins: the device location must not replace it.
    const { context, page } = await newPage(360, { geo: MISSOULA, path: "/local-delivery?zip=10001" });
    await result(page).getByText(IN_ZONE).waitFor();
    await page.waitForTimeout(800);
    const text = await result(page).textContent();
    check(/10001/.test(text) && !/device location/.test(text), "?zip= on load: no automatic location check");
    await context.close();
  }
  {
    // Typing first: the automatic answer stays out of the way.
    const { context, page } = await newPage(360, {
      geoApi: { country: "US", zip: "33351" },
      init: () => {
        const real = window.fetch;
        window.fetch = (u, o) =>
          String(u).includes("/api/geo") ? new Promise((r) => setTimeout(() => r(real(u, o)), 600)) : real(u, o);
        navigator.geolocation.getCurrentPosition = (_ok, fail) => fail({ code: 1 });
      },
    });
    await page.getByLabel("ZIP code").pressSequentially("5980");
    await page.waitForTimeout(1200);
    check(
      (await page.getByLabel("ZIP code").inputValue()) === "5980" && !/connection/.test(await result(page).textContent()),
      "typing before the automatic answer: it never overwrites the field or the result",
    );
    await context.close();
  }


  /* ------------------------------ place names ------------------------------ */
  {
    const GEOCODER = "api.bigdatacloud.net";
    const WYNWOOD = {
      latitude: 25.8009,
      longitude: -80.1991,
      locality: "Wynwood",
      city: "Miami",
      principalSubdivision: "Florida",
      principalSubdivisionCode: "US-FL",
      countryCode: "US",
      postcode: "33127",
      streetName: "NW 2nd Ave",
      houseNumber: "2520",
    };
    // Mocks the geocoder host and records every request made to it.
    const mockGeocoder = (calls, respond) => async (page) => {
      await page.route(`https://${GEOCODER}/**`, (r) => {
        calls.push(r.request().url());
        return respond(r);
      });
    };
    const json = (body) => (r) =>
      r.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body),
      });
    const MIAMI_PRECISE = { latitude: 25.800912345, longitude: -80.199149876 };
    const stored = (page) =>
      page.evaluate(() => ({
        local: JSON.stringify({ ...localStorage }),
        session: JSON.stringify({ ...sessionStorage }),
        cookie: document.cookie,
      }));

    for (const width of [360, 1440]) {
      // (b) the device location is named, (d) the request is minimal, (e) nothing is stored.
      {
        const calls = [];
        const { context, page, errors } = await newPage(width, {
          geo: MIAMI_PRECISE,
          geoApi: { country: "US", zip: "33351", city: "Sunrise", region: "FL" },
          before: mockGeocoder(calls, json(WYNWOOD)),
        });
        await result(page)
          .getByText(`Using your device location, you’re near Wynwood, Miami, FL: ${IN_ZONE}`)
          .waitFor();
        const text = await result(page).textContent();
        check(text.includes("A truck is heading to a house near you."), `${width}: device answer keeps the truck line`);
        check(
          !/\b33127\b|NW 2nd|2520|\b33351\b/.test(text),
          `${width}: device answer shows no ZIP, street or house number even if the reply has them`,
        );
        const urls = calls.map((u) => new URL(u));
        check(urls.length === 1, `${width}: exactly one reverse-geocode request (${urls.length})`);
        const q = urls[0];
        check(
          q.pathname === "/data/reverse-geocode-client" &&
            [...q.searchParams.keys()].sort().join() === "latitude,localityLanguage,longitude" &&
            q.searchParams.get("latitude") === "25.801" &&
            q.searchParams.get("longitude") === "-80.199" &&
            q.searchParams.get("localityLanguage") === "en",
          `${width}: the request has only latitude, longitude and language, rounded to 3 decimals (${q.search})`,
        );
        const mem = await stored(page);
        const all = `${mem.local} ${mem.session} ${mem.cookie}`;
        check(
          !/25\.80|80\.19|Wynwood|Miami|Sunrise/.test(all),
          `${width}: no storage or cookie holds the coordinates or a place name (${all.slice(0, 80)})`,
        );
        await page.locator("#zip-check").scrollIntoViewIfNeeded();
        await shot(page, `${width}-place-device-in.png`);
        check(errors.length === 0, `${width}: place name: no console errors ${errors.join(" | ")}`);
        await context.close();
      }
      // Out of zone, named.
      {
        const { context, page } = await newPage(width, {
          geo: MISSOULA,
          before: mockGeocoder([], json({ locality: "", city: "Missoula", principalSubdivisionCode: "US-MT", countryCode: "US" })),
        });
        await result(page)
          .getByText("Using your device location, you’re near Missoula, MT: you aren’t in a local delivery zone yet")
          .waitFor();
        ok(`${width}: out of zone, the device answer is named too`);
        await page.locator("#zip-check").scrollIntoViewIfNeeded();
        await shot(page, `${width}-place-device-out.png`);
        await context.close();
      }
      // (a) the approximate line names the city; no city says "near you".
      {
        const { context, page } = await newPage(width, {
          geoApi: { country: "US", zip: "33351", city: "Sunrise", region: "FL" },
          init: DENY,
        });
        await result(page).getByText(`Based on your connection, you’re near Sunrise, FL: ${IN_ZONE}`).waitFor();
        await page.locator("#zip-check").scrollIntoViewIfNeeded();
        await shot(page, `${width}-place-approx.png`);
        await context.close();
      }
    }
    {
      const { context, page } = await newPage(360, {
        geoApi: { country: "US", zip: "33351", city: null, region: "FL" },
        init: DENY,
      });
      await result(page).getByText(`Based on your connection, here’s what we see near you: ${IN_ZONE}`).waitFor();
      ok("approximate answer with no city says it is near you, with no ZIP");
      await context.close();
    }
    // (c) a failing, empty, non-JSON, slow or blocked geocoder: clean fallback, no error shown.
    for (const [label, respond] of [
      ["HTTP 500", (r) => r.fulfill({ status: 500, body: "" })],
      ["402 (fair use)", (r) => r.fulfill({ status: 402, body: "" })],
      ["empty place", json({ locality: "", city: "", principalSubdivisionCode: "US-FL", countryCode: "US" })],
      ["only a ZIP and a street", json({ postcode: "33127", streetName: "NW 2nd Ave", countryCode: "US" })],
      ["not JSON", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html>" })],
      ["network error", (r) => r.abort()],
    ]) {
      const { context, page, errors } = await newPage(360, {
        geo: MIAMI,
        before: mockGeocoder([], respond),
      });
      await result(page).getByText(`Using your device location: ${IN_ZONE}`).waitFor();
      await page.waitForTimeout(400);
      const text = await result(page).textContent();
      check(
        text.startsWith(`Using your device location: ${IN_ZONE}`) && !/couldn|error|near Wynwood/i.test(text),
        `geocoder ${label}: falls back to "Using your device location:" with no error`,
      );
      check(errors.length === 0, `geocoder ${label}: no console errors ${errors.join(" | ")}`);
      await context.close();
    }
    {
      // A geocoder that never answers: the zone answer is there at once, and stays without a name.
      const { context, page } = await newPage(360, {
        geo: MIAMI,
        before: mockGeocoder([], () => new Promise(() => {})),
      });
      await result(page).getByText(`Using your device location: ${IN_ZONE}`).waitFor();
      await page.waitForTimeout(4600);
      check(
        (await result(page).textContent()).startsWith(`Using your device location: ${IN_ZONE}`),
        "a geocoder that never answers: the answer stays without a name after the 4 s timeout",
      );
      await context.close();
    }
    {
      // The zone answer never waits for the name.
      const { context, page } = await newPage(360, {
        geo: MIAMI,
        before: mockGeocoder([], async (r) => {
          await new Promise((res) => setTimeout(res, 1500));
          return json(WYNWOOD)(r);
        }),
      });
      await result(page).getByText(`Using your device location: ${IN_ZONE}`).waitFor({ timeout: 1200 });
      await result(page).getByText("you’re near Wynwood, Miami, FL").waitFor();
      ok("the zone answer shows first; the name joins it when it arrives");
      await context.close();
    }
    {
      // The Use my location button names the place too; a typed ZIP never does.
      const calls = [];
      const { context, page } = await newPage(360, { before: mockGeocoder(calls, json(WYNWOOD)) });
      await checkZip(page, "33351");
      await result(page).getByText(IN_ZONE).waitFor();
      check(
        (await result(page).textContent()).startsWith("33351:") && calls.length === 0,
        "a typed ZIP keeps showing the ZIP and asks no geocoder",
      );
      await context.close();
    }
    {
      // A long name must not move anything below the answer, at the widths the reserved height was measured for.
      const LONG = { locality: "Fisher Island Neighborhood Area", city: "North Miami Beach Heights", principalSubdivisionCode: "US-FL", countryCode: "US" };
      for (const width of [360, 390, 414, 430, 500, 768, 1024, 1440]) {
        const { context, page } = await newPage(width, {
          geo: MIAMI,
          before: mockGeocoder([], async (r) => {
            await new Promise((res) => setTimeout(res, 700));
            return json(LONG)(r);
          }),
        });
        await result(page).getByText(`Using your device location: ${IN_ZONE}`).waitFor();
        const before = await note(page).boundingBox();
        await result(page).getByText("you’re near Fisher Island Neighborhood Area, North Miami Beach Heights, FL").waitFor();
        const after = await note(page).boundingBox();
        check(
          Math.abs((after?.y ?? 0) - (before?.y ?? 0)) < 1,
          `${width}: a long place name moves nothing below the answer (${before?.y} -> ${after?.y})`,
        );
        await context.close();
      }
    }
    {
      // The home page never asks the geocoder.
      const calls = [];
      const { context } = await newPage(360, { path: "/", before: mockGeocoder(calls, json(WYNWOOD)) });
      check(calls.length === 0, "the home page requests no reverse geocode");
      await context.close();
    }
  }

  /* -------------------------- zone fetch fails -------------------------- */
  {
    const { context, page } = await newPage(360);
    let fail = true;
    await page.route("**/data/local-delivery-zips.json", (r) =>
      fail ? r.abort() : r.continue(),
    );
    await checkZip(page, "33351");
    await result(page).getByText("couldn’t load the zone list").waitFor();
    fail = false;
    await checkZip(page, "33351");
    await result(page).getByText(IN_ZONE).waitFor();
    ok("a failed zone fetch is explained, and a retry recovers");
    await context.close();
  }
} catch (e) {
  bad(String(e?.message ?? e).split("\n")[0]);
} finally {
  await browser.close();
  stopServer();
}

console.log(failures ? `\n${failures} local delivery check(s) failed` : "\nlocal delivery: all checks passed");
process.exit(failures ? 1 : 0);
