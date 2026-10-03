// The pure half of the /local-delivery truck simulation: routes, easing and
// the zoom frame. No DOM and no browser globals, so the tests run it under
// Node and the lazily loaded scene (src/components/delivery/deliveryTrucks.js)
// stays about drawing. Everything here is illustration: nothing is a real
// truck, route, house or delivery.

/** The map's drawing size (the generated viewBox). */
export const MAP_W = 975;
export const MAP_H = 610;

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Overshoot ease for a package or badge popping in: 0 up to 1 (briefly past it) as t goes 0 to 1. */
export function pop(t) {
  const u = clamp01(t);
  return u <= 0 ? 0 : 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2;
}

/** Smooth in and out: the truck eases away from the hub and into the house. */
export const smooth = (f) => f * f * (3 - 2 * f);

/** True when (x, y) is inside the hub's halo, with a margin so nothing is drawn on its edge. */
export const insideHalo = (hub, x, y) => Math.hypot(x - hub.x, y - hub.y) <= hub.r * 0.96;

/**
 * How many trucks to run. About 34 on a roomy screen; fewer on a phone-sized
 * map or a device with few cores, where each truck costs a visible share of
 * the frame. (Slow frames shrink it further, see `throttledLimit`.)
 */
export function truckBudget(mapWidthPx, cores) {
  let n = 34;
  if (mapWidthPx < 520) n = 22;
  if (Number.isFinite(cores) && cores <= 2) n = Math.min(n, 16);
  return n;
}

/**
 * The truck limit after a slow stretch: three quarters of it, never under 12.
 * `frameSeconds` is a smoothed frame time; 34 ms is about 30 fps.
 */
export function throttledLimit(limit, frameSeconds) {
  return frameSeconds > 0.034 && limit > 12 ? Math.max(12, Math.round(limit * 0.75)) : limit;
}

/**
 * One road-like leg from a to b: a smooth Catmull-Rom curve with two bends,
 * kept inside the hub's halo and on land. env = { rnd(a, b), onLand(x, y) }.
 * `sign` is +1 or -1 and picks which way the first bend leans. Returns
 * { pts: [{ x, y, s }], len, dur, house: null } (s is the distance along the
 * leg) or null when no bounded curve was found.
 */
