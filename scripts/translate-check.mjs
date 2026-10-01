/**
 * The header's Language control, in Chromium, against the built site.
 *
 *   1. Lazy: a page that never opens the control requests nothing from
 *      Google and sets no googtrans cookie. Opening it loads the script.
 *   2. The control: aria-expanded, the five pinned languages in order,
 *      English (original), a labelled select of every language, Escape and
 *      focus, 44px targets, no sideways scroll at 320px, and the same in the
 *      mobile menu.
 *   3. ELEMENT mode, with Google's element.js answered by a stand-in that
 *      rewrites the page the way Google does (each text node swapped for
 *      <font> wrappers, a banner iframe, body pushed down 40px). After
 *      choosing Español: the notice shows, prices / phone / sizes / brand
 *      names are untouched, Google's banner is hidden and the page has not
 *      moved. Then: navigate between routes, add to cart, open the cart,
 *      change quantity, toggle install, remove, fill and send /contact, with
 *      no uncaught error. The session is remembered across a reload, and
 *      "Switch back to English" undoes all of it.
 *   4. The same steps with the stand-in translator but WITHOUT the site's
 *      guard (translation started behind the control's back) do crash
 *      React, which is what shows the stand-in is a fair test.
 *   5. FALLBACK: with element.js failing, choosing Español sends the page to
 *      https://translate.google.com/translate?sl=en&tl=es&u=<this page>.
 *   6. PROXY: the site served from tiredroponline-com.translate.goog (Google's
 *      URL translator) knows it is translated, shows the notice, survives
 *      navigation, and "Switch back to English" returns to the real host.
 *
 * Nothing reaches Google: every Google URL is answered locally. Whether the
 * real element.js still loads (Google retired the widget on 2026-10-01) can
 * only be seen on a deployed preview.
 *
 *   npm run build && npm run check:translate
 *
 * Starts `vite preview` on TRANSLATE_PORT (default 4320), or tests
 * TRANSLATE_BASE. TRANSLATE_SHOTS=<dir> also saves screenshots of the
 * control open at 390 and 1440 and of a translated page.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";

const CHROME =
  process.env.AUDIT_CHROME ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const PORT = Number(process.env.TRANSLATE_PORT ?? 4320);
const SHOTS = process.env.TRANSLATE_SHOTS;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/* ------------------------------ preview ------------------------------ */

let server = null;
let BASE = process.env.TRANSLATE_BASE;
if (!BASE) {
  if (!existsSync("dist/index.html")) {
    console.error("No build in dist/. Run `npm run build` first.");
    process.exit(1);
  }
  BASE = `http://localhost:${PORT}`;
  server = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort"],
    { stdio: "ignore", detached: true },
  );
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

/* ------------------------- Google, stood in for ------------------------ */

