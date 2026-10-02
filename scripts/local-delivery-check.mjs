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
 * - No console errors.
 *
 * SHOTS_DIR=<dir> also saves screenshots (hero, map, in zone, out of zone) per width.
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

async function newPage(width, { js = true, geo, path = "/local-delivery" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 800 ? 800 : 900 },
    javaScriptEnabled: js,
    hasTouch: width < 800,
    ...(geo ? { geolocation: geo, permissions: ["geolocation"] } : {}),
  });
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
    await result(page).getByText("Your location isn’t in a local delivery zone yet").waitFor();
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
    ok("location denied: explained, ZIP suggested");
    await context.close();
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
