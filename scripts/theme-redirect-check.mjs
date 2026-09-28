/**
 * Theme redirect check. Renders the TD-REDIRECT block at the top of
 * shopify/layout/theme.liquid with liquidjs and stubbed Shopify objects, then
 * runs the emitted <script> in a VM with a fake `location` and asserts:
 *   - it fires on shop.tiredroponline.com storefront templates, with the
 *     right target URL (path + query string + hash);
 *   - it stays silent on customers/*, password, gift_card, the theme editor,
 *     theme previews, and the other store domains;
 *   - crafted paths (quotes, </script>, newlines) cannot break out of the
 *     script or the attributes.
 * Nothing reaches Shopify.
 *
 *   LIQUIDJS_DIR=/path/to/node_modules node scripts/theme-redirect-check.mjs
 *
 * liquidjs is not a repo dependency; point LIQUIDJS_DIR at any node_modules
 * that has it (or install it globally). Differences from Shopify's Liquid
 * that matter here: none of the filters used (json, escape, replace, append,
 * default) behave differently for these inputs, and the block uses no
 * backslash string literals (liquidjs unescapes those, Shopify does not).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const require = createRequire(
  process.env.LIQUIDJS_DIR ? `${process.env.LIQUIDJS_DIR}/` : import.meta.url,
);
const { Liquid } = require("liquidjs");

const LAYOUT = fileURLToPath(new URL("../shopify/layout/theme.liquid", import.meta.url));
const src = readFileSync(LAYOUT, "utf8");
const start = src.indexOf("<head>") + "<head>".length;
const end = src.indexOf("{%- if settings.favicon != blank -%}");
assert.ok(start > 5 && end > start, "TD-REDIRECT block not found in theme.liquid");
const block = src.slice(start, end);
assert.match(block, /TD-REDIRECT/);

const engine = new Liquid({ strictFilters: true, strictVariables: false });
const tpl = engine.parse(block);

// template.name / template.directory the way Shopify exposes them.
const tmpl = (t) => {
  const [a, b] = t.split("/");
  return b ? { name: b, directory: a } : { name: a, directory: null };
};

async function run({ host = "shop.tiredroponline.com", template = "index", path = "/",
  search = "", hash = "", design_mode = false, visual_preview_mode = false }) {
  const html = await engine.render(tpl, {
    request: { host, path, design_mode, visual_preview_mode },
    template: tmpl(template),
  });
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let replaced = null;
  for (const code of scripts) {
    vm.runInNewContext(code, { location: { search, hash, replace: (u) => { replaced = u; } } });
  }
  const attr = (re) => (html.match(re) || [])[1] ?? null;
  return {
    html,
    replaced,
    openTags: (html.match(/<script/gi) || []).length,
    closeTags: (html.match(/<\/script/gi) || []).length,
    refresh: attr(/<meta http-equiv="refresh" content="0;url=([^"]*)">/),
    canonical: attr(/<link rel="canonical" href="([^"]*)">/),
    noindex: /<meta name="robots" content="noindex">/.test(html),
  };
}

let passed = 0;
const check = async (name, fn) => {
  try { await fn(); passed++; console.log(`ok   ${name}`); }
  catch (e) { console.log(`FAIL ${name}\n     ${e.message}`); process.exitCode = 1; }
};

// --- fires ---------------------------------------------------------------
const fires = [
  ["index", "/", "", "https://tiredroponline.com/"],
  ["product", "/products/michelin-defender", "?variant=123", "https://tiredroponline.com/products/michelin-defender?variant=123"],
  ["product.alternate", "/products/x", "", "https://tiredroponline.com/products/x"],
  ["collection", "/collections/all-season", "?page=2&sort_by=price", "https://tiredroponline.com/collections/all-season?page=2&sort_by=price"],
  ["page", "/pages/contact", "", "https://tiredroponline.com/pages/contact"],
  ["page.financing", "/pages/financing", "", "https://tiredroponline.com/pages/financing"],
  ["cart", "/cart", "", "https://tiredroponline.com/cart"],
  ["search", "/search", "?q=205%2F55R16&type=product", "https://tiredroponline.com/search?q=205%2F55R16&type=product"],
];
for (const [template, path, search, want] of fires) {
  await check(`fires: ${template} ${path}${search}`, async () => {
    const r = await run({ template, path, search });
    assert.equal(r.replaced, want);
    assert.equal(r.refresh, `https://tiredroponline.com${path}`);
    assert.equal(r.canonical, `https://tiredroponline.com${path}`);
    assert.ok(r.noindex, "noindex missing");
  });
}
await check("fires: hash is kept", async () => {
  const r = await run({ template: "page", path: "/pages/faq", search: "?a=1", hash: "#returns" });
  assert.equal(r.replaced, "https://tiredroponline.com/pages/faq?a=1#returns");
});

// --- does not fire -------------------------------------------------------
const silent = [
  ["customers/account", { template: "customers/account", path: "/account" }],
  ["customers/login", { template: "customers/login", path: "/account/login" }],
  ["customers/register", { template: "customers/register", path: "/account/register" }],
  ["customers/order", { template: "customers/order", path: "/account/orders/abc" }],
  ["customers/addresses", { template: "customers/addresses", path: "/account/addresses" }],
  ["customers/activate_account", { template: "customers/activate_account", path: "/account/activate/1/x" }],
  ["customers/reset_password", { template: "customers/reset_password", path: "/account/reset/1/x" }],
  ["password", { template: "password", path: "/password" }],
  ["gift_card", { template: "gift_card", path: "/gift_cards/x" }],
  ["design_mode", { template: "index", design_mode: true }],
  ["visual_preview_mode", { template: "product", path: "/products/x", visual_preview_mode: true }],
  ["host etwheelz.com", { host: "etwheelz.com" }],
  ["host www.etwheelz.com", { host: "www.etwheelz.com", template: "product", path: "/products/x" }],
  ["host account.etwheelz.com", { host: "account.etwheelz.com" }],
  ["host 3rxp1x-ym.myshopify.com", { host: "3rxp1x-ym.myshopify.com", template: "collection", path: "/collections/all" }],
  ["host tiredroponline.com (never on Shopify, but no self-loop)", { host: "tiredroponline.com" }],
];
for (const [name, opts] of silent) {
  await check(`silent: ${name}`, async () => {
    const r = await run(opts);
    assert.equal(r.html.trim(), "", `unexpected output: ${r.html.trim().slice(0, 120)}`);
    assert.equal(r.replaced, null);
  });
}
await check("silent in JS: ?preview_theme_id=", async () => {
  const r = await run({ template: "index", search: "?preview_theme_id=166982615192" });
  assert.equal(r.replaced, null);
});
await check("silent in JS: &preview_theme_id=", async () => {
  const r = await run({ template: "product", path: "/products/x", search: "?_ab=0&preview_theme_id=1" });
  assert.equal(r.replaced, null);
});

// --- injection -----------------------------------------------------------
const nasty = [
  `/pages/x"</script><script>globalThis.pwned=1</script>`,
  `/pages/it's-"quoted"`,
  `/pages/a</SCRIPT >b`,
  `/pages/<!--x`,
  "/pages/line\nbreak sep",
  "/pages/back\\slash",
  `/pages/x" onload="alert(1)`,
];
for (const path of nasty) {
  await check(`no injection: ${JSON.stringify(path)}`, async () => {
    const r = await run({ template: "page", path, search: "?q=1" });
    assert.equal(r.openTags, 1, "extra <script> tag");
    assert.equal(r.closeTags, 1, "extra </script> tag");
    const enc = path.replace(/</g, "%3C").replace(/>/g, "%3E");
    assert.equal(r.replaced, `https://tiredroponline.com${enc}?q=1`);
    for (const v of [r.refresh, r.canonical]) {
      assert.ok(v !== null, "attribute missing or broken out of");
      assert.doesNotMatch(v, /["<>]/);
    }
  });
}

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ", 0 failed"}`);
