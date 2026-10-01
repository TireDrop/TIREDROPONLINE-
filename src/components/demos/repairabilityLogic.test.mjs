// Pure-logic tests for D13, Can this tire be repaired?
//   node --test src/components/demos/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BOOKING_HREF,
  DAMAGES,
  REPAIR_STANDARD,
  TECH_NOTE,
  ZONES,
  assessDamage,
  describeSelection,
} from "./repairabilityLogic.js";
import { BANNED_WORDS } from "./demoLogic.js";
import { SOURCES } from "./sources.js";

/** Every string reachable in a value, for the house-rules sweep. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => strings(v, out));
  return out;
}

function assertHouseRules(value, where) {
  for (const s of strings(value)) {
    assert.ok(!BANNED_WORDS.test(s), `${where}: banned word in "${s}"`);
    assert.ok(!/safe to (repair|drive)/i.test(s), `${where}: "${s}"`);
    assert.ok(!/\bokay\b|\bno problem\b/i.test(s), `${where}: "${s}"`);
  }
}

const VOCAB = [
  "Replace",
  "Consider replacing",
  "Have it inspected",
  "Keep checking monthly",
];

const R = "replace"; // Replace, "Not repairable under industry practice"
const M = "maybe"; // Have it inspected, "May be repairable…"
const I = "inspect"; // Have it inspected
const B = "bulge"; // Replace, "Replace this tire"

// Every zone × damage combination, per the D13 rules:
//   center + small puncture → may be repairable after an inside inspection;
//   any bulge → replace; cracking or scrape → have it inspected;
//   everything else → not repairable, replace.
const EXPECTED = {
  center: {
    "puncture-small": M,
    "puncture-large": R,
    cut: R,
    bulge: B,
    cracking: I,
    scrape: I,
  },
  shoulder: {
    "puncture-small": R,
    "puncture-large": R,
    cut: R,
    bulge: B,
    cracking: I,
    scrape: I,
  },
  sidewall: {
    "puncture-small": R,
    "puncture-large": R,
    cut: R,
    bulge: B,
    cracking: I,
    scrape: I,
  },
  bead: {
    "puncture-small": R,
    "puncture-large": R,
    cut: R,
    bulge: B,
    cracking: I,
    scrape: I,
  },
};

test("repair: four zones and six kinds of damage", () => {
  assert.deepEqual(
    ZONES.map((z) => z.id),
    ["center", "shoulder", "sidewall", "bead"],
  );
  assert.deepEqual(
    DAMAGES.map((d) => d.id),
    ["puncture-small", "puncture-large", "cut", "bulge", "cracking", "scrape"],
  );
  assert.match(DAMAGES[0].label, /1\/4 in \(6 mm\) or smaller/);
  assert.match(DAMAGES[1].label, /bigger than 1\/4 in/);
});

for (const zone of ZONES) {
  for (const damage of DAMAGES) {
    const want = EXPECTED[zone.id][damage.id];
    test(`repair: ${zone.id} × ${damage.id} → ${want}`, () => {
      const r = assessDamage(zone.id, damage.id);
      assert.ok(r);
      assert.equal(r.zone, zone.id);
      assert.equal(r.damage, damage.id);
      assert.ok(VOCAB.includes(r.status.label), r.status.label);

      if (want === M) {
        assert.equal(r.outcome, "maybe");
        assert.equal(r.status.label, "Have it inspected");
        assert.equal(
          r.headline,
          "May be repairable, only after an inside inspection",
        );
        assert.deepEqual(r.standard, REPAIR_STANDARD);
      } else if (want === B) {
        assert.equal(r.outcome, "replace");
        assert.equal(r.status.label, "Replace");
        assert.equal(r.headline, "Replace this tire");
        assert.match(r.body, /bulge/i);
        // No unsourced "an inward dent can be normal" aside on a bulge.
        assert.doesNotMatch(r.body, /dent|indent|normal/i);
        assert.equal(r.standard, null);
      } else if (want === I) {
        assert.equal(r.outcome, "inspect");
        assert.equal(r.status.label, "Have it inspected");
        assert.equal(r.headline, "Have it inspected");
        assert.equal(r.standard, null);
      } else {
        assert.equal(r.outcome, "replace");
        assert.equal(r.status.label, "Replace");
        assert.equal(r.headline, "Not repairable under industry practice");
        assert.match(r.body, /USTMA|industry practice/);
        assert.equal(r.standard, null);
      }

      // Every result ends with the technician line and the booking link.
      assert.equal(r.closing, "A technician must inspect the inside of the tire.");
      assert.equal(r.bookingHref, BOOKING_HREF);
      assert.ok(r.body.length > 40);
      for (const sid of r.sources) assert.ok(SOURCES[sid]?.url, sid);
      assertHouseRules(r, `${zone.id} × ${damage.id}`);
    });
  }
}

test("repair: only center tread + small puncture may be repairable", () => {
  const maybes = [];
  for (const z of ZONES) {
    for (const d of DAMAGES) {
      if (assessDamage(z.id, d.id).outcome === "maybe") maybes.push(`${z.id}/${d.id}`);
    }
  }
  assert.deepEqual(maybes, ["center/puncture-small"]);
});

test("repair: the explanations name the zone or the size limit", () => {
  assert.match(assessDamage("center", "puncture-large").body, /1\/4 in \(6 mm\)/);
  assert.match(assessDamage("center", "cut").body, /cut or gash/i);
  assert.match(assessDamage("shoulder", "puncture-small").body, /shoulder/);
  assert.match(assessDamage("sidewall", "cut").body, /sidewall/i);
  assert.match(assessDamage("bead", "puncture-large").body, /bead/i);
  assert.match(assessDamage("sidewall", "scrape").body, /sidewall/);
  assert.match(assessDamage("center", "cracking").body, /DOT date code/);
});

test("repair: the plug-patch standard", () => {
  const text = REPAIR_STANDARD.join(" ");
  assert.match(text, /Tread area only/);
  assert.match(text, /1\/4 in \(6 mm\)/);
  assert.match(text, /comes off the wheel/);
  assert.match(text, /plug-patch combination/);
  assert.match(text, /plug alone or a patch alone/);
  assert.match(assessDamage("center", "puncture-small").body, /outside plug on its own/);
  assert.deepEqual(assessDamage("center", "puncture-small").sources, ["S14", "S19"]);
});

test("repair: booking link is the service booking page for tire repair", () => {
  assert.equal(BOOKING_HREF, "/schedule?service=tire-repair");
  assert.equal(TECH_NOTE, "A technician must inspect the inside of the tire.");
});

test("repair: unknown ids return null", () => {
  assert.equal(assessDamage("tread", "cut"), null);
  assert.equal(assessDamage("center", "nail"), null);
  assert.equal(assessDamage(undefined, undefined), null);
  assert.equal(describeSelection("x", "cut"), "");
});

test("repair: selection text", () => {
  assert.equal(
    describeSelection("sidewall", "bulge"),
    "Bulge or bubble, sidewall.",
  );
});

test("repair: all constants follow house rules", () => {
  assertHouseRules({ ZONES, DAMAGES, REPAIR_STANDARD, TECH_NOTE }, "constants");
});
