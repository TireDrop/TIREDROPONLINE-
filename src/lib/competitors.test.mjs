import { test } from "node:test";
import assert from "node:assert/strict";

import {
  COMPETITOR_DOMAINS,
  COMPETITOR_NAMES,
  decodeEntities,
  findCompetitorHosts,
  findCompetitorNames,
  hostOf,
  isCompetitorHost,
  isResourceHost,
  scanPage,
} from "./competitors.js";

const names = (text) => findCompetitorNames(text).map((h) => h.name);

test("the lists are well formed: lower-case bare domains, no duplicates", () => {
  for (const d of COMPETITOR_DOMAINS) assert.match(d, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, d);
  assert.equal(new Set(COMPETITOR_DOMAINS).size, COMPETITOR_DOMAINS.length);
  const n = COMPETITOR_NAMES.map((e) => (typeof e === "string" ? e : e.name));
  assert.equal(new Set(n).size, n.length);
});

test("hostOf: absolute, protocol-relative, user info, port; relative is empty", () => {
  assert.equal(hostOf("https://WWW.TireRack.com/x?y#z"), "www.tirerack.com");
  assert.equal(hostOf("//cdn.ebay.com/a.png"), "cdn.ebay.com");
  assert.equal(hostOf("http://user:pw@walmart.com:8080/p"), "walmart.com");
  assert.equal(hostOf("/learn/tread"), "");
  assert.equal(hostOf("mailto:hi@tiredroponline.com"), "");
  assert.equal(hostOf(undefined), "");
});

test("competitor hosts: the domain and every subdomain, nothing that merely ends alike", () => {
  assert.ok(isCompetitorHost("tirerack.com"));
  assert.ok(isCompetitorHost("www.tirerack.com"));
  assert.ok(isCompetitorHost("a.b.discounttire.com"));
  assert.ok(isCompetitorHost("SHOP.TESLA.COM."));
  assert.ok(!isCompetitorHost("www.tesla.com"), "Tesla the carmaker is a resource");
  assert.ok(!isCompetitorHost("service.tesla.com"));
  assert.ok(!isCompetitorHost("nottirerack.com"));
  assert.ok(!isCompetitorHost("tirerack.com.example.org"));
  assert.ok(!isCompetitorHost("www.firestonetire.com"), "Firestone the maker is a resource");
  assert.ok(!isCompetitorHost(""));
});

test("resources: allowlist by domain, suffix and pattern; a competitor never counts", () => {
  for (const h of ["www.nhtsa.gov", "dmv.ny.gov", "www.tceq.texas.gov", "tires.bridgestone.com", "www.bridgestoneamericas.com",
    "www.continental-tires.com", "continentaltire.com", "fonts.gstatic.com", "shop.tiredroponline.com", "www.tesla.com"]) {
    assert.ok(isResourceHost(h), h);
  }
  assert.ok(!isResourceHost("shop.tesla.com"), "the shop is denied even though tesla.com is allowed");
  assert.ok(!isResourceHost("example.com"));
  assert.ok(!isResourceHost("gov.example.com"));
});

test("names: case-insensitive, word boundaries, either apostrophe, any spacing", () => {
  assert.deepEqual(names("Per TIRE RACK and discount tire"), ["Tire Rack", "Discount Tire"]);
  assert.deepEqual(names("America’s Tire and Sam's Club"), ["America's Tire", "Sam's Club"]);
  assert.deepEqual(names("Les Schwab, Pep  Boys"), ["Les Schwab", "Pep Boys"]);
  assert.deepEqual(names("Buy at NTB."), ["NTB"]);
  assert.deepEqual(names("CARiD, carid"), ["CARiD", "CARiD"]);
  assert.deepEqual(names("Firestone Complete Auto Care says"), ["Firestone Complete Auto Care"]);
});

