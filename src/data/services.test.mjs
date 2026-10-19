// Guards for the 12 /services/:slug pages: every page carries real copy of
// its own, a closing line that fits it, sourced guidance and 2 to 4 FAQs, and
// none of the house rules is broken (no deals language, no "safe to drive", no
// invented prices or times, no em dashes, only resource-host sources).
// Run with `npm run test:data`.
import { test } from "node:test";
import assert from "node:assert/strict";

import { SERVICES, getService } from "./services.js";
import { isResourceHost } from "../lib/competitors.js";

const AREA = /Miami-Dade, Broward and Palm Beach/;

// The plain search phrase each page must carry in its H1 or first paragraph.
const PHRASE = {
  "tire-installation": "tire installation",
  "tire-balancing": "tire balancing",
  "tire-repair": "flat tire repair",
  "tire-rotation": "tire rotation",
  "wheel-installation": "wheel installation",
  "oil-change": "oil change",
  "tpms-service": "tpms sensor replacement",
  "brake-repair": "brake repair",
  "wheel-alignment": "wheel alignment",
  "suspension-repair": "suspension repair",
  "lift-kits": "lift kit",
  diagnostics: "check engine light",
};

const words = (s) => String(s).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

/** Every string of a service's own copy (not facts, not source titles). */
function copyText(s) {
  return [
    s.heading,
    ...(s.intro ?? []),
    ...(s.when ?? []),
    ...(s.steps ?? []),
    ...(s.priceFactors ?? []),
    ...(s.faq ?? []).flatMap((f) => [f.q, f.a]),
    s.closing,
    ...(s.guides ?? []).map((g) => g.label),
  ].filter(Boolean);
}

test("there are 12 services and each has copy", () => {
  assert.equal(SERVICES.length, 12);
  for (const s of SERVICES) {
    assert.ok(PHRASE[s.slug], `${s.slug}: add its search phrase to this test`);
    assert.ok(s.heading, `${s.slug}: no heading`);
    assert.equal(s.intro?.length, 2, `${s.slug}: intro should be 2 paragraphs`);
    assert.ok(s.when?.length >= 2, `${s.slug}: when needs 2+ paragraphs`);
    assert.ok(s.steps?.length >= 4, `${s.slug}: steps needs 4+`);
    assert.ok(s.priceFactors?.length >= 3, `${s.slug}: priceFactors needs 3+`);
    assert.ok(s.sources?.length >= 1, `${s.slug}: no sources`);
  }
});

test("each service has at least 350 words of its own copy", () => {
  for (const s of SERVICES) {
    const n = words(copyText(s).join(" "));
    assert.ok(n >= 350, `${s.slug}: only ${n} words of own copy`);
  }
});

test("each page targets its plain search phrase and names South Florida or Sunrise", () => {
  for (const s of SERVICES) {
    const head = `${s.heading} ${s.intro[0]}`.toLowerCase();
    assert.ok(head.includes(PHRASE[s.slug]), `${s.slug}: "${PHRASE[s.slug]}" missing from H1 or first paragraph`);
    assert.match(`${s.heading} ${s.intro[0]}`, /South Florida|Sunrise/, `${s.slug}: no local name`);
    if (s.mobile) assert.match(s.intro[0], AREA, `${s.slug}: mobile page should name the three counties`);
    else assert.match(s.intro[0], /Sunrise/, `${s.slug}: shop page should name Sunrise`);
  }
});

test("every service has its own closing line, not a shared one", () => {
  const seen = new Set();
  for (const s of SERVICES) {
    assert.ok(s.closing && s.closing.length > 40, `${s.slug}: no closing line`);
    assert.ok(!seen.has(s.closing), `${s.slug}: closing line repeats another service's`);
    seen.add(s.closing);
    assert.ok(!/\btow\b/i.test(s.closing), `${s.slug}: the shared tow line crept back`);
    assert.ok(!/\bvisit\b.*\btow\b/i.test(s.closing));
  }
});

