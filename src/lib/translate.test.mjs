// npm run test:lib
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LANGUAGES,
  OTHER_LANGUAGES,
  PINNED,
  PINNED_CODES,
  buildFallbackUrl,
  cookieDomains,
  googtransValue,
  installDomGuard,
  isDomGuardInstalled,
  isProtectedText,
  isProxyHost,
  isValidCode,
  languageFor,
  languageLabel,
  mergeGoogleLanguages,
  originalHost,
  originalUrl,
  pageLanguage,
  proxyLanguage,
} from "./translate.js";

/* ------------------------------ languages ------------------------------ */

test("the five pinned languages come first, in Justin's order, by their own names", () => {
  assert.deepEqual(PINNED_CODES, ["es", "pt", "ht", "ru", "fr"]);
  assert.deepEqual(
    PINNED.map((l) => l.native),
    ["Español", "Português", "Kreyòl ayisyen", "Русский", "Français"],
  );
});

test("the list is broad, unique, sorted, and never offers English as a target", () => {
  assert.ok(LANGUAGES.length >= 130, `only ${LANGUAGES.length} languages`);
  const codes = LANGUAGES.map((l) => l.code);
  assert.equal(new Set(codes).size, codes.length, "duplicate code");
  assert.ok(!codes.includes("en"));
  const names = LANGUAGES.map((l) => l.english);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en")));
  for (const l of LANGUAGES) {
    assert.ok(isValidCode(l.code), `bad code ${l.code}`);
    assert.ok(l.english && l.native, `missing name for ${l.code}`);
  }
});

test("Google's own codes are used where they differ from ISO", () => {
  for (const code of ["iw", "jw", "tl", "zh-CN", "zh-TW", "ht", "mni-Mtei"])
    assert.ok(languageFor(code), `${code} missing`);
  assert.equal(languageFor("iw").rtl, true);
  assert.equal(languageFor("ar").rtl, true);
  assert.equal(languageFor("es").rtl, false);
});

test("pinned languages are not repeated in the full list", () => {
  for (const code of PINNED_CODES)
    assert.ok(!OTHER_LANGUAGES.some((l) => l.code === code));
  assert.equal(OTHER_LANGUAGES.length, LANGUAGES.length - PINNED.length);
});

test("labels read native name first, without repeating identical names", () => {
  assert.equal(languageLabel(languageFor("de")), "Deutsch (German)");
  assert.equal(languageLabel(languageFor("af")), "Afrikaans");
  assert.equal(languageLabel(null), "");
});

test("isValidCode accepts Google codes and rejects anything else", () => {
  for (const ok of ["es", "haw", "zh-CN", "mni-Mtei"]) assert.ok(isValidCode(ok));
  for (const bad of ["en", "", null, "ES", "es;", "es&u=x", "javascript:", "e", "a-b-c"])
    assert.ok(!isValidCode(bad), String(bad));
});

test("languages Google reports that the list lacks are merged in, once", () => {
  const merged = mergeGoogleLanguages([
    { value: "", text: "Select Language" },
    { value: "es", text: "Spanish" },
    { value: "zza", text: "Zaza" },
    { value: "zza", text: "Zaza" },
    { value: "bad code", text: "Nope" },
  ]);
  assert.equal(merged.length, LANGUAGES.length + 1);
  assert.equal(merged.find((l) => l.code === "zza").english, "Zaza");
  assert.equal(merged.find((l) => l.code === "es").native, "Español");
  assert.equal(mergeGoogleLanguages([]), LANGUAGES);
});

/* ---------------------------- URL fallback ---------------------------- */

test("the fallback URL is translate.google.com with sl, tl and the page as u", () => {
  const out = new URL(
    buildFallbackUrl("es", "https://tiredroponline.com/tires?w=225&a=45&d=17#list"),
  );
  assert.equal(out.origin, "https://translate.google.com");
  assert.equal(out.pathname, "/translate");
  assert.equal(out.searchParams.get("sl"), "en");
  assert.equal(out.searchParams.get("tl"), "es");
  assert.equal(out.searchParams.get("hl"), "es");
  assert.equal(
    out.searchParams.get("u"),
    "https://tiredroponline.com/tires?w=225&a=45&d=17#list",
  );
});

