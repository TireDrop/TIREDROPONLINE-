import { test } from "node:test";
import assert from "node:assert/strict";

import {
  anchorHrefs,
  articleOwnHtml,
  articleSendsOn,
  isArticleRoute,
  isNoindex,
  isShopOrToolRoute,
  mainContentHtml,
  routeOf,
  routeOfFile,
  vercelSourceRegex,
} from "./internalLinks.js";

test("anchorHrefs reads <a href> only, entity-decoded", () => {
  const html = `<link href="/x.css"><a class="b" href="/tires?year=2019&amp;make=ford">t</a>
    <a href='/learn'>l</a><script>const a = '<a href="/in-script">';</script><img src="/a.png"><area href="/map">`;
  assert.deepEqual(anchorHrefs(html).slice(0, 2), ["/tires?year=2019&make=ford", "/learn"]);
  assert.ok(!anchorHrefs(html).includes("/x.css"));
  assert.ok(!anchorHrefs(html).includes("/map"));
});

test("routeOf: site paths only, query/hash/trailing slash dropped", () => {
  assert.equal(routeOf("/tires?size=265-70r17#results"), "/tires");
  assert.equal(routeOf("/learn/age/"), "/learn/age");
  assert.equal(routeOf("/"), "/");
  assert.equal(routeOf("https://www.tiredroponline.com/wheels"), "/wheels");
  assert.equal(routeOf("https://tiredroponline.com"), "/");
  for (const off of ["https://nhtsa.gov/x", "//cdn.example/x", "#faq", "tel:+19547731896", "mailto:a@b.c", "/api/status", ""]) {
    assert.equal(routeOf(off), null, off);
  }
  // A look-alike host is not this site.
  assert.equal(routeOf("https://tiredroponline.com.evil.test/tires"), null);
});

test("routeOfFile maps dist files to routes", () => {
  assert.equal(routeOfFile("index.html"), "/");
  assert.equal(routeOfFile("learn.html"), "/learn");
  assert.equal(routeOfFile("learn/age/how-old-is-too-old.html"), "/learn/age/how-old-is-too-old");
  assert.equal(routeOfFile("blog/index.html"), "/blog");
});

test("vercelSourceRegex covers the vercel.json forms", () => {
  assert.ok(vercelSourceRegex("/track-order").test("/track-order"));
  assert.ok(!vercelSourceRegex("/track-order").test("/track-order/x"));
  assert.ok(vercelSourceRegex("/tires/p/:sku").test("/tires/p/ABC123"));
  assert.ok(!vercelSourceRegex("/tires/p/:sku").test("/tires/p"));
  const tool = vercelSourceRegex("/tools/:tool(tire-size|tire-check)");
  assert.ok(tool.test("/tools/tire-size") && !tool.test("/tools/other"));
  const star = vercelSourceRegex("/blogs/:path*");
  assert.ok(star.test("/blogs") && star.test("/blogs/news/x"));
  const plus = vercelSourceRegex("/cart/:path+");
  assert.ok(plus.test("/cart/a") && !plus.test("/cart"));
  assert.ok(vercelSourceRegex("/:shopId(\\d+)/:kind(orders|invoices)/:path*").test("/123/orders/abc"));
});

test("articles and shop/tool routes", () => {
  assert.ok(isArticleRoute("/blog/nitrogen-in-tires-myth"));
  assert.ok(isArticleRoute("/learn/age/how-old-is-too-old"));
  assert.ok(!isArticleRoute("/learn/age") && !isArticleRoute("/blog") && !isArticleRoute("/learn"));
  const tools = ["/tire-check"];
  for (const r of ["/tires", "/tires/nitto-motivo-245-45r19", "/wheels", "/install", "/schedule", "/tire-check"]) {
    assert.ok(isShopOrToolRoute(r, tools), r);
  }
  for (const r of ["/learn", "/blog/x", "/tires-guide", "/about"]) assert.ok(!isShopOrToolRoute(r, tools), r);
});

const page = (body) => `<header><a href="/tires">Shop</a></header><main>
  <nav aria-label="Breadcrumb"><a href="/learn">Learn</a></nav>
  <article><header><a href="/learn/age">Age</a></header>${body}
    <section aria-labelledby="content-cta" class="x"><a href="/tires">Shop tires</a><a href="/install">Book</a></section>
  </article></main><footer><a href="/wheels">Wheels</a></footer>`;

test("an article's own links count; nav, footer and the shared CTA box do not", () => {
  assert.equal(articleSendsOn(page("<p>No links here.</p>")), false);
  assert.equal(articleSendsOn(page('<p>See <a href="/learn/x/y">this</a>.</p>')), false);
  assert.equal(articleSendsOn(page('<p><a href="/tires?size=225-45r17">Shop 225/45R17</a></p>')), true);
  assert.equal(articleSendsOn(page('<p><a href="/tire-check">Check</a></p>'), ["/tire-check"]), true);
  assert.equal(articleSendsOn(page('<div class="my-8" data-demo="tread-depth"></div>')), true);
  assert.ok(!articleOwnHtml(page("")).includes("content-cta"));
  assert.equal(articleOwnHtml("<main>no article</main>"), "");
});

test("mainContentHtml drops the breadcrumb and everything outside <main>", () => {
  const main = mainContentHtml(page('<a href="/about">About</a>'));
  assert.deepEqual(anchorHrefs(main), ["/learn/age", "/about", "/tires", "/install"]);
  assert.equal(mainContentHtml("<div>no main</div>"), "");
});

test("isNoindex", () => {
  assert.ok(isNoindex('<meta name="robots" content="noindex, follow" />'));
  assert.ok(!isNoindex('<meta name="robots" content="index, follow" />'));
  assert.ok(!isNoindex("<title>x</title>"));
});
