/**
 * The installable web app, checked against the real build (dist/) in Chromium.
 *
 *   npm run build && npm run check:pwa
 *
 * Static checks (no browser)
 *   - site.webmanifest: name, short_name, id, start_url "/?source=app", scope,
 *     standalone, colors equal to the design tokens, icons 192/512 as "any"
 *     and "maskable" that exist at their stated size, four shortcuts that are
 *     in scope and point at real pages.
 *   - index.html: manifest link, apple-touch-icon (180x180 PNG on disk), the
 *     iOS meta tags, theme-color.
 *   - offline.html: self-contained (no script, no external URL, no request
 *     except the tel: link), and its phone number and hours equal
 *     src/data/business.js.
 *   - sw.js: placeholders filled, skipWaiting only inside the SKIP_WAITING
 *     message handler (never on install), never lists /api, checkout, cart,
 *     track or schedule to precache.
 *   - vercel.json: no rewrite swallows /sw.js, /offline(.html) or
 *     /site.webmanifest; sw.js is Cache-Control no-cache.
 *
 * Browser checks, against a small static server of dist/ that applies
 * vercel.json's headers and fakes /api/status and counts every /api hit
 *   - the worker registers, activates and controls the page;
 *   - offline, a navigation (including /track, /cart, /checkout) gets the
 *     offline page with the shop phone, and hashed assets still load;
 *   - /api, /track, /cart, /checkout and /schedule are never cached, and every
 *     /api request reaches the server (the worker never answers one);
 *   - an updated worker waits, does NOT activate by itself, shows the "update
 *     ready" toast, and Update activates it, reloads once and removes the old
 *     versioned cache;
 *   - the install banner: not on a first visit, shown on the second (or after
 *     an action), clear of the chat button and the call bar, dismissal
 *     remembered, hidden in standalone, quiet on /checkout; iOS Safari gets the
 *     Add to Home Screen hint; app_install_prompt_shown is sent.
 *
 * PWA_CHECK_PORT (default 4701) is the port of the server it starts itself.
 * PWA_CHECK_SHOTS=<dir> also saves a screenshot of the main states there.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import assert from "node:assert/strict";

import { BUSINESS } from "../src/data/business.js";

const CHROME =
  process.env.AUDIT_CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.PWA_CHECK_PORT ?? 4701);
const DIST = resolve("dist");
const read = (p) => readFileSync(p, "utf8");
const SHOTS = process.env.PWA_CHECK_SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const shot = (page, name) => (SHOTS ? page.screenshot({ path: join(SHOTS, `${name}.png`) }) : null);

if (!existsSync(join(DIST, "sw.js"))) {
  console.error("No sw.js in dist/. Run `npm run build` first.");
  process.exit(1);
}

let failures = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(err.message).split("\n").join("\n     ")}`);
  }
}

/** Width and height of a PNG, from its header. */
function pngSize(file) {
  const b = readFileSync(file);
  assert.equal(b.subarray(1, 4).toString(), "PNG", `${file} is not a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

const vercel = JSON.parse(read("vercel.json"));
const swSource = read(join(DIST, "sw.js"));
const html = read(join(DIST, "index.html"));
const manifest = JSON.parse(read("public/site.webmanifest"));

/* ------------------------------ static ------------------------------ */

await check("manifest: identity, start_url, scope, display and colors", () => {
  assert.equal(manifest.name, "TireDrop");
  assert.equal(manifest.short_name, "TireDrop");
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/?source=app");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  const tailwind = read("tailwind.config.js");
  const ink = tailwind.match(/ink:\s*"(#[0-9A-Fa-f]{6})"/)[1].toLowerCase();
  assert.equal(manifest.background_color.toLowerCase(), ink, "background_color is the ink token");
  assert.equal(manifest.theme_color.toLowerCase(), ink, "theme_color is the ink token");
  assert.ok(html.includes(`<meta name="theme-color" content="${manifest.theme_color}"`), "theme-color meta");
  assert.ok(manifest.description.length > 20);
});

await check("manifest: 192 and 512 icons, any and maskable, each the size it says", () => {
  const have = new Set();
  for (const icon of manifest.icons) {
    const [w, h] = pngSize(join("public", icon.src));
    assert.equal(`${w}x${h}`, icon.sizes, `${icon.src} is ${w}x${h}`);
    assert.equal(icon.type, "image/png");
    have.add(`${w}:${icon.purpose}`);
    assert.ok(!/\bany\b.*\bmaskable\b|\bmaskable\b.*\bany\b/.test(icon.purpose), "no combined purpose");
  }
  for (const k of ["192:any", "512:any", "192:maskable", "512:maskable"]) assert.ok(have.has(k), `missing ${k}`);
});

await check("manifest: shortcuts are in scope and point at real pages", () => {
  assert.deepEqual(
    manifest.shortcuts.map((s) => s.name),
    ["Shop tires", "Find my size", "My orders", "Call the shop"],
  );
  for (const s of manifest.shortcuts) {
    const url = new URL(s.url, "https://tiredroponline.com/");
    assert.ok(url.pathname.startsWith(manifest.scope) && url.origin === "https://tiredroponline.com", `${s.url} in scope`);
    assert.ok(existsSync(join(DIST, `${url.pathname}.html`)), `${url.pathname} is not a built page`);
    for (const i of s.icons) assert.ok(existsSync(join("public", i.src)), i.src);
  }
});

await check("index.html: manifest link, apple-touch-icon, iOS meta", () => {
  assert.match(html, /<link rel="manifest" href="\/site\.webmanifest"/);
  const m = html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/);
  assert.ok(m, "apple-touch-icon link");
  assert.deepEqual(pngSize(join("public", m[1])), [180, 180]);
  for (const name of ["apple-mobile-web-app-capable", "apple-mobile-web-app-status-bar-style", "apple-mobile-web-app-title"])
    assert.ok(html.includes(`name="${name}"`), name);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0"/, "the browser viewport tag is unchanged");
});

await check("offline.html: self-contained, shop phone and hours match business.js", () => {
  const page = read("public/offline.html");
  assert.ok(!/<script/i.test(page), "no script");
  assert.ok(!/<link\b/i.test(page), "no linked stylesheet or font");
  assert.ok(!/\b(src|href)\s*=\s*["']https?:/i.test(page) && !/url\(\s*["']?https?:/i.test(page), "no external request");
  assert.ok(!/@import/i.test(page));
  assert.ok(page.includes(`href="${BUSINESS.phoneHref}"`), "tel link is BUSINESS.phoneHref");
  assert.ok(page.includes(BUSINESS.phone), "phone text");
  for (const h of BUSINESS.hours) {
    const days = h.days.replace(/ – /g, " – ");
    assert.ok(page.includes(`${days} ${h.time}`), `hours line: ${days} ${h.time}`);
  }
  assert.ok(/name="robots" content="noindex"/.test(page));
  assert.ok(!/\b(deal|discount|coupon|rebate|safe to drive)\b/i.test(page));
});

await check("sw.js: filled in, no skipWaiting on install, sensitive paths guarded", () => {
  assert.ok(!swSource.includes("__SW_"), "placeholder left in sw.js");
  const precache = JSON.parse(swSource.match(/const PRECACHE = (\[.*\]);/)[1]);
  assert.ok(precache.includes("/offline"));
  assert.ok(precache.some((u) => /^\/assets\/index-.*\.js$/.test(u)), "entry script precached");
  assert.ok(precache.some((u) => /^\/assets\/index-.*\.css$/.test(u)), "entry stylesheet precached");
  for (const u of precache) {
    assert.ok(!/^\/(api|checkout|cart|track|track-order|schedule)(\/|$)/.test(u), `${u} must never be precached`);
    assert.ok(u === "/offline" || u.startsWith("/assets/") || u.startsWith("/brand/"), `unexpected precache entry ${u}`);
  }
  const code = swSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const skips = [...code.matchAll(/skipWaiting\(/g)];
  assert.equal(skips.length, 1, "exactly one skipWaiting call");
  const handler = code.match(/addEventListener\("message"[\s\S]*?\n\}\);/)?.[0] ?? "";
  assert.ok(handler.includes("skipWaiting(") && handler.includes("SKIP_WAITING"), "skipWaiting only in the SKIP_WAITING handler");
  assert.ok(/const NEVER = \/\^\\\/\(api\|checkout\|cart\|track\|track-order\|schedule\)/.test(code), "NEVER list");
  assert.ok(/request\.method !== "GET"/.test(code), "non-GET requests are left alone");
});

/** A Vercel source pattern as a RegExp (the subset vercel.json uses here). */
const sourceRe = (src) =>
  new RegExp(
    `^${src
      .replace(/:\w+\(([^)]*)\)/g, "($1)")
      .replace(/:\w+\+/g, ".+")
      .replace(/:\w+\*/g, ".*")
      .replace(/:\w+/g, "[^/]+")}$`,
  );

await check("vercel.json: no rewrite swallows the worker, offline page or manifest; sw.js is no-cache", () => {
  for (const path of ["/sw.js", "/offline", "/offline.html", "/site.webmanifest"]) {
    for (const r of vercel.rewrites ?? [])
      assert.ok(!sourceRe(r.source).test(path), `rewrite ${r.source} matches ${path}`);
    for (const r of vercel.redirects ?? [])
      assert.ok(!sourceRe(r.source).test(path), `redirect ${r.source} matches ${path}`);
  }
  const headersFor = (path) =>
    Object.fromEntries(
      (vercel.headers ?? [])
        .filter((h) => !h.has && sourceRe(h.source).test(path))
        .flatMap((h) => h.headers.map((x) => [x.key, x.value])),
    );
  assert.match(headersFor("/sw.js")["Cache-Control"], /max-age=0/);
  assert.match(headersFor("/sw.js")["Cache-Control"], /must-revalidate/);
  assert.match(headersFor("/offline")["Cache-Control"], /max-age=0/);
  assert.ok(headersFor("/site.webmanifest")["Cache-Control"], "manifest has a Cache-Control");
  const csp = vercel.headers.flatMap((h) => h.headers).find((x) => x.key.startsWith("Content-Security-Policy"))?.value ?? "";
  assert.ok(/worker-src 'self'/.test(csp) && /manifest-src 'self'/.test(csp), "CSP already allows our worker and manifest");
});

/* --------------------------- test server --------------------------- */

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

const state = { apiHits: [], swVersion: null };

function headerFor(path) {
  const out = {};
  for (const rule of vercel.headers ?? []) {
    if (rule.has) continue;
    if (!sourceRe(rule.source).test(path)) continue;
    for (const h of rule.headers) out[h.key] = h.value;
  }
  delete out["Content-Security-Policy-Report-Only"];
  return out;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path.startsWith("/api/")) {
    state.apiHits.push(`${req.method} ${path}`);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json");
    if (path === "/api/status") {
      res.end(
        JSON.stringify({ atd: "sample", shopify: "live", checkout: "request", newsletter: "on", forms: "on", scanner: "on", chat: "on", version: "t" }),
      );
    } else {
      res.statusCode = 404;
      res.end("{}");
    }
    return;
  }
  const candidates = [path, `${path}.html`, join(path, "index.html")];
  if (/^\/tires\/p\/[^/]+$/.test(path)) candidates.unshift("/spa.html");
  const file = candidates
    .map((c) => normalize(join(DIST, c)))
    .find((f) => f.startsWith(DIST) && existsSync(f) && statSync(f).isFile());
  // Vercel's default for static files is "revalidate every time"; without it
  // Chromium's heuristic freshness would answer an offline navigation from
  // its HTTP cache and hide what the worker does.
  const headers = { "Cache-Control": "public, max-age=0, must-revalidate", ...headerFor(path) };
  if (!file) {
    res.writeHead(404, { ...headers, "Content-Type": TYPES[".html"] });
    res.end(readFileSync(join(DIST, "404.html")));
    return;
  }
  let body = readFileSync(file);
  if (path === "/sw.js" && state.swVersion) body = Buffer.from(body.toString().replace(/const VERSION = "[^"]*"/, `const VERSION = "${state.swVersion}"`));
  res.writeHead(200, { ...headers, "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(body);
});
const listen = () => new Promise((ok, bad) => server.once("error", bad).listen(PORT, "127.0.0.1", ok));
/** "Offline": the origin stops answering. Playwright's setOffline() does not
 *  reach a service worker's own fetches in every Chromium build, and a dead
 *  origin is what a phone with no signal looks like to the worker anyway. */
const originDown = () =>
  new Promise((ok) => {
    server.close(ok);
    server.closeAllConnections();
  });
await listen();
const BASE = `http://localhost:${PORT}`;

const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });

async function open({ viewport = { width: 390, height: 844 }, userAgent, standalone = false, hasTouch } = {}) {
  const context = await browser.newContext({ viewport, userAgent, hasTouch });
  await context.route(
    (u) => u.host !== new URL(BASE).host,
    (route) => route.fulfill({ status: 200, body: "" }),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|ERR_FAILED|ERR_INTERNET_DISCONNECTED|net::/.test(m.text())) errors.push(m.text());
  });
  await page.addInitScript((isApp) => {
    const dl = (window.dataLayer = window.dataLayer || []);
    const push = dl.push.bind(dl);
    dl.push = (entry) => {
      try {
        const calls = JSON.parse(sessionStorage.getItem("__gaCalls") || "[]");
        calls.push(Array.from(entry));
        sessionStorage.setItem("__gaCalls", JSON.stringify(calls));
      } catch {
        /* blocked */
      }
      return push(entry);
    };
    if (isApp) Object.defineProperty(navigator, "standalone", { get: () => true });
  }, standalone);
  const events = async () =>
    (await page.evaluate(() => JSON.parse(sessionStorage.getItem("__gaCalls") || "[]"))).filter((c) => c[0] === "event");
  return { context, page, errors, events };
}

const cacheNames = (page) => page.evaluate(() => caches.keys());
const cachedUrls = (page) =>
  page.evaluate(async () => {
    const out = [];
    for (const name of await caches.keys()) for (const r of await (await caches.open(name)).keys()) out.push(new URL(r.url).pathname + new URL(r.url).search);
    return out;
  });