// Google's element.js, as far as the site can see it: a TranslateElement that
// puts a select.goog-te-combo in the container, translates on its change event
// or from the googtrans cookie, and rewrites the DOM like Google does.
const FAKE_TRANSLATOR = String.raw`
(function () {
  if (window.__fakeTranslator) return;
  window.__fakeTranslator = true;
  var lang = null;
  function skip(n) {
    for (var e = n.parentElement; e; e = e.parentElement) {
      if (e.classList.contains("notranslate") || e.getAttribute("translate") === "no") return true;
      if (/^(SCRIPT|STYLE|NOSCRIPT|OPTION|SELECT|TEXTAREA|TITLE)$/.test(e.tagName)) return true;
      if (e.dataset && e.dataset.mock) return true;
    }
    return false;
  }
  function translateNode(t) {
    if (!lang || !t.parentNode || !t.nodeValue.trim() || skip(t)) return;
    var outer = document.createElement("font");
    outer.style.verticalAlign = "inherit";
    var inner = document.createElement("font");
    inner.style.verticalAlign = "inherit";
    inner.dataset.mock = "1";
    inner.textContent = "[" + lang + "] " + t.nodeValue;
    outer.appendChild(inner);
    t.parentNode.replaceChild(outer, t);
  }
  function walk(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(translateNode);
  }
  // quiet: leave <html> unmarked, so the site cannot tell (control experiment).
  window.__startFakeTranslation = function (code, quiet) {
    var first = !lang;
    lang = code;
    setTimeout(function () {
      if (!quiet) document.documentElement.classList.add("translated-ltr");
      document.documentElement.lang = code;
      if (first) {
        var holder = document.createElement("div");
        holder.className = "skiptranslate";
        var frame = document.createElement("iframe");
        frame.className = "goog-te-banner-frame skiptranslate";
        frame.style.cssText = "position:fixed;top:0;left:0;width:100%;height:39px;border:0;z-index:2147483647;background:#fd0";
        holder.appendChild(frame);
        document.body.insertBefore(holder, document.body.firstChild);
        document.body.style.position = "relative";
        document.body.style.top = "40px";
        var tip = document.createElement("div");
        tip.id = "goog-gt-tt";
        tip.textContent = "Original text";
        tip.style.cssText = "position:absolute;top:100px;left:100px;width:200px;height:60px;background:#fff";
        document.body.appendChild(tip);
        new MutationObserver(function (records) {
          records.forEach(function (r) {
            if (r.type === "characterData") return translateNode(r.target);
            r.addedNodes.forEach(function (n) {
              if (n.nodeType === 3) translateNode(n);
              else if (n.nodeType === 1 && !(n.dataset && n.dataset.mock)) walk(n);
            });
          });
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
      }
      walk(document.body);
    }, 60);
  };
  window.google = window.google || {};
  window.google.translate = {
    TranslateElement: function (opts, id) {
      var sel = document.createElement("select");
      sel.className = "goog-te-combo";
      [["", "Select Language"], ["es", "Spanish"], ["pt", "Portuguese"], ["ht", "Haitian Creole"],
       ["ru", "Russian"], ["fr", "French"], ["de", "German"], ["zza", "Zaza"]].forEach(function (o) {
        var opt = document.createElement("option");
        opt.value = o[0];
        opt.textContent = o[1];
        sel.appendChild(opt);
      });
      document.getElementById(id).appendChild(sel);
      sel.addEventListener("change", function () {
        if (sel.value) window.__startFakeTranslation(sel.value);
      });
      var m = /(?:^|; )googtrans=\/en\/([^;]+)/.exec(document.cookie);
      if (m) { sel.value = m[1]; window.__startFakeTranslation(m[1]); }
    },
  };
})();
`;

const ELEMENT_JS = (cb) => `${FAKE_TRANSLATOR}\nsetTimeout(function(){ window[${JSON.stringify(cb)}](); }, 30);`;

/* ------------------------------ harness ------------------------------ */

const browser = await chromium.launch({
  executablePath: existsSync(CHROME) ? CHROME : undefined,
});
const local = new URL(BASE).host;
const PROXY_HOST = "tiredroponline-com.translate.goog";

const STATUS = {
  atd: "sample",
  shopify: "live",
  checkout: "request",
  newsletter: "off",
  forms: "on",
  version: "test",
};

/**
 * A fresh context. `element`: "ok" answers element.js with the stand-in,
 * "fail" answers it 404. Every other outside host is answered empty, and the
 * translate.goog proxy is served from the local build.
 */
async function open(width, { element = "ok", reducedMotion = "no-preference" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    hasTouch: width < 768,
    reducedMotion,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const errors = [];
  const warnings = [];
  const google = [];
  const forms = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
    if (m.type() === "warning" && m.text().startsWith("[translate]"))
      warnings.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

  await context.route(
    (url) => url.host !== local,
    async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === PROXY_HOST) {
        // Google's proxy, played by the local build.
        const res = await fetch(BASE + url.pathname + url.search);
        await route.fulfill({
          status: res.status,
          headers: { "content-type": res.headers.get("content-type") ?? "text/html" },
          body: Buffer.from(await res.arrayBuffer()),
        });
        return;
      }
      if (url.hostname === "translate.google.com") {
        google.push(url.toString());
        if (url.pathname === "/translate_a/element.js") {
          if (element === "fail") return route.fulfill({ status: 404, body: "" });
          return route.fulfill({
            contentType: "text/javascript",
            body: ELEMENT_JS(url.searchParams.get("cb")),
          });
        }
        return route.fulfill({ contentType: "text/html", body: "<title>Google Translate (stand-in)</title>" });
      }
      return route.fulfill({ status: 200, body: "" });
    },
  );
  await context.route("**/api/status", (r) => r.fulfill({ json: STATUS }));
  await context.route("**/api/tires**", (r) => r.fulfill({ status: 404, body: "" }));
  await context.route("**/api/forms", (r) => {
    forms.push(JSON.parse(r.request().postData() || "{}"));
    return r.fulfill({ json: { ok: true } });
  });
  return { context, page, errors, warnings, google, forms };
}