test("2 to 4 FAQs per page, each with a real answer and a unique question", () => {
  for (const s of SERVICES) {
    assert.ok(s.faq.length >= 2 && s.faq.length <= 4, `${s.slug}: ${s.faq.length} FAQs`);
    const qs = new Set();
    for (const f of s.faq) {
      assert.ok(f.q.endsWith("?"), `${s.slug}: "${f.q}" is not a question`);
      assert.ok(words(f.a) >= 20, `${s.slug}: thin answer to "${f.q}"`);
      assert.ok(!qs.has(f.q), `${s.slug}: duplicate question`);
      qs.add(f.q);
    }
  }
});

test("house rules hold across all service copy", () => {
  const rules = [
    [/\b(discount|coupon|rebate|deals?|promo\w*|sale|cheap\w*|bargain|savings?|save)\b/i, "deals language"],
    [/safe to drive/i, '"safe to drive"'],
    [/\b(guarantee[sd]?|warrant(y|ies))\b/i, "a guarantee or warranty claim"],
    [/\$\s?\d/, "a dollar figure (prices live in priceFrom only)"],
    [/\bsince\s+(19|20)\d\d\b/i, 'an invented "since" year'],
    [/\b(\d(\.\d)?[- ]stars?|(customer|google|yelp|verified|five-star)\s+reviews?|reviews? (from|by)|rated \d|testimonials?)\b/i, "a rating or review"],
    [/\b(APR|financing|lender|loan)\b/i, "APR or lender wording"],
    [/[—–]/, "an em or en dash"],
    [/\b(same[- ]day|next[- ]day|tomorrow|today|while you wait|within \d|in under|by \w+day)\b/i, "a time or delivery promise"],
    [/\b(delivery|deliver(s|ed)?|arrive[sd]?|arrival)\b/i, "delivery or arrival wording"],
  ];
  for (const s of SERVICES) {
    for (const text of copyText(s)) {
      for (const [re, what] of rules) {
        assert.ok(!re.test(text), `${s.slug}: ${what} in "${text.slice(0, 80)}"`);
      }
    }
  }
});

test("only shop-bay services say the work is bay-only, and mobile ones name the area", () => {
  for (const s of SERVICES.filter((x) => !x.mobile)) {
    assert.ok(copyText(s).join(" ").includes("Sunrise"), `${s.slug}: shop page never says Sunrise`);
  }
  for (const s of SERVICES.filter((x) => x.mobile)) {
    assert.ok(copyText(s).join(" ").match(AREA), `${s.slug}: mobile page never names the service area`);
  }
});

test("sources are https links on resource hosts, with a title and publisher", () => {
  for (const s of SERVICES) {
    const urls = new Set();
    for (const src of s.sources) {
      assert.ok(src.title && src.publisher, `${s.slug}: source missing title or publisher`);
      const u = new URL(src.url);
      assert.equal(u.protocol, "https:", `${s.slug}: ${src.url}`);
      assert.ok(isResourceHost(u.hostname), `${s.slug}: ${u.hostname} is not a known resource host`);
      assert.ok(!urls.has(src.url), `${s.slug}: duplicate source`);
      urls.add(src.url);
    }
  }
});

test("guide links are site paths", () => {
  for (const s of SERVICES) {
    for (const g of s.guides ?? []) {
      assert.match(g.to, /^\/[a-z0-9\-/]+$/, `${s.slug}: ${g.to}`);
      assert.ok(g.label, `${s.slug}: guide with no label`);
    }
  }
});

test("the copy merge leaves the facts alone", () => {
  const s = getService("tire-rotation");
  assert.equal(s.priceFrom, 40);
  assert.equal(s.duration, "30 min");
  assert.equal(s.name, "Tire Rotation");
  assert.ok(Array.isArray(s.includes) && Array.isArray(s.symptoms));
});