test("names: makers, places and everyday phrases are not competitors", () => {
  assert.deepEqual(names("Firestone Destination LE3 and Firestone tires"), []);
  assert.deepEqual(names("Monroe County and Monro Avenue"), []);
  assert.deepEqual(names("Mavisa, ntbx, Costcos, Walmartian"), []);
  assert.deepEqual(names("4 tires plus installation"), [], "Tires Plus is matched with its capitals only");
  assert.deepEqual(names("Tires Plus"), ["Tires Plus"]);
});

test("bare hosts in prose or code are found", () => {
  assert.deepEqual(findCompetitorHosts("see tirerack.com/x or www.EBAY.com, not tesla.com").map((h) => h.host), ["tirerack.com", "www.ebay.com"]);
  assert.deepEqual(findCompetitorHosts("src/lib/tirerack.component.js? no: mytirerack.com"), []);
});

test("decodeEntities: named and numeric", () => {
  assert.equal(decodeEntities("Sam&#x27;s &amp; America&rsquo;s&nbsp;Tire &#39;x&#39; &bogus;"), "Sam's & America’s Tire 'x' &bogus;");
});

const PAGE = (head, body) => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

test("scanPage: a clean page passes and reports its external links", () => {
  const { failures, links } = scanPage(
    PAGE(
      `<title>Tread depth | TireDrop</title><meta name="description" content="Firestone and Michelin advice"><link rel="preconnect" href="https://fonts.gstatic.com">`,
      `<a href="/learn">Learn</a><a href="https://www.nhtsa.gov/x">NHTSA</a><img src="//cdn.example.com/a.png" alt="Tread" srcset="https://img.example.org/a.png 1x, /b.png 2x"><!-- -->Monroe County`,
    ),
  );
  assert.deepEqual(failures, []);
  assert.deepEqual(links, ["fonts.gstatic.com", "www.nhtsa.gov", "cdn.example.com", "img.example.org"]);
});

test("scanPage: every place a competitor can hide fails, once per value", () => {
  const html = PAGE(
    `<title>Tire Rack vs us</title><meta property="og:description" content="Cheaper than Costco"><link rel="canonical" href="https://www.walmart.com/x">` +
      `<script type="application/ld+json">{"@type":"Article","citation":[{"name":"Les Schwab guide","url":"https://www.lesschwab.com/a"}]}</script>` +
      `<script>window.__D={"u":"https:\\/\\/shop.tesla.com\\/p"}</script>`,
    `<a href="https://www.tirerack.com/a">one</a><a href="https://www.tirerack.com/a">two</a><img src="https://i.ebay.com/x.png" alt="Pep Boys">` +
      `<p>As Discount Tire puts it, see simpletire.com.</p><p>Monroe and Firestone are fine.</p>`,
  );
  const { failures, links } = scanPage(html);
  const got = failures.map((f) => `${f.kind} ${f.value.split(":")[0]}`);
  for (const want of [
    'title "Tire Rack"',
    '<meta og:description> "Costco"',
    "<link href> https",
    'json-ld "Les Schwab"',
    "json-ld www.lesschwab.com",
    "<a href> https",
    "<img src> https",
    '[alt] "Pep Boys"',
    'text "Discount Tire"',
    "text simpletire.com",
    "url in page source https",
  ]) {
    assert.ok(got.includes(want), `missing ${want} in\n${got.join("\n")}`);
  }
  assert.equal(failures.filter((f) => f.value === "https://www.tirerack.com/a").length, 1, "same link reported once");
  assert.ok(failures.some((f) => f.kind === "url in page source" && f.value.includes("shop.tesla.com")));
  assert.deepEqual(links, [], "competitor hosts are failures, not report entries");
});

test("scanPage: sitemap/robots text", () => {
  const { failures, links } = scanPage("Sitemap: https://tiredroponline.com/sitemap.xml\n# see https://www.amazon.com/x", { markup: false });
  assert.ok(failures.some((f) => f.value.startsWith("www.amazon.com")));
  assert.ok(failures.some((f) => f.value.startsWith('"amazon"')));
  assert.deepEqual(links, ["tiredroponline.com"]);
});
