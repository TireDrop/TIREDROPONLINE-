// Title, H1 and meta description for the catalog product pages.
//
//   npm run test:data      (node --test "src/data/*.test.mjs")
import test from "node:test";
import assert from "node:assert/strict";

import { TIRES, WHEELS } from "./products.js";
import {
  productH1,
  productTitle,
  productDescription,
  TITLE_MAX,
  DESC_MIN,
  DESC_MAX,
} from "./productSeo.js";

const SUFFIX = " | TireDrop";
const BANNED =
  /most requested|top seller|best[- ]sell|popular|excellent|race-proven|\bproven\b|#1|favorite|safe to drive|coupon|discount|rebate|\bdeal|\bAPR\b|since \d{4}/i;

const all = [...TIRES, ...WHEELS];

test("catalog is covered (20 tires, 12 wheels)", () => {
  assert.equal(TIRES.length, 20);
  assert.equal(WHEELS.length, 12);
});

for (const p of all) {
  const label = `${p.kind} ${p.slug}`;
  test(`H1 carries brand, model and size: ${label}`, () => {
    const h1 = productH1(p);
    assert.ok(h1.startsWith(`${p.brand} ${p.model}`), h1);
    if (p.kind === "wheel") {
      assert.ok(h1.includes(`${p.diameter}x${p.wheelWidth}`), h1);
      assert.ok(h1.includes(p.finish), h1);
    } else {
      assert.ok(h1.includes(p.size), h1);
    }
  });
  test(`title is keyword-led and within ${TITLE_MAX}: ${label}`, () => {
    const t = productTitle(p);
    assert.ok(t.length + SUFFIX.length <= TITLE_MAX, `${t.length}: ${t}`);
    assert.match(t, p.kind === "wheel" ? /\bWheel\b/ : /\bTire\b/);
    assert.ok(t.startsWith(p.brand), t);
  });
  test(`description is clean and ${DESC_MIN}-${DESC_MAX} chars: ${label}`, () => {
    const d = productDescription(p);
    assert.ok(d.length >= DESC_MIN && d.length <= DESC_MAX, `${d.length}: ${d}`);
    assert.ok(!d.includes("$"), d);
    assert.ok(!BANNED.test(d), d);
    assert.ok(!/\b(delivered|arrives?|by (mon|tue|wed|thu|fri|sat|sun))/i.test(d), d);
  });
  test(`feature copy has no invented popularity claims: ${label}`, () => {
    for (const f of p.features ?? []) assert.ok(!BANNED.test(f), f);
  });
}
