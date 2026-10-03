// The pure half of the /local-delivery truck simulation: routes stay inside
// the hub's halo and on land, the zoom frame always holds the hub, and the
// easing and budgets behave. (The scene that draws them is a browser check:
// scripts/local-delivery-check.mjs.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CARGO,
  MAP_H,
  MAP_W,
  WHOLE_MAP,
  blendFrame,
  clamp01,
  frameFor,
  insideHalo,
  legCurve,
  makeTrip,
  pinInZone,
  pointAt,
  pop,
  smooth,
  throttledLimit,
  truckBudget,
} from "./deliverySim.js";

const MAP = JSON.parse(
  readFileSync(new URL("../data/deliveryHubs.generated.json", import.meta.url), "utf8"),
);

/** A seeded generator, so a failure is reproducible. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const envFor = (seed, onLand = () => true, drop = 3) => {
  const next = seeded(seed);
  return { rnd: (a, b) => a + next() * (b - a), onLand, drop };
};
const hub = (x = 400, y = 300, r = MAP.haloRadius) => ({ x, y, r });

test("insideHalo: within 96% of the radius", () => {
  const h = hub(100, 100, 10);
  assert.ok(insideHalo(h, 100, 100));
  assert.ok(insideHalo(h, 109.5, 100));
  assert.ok(!insideHalo(h, 109.7, 100));
  assert.ok(!insideHalo(h, 100, 111));
});

test("makeTrip: every stop, house and path point is inside the hub's halo", () => {
  for (let seed = 1; seed <= 60; seed++) {
    const h = hub(300 + seed, 200 + seed);
    const env = envFor(seed);
    for (const n of [1, 2]) {
      const trip = makeTrip(h, n, env);
      assert.ok(trip, `seed ${seed}, ${n} stops`);
      assert.equal(trip.stops.length, n);
      assert.equal(trip.legs.length, n + 1); // hub -> house(s) -> hub
      for (const s of trip.stops) {
        assert.ok(insideHalo(h, s.hx, s.hy), "house");
        assert.ok(insideHalo(h, s.dx, s.dy), "stop");
        assert.ok(s.dy > s.hy, "the house sits above where the truck stops");
      }
      for (const leg of trip.legs)
        for (const p of leg.pts) assert.ok(insideHalo(h, p.x, p.y), `seed ${seed}: path point ${p.x},${p.y}`);
    }
  }
});

test("makeTrip: starts and ends at the hub, and two houses are kept apart", () => {
  const h = hub();
  const trip = makeTrip(h, 2, envFor(7));
  const first = trip.legs[0].pts[0];
  const lastLeg = trip.legs[trip.legs.length - 1];
  const last = lastLeg.pts[lastLeg.pts.length - 1];
  assert.ok(Math.hypot(first.x - h.x, first.y - h.y) < 0.01);
  assert.ok(Math.hypot(last.x - h.x, last.y - h.y) < 0.01);
  const [a, b] = trip.stops;
  assert.ok(Math.hypot(a.hx - b.hx, a.hy - b.hy) >= h.r * 0.7);
  trip.legs.slice(0, 2).forEach((leg, i) => assert.equal(leg.stop, trip.stops[i]));
});

test("makeTrip: honours the land mask, and gives up (null) rather than leave land", () => {
  const h = hub();
  // Only the half of the halo west of the hub is land.
  const west = (x) => x <= h.x;
  const trip = makeTrip(h, 1, envFor(3, (x) => west(x)));
  assert.ok(trip);
  for (const s of trip.stops) assert.ok(west(s.hx) && west(s.dx));
  for (const leg of trip.legs)
    for (const p of leg.pts) assert.ok(Math.hypot(p.x - h.x, p.y - h.y) <= 2 || west(p.x), "path stays on land");
  assert.equal(makeTrip(h, 1, envFor(3, () => false)), null);
});

test("makeTrip: works for every real hub, with the page's mask-free fallback", () => {
  MAP.hubs.forEach((p, i) => {
    const h = hub(p.x, p.y);
    const trip = makeTrip(h, 1, envFor(100 + i));
    assert.ok(trip, `hub ${i}`);
  });
});

test("legCurve: bounded, monotone distance, and null for a zero-length leg", () => {
  const h = hub();
  const env = envFor(11);
  const leg = legCurve({ x: h.x, y: h.y }, { x: h.x + 5, y: h.y + 4 }, h, 1, env);
  assert.ok(leg);
  assert.equal(leg.pts[0].s, 0);
  for (let i = 1; i < leg.pts.length; i++) assert.ok(leg.pts[i].s > leg.pts[i - 1].s);
  assert.ok(Math.abs(leg.len - leg.pts[leg.pts.length - 1].s) < 1e-9);
  assert.ok(leg.dur > 1.8);
  assert.equal(legCurve({ x: 1, y: 1 }, { x: 1.5, y: 1 }, h, 1, env), null);
  // A destination outside the halo cannot be reached by a bounded curve.
  assert.equal(legCurve({ x: h.x, y: h.y }, { x: h.x + h.r * 3, y: h.y }, h, 1, env), null);
});

test("pointAt: walks the leg and reports the heading", () => {
  const leg = { pts: [{ x: 0, y: 0, s: 0 }, { x: 10, y: 0, s: 10 }, { x: 10, y: 10, s: 20 }], len: 20 };
  const out = { x: 0, y: 0, dx: 1 };
  assert.equal(pointAt(leg, 0, out), out);
  assert.deepEqual([out.x, out.y], [0, 0]);
  pointAt(leg, 5, out);
  assert.deepEqual([out.x, out.y, out.dx > 0], [5, 0, true]);
  pointAt(leg, 15, out);
  assert.deepEqual([out.x, out.y], [10, 5]);
  pointAt(leg, 99, out); // past the end clamps to the last point
  assert.deepEqual([out.x, out.y], [10, 10]);
});

test("frameFor: about 200 miles, the hub and its zone always inside, never off the map", () => {
  const checkFrame = (f, px, py, h, label) => {
    const fh = (f.w * MAP_H) / MAP_W;
    assert.ok(f.w >= 132 - 1e-9 && f.w <= MAP_W, `${label}: width ${f.w}`);
    assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= MAP_W + 1e-9 && f.y + fh <= MAP_H + 1e-9, `${label}: on the map`);
    // The nearest hub's whole halo is in frame whenever the frame is not the whole map.
    if (f.w < MAP_W) {
      assert.ok(h.x - h.r >= f.x - 1e-9 && h.x + h.r <= f.x + f.w + 1e-9, `${label}: hub x in frame`);
      assert.ok(h.y - h.r >= f.y - 1e-9 && h.y + h.r <= f.y + fh + 1e-9, `${label}: hub y in frame`);
    }
  };
  for (const p of MAP.hubs) {
    const h = hub(p.x, p.y);
    // The point at the hub, and 0.7 of a halo away (the pin's limit in a zone).
    checkFrame(frameFor(p.x, p.y, h), p.x, p.y, h, "at hub");
    checkFrame(frameFor(p.x + h.r * 0.7, p.y, h), p.x + h.r * 0.7, p.y, h, "in zone");
  }
  // A far-away point (out of zone): the frame widens to take in the nearest hub, up to the whole map.
  const near = hub(800, 500);
  const f = frameFor(150, 100, near);
  assert.equal(f.w, MAP_W);
  assert.deepEqual([f.x, f.y], [0, 0]);
  // And a point close to its hub keeps the standard 132-unit frame.
  assert.equal(frameFor(805, 505, near).w, 132);
});

test("pinInZone: kept inside 70% of the halo, along the way to the hub", () => {
  const h = hub(100, 100, 10);
  assert.deepEqual(pinInZone({ x: 102, y: 100 }, h), { x: 102, y: 100 });
  const p = pinInZone({ x: 140, y: 100 }, h);
  assert.deepEqual(p, { x: 107, y: 100 });
  const q = pinInZone({ x: 100, y: 60 }, h);
  assert.ok(Math.abs(Math.hypot(q.x - 100, q.y - 100) - 7) < 1e-9);
});

test("blendFrame: starts at the first frame, ends at the second, zooms evenly in log space", () => {
  const from = { x: 0, y: 0, w: MAP_W };
  const to = { x: 700, y: 500, w: 132 };
  const a = blendFrame(from, to, 0);
  const z = blendFrame(from, to, 1);
  for (const k of ["x", "y", "w"]) {
    assert.ok(Math.abs(a[k] - from[k]) < 1e-9, k);
    assert.ok(Math.abs(z[k] - to[k]) < 1e-9, k);
  }
  const mid = blendFrame(from, to, 0.5);
  assert.ok(Math.abs(mid.w - Math.sqrt(MAP_W * 132)) < 1e-6);
  assert.deepEqual({ ...WHOLE_MAP }, { x: 0, y: 0, w: MAP_W });
});

test("easing: clamp01, pop overshoots then settles, smooth is S-shaped", () => {
  assert.deepEqual([clamp01(-1), clamp01(0.3), clamp01(2)], [0, 0.3, 1]);
  assert.equal(pop(0), 0);
  assert.equal(pop(-3), 0);
  assert.equal(pop(1), 1);
  assert.ok(Math.max(...[0.2, 0.4, 0.6, 0.8].map(pop)) > 1, "overshoots");
  assert.equal(smooth(0), 0);
  assert.equal(smooth(1), 1);
  assert.equal(smooth(0.5), 0.5);
  assert.ok(smooth(0.25) < 0.25 && smooth(0.75) > 0.75);
});

test("truckBudget and throttledLimit: about 34, fewer on small maps, few cores or slow frames", () => {
  assert.equal(truckBudget(900, 8), 34);
  assert.equal(truckBudget(700, undefined), 34);
  assert.equal(truckBudget(330, 8), 22);
  assert.equal(truckBudget(900, 2), 16);
  assert.equal(truckBudget(330, 1), 16);
  assert.equal(throttledLimit(34, 1 / 60), 34);
  assert.equal(throttledLimit(34, 0.05), 26);
  assert.equal(throttledLimit(14, 0.05), 12);
  assert.equal(throttledLimit(12, 0.05), 12);
});

test("cargo lines are all simulated-style copy: no prices, dates or promises", () => {
  assert.ok(CARGO.length >= 4);
  for (const line of CARGO) {
    assert.match(line, /tire|wheel|set of 4/i);
    assert.doesNotMatch(line, /\$|today|tomorrow|free|minutes?|hours?|days?|arriv/i);
  }
  assert.ok(CARGO.includes("Delivering a set of 4"));
});
