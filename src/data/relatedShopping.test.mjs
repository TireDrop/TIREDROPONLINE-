/**
 * Related-shopping links: every Learn guide and blog post gets at least two
 * money-page links, every target is a real route, and the product pages link
 * a guide plus /brands (tires) or /wheel-fitment (wheels).
 * Run with: npm run test:data
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import {
  MONEY_PREFIXES,
  SHOPPING_LINKS,
  productRelatedLinks,
  shoppingLinksFor,
} from "./relatedShopping.js";
import { TIRES, WHEELS, getProduct } from "./products.js";
import { loadContent } from "../content/node.js";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const app = readFileSync(resolve(ROOT, "src/App.jsx"), "utf8");
const ROUTES = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

const store = loadContent();
const ARTICLES = [...store.getLearnArticles(), ...store.getBlogPosts()];
const hasContent = (p) => ARTICLES.some((a) => a.path === p);

function isRealRoute(to) {
  if (ROUTES.includes(to)) return true;
  let m = /^\/tires\/([^/]+)$/.exec(to);
  if (m) return !!getProduct("tire", m[1]);
  m = /^\/wheels\/([^/]+)$/.exec(to);
  if (m) return !!getProduct("wheel", m[1]);
  return hasContent(to);
}

const isMoney = (to) =>
  MONEY_PREFIXES.some((p) => to === p || to.startsWith(`${p}/`));

test("there are articles to check", () => {
  assert.ok(ARTICLES.length >= 80, `only ${ARTICLES.length} articles`);
});

test("every catalog link points at a real route", () => {
  for (const [key, l] of Object.entries(SHOPPING_LINKS)) {
    assert.ok(isRealRoute(l.to), `${key} -> ${l.to} is not a route`);
    assert.ok(l.anchors.length > 0 && l.note, `${key} needs anchors and a note`);
  }
});

test("every article has at least two money-page links, all real", () => {
  for (const a of ARTICLES) {
    const links = shoppingLinksFor(a);
    const money = new Set(links.map((l) => l.to).filter(isMoney));
    assert.ok(money.size >= 2, `${a.path}: only ${money.size} money links`);
    for (const l of links) {
      assert.ok(isRealRoute(l.to), `${a.path}: ${l.to} is not a route`);
      assert.ok(
        !/click here|read more|^here$/i.test(l.text),
        `${a.path}: weak anchor "${l.text}"`,
      );
    }
    const texts = links.map((l) => l.text);
    assert.equal(new Set(texts).size, texts.length, `${a.path}: repeated anchor`);
  }
});

test("related-shopping copy follows the house rules", () => {
  const banned =
    /discount|coupon|rebate|\bdeals?\b|\bsale\b|safe to drive|\bAPR\b|arrive|delivered by|since \d{4}/i;
  for (const [key, l] of Object.entries(SHOPPING_LINKS)) {
    assert.ok(!banned.test(`${l.anchors.join(" ")} ${l.note}`), `${key} copy`);
  }
});

test("tire pages link a guide and /brands; wheel pages a guide and /wheel-fitment", () => {
  for (const t of TIRES) {
    const { links } = productRelatedLinks(t);
    assert.ok(links.some((l) => l.to === "/brands"), `${t.slug}: no /brands`);
    assert.ok(
      links.some((l) => l.to.startsWith("/learn/")),
      `${t.slug}: no guide`,
    );
    for (const l of links) assert.ok(isRealRoute(l.to), `${t.slug}: ${l.to}`);
  }
  assert.equal(WHEELS.length, 12);
  for (const w of WHEELS) {
    const { links } = productRelatedLinks(w);
    assert.ok(links.some((l) => l.to === "/wheel-fitment"), `${w.slug}: no fitment`);
    assert.ok(
      links.some((l) => l.to.startsWith("/learn/")),
      `${w.slug}: no guide`,
    );
    for (const l of links) assert.ok(isRealRoute(l.to), `${w.slug}: ${l.to}`);
  }
});
