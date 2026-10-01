// Rules for the Returns, Warranty & Road Hazard copy (src/data/returnsPolicy.js)
// and its publish switch (src/data/returnsFlag.js).
//
//   node --test src/data/returnsPolicy.test.mjs   (or npm run test:data)

import test from "node:test";
import assert from "node:assert/strict";

import { BUSINESS } from "./business.js";
import {
  RETURNS_PAGE_LIVE,
  draftAllowedByEnv,
} from "./returnsFlag.js";
import {
  FAQ,
  QUESTIONS_FOR_JUSTIN,
  SECTIONS,
  SUMMARY,
  TODO_PATTERN,
} from "./returnsPolicy.js";

/** Every string the page renders from the data file, with where it is. */
const rendered = [
  ...SUMMARY.flatMap((s) => [
    [`summary ${s.id} title`, s.title],
    [`summary ${s.id}`, s.copy],
  ]),
  ...SECTIONS.flatMap((s) => [
    [`${s.id} heading`, s.heading],
    ...[...(s.paragraphs ?? []), ...(s.list ?? []), ...(s.after ?? [])].map(
      (t, i) => [`${s.id} #${i + 1}`, t],
    ),
  ]),
  ...FAQ.flatMap((f) => [
    [`FAQ "${f.q}" question`, f.q],
    [`FAQ "${f.q}"`, f.a],
  ]),
];

const withoutTodos = (s) => s.replace(TODO_PATTERN, "");

test("the page cannot go live with a TODO_JUSTIN marker left", () => {
  const left = rendered.filter(([, t]) => /TODO_JUSTIN/.test(t));
  if (RETURNS_PAGE_LIVE) {
    assert.deepEqual(
      left.map(([where]) => where),
      [],
      "RETURNS_PAGE_LIVE is true but these still have a TODO_JUSTIN marker",
    );
  } else {
    assert.ok(left.length > 0, "no markers left: flip RETURNS_PAGE_LIVE");
  }
});

test("every TODO_JUSTIN marker is well formed", () => {
  for (const [where, text] of rendered) {
    const loose = (text.match(/TODO_JUSTIN/g) ?? []).length;
    const wellFormed = (text.match(TODO_PATTERN) ?? []).length;
    assert.equal(loose, wellFormed, `${where}: malformed marker in "${text}"`);
  }
});

test("house wording: never safe, fine, OK or guaranteed", () => {
  for (const [where, text] of rendered) {
    assert.doesNotMatch(
      withoutTodos(text),
      /\b(safe|safer|safely|fine|guaranteed?|OK)\b/i,
      where,
    );
  }
});

test("no discounts, coupons, rebates or deals", () => {
  for (const [where, text] of rendered) {
    assert.doesNotMatch(
      text,
      /\b(discount|coupon|rebate|deal|promo|% off|sale price)s?\b/i,
      where,
    );
  }
});

test("no invented numbers: no digits except the shop's phone and email", () => {
  for (const [where, text] of rendered) {
    const stripped = withoutTodos(text)
      .replaceAll(BUSINESS.phone, "")
      .replaceAll(BUSINESS.email, "");
    assert.doesNotMatch(stripped, /\d/, `${where}: "${stripped}"`);
  }
});

test("no refund or arrival dates promised", () => {
  for (const [where, text] of rendered) {
    assert.doesNotMatch(
      withoutTodos(text),
      /\b(within|in) (a|one|two|\w+) (business )?(day|week|billing cycle)s?\b/i,
      where,
    );
    assert.doesNotMatch(withoutTodos(text), /billing cycle/i, where);
  }
});

test("road hazard: no plan is described, only an invitation to ask", () => {
  const section = SECTIONS.find((s) => s.id === "road-hazard");
  assert.ok(section, "road-hazard section");
  assert.match(
    section.paragraphs[0],
    new RegExp(`Ask us about road hazard protection: call ${BUSINESS.phone.replace(/[()]/g, "\\$&")}`),
  );
  for (const [where, text] of rendered) {
    assert.doesNotMatch(
      withoutTodos(text),
      /road[- ]hazard (plan|warranty|coverage|certificate)s? (covers|costs|is included|included)/i,
      where,
    );
  }
});

test("seven questions for Justin, one per open policy", () => {
  assert.equal(QUESTIONS_FOR_JUSTIN.length, 7);
});

test("draft visibility: off unless a preview build or forced on", () => {
  assert.equal(draftAllowedByEnv({}), false);
  assert.equal(draftAllowedByEnv({ VERCEL_ENV: "production" }), false);
  assert.equal(draftAllowedByEnv({ VERCEL_ENV: "development" }), false);
  assert.equal(draftAllowedByEnv({ VERCEL_ENV: "preview" }), true);
  assert.equal(draftAllowedByEnv({ RETURNS_DRAFT: "on" }), true);
  assert.equal(
    draftAllowedByEnv({ VERCEL_ENV: "preview", RETURNS_DRAFT: "off" }),
    false,
  );
});