test("the page URL is encoded, so its own query string stays inside u", () => {
  const url = buildFallbackUrl("ht", "https://tiredroponline.com/tires?w=225&a=45");
  assert.match(url, /u=https%3A%2F%2Ftiredroponline\.com%2Ftires%3Fw%3D225%26a%3D45/);
  assert.equal(new URL(url).searchParams.get("tl"), "ht");
});

test("from Google's proxy, the fallback unwraps to the original page", () => {
  const out = new URL(
    buildFallbackUrl(
      "fr",
      "https://tiredroponline-com.translate.goog/cart?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=wapp",
    ),
  );
  assert.equal(out.searchParams.get("u"), "https://tiredroponline.com/cart");
  assert.equal(out.searchParams.get("tl"), "fr");
});

test("the fallback refuses anything that is not a language code", () => {
  assert.throws(() => buildFallbackUrl("en", "https://tiredroponline.com/"));
  assert.throws(() => buildFallbackUrl("es&u=https://evil.example", "https://tiredroponline.com/"));
  assert.throws(() => buildFallbackUrl(undefined, "https://tiredroponline.com/"));
});

test("proxy hosts decode back to the real host", () => {
  assert.ok(isProxyHost("tiredroponline-com.translate.goog"));
  assert.ok(!isProxyHost("tiredroponline.com"));
  assert.equal(originalHost("tiredroponline-com.translate.goog"), "tiredroponline.com");
  assert.equal(originalHost("www-tiredroponline-com.translate.goog"), "www.tiredroponline.com");
  assert.equal(
    originalHost("tiredrop--git--preview--translate-vercel-app.translate.goog"),
    "tiredrop-git-preview-translate.vercel.app",
  );
  assert.equal(originalHost("tiredroponline.com"), "tiredroponline.com");
});

test("originalUrl drops Google's _x_tr_ parameters and keeps the page's own", () => {
  assert.equal(
    originalUrl("https://tiredroponline-com.translate.goog/tire-size?size=225%2F45R17&_x_tr_sl=en&_x_tr_tl=ru"),
    "https://tiredroponline.com/tire-size?size=225%2F45R17",
  );
  assert.equal(originalUrl("https://tiredroponline.com/"), "https://tiredroponline.com/");
});

test("proxyLanguage reads _x_tr_tl on the proxy only", () => {
  assert.equal(proxyLanguage("https://tiredroponline-com.translate.goog/?_x_tr_tl=pt"), "pt");
  assert.equal(proxyLanguage("https://tiredroponline.com/?_x_tr_tl=pt"), null);
  assert.equal(proxyLanguage("https://tiredroponline-com.translate.goog/?_x_tr_tl=<x>"), null);
  assert.equal(proxyLanguage("not a url"), null);
});

/* ------------------------------- cookies ------------------------------- */

test("googtrans is cleared under the host and every parent domain", () => {
  assert.equal(googtransValue("es"), "/en/es");
  assert.deepEqual(cookieDomains("www.tiredroponline.com"), [
    null,
    "www.tiredroponline.com",
    ".www.tiredroponline.com",
    "tiredroponline.com",
    ".tiredroponline.com",
  ]);
  assert.deepEqual(cookieDomains("localhost"), [null, "localhost"]);
  assert.deepEqual(cookieDomains("127.0.0.1"), [null, "127.0.0.1"]);
});

/* -------------------------- protected values -------------------------- */

test("prices, sizes, codes, numbers and contact details are protected", () => {
  const exact = ["TireDrop", "Extreme Tires", "7712 West Oakland Park Blvd"];
  for (const t of [
    "$95.00",
    "$1,234.56",
    " +$25.00 ",
    "$380",
    "225/45R17",
    "225/45ZR17 94W",
    "P235/65R16",
    "LT275/70R18 125/122S",
    "225/45R17 · 94W",
    "31x10.50R15",
    "18x8.5",
    "94W",
    "121/118S",
    "#1001",
    "TD-260929-ABC234",
    "MICH-12345",
    "(954) 773-1896",
    "info@tiredroponline.com",
    "TireDrop",
    "extreme tires",
    "7712 West Oakland Park Blvd",
  ])
    assert.ok(isProtectedText(t, exact), `should protect: ${t}`);
});