export function legCurve(a, b, hub, sign, env) {
  if (Math.hypot(b.x - a.x, b.y - a.y) < 1.2) return null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const nx = -dy / d;
    const ny = dx / d;
    const o1 = env.rnd(0.16, 0.4) * hub.r * sign;
    const o2 = -env.rnd(0.16, 0.4) * hub.r * sign;
    const P = [
      a,
      { x: a.x + dx * 0.33 + nx * o1, y: a.y + dy * 0.33 + ny * o1 },
      { x: a.x + dx * 0.67 + nx * o2, y: a.y + dy * 0.67 + ny * o2 },
      b,
    ];
    const pts = [];
    let ok = true;
    for (let s = 0; s < 3 && ok; s++) {
      const p0 = P[Math.max(0, s - 1)];
      const p1 = P[s];
      const p2 = P[s + 1];
      const p3 = P[Math.min(3, s + 2)];
      for (let i = s ? 1 : 0; i <= 8; i++) {
        const t = i / 8;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (k) =>
          0.5 *
          (2 * p1[k] +
            (-p0[k] + p2[k]) * t +
            (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
            (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        const x = f("x");
        const y = f("y");
        // The hub's own spot may sit on the coast; everything else must be land.
        if (!insideHalo(hub, x, y) || (Math.hypot(x - hub.x, y - hub.y) > 2 && !env.onLand(x, y))) {
          ok = false;
          break;
        }
        pts.push({ x, y, s: 0 });
      }
    }
    if (!ok) continue;
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      pts[i].s = len;
    }
    return { pts, len, dur: 1.8 + len * 0.15, house: null };
  }
  return null;
}

/** The point `d` along a leg, written into `out` ({ x, y, dx }; dx is the heading, for flipping the truck). */
export function pointAt(leg, d, out = { x: 0, y: 0, dx: 1 }) {
  const p = leg.pts;
  let i = 1;
  while (i < p.length - 1 && p[i].s < d) i++;
  const a = p[i - 1];
  const b = p[i];
  const f = clamp01((d - a.s) / (b.s - a.s || 1));
  out.x = a.x + (b.x - a.x) * f;
  out.y = a.y + (b.y - a.y) * f;
  out.dx = b.x - a.x;
  return out;
}

/**
 * A trip: hub, then `n` houses, then back to the hub. Each house sits just
 * above the spot where the truck stops (`env.drop` map units), and every
 * house, stop and curve is inside the hub's halo and on land. Returns
 * { legs, stops: [{ hx, hy, dx, dy }] } or null. env = { rnd, onLand, drop }.
 */
export function makeTrip(hub, n, env) {
  for (let attempt = 0; attempt < 14; attempt++) {
    const stops = [];
    let ok = true;
    for (let j = 0; j < n && ok; j++) {
      let stop = null;
      for (let q = 0; q < 16 && !stop; q++) {
        const ang = env.rnd(0, 6.2832);
        const rr = env.rnd(0.5, 0.9) * hub.r;
        const hx = hub.x + Math.cos(ang) * rr;
        const hy = hub.y + Math.sin(ang) * rr;
        const dy = hy + env.drop;
        if (!env.onLand(hx, hy) || !insideHalo(hub, hx, dy) || !env.onLand(hx, dy)) continue;
        if (stops.some((s) => Math.hypot(s.hx - hx, s.hy - hy) < hub.r * 0.7)) continue;
        stop = { hx, hy, dx: hx, dy };
      }
      if (stop) stops.push(stop);
      else ok = false;
    }
    if (!ok) continue;
    const pts = [{ x: hub.x, y: hub.y }, ...stops.map((s) => ({ x: s.dx, y: s.dy })), { x: hub.x, y: hub.y }];
    const legs = [];
    let sign = env.rnd(0, 1) < 0.5 ? 1 : -1;
    for (let j = 0; j < pts.length - 1 && ok; j++) {
      const leg = legCurve(pts[j], pts[j + 1], hub, sign, env);
      sign = -sign;
      if (leg) legs.push(leg);
      else ok = false;
    }
    if (ok) {
      legs.forEach((leg, j) => {
        if (j < stops.length) leg.stop = stops[j];
      });
      return { legs, stops };
    }
  }
  return null;
}

/**
 * The viewBox for "your area": about 200 miles around (px, py), which is 66
 * map units each way (132 wide), widened so the nearest hub and its whole zone
 * stay in frame, never wider than the map and never off its edge. Returns
 * { x, y, w } (the height follows from the map's aspect).
 */
export function frameFor(px, py, hub) {
  const margin = 10;
  let w = Math.max(
    132,
    2 * (Math.abs(hub.x - px) + hub.r + margin),
    (2 * (Math.abs(hub.y - py) + hub.r + margin) * MAP_W) / MAP_H,
  );
  w = Math.min(w, MAP_W);
  const h = (w * MAP_H) / MAP_W;
  return {
    x: Math.max(0, Math.min(MAP_W - w, px - w / 2)),
    y: Math.max(0, Math.min(MAP_H - h, py - h / 2)),
    w,
  };
}

/** The whole map as a frame. */
export const WHOLE_MAP = Object.freeze({ x: 0, y: 0, w: MAP_W });

/** Where the "you are here" pin goes for an in-zone ZIP: kept inside 70% of the halo so it is never on the edge. */
export function pinInZone(point, hub) {
  const d = Math.hypot(point.x - hub.x, point.y - hub.y);
  const limit = hub.r * 0.7;
  if (d <= limit) return { x: point.x, y: point.y };
  const k = limit / d;
  return { x: hub.x + (point.x - hub.x) * k, y: hub.y + (point.y - hub.y) * k };
}

/** Eases a viewBox frame: `e` goes 0 to 1; zoom is blended in log space so it feels even, pan in map units. */
export function blendFrame(from, to, e) {
  const hFrom = (from.w * MAP_H) / MAP_W;
  const hTo = (to.w * MAP_H) / MAP_W;
  const w = from.w * Math.pow(to.w / from.w, e);
  const cx = from.x + from.w / 2 + (to.x + to.w / 2 - from.x - from.w / 2) * e;
  const cy = from.y + hFrom / 2 + (to.y + hTo / 2 - from.y - hFrom / 2) * e;
  return { x: cx - w / 2, y: cy - (w * MAP_H) / MAP_W / 2, w };
}

/** Simulated cargo, for the bubble on a truck tap. Always shown beside the word "Simulated". */
export const CARGO = [
  "Delivering a set of 4",
  "2 tires, 1 set of wheels",
  "Delivering 2 tires",
  "Delivering 1 tire",
  "Delivering a set of 4 wheels",
  "Delivering a set of 4 and a spare",
];