/** Registers the worker and waits until it controls the page. */
async function controlled(page, path = "/") {
  await page.goto(BASE + path);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(async () => {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller);
  });
}

/* ------------------------------ browser ------------------------------ */

try {
  const sw = await open();
  await check("worker registers, activates and controls the page; sw.js is served no-cache", async () => {
    const swResponse = page_headers(await sw.page.request.get(`${BASE}/sw.js`));
    assert.match(swResponse["cache-control"], /max-age=0/);
    assert.match(swResponse["content-type"], /javascript/);
    await controlled(sw.page);
    const info = await sw.page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      return { scope: reg.scope, state: reg.active?.state, updateViaCache: reg.updateViaCache };
    });
    assert.equal(info.scope, `${BASE}/`);
    assert.equal(info.state, "activated");
    assert.equal(info.updateViaCache, "none");
    const names = await cacheNames(sw.page);
    assert.ok(names.some((n) => n.startsWith("td-shell-")), `shell cache missing: ${names}`);
    assert.ok((await cachedUrls(sw.page)).includes("/offline"), "offline page precached");
    assert.deepEqual(sw.errors, [], sw.errors.join("\n"));
  });

  await check("/api, /track, /cart, /checkout, /schedule are never cached and every /api request reaches the server", async () => {
    state.apiHits.length = 0;
    const p = sw.page;
    for (const path of ["/track", "/cart", "/schedule", "/checkout", "/"]) {
      await p.goto(BASE + path);
      await p.waitForTimeout(250);
    }
    const before = state.apiHits.length;
    const results = await p.evaluate(async () => {
      const a = await fetch("/api/status");
      const b = await fetch("/api/status");
      const t = await fetch("/api/track", { method: "POST", body: JSON.stringify({ order: "x", email: "y@z.co" }) });
      return [a.status, b.status, t.status];
    });
    assert.deepEqual(results, [200, 200, 404]);
    const mine = state.apiHits.slice(before);
    assert.deepEqual(mine, ["GET /api/status", "GET /api/status", "POST /api/track"], "every /api call hit the server");
    const urls = await cachedUrls(p);
    const bad = urls.filter((u) => /^\/(api|checkout|cart|track|track-order|schedule)(\/|$|\?)/.test(u));
    assert.deepEqual(bad, [], `cached: ${bad}`);
    assert.ok(!urls.some((u) => /\.html$/.test(u) && u !== "/offline.html"), "no page HTML stored");
    // Images and fonts are the only runtime entries beside hashed assets.
    for (const u of urls) assert.ok(u === "/offline" || /^\/(assets|brand)\//.test(u) || u === "/favicon.ico", `unexpected cache entry ${u}`);
  });

  await check("offline: any navigation, the sensitive ones included, gets the offline page with the shop phone", async () => {
    const p = sw.page;
    await p.goto(BASE + "/");
    await originDown();
    for (const path of ["/tires", "/track", "/cart", "/checkout", "/schedule", "/learn"]) {
      await p.goto(BASE + path).catch(() => {});
      await p.getByRole("heading", { name: "You are offline" }).waitFor({ timeout: 8000 }).catch(async (e) => {
        throw new Error(`${path}: no offline page (at ${p.url()}, title "${await p.title().catch(() => "?")}")`);
      });
      const call = p.getByRole("link", { name: new RegExp(BUSINESS.phone.replace(/[()]/g, "\\$&")) });
      assert.equal(await call.getAttribute("href"), BUSINESS.phoneHref, `${path}: phone link`);
      assert.equal(await p.locator("a", { hasText: "Try again" }).getAttribute("href"), "", "Try again reloads the same address");
      assert.equal(new URL(p.url()).pathname, path, "the address stays what was asked for");
      if (path === "/tires") await shot(p, "offline-390");
    }
    // Hashed shell assets still load offline.
    const precache = JSON.parse(swSource.match(/const PRECACHE = (\[.*\]);/)[1]);
    const css = precache.find((u) => u.endsWith(".css"));
    assert.equal(await p.evaluate(async (u) => (await fetch(u)).status, css), 200);
    await listen();
    await p.goto(BASE + "/tires");
    await p.getByRole("heading", { level: 1 }).first().waitFor();
    assert.ok(!(await p.content()).includes("You are offline"), "back online, the real page");
  });

  await check("update: a new worker waits, shows the toast, and activates only when Update is pressed", async () => {
    const p = sw.page;
    await p.goto(BASE + "/");
    const oldCaches = (await cacheNames(p)).filter((n) => n.startsWith("td-shell-"));
    assert.equal(oldCaches.length, 1);
    state.swVersion = "update-test";
    await p.evaluate(async () => (await navigator.serviceWorker.getRegistration("/")).update());
    await p.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration("/")).waiting, null, { timeout: 15000 });
    await p.waitForTimeout(1500);
    const waiting = await p.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration("/");
      return { waiting: !!r.waiting, active: r.active?.state };
    });
    assert.deepEqual(waiting, { waiting: true, active: "activated" }, "still waiting after 1.5 s, nothing skipped on its own");
    assert.equal(await p.evaluate(() => performance.getEntriesByType("navigation").length), 1);
    const toast = p.locator('[data-pwa="update-toast"]');
    await toast.waitFor();
    assert.match(await toast.innerText(), /new version of TireDrop is ready/i);
    await shot(p, "update-toast-390");
    // Nothing reloaded behind our back.
    await p.evaluate(() => (window.__stamp = "same-page"));
    await p.waitForTimeout(800);
    assert.equal(await p.evaluate(() => window.__stamp), "same-page");
    await Promise.all([p.waitForEvent("load"), toast.getByRole("button", { name: "Update" }).click()]);
    await p.waitForFunction(async () => (await navigator.serviceWorker.getRegistration("/")).active?.state === "activated" && !(await navigator.serviceWorker.getRegistration("/")).waiting);
    const names = (await cacheNames(p)).filter((n) => n.startsWith("td-shell-"));
    assert.equal(names.length, 1, `old versioned cache removed, have ${names}`);
    assert.notEqual(names[0], oldCaches[0]);
    assert.ok(names[0].endsWith("update-test"));
    await p.waitForTimeout(500);
    assert.equal(await p.locator('[data-pwa="update-toast"]').count(), 0, "toast gone after the update");
    state.swVersion = null;
  });

  await check("update: Later hides the toast and leaves the worker waiting", async () => {
    const p = sw.page;
    state.swVersion = "later-test";
    await p.goto(BASE + "/");
    await p.evaluate(async () => (await navigator.serviceWorker.getRegistration("/")).update());
    const toast = p.locator('[data-pwa="update-toast"]');
    await toast.waitFor();
    await toast.getByRole("button", { name: "Later" }).click();
    assert.equal(await toast.count(), 0);
    assert.equal(await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration("/")).waiting), true);
    state.swVersion = null;
    await sw.context.close();
  });

  /* ---------------------------- install prompt ---------------------------- */

  const fakeInstallEvent = () =>
    window.dispatchEvent(
      Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: async () => {
          window.__prompted = true;
        },
        userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      }),
    );

  /** A page on its second visit with a (faked) install event waiting. */
  async function secondVisit(opts, path = "/") {
    const h = await open(opts);
    await h.page.goto(BASE + path);
    await h.page.evaluate(() => {
      localStorage.setItem("tiredrop.pwa.v1", JSON.stringify({ visits: 1 }));
      sessionStorage.removeItem("tiredrop.pwa.session");
    });
    await h.page.reload();
    return h;
  }

  await check("install banner: not on a first visit; shown on the second, clear of chat and the call bar; Install prompts", async () => {
    const h = await open();
    await h.page.goto(BASE + "/");
    await h.page.evaluate(fakeInstallEvent);
    await h.page.waitForTimeout(5000);
    assert.equal(await h.page.locator('[data-pwa="install-prompt"]').count(), 0, "first visit: nothing");
    await h.context.close();

    const v = await secondVisit();
    await v.page.evaluate(fakeInstallEvent);
    const banner = v.page.locator('[data-pwa="install-prompt"]');
    assert.equal(await banner.count(), 0, "not instantly");
    await banner.waitFor({ timeout: 9000 });
    assert.equal(await banner.getAttribute("data-placement"), "banner");
    await v.page.getByRole("button", { name: /Ask TireDrop/ }).waitFor();
    const rect = (loc) => loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, vw: innerWidth, vh: innerHeight }; });
    const b = await rect(banner);
    const chat = await rect(v.page.getByRole("button", { name: /Ask TireDrop/ }));
    const bar = await rect(v.page.getByRole("navigation", { name: "Quick actions" }));
    const overlap = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
    await shot(v.page, "install-banner-390");
    assert.ok(!overlap(b, chat), "banner overlaps the chat button");
    assert.ok(!overlap(b, bar), "banner overlaps the call bar");
    assert.ok(b.left >= 0 && b.right <= b.vw && b.top >= 0, "banner on screen");
    assert.ok(b.bottom < b.vh / 3, "banner sits at the top");
    for (const name of ["Install", "Not now"]) {
      const box = await banner.getByRole("button", { name }).boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, `${name} target ${box.width}x${box.height}`);
    }
    const ga = (await v.events()).filter((c) => c[1] === "app_install_prompt_shown");
    assert.deepEqual(ga.map((c) => c[2]), [{ placement: "banner" }]);
    await banner.getByRole("button", { name: "Install" }).click();
    await v.page.waitForFunction(() => window.__prompted === true);
    await banner.waitFor({ state: "detached" });
    const stored = JSON.parse(await v.page.evaluate(() => localStorage.getItem("tiredrop.pwa.v1")));
    assert.equal(stored.installed, true);
    assert.deepEqual(v.errors, [], v.errors.join("\n"));
    await v.context.close();
  });

  await check("install banner: after an action on a first visit; dismissal is remembered; quiet on /checkout and /cart", async () => {
    const h = await open();
    await h.page.goto(BASE + "/tires");
    await h.page.evaluate(fakeInstallEvent);
    // "Meaningful action": the same analytics event an Add to Cart sends.
    await h.page.evaluate(() => window.gtag("event", "add_to_cart", {}));
    const banner = h.page.locator('[data-pwa="install-prompt"]');
    await h.page.waitForTimeout(5000);
    assert.equal(await banner.count(), 0, "a bare gtag call is not an app event; only trackEvent is");
    await h.context.close();

    const a = await open();
    await a.page.goto(BASE + "/tire-size");
    await a.page.evaluate(fakeInstallEvent);
    // Drive the real thing: open a tool page and use it is covered by check:ga; here the
    // listener is exercised through a real trackEvent by adding a tire to the cart.
    await a.page.goto(BASE + "/tires");
    await a.page.evaluate(fakeInstallEvent);
    const sku = (await a.page.evaluate(() => document.querySelector('a[href^="/tires/"]')?.getAttribute("href"))) ?? "";
    assert.ok(sku, "found a product link");
    await a.page.goto(BASE + sku);
    await a.page.evaluate(fakeInstallEvent);
    await a.page.getByRole("button", { name: "Add to Cart", exact: true }).click();
    await a.page.locator('[data-pwa="install-prompt"]').waitFor({ timeout: 9000 });
    // Dismiss, reload: not again.
    await a.page.getByRole("button", { name: "Not now" }).click();
    const stored = JSON.parse(await a.page.evaluate(() => localStorage.getItem("tiredrop.pwa.v1")));
    assert.equal(stored.dismissCount, 1);
    assert.ok(stored.dismissedAt > 0);
    await a.page.evaluate(() => sessionStorage.removeItem("tiredrop.pwa.session"));
    await a.page.reload();
    await a.page.evaluate(fakeInstallEvent);
    await a.page.waitForTimeout(5500);
    assert.equal(await a.page.locator('[data-pwa="install-prompt"]').count(), 0, "dismissed: not shown again on the next visit");
    // 14 days later it may come back.
    await a.page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("tiredrop.pwa.v1"));
      s.dismissedAt = Date.now() - 15 * 864e5;
      localStorage.setItem("tiredrop.pwa.v1", JSON.stringify(s));
      sessionStorage.removeItem("tiredrop.pwa.session");
    });
    await a.page.reload();
    await a.page.evaluate(fakeInstallEvent);
    await a.page.locator('[data-pwa="install-prompt"]').waitFor({ timeout: 9000 });
    await a.context.close();

    for (const path of ["/checkout", "/cart"]) {
      const q = await secondVisit({}, path);
      await q.page.evaluate(fakeInstallEvent);
      await q.page.waitForTimeout(5500);
      assert.equal(await q.page.locator('[data-pwa="install-prompt"]').count(), 0, `quiet on ${path}`);
      await q.context.close();
    }
  });

  await check("install banner: hidden in standalone; storage blocked does not throw", async () => {
    const s = await secondVisit({ standalone: true });
    await s.page.evaluate(fakeInstallEvent);
    await s.page.waitForTimeout(5500);
    assert.equal(await s.page.locator('[data-pwa="install-prompt"]').count(), 0, "standalone: no banner");
    const launches = (await s.events()).filter((c) => c[1] === "app_launch_standalone");
    assert.equal(launches.length, 1, "app_launch_standalone sent once");
    await s.context.close();

    const b = await open();
    await b.page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
    });
    await b.page.goto(BASE + "/");
    await b.page.evaluate(fakeInstallEvent);
    await b.page.waitForTimeout(500);
    assert.deepEqual(b.errors, [], b.errors.join("\n"));
    await b.context.close();
  });

  await check("install hint: iPhone Safari gets Add to Home Screen steps, other iOS browsers and desktop get nothing without an event", async () => {
    const SAFARI =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    const CHROME_IOS =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1";
    const i = await secondVisit({ userAgent: SAFARI, hasTouch: true });
    const hint = i.page.locator('[data-pwa="install-prompt"]');
    await hint.waitFor({ timeout: 9000 });
    assert.equal(await hint.getAttribute("data-placement"), "ios_hint");
    assert.match(await hint.innerText(), /Add to Home Screen/);
    await shot(i.page, "ios-hint-390");
    assert.deepEqual(
      (await i.events()).filter((c) => c[1] === "app_install_prompt_shown").map((c) => c[2]),
      [{ placement: "ios_hint" }],
    );
    await hint.getByRole("button", { name: "Got it" }).click();
    assert.equal(await hint.count(), 0);
    await i.context.close();

    for (const opts of [{ userAgent: CHROME_IOS, hasTouch: true }, {}]) {
      const o = await secondVisit(opts);
      await o.page.waitForTimeout(5500);
      assert.equal(await o.page.locator('[data-pwa="install-prompt"]').count(), 0);
      await o.context.close();
    }
  });

  await check("install banner: 320x568, 844x390 and desktop fit on screen", async () => {
    for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      const v = await secondVisit({ viewport });
      await v.page.evaluate(fakeInstallEvent);
      const banner = v.page.locator('[data-pwa="install-prompt"]');
      await banner.waitFor({ timeout: 9000 });
      const r = await banner.evaluate((el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth }; });
      assert.ok(r.l >= 0 && r.r <= r.w && r.t >= 0 && r.b <= r.h, `${viewport.width}x${viewport.height}: banner on screen ${JSON.stringify(r)}`);
      assert.ok(r.sw <= r.w, "no horizontal scroll");
      await shot(v.page, `install-banner-${viewport.width}x${viewport.height}`);
      await v.context.close();
    }
  });
} finally {
  await browser.close();
  server.close();
  server.closeAllConnections();
}

function page_headers(res) {
  return res.headers();
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall PWA checks passed");
process.exit(failures ? 1 : 0);