test("ordinary words and sentences that contain a price are not", () => {
  for (const t of [
    "Shop Tires",
    "From $95.00 each",
    "Free shipping (48 states + DC) · estimate at checkout",
    "Set of 4",
    "Track Order",
    "",
    "x".repeat(200),
  ])
    assert.ok(!isProtectedText(t, ["TireDrop"]), `should not protect: ${t}`);
});

/* ----------------------------- React guard ----------------------------- */

function fakeNodeClass() {
  class FakeNode {
    constructor(name) {
      this.name = name;
      this.parentNode = null;
      this.children = [];
    }
    removeChild(child) {
      if (child.parentNode !== this) throw new Error("NotFoundError: removeChild");
      this.children = this.children.filter((c) => c !== child);
      child.parentNode = null;
      return child;
    }
    insertBefore(node, ref) {
      if (ref && ref.parentNode !== this) throw new Error("NotFoundError: insertBefore");
      const i = ref ? this.children.indexOf(ref) : this.children.length;
      this.children.splice(i, 0, node);
      node.parentNode = this;
      return node;
    }
  }
  return FakeNode;
}

test("the guard turns a translator's moved node into a warning, not a crash", () => {
  const Node = fakeNodeClass();
  const warnings = [];
  const log = { warn: (...a) => warnings.push(a[0]) };

  const parent = new Node("p");
  const text = new Node("#text");
  parent.insertBefore(text, null);
  // A translator moves the text node into its own <font> wrapper.
  const font = new Node("font");
  parent.removeChild(text);
  parent.insertBefore(font, null);
  font.insertBefore(text, null);

  assert.throws(() => parent.removeChild(text), /NotFoundError/);
  assert.throws(() => parent.insertBefore(new Node("span"), text), /NotFoundError/);

  assert.equal(isDomGuardInstalled(Node), false);
  assert.equal(installDomGuard(Node, log), true);
  assert.equal(installDomGuard(Node, log), false, "installs once");
  assert.equal(isDomGuardInstalled(Node), true);

  assert.equal(parent.removeChild(text), text);
  const span = new Node("span");
  assert.equal(parent.insertBefore(span, text), span);
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /removeChild skipped/);
  assert.match(warnings[1], /insertBefore skipped/);
});

test("the guard leaves calls that would have worked alone", () => {
  const Node = fakeNodeClass();
  const warnings = [];
  installDomGuard(Node, { warn: (m) => warnings.push(m) });
  const parent = new Node("ul");
  const a = new Node("li");
  const b = new Node("li");
  parent.insertBefore(a, null);
  parent.insertBefore(b, a);
  assert.deepEqual(parent.children, [b, a]);
  parent.removeChild(a);
  assert.deepEqual(parent.children, [b]);
  assert.equal(warnings.length, 0);
});

test("without a Node constructor (the prerender), the guard does nothing", () => {
  assert.equal(installDomGuard(undefined), false);
  assert.equal(isDomGuardInstalled(undefined), false);
});

/* ------------------------- Spanish test pages ------------------------- */

test("pages under /es/ are written in Spanish, every other page in English", () => {
  assert.equal(pageLanguage("/es/instalacion-movil"), "es");
  assert.equal(pageLanguage("/es/instalacion-movil/hialeah-fl"), "es");
  assert.equal(pageLanguage("/es"), "es");
  for (const p of ["/", "/tires", "/mobile-service", "/essential", "/esp", undefined])
    assert.equal(pageLanguage(p), "en", String(p));
});

test("the translator is told a Spanish page is Spanish (sl=es, /es/<code>)", () => {
  const out = new URL(buildFallbackUrl("pt", "https://tiredroponline.com/es/instalacion-movil"));
  assert.equal(out.searchParams.get("sl"), "es");
  assert.equal(out.searchParams.get("tl"), "pt");
  // From Google's proxy too: the page's own path decides.
  const viaProxy = new URL(
    buildFallbackUrl(
      "ru",
      "https://tiredroponline-com.translate.goog/es/instalacion-movil/hialeah-fl?_x_tr_sl=es&_x_tr_tl=pt",
    ),
  );
  assert.equal(viaProxy.searchParams.get("sl"), "es");
  assert.equal(viaProxy.searchParams.get("u"), "https://tiredroponline.com/es/instalacion-movil/hialeah-fl");
  assert.equal(googtransValue("fr", "es"), "/es/fr");
  assert.equal(googtransValue("fr"), "/en/fr", "English pages are unchanged");
});