let failures = 0;
let passes = 0;
async function check(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
  try {
    await fn();
    passes += 1;
    console.log(`ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${name}\n     ${String(error?.message ?? error).split("\n").join("\n     ")}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noErrors = (errors, label = "") => {
  const real = errors.filter((e) => !/Failed to load resource/.test(e));
  assert(!real.length, `errors${label}:\n${real.join("\n")}`);
};

const hydrated = (page) =>
  page.waitForFunction(() =>
    Object.keys(document.getElementById("root")).some((k) => k.startsWith("__reactContainer")),
  );

const languageButton = (page) =>
  page.locator("button[aria-expanded][aria-controls]").filter({ hasText: /Language/ }).first();

async function openDesktopControl(page) {
  const button = languageButton(page);
  await button.click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button[aria-controls]")].some(
      (b) => /Language/.test(b.textContent) && b.getAttribute("aria-expanded") === "true",
    ),
  );
  return button;
}

/** Waits for the stand-in to have translated the page and the site to say so. */
async function waitTranslated(page, code = "es") {
  if (process.env.TRANSLATE_DEBUG)
    setTimeout(async () => {
      const st = await page.evaluate(() => ({
        cls: document.documentElement.className,
        lang: document.documentElement.lang,
        notice: document.querySelector("[data-translate-notice]")?.textContent,
        font: document.querySelectorAll("font[data-mock]").length,
        combo: Boolean(document.querySelector("select.goog-te-combo")),
        cookie: document.cookie,
      })).catch((e) => e.message);
      console.log("     state after 6s:", JSON.stringify(st));
    }, 6000);
  await page.waitForFunction(
    (c) =>
      document.documentElement.classList.contains("translated-ltr") &&
      document.documentElement.lang === c &&
      document.querySelector("[data-translate-notice]") &&
      document.querySelector("font[data-mock]"),
    code,
  );
}

/** Things that must read exactly as the English page has them. */
async function protectedIntact(page) {
  return page.evaluate(() => {
    const bad = [];
    const phone = document.querySelector("a[href^='tel:']");
    if (!phone || phone.querySelector("font") || !/\(954\) 773-1896/.test(phone.textContent))
      bad.push(`phone: ${phone?.textContent}`);
    for (const el of document.querySelectorAll("[translate='no']")) {
      if (el.querySelector("font[data-mock]")) bad.push(`translated inside notranslate: ${el.outerHTML.slice(0, 120)}`);
    }
    // An element whose whole text is a price, a size or a brand must not
    // have been translated. (A price inside a sentence, "$142.00 per tire",
    // is translated with its sentence; Google keeps the figure.)
    const strip = (t) => t.replace(/\[\w+(-\w+)?\] /g, "").replace(/\s+/g, " ").trim();
    for (const el of document.querySelectorAll("font[data-mock]")) {
      let host = el.parentElement;
      while (host && host.tagName === "FONT") host = host.parentElement;
      const t = strip(host?.textContent ?? "");
      if (/^\$\d[\d,]*(\.\d\d)?$/.test(t) || /^\d{3}\/\d{2}Z?R\d{2}(\s*·\s*\d{2,3}[A-Z])?$/.test(t) || /^(TireDrop|Extreme Tires)$/.test(t))
        bad.push(`translated: ${t}`);
    }
    return bad;
  });
}

const ONLY = process.env.TRANSLATE_ONLY ? new RegExp(process.env.TRANSLATE_ONLY) : null;
try {
  /* --------------------------- 1. lazy loading --------------------------- */

  await check("1440 nothing loads from Google until the control is opened; opening loads element.js", async () => {
    const h = await open(1440);
    await h.page.goto(`${BASE}/`);
    await hydrated(h.page);
    await sleep(800);
    assert(h.google.length === 0, `requests before opening: ${h.google.join(", ")}`);
    const before = await h.page.evaluate(() => ({
      cookie: document.cookie.includes("googtrans"),
      container: Boolean(document.getElementById("td-gt-element")),
      script: Boolean(document.querySelector("script[src*='translate.google']")),
      css: Boolean(document.getElementById("td-translate-css")),
    }));
    assert(!Object.values(before).some(Boolean), `before opening: ${JSON.stringify(before)}`);
    await openDesktopControl(h.page);
    await h.page.waitForFunction(() => Boolean(document.querySelector("select.goog-te-combo")));
    assert(h.google.some((u) => u.includes("/translate_a/element.js?cb=")), "element.js was not requested on open");
    const after = await h.page.evaluate(() => ({
      translated: document.documentElement.classList.contains("translated-ltr"),
      cookie: document.cookie.includes("googtrans"),
    }));
    assert(!after.translated && !after.cookie, `opening alone translated: ${JSON.stringify(after)}`);
    noErrors(h.errors);
    await h.context.close();
  });

  /* ---------------------------- 2. the control --------------------------- */

  await check("1440 control: aria-expanded, pinned five in order, English (original), labelled select, Escape returns focus", async () => {
    const h = await open(1440);
    await h.page.goto(`${BASE}/tires`);
    await hydrated(h.page);
    const button = languageButton(h.page);
    assert((await button.getAttribute("aria-expanded")) === "false", "starts expanded");
    await button.focus();
    await h.page.keyboard.press("Enter");
    await h.page.waitForFunction(() =>
      [...document.querySelectorAll("button[aria-controls]")].some((b) => /Language/.test(b.textContent) && b.getAttribute("aria-expanded") === "true"),
    );
    const info = await h.page.evaluate(() => {
      const b = [...document.querySelectorAll("button[aria-controls]")].find((x) => /Language/.test(x.textContent) && x.getAttribute("aria-expanded") === "true");
      const panel = document.getElementById(b.getAttribute("aria-controls"));
      const buttons = [...panel.querySelectorAll("button")];
      const select = panel.querySelector("select");
      const label = select && document.querySelector(`label[for="${CSS.escape(select.id)}"]`);
      const small = [...panel.querySelectorAll("button, select")]
        .filter((el) => el.getBoundingClientRect().height < 44)
        .map((el) => `${el.textContent.trim() || el.tagName} ${Math.round(el.getBoundingClientRect().height)}px`);
      return {
        names: buttons.map((x) => x.textContent.trim()),
        group: panel.getAttribute("role"),
        groupLabel: document.getElementById(panel.getAttribute("aria-labelledby"))?.textContent,
        options: select ? select.options.length : 0,
        label: label?.textContent.trim(),
        small,
        buttonHeight: b.getBoundingClientRect().height,
      };
    });
    assert(
      JSON.stringify(info.names.slice(0, 6)) ===
        JSON.stringify(["Español", "Português", "Kreyòl ayisyen", "Русский", "Français", "English (original)"]),
      `pinned: ${info.names.join(" | ")}`,
    );
    assert(info.group === "group" && info.groupLabel === "Translate this page", `group ${info.group} ${info.groupLabel}`);
    assert(info.label === "All languages", `select label ${info.label}`);
    assert(info.options > 125, `only ${info.options} options`);
    assert(!info.small.length && info.buttonHeight >= 44, `under 44px: ${info.small.join(", ")} / button ${info.buttonHeight}`);
    await h.page.keyboard.press("Escape");
    await h.page.waitForFunction(() => document.activeElement?.getAttribute("aria-expanded") === "false");
    noErrors(h.errors);
    await h.context.close();
  });

  for (const width of [390, 320]) {
    await check(`${width} mobile menu: the control is first in the menu, opens in place, 44px targets, no sideways scroll`, async () => {
      const h = await open(width, { reducedMotion: "reduce" });
      await h.page.goto(`${BASE}/`);
      await hydrated(h.page);
      await h.page.getByRole("button", { name: "Open menu" }).click();
      const dialog = h.page.getByRole("dialog", { name: "Site menu" });
      const button = dialog.locator("button[aria-controls]").filter({ hasText: "Language" });
      await button.click();
      assert((await button.getAttribute("aria-expanded")) === "true", "not expanded");
      const info = await h.page.evaluate(() => {
        const dlg = document.querySelector("[role=dialog]");
        const panel = dlg.querySelector("[role=group]");
        const r = dlg.getBoundingClientRect();
        const outside = [...panel.querySelectorAll("button, select")].filter((el) => {
          const b = el.getBoundingClientRect();
          return b.left < r.left - 0.5 || b.right > r.right + 0.5;
        }).length;
        const chevron = dlg.querySelector("button[aria-controls] svg");
        return {
          scroll: document.documentElement.scrollWidth - window.innerWidth,
          outside,
          small: [...panel.querySelectorAll("button, select")].filter((el) => el.getBoundingClientRect().height < 44).length,
          transition: getComputedStyle(chevron).transitionDuration,
        };
      });
      assert(info.scroll <= 0, `sideways scroll ${info.scroll}px`);
      assert(info.outside === 0, `${info.outside} controls outside the menu`);
      assert(info.small === 0, `${info.small} targets under 44px`);
      assert(/^0s(, 0s)*$/.test(info.transition) || parseFloat(info.transition) < 0.02, `reduced motion: chevron transition ${info.transition}`);
      if (SHOTS && width === 390) await h.page.screenshot({ path: `${SHOTS}/language-390-menu-open.png` });
      // Escape closes the panel and leaves the menu open.
      await h.page.keyboard.press("Escape");
      assert((await button.getAttribute("aria-expanded")) === "false", "Escape did not close the panel");
      assert(await dialog.isVisible(), "Escape closed the whole menu");
      noErrors(h.errors);
      await h.context.close();
    });
  }

  /* --------------------------- 3. element mode --------------------------- */

  await check("1440 element mode: Español translates in place; notice, protected values, banner hidden, no layout jump", async () => {
    const h = await open(1440);
    await h.page.goto(`${BASE}/tires`);
    await hydrated(h.page);
    const headerTop = await h.page.evaluate(() => document.querySelector(".sticky").getBoundingClientRect().top + window.scrollY);
    await openDesktopControl(h.page);
    if (SHOTS) await h.page.screenshot({ path: `${SHOTS}/language-1440-open.png` });
    await h.page.getByRole("button", { name: "Español" }).click();
    await waitTranslated(h.page);
    await sleep(300);
    const info = await h.page.evaluate(() => ({
      notice: document.querySelector("[data-translate-notice]").textContent,
      noticeRole: document.querySelector("[data-translate-notice]").getAttribute("role"),
      banner: getComputedStyle(document.querySelector(".goog-te-banner-frame")).display,
      tip: getComputedStyle(document.getElementById("goog-gt-tt")).display,
      bodyTop: getComputedStyle(document.body).top,
      stored: sessionStorage.getItem("td-translate"),
      cookie: document.cookie,
      headerTop: document.querySelector(".sticky").getBoundingClientRect().top + window.scrollY,
    }));
    assert(/Automatic translation — the English version applies to prices, policies and orders\./.test(info.notice), `notice: ${info.notice}`);
    assert(/^\[es\]/.test(info.notice.trim()), `the notice itself was not translated: ${info.notice}`);
    assert(info.noticeRole === "status", "notice role");
    assert(info.banner === "none" && info.tip === "none", `banner ${info.banner}, tooltip ${info.tip}`);
    assert(info.bodyTop === "0px", `body top ${info.bodyTop}`);
    assert(JSON.parse(info.stored)?.code === "es", `session: ${info.stored}`);
    assert(/googtrans=\/en\/es/.test(info.cookie), `cookie: ${info.cookie}`);
    // The notice adds its own row; nothing else should push the header down.
    const noticeHeight = await h.page.evaluate(() => document.querySelector("[data-translate-notice]").getBoundingClientRect().height);
    assert(Math.abs(info.headerTop - headerTop - noticeHeight) < 2, `header moved ${info.headerTop - headerTop}px with a ${noticeHeight}px notice`);
    const bad = await protectedIntact(h.page);
    assert(!bad.length, bad.slice(0, 8).join("\n"));
    if (SHOTS) await h.page.screenshot({ path: `${SHOTS}/translated-1440.png` });
    noErrors(h.errors);
    await h.context.close();
  });

  /** The journey every translated-page check runs: routes, cart, a form. */
  async function journey(page) {
    const step = (what) => {
      if (process.env.TRANSLATE_DEBUG) console.log(`     · ${what}`);
    };
    const go = async (href) => {
      step(href);
      await page.locator(`a[href="${href}"]:visible`).first().click();
      await page.waitForURL((u) => u.pathname === href);
      await sleep(400);
    };
    await go("/tires");
    // Add a set from a product card and stay: 2.2s later the card swaps its
    // translated "Added" text back to "Add set of 4", the classic place a
    // translated page makes React remove a text node that has moved.
    step("add to cart, wait for the button to reset");
    await page.locator("article button.btn-primary").first().click();
    await sleep(2800);
    const detail = await page.locator("article a[href^='/tires/']").first().getAttribute("href");
    await go(detail);
    await sleep(300);
    let bad = await protectedIntact(page);
    assert(!bad.length, `product page: ${bad.slice(0, 5).join("; ")}`);
    await go("/cart");
    await sleep(300);
    bad = await protectedIntact(page);
    assert(!bad.length, `cart: ${bad.slice(0, 5).join("; ")}`);
    // The cart page is not edited for this; its prices are protected at run time.
    const cartPrices = await page.evaluate(() =>
      [...document.querySelectorAll("main [translate='no'], #root [translate='no']")]
        .map((el) => el.textContent.trim())
        .filter((t) => /^\$\d/.test(t)),
    );
    assert(cartPrices.length >= 3, `cart prices left unmarked (found ${cartPrices.join(", ")})`);
    step(`cart prices protected: ${[...new Set(cartPrices)].join(", ")}`);
    step("cart controls");
    await page.locator("button[aria-label^='Increase quantity']").first().click();
    await sleep(200);
    await page.locator("button[aria-label^='Decrease quantity']").first().click();
    await sleep(200);
    const install = page.locator("li input[type=checkbox]").first();
    await install.check();
    await sleep(200);
    await install.uncheck();
    await sleep(200);
    await page.locator("li button:has(svg.lucide-trash2), li button:has(svg.lucide-trash-2)").first().click();
    await sleep(400);
    await go("/contact");
    step("contact form");
    await page.fill("#contact-name", "Alex Translate");
    await page.fill("#contact-email", "alex@example.com");
    await page.fill("#contact-phone", "9545550188");
    await page.check("#subject-orderquestion");
    await page.fill("#contact-message", "¿Tienen 225/45R17?");
    await page.locator("form:has(#contact-name) button[type=submit]").click();
    await page.waitForFunction(() => /Alex/.test(document.querySelector("h3")?.textContent ?? "") || [...document.querySelectorAll("h3")].some((h) => /Alex/.test(h.textContent)));
    await page.locator("a[href='/']:visible").first().click();
    await page.waitForURL((u) => u.pathname === "/");
    await sleep(400);
    await go("/install");
  }

  await check("1440 element mode: routes, cart and a form after translating throw nothing; the guard did its job", async () => {
    const h = await open(1440);
    await h.page.goto(`${BASE}/`);
    await hydrated(h.page);
    await openDesktopControl(h.page);
    await h.page.getByRole("button", { name: "Español" }).click();
    await waitTranslated(h.page);
    await journey(h.page);
    assert(h.forms.length === 1 && h.forms[0].name === "Alex Translate", `form sent: ${JSON.stringify(h.forms)}`);
    const still = await h.page.evaluate(() => ({
      root: document.getElementById("root").children.length,
      h1: Boolean(document.querySelector("h1")),
      notice: Boolean(document.querySelector("[data-translate-notice]")),
    }));
    assert(still.root && still.h1 && still.notice, `page gone: ${JSON.stringify(still)}`);
    noErrors(h.errors);
    assert(h.warnings.length >= 1, "the guard never fired, so this journey did not exercise it");
    console.log(`     (guard skipped ${h.warnings.length} DOM call(s) the translator had invalidated)`);
    await h.context.close();
  });

  await check("390 element mode from the mobile menu: Español, then the same journey, no errors", async () => {
    const h = await open(390);
    await h.page.goto(`${BASE}/`);
    await hydrated(h.page);
    await h.page.getByRole("button", { name: "Open menu" }).click();
    const dialog = h.page.getByRole("dialog", { name: "Site menu" });
    await dialog.locator("button[aria-controls]").filter({ hasText: "Language" }).click();
    await dialog.getByRole("button", { name: "Español" }).click();
    await waitTranslated(h.page);
    assert(!(await dialog.isVisible()), "menu stayed open");
    if (SHOTS) await h.page.screenshot({ path: `${SHOTS}/translated-390.png` });
    // On a phone most links live in the menu: open it for each route.
    for (const path of ["/tires", "/install", "/contact"]) {
      await h.page.getByRole("button", { name: "Open menu" }).click();
      await dialog.locator(`a[href="${path}"]`).first().click();
      await h.page.waitForURL((u) => u.pathname === path);
      await sleep(400);
      if (path === "/tires") {
        await h.page.locator("article button.btn-primary").first().click();
        await sleep(2800); // the "Added" text swaps back while translated
      }
    }
    await h.page.locator("a[href='/cart']:visible").first().click();
    await h.page.waitForURL((u) => u.pathname === "/cart");
    await sleep(400);
    await h.page.locator("a[href='/']:visible").first().click();
    await h.page.waitForURL((u) => u.pathname === "/");
    await sleep(400);
    noErrors(h.errors);
    await h.context.close();
  });

  await check("1440 element mode: the choice survives a reload; Switch back to English clears it", async () => {
    const h = await open(1440);
    await h.page.goto(`${BASE}/tires`);
    await hydrated(h.page);
    await openDesktopControl(h.page);
    await h.page.getByRole("button", { name: "Français" }).click();
    await waitTranslated(h.page, "fr");
    await h.page.reload();
    await waitTranslated(h.page, "fr");
    const badge = await languageButton(h.page).textContent();
    assert(/Français/.test(badge), `button does not show the language: ${badge}`);
    await h.page.locator("[data-translate-notice] button").click();
    await h.page.waitForLoadState("load");
    await hydrated(h.page);
    await sleep(800);
    const after = await h.page.evaluate(() => ({
      translated: document.documentElement.classList.contains("translated-ltr"),
      font: Boolean(document.querySelector("font[data-mock]")),
      notice: Boolean(document.querySelector("[data-translate-notice]")),
      stored: sessionStorage.getItem("td-translate"),
      cookie: /googtrans=\/en/.test(document.cookie),
    }));
    assert(!Object.values(after).some(Boolean), `still translated: ${JSON.stringify(after)}`);
    noErrors(h.errors);
    await h.context.close();
  });

  /* ----------------------- 4. the stand-in has teeth ---------------------- */

  await check("1440 control experiment: the same translator WITHOUT the guard crashes React", async () => {
    const h = await open(1440);
    await h.page.addInitScript({ content: FAKE_TRANSLATOR });
    await h.page.goto(`${BASE}/`);
    await hydrated(h.page);
    await h.page.evaluate(() => window.__startFakeTranslation("es", true));
    await h.page.waitForFunction(() => document.querySelector("font[data-mock]"));
    try {
      await journey(h.page);
    } catch {
      /* the page falling apart mid-journey is the expected outcome */
    }
    const crashed = h.errors.some((e) => /removeChild|insertBefore|NotFoundError|not a child/i.test(e));
    assert(crashed, `no crash without the guard (errors: ${h.errors.join(" | ") || "none"})`);
    console.log(`     (${h.errors.find((e) => /removeChild|insertBefore|NotFoundError|not a child/i.test(e)).slice(0, 140)})`);
    await h.context.close();
  });

  /* ---------------------------- 5. URL fallback --------------------------- */

  await check("1440 fallback: element.js failing sends Español to translate.google.com/translate?sl=en&tl=es&u=<page>", async () => {
    const h = await open(1440, { element: "fail" });
    await h.page.goto(`${BASE}/tires?w=225&a=45&d=17`);
    await hydrated(h.page);
    await openDesktopControl(h.page);
    await h.page.getByRole("button", { name: "Español" }).click();
    await h.page.waitForURL((u) => u.hostname === "translate.google.com" && u.pathname === "/translate");
    const url = new URL(h.page.url());
    assert(url.searchParams.get("sl") === "en", `sl ${url.searchParams.get("sl")}`);
    assert(url.searchParams.get("tl") === "es", `tl ${url.searchParams.get("tl")}`);
    assert(url.searchParams.get("u") === `${BASE}/tires?w=225&a=45&d=17`, `u ${url.searchParams.get("u")}`);
    await h.context.close();
  });

  await check("1440 fallback: a pick from All languages goes the same way (Tiếng Việt → tl=vi)", async () => {
    const h = await open(1440, { element: "fail" });
    await h.page.goto(`${BASE}/install`);
    await hydrated(h.page);
    await openDesktopControl(h.page);
    await h.page.getByLabel("All languages").selectOption("vi");
    await h.page.getByRole("button", { name: "Translate", exact: true }).click();
    await h.page.waitForURL((u) => u.hostname === "translate.google.com");
    assert(new URL(h.page.url()).searchParams.get("tl") === "vi", h.page.url());
    await h.context.close();
  });

  /* ------------------------------ 6. proxy ------------------------------- */

  await check("1440 proxy: on tiredroponline-com.translate.goog the site knows, navigates cleanly, and returns to the real host", async () => {
    const h = await open(1440);
    // Google's proxy translates the page as it arrives, before the app starts.
    await h.page.addInitScript({ content: FAKE_TRANSLATOR });
    await h.page.addInitScript(() => {
      if (location.hostname.endsWith(".translate.goog"))
        document.addEventListener("DOMContentLoaded", () => window.__startFakeTranslation("pt"));
    });
    await h.page.goto(`https://${PROXY_HOST}/tires?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=pt&_x_tr_pto=wapp`);
    await waitTranslated(h.page, "pt");
    await hydrated(h.page);
    const stored = await h.page.evaluate(() => sessionStorage.getItem("td-translate"));
    assert(JSON.parse(stored)?.mode === "proxy" && JSON.parse(stored)?.code === "pt", `stored ${stored}`);
    assert(/Português/.test(await languageButton(h.page).textContent()), "button does not show Português");
    assert(!h.google.some((u) => u.includes("element.js")), "loaded element.js on the proxy");
    await journey(h.page);
    noErrors(h.errors);
    // Picking another language re-routes through Google with the real page.
    await openDesktopControl(h.page);
    await h.page.getByRole("button", { name: "Русский" }).click();
    await h.page.waitForURL((u) => u.hostname === "translate.google.com");
    const u = new URL(h.page.url());
    assert(u.searchParams.get("tl") === "ru" && u.searchParams.get("u") === "https://tiredroponline.com/install", `re-route ${h.page.url()}`);
    await h.page.goBack();
    await waitTranslated(h.page, "pt");
    await h.page.locator("[data-translate-notice] button").click();
    await h.page.waitForURL((x) => x.hostname === "tiredroponline.com");
    assert(!/_x_tr_/.test(h.page.url()), h.page.url());
    await h.context.close();
  });
} finally {
  await browser.close();
  stopServer();
}

console.log(
  failures ? `\n${failures} of ${passes + failures} check(s) failed` : `\nall ${passes} checks passed`,
);
process.exit(failures ? 1 : 0);
