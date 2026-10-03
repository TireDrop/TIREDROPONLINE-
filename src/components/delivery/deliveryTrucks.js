// The /local-delivery map's moving layer: simulated trucks and houses, "you
// are here" and the area zoom, and tap-to-explore. Loaded with import() after
// the page is idle and only in the browser (LocalDeliveryPage.jsx), so the
// prerendered page and the JS-off page are the plain map and ZIP checker.
//
// Everything drawn here is an illustration of the idea of local delivery:
// there are no real trucks, routes or deliveries behind it, and the page
// says so ("Simulated. Not live tracking."). It is imperative on purpose: a
// frame loop that moves ~35 trucks should not go through React state.
//
// Pure pieces (routes, easing, the zoom frame) live in src/lib/deliverySim.js.

import {
  CARGO,
  MAP_H as H,
  MAP_W as W,
  WHOLE_MAP,
  blendFrame,
  clamp01,
  frameFor,
  makeTrip,
  pinInZone,
  pointAt,
  pop,
  smooth,
  throttledLimit,
  truckBudget,
} from "../../lib/deliverySim.js";

const NS = "http://www.w3.org/2000/svg";
const MAX_HOUSES = 64; // about 45 are ever in use at once (34 trucks, up to 2 stops each, a few seconds each)
const PRE_ROLL_SECONDS = 9; // simulated, before the first painted frame
const PRE_ROLL_STEP = 1 / 30;
const BOOST_SECONDS = 6;
const ZOOM_MS = 700;
const HIT_RADIUS = 22; // px: half of the 44px hub button

const rnd = (a, b) => a + Math.random() * (b - a);
const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));
const SLICE_MS = 4;

const mk = (tag, attrs, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const div = (cls, parent, tag = "div") => {
  const e = document.createElement(tag);
  e.className = cls;
  parent.appendChild(e);
  return e;
};

/**
 * Starts the moving layer on an existing map.
 *
 *   svg    the map <svg> (HubMap). Its halos carry data-halo, in hub order.
 *   host   the position:relative box around it; overlays are added here.
 *   note   the reserved legend row (empty until now, so nothing moves).
 *   map    { land, hubs: [{ x, y }], haloRadius } from deliveryHubs.generated.json.
 *   signal an AbortSignal: the page unmounted before setup finished.
 *
 * Resolves to { focus(target), destroy() }. `focus` takes { x, y, hub,
 * inZone, reveal } (map units, hub index) or null to show the whole map.
 */
export async function mountTrucks({ svg, host, note, map, signal }) {
  const hubs = map.hubs.map((h) => ({ x: h.x, y: h.y, r: map.haloRadius }));
  const N = hubs.length;
  const halos = [...svg.querySelectorAll("[data-halo]")];
  if (!N || halos.length !== N) return null;
  let destroyed = false;
  const gone = () => destroyed || Boolean(signal?.aborted);
  // Setup runs in slices of a few milliseconds with a yield between them, so
  // mounting never holds the main thread for a long task, even on a slow phone
  // (a 4x throttled one still stays near 50 ms per slice).
  let sliceStart = performance.now();
  const pace = async () => {
    if (performance.now() - sliceStart < SLICE_MS) return;
    await yieldToBrowser();
    sliceStart = performance.now();
  };
  const cleanups = [];
  const listen = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    cleanups.push(() => target.removeEventListener(type, fn, opts));
  };

  /* --------------------------- the land, as a mask --------------------------- */
  // Trucks and houses stay on land: the map's own land path, drawn once into a
  // canvas and read back. Without canvas support they simply stay in the halo.
  let mask = null;
  try {
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.fill(new Path2D(map.land));
    await yieldToBrowser(); // drawing and reading back are each a slice of their own
    mask = cx.getImageData(0, 0, W, H).data;
  } catch {
    mask = null;
  }
  const env = {
    rnd,
    drop: 0,
    onLand(x, y) {
      if (!mask) return true;
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 1 || iy < 1 || ix > W - 2 || iy > H - 2) return false;
      return mask[(iy * W + ix) * 4 + 3] > 128;
    },
  };
  await yieldToBrowser();
  sliceStart = performance.now();
  if (gone()) return null;

  /* --------------------------------- layers --------------------------------- */
  // Trucks, houses and the pin live in a second <svg> laid exactly over the map
  // and promoted to its own compositor layer: moving them then repaints that
  // transparent layer, not the map's land, borders and 105 pins underneath,
  // which is most of what a frame would otherwise cost. Its viewBox follows the map's.
  const over = mk("svg", { viewBox: svg.getAttribute("viewBox"), "aria-hidden": "true", focusable: "false", class: "pointer-events-none absolute inset-0 h-full w-full" }, host);
  over.style.willChange = "transform";
  const defs = mk("defs", {}, over);
  const truckSym = mk("symbol", { id: "td-truck", viewBox: "0 0 24 13", overflow: "visible" }, defs);
  const body = mk("g", { "stroke-width": 1.1, "stroke-linejoin": "round", style: "fill:currentColor;paint-order:stroke" }, truckSym);
  body.setAttribute("class", "stroke-bone");
  mk("rect", { x: 0, y: 5, width: 14.5, height: 5.5, rx: 1 }, body);
  mk("path", { d: "M13 3H18L23.6 7V10.5H13Z" }, body);
  mk("rect", { x: 2, y: 0.9, width: 6.2, height: 4.6, rx: 0.7, class: "fill-amber" }, body);
  mk("rect", { x: 4.6, y: 0.9, width: 0.9, height: 4.6, class: "fill-amberInk" }, truckSym);
  mk("path", { d: "M15 4.4H17.7L20.5 7H15Z", class: "fill-bone" }, truckSym);
  const wheels = mk("g", { class: "fill-ink stroke-bone", "stroke-width": 0.9 }, truckSym);
  mk("circle", { cx: 5, cy: 10.8, r: 2.1 }, wheels);
  mk("circle", { cx: 19, cy: 10.8, r: 2.1 }, wheels);
  const houseSym = mk("symbol", { id: "td-house", viewBox: "-6 -6 12 12", overflow: "visible" }, defs);
  const hbody = mk("g", { class: "stroke-bone", "stroke-width": 0.6, "stroke-linejoin": "round", style: "paint-order:stroke" }, houseSym);
  mk("path", { d: "M-5.6 -.6L0 -5.6L5.6 -.6Z", class: "fill-amber" }, hbody);
  mk("rect", { x: -4, y: -0.8, width: 8, height: 5.8, class: "fill-bone" }, hbody);
  mk("rect", { x: -0.9, y: 2, width: 1.8, height: 3, class: "fill-drop" }, houseSym);

  const housesG = mk("g", { "aria-hidden": "true", "data-houses": "" }, over);
  const trucksG = mk("g", { "aria-hidden": "true", "data-trucks": "" }, over);
  const pinG = mk("g", { "aria-hidden": "true", "data-you-are-here": "" }, over);
  pinG.style.display = "none";
  const ring = mk("circle", { r: 9, fill: "none", "stroke-width": 2, class: "stroke-drop" }, pinG);
  ring.style.transformBox = "fill-box";
  ring.style.transformOrigin = "center";
  mk("rect", { x: -44, y: -36, width: 88, height: 21, rx: 10.5, "stroke-width": 1.4, class: "fill-bone stroke-drop" }, pinG);
  const pinText = mk("text", { x: 0, y: -21.5, "text-anchor": "middle", "font-size": 11.5, "font-weight": 600, class: "font-sans fill-ink" }, pinG);
  pinText.textContent = "You are here";
  mk("circle", { r: 5.2, "stroke-width": 2, class: "fill-drop stroke-bone" }, pinG);

  const truckClasses = ["text-drop", "text-amber", "text-steel", "text-volt"];
  const SPECIAL = 34; // the extra, highlighted truck "heading to your house"
  const trucks = [];
  const houses = [];
  for (let i = 0; i <= SPECIAL; i++) {
    const g = mk("g", { opacity: 0, display: "none", "data-truck": "", class: truckClasses[i % 4] }, trucksG);
    mk("use", { href: "#td-truck", x: -12, y: -6.5, width: 24, height: 13 }, g);
    trucks.push({ g, ph: "wait", t: 0, dur: rnd(0, 8), hub: -1, legs: null, li: 0, dir: 1, x: 0, y: 0, op: 0, tt: 0, special: i === SPECIAL, shown: false, counted: false, parked: false, cargo: CARGO[0] });
    await pace();
  }
  for (let i = 0; i < MAX_HOUSES; i++) {
    const g = mk("g", { opacity: 0, display: "none" }, housesG);
    const sp = mk("circle", { r: 8.2, fill: "none", opacity: 0, "stroke-width": 0.8, "stroke-dasharray": "1.6 1.4", class: "stroke-drop" }, g);
    mk("use", { href: "#td-house", x: -6, y: -6, width: 12, height: 12 }, g);
    const pk = mk("g", { transform: "translate(5.6 4.2) scale(0)" }, g);
    mk("rect", { x: -1.5, y: -1.2, width: 3, height: 2.4, rx: 0.4, "stroke-width": 0.5, class: "fill-amber stroke-bone", style: "paint-order:stroke" }, pk);
    mk("rect", { x: -0.25, y: -1.2, width: 0.5, height: 2.4, class: "fill-amberInk" }, pk);
    const ringH = mk("circle", { cx: 4.8, cy: -4.8, r: 2.4, fill: "none", opacity: 0, "stroke-width": 0.6, class: "stroke-drop" }, g);
    const bd = mk("g", { transform: "translate(4.8 -4.8) scale(0)" }, g);
    mk("circle", { r: 2.5, "stroke-width": 0.5, class: "fill-drop stroke-bone" }, bd);
    mk("path", { d: "M-1.2 .1L-.3 1L1.3 -.9", fill: "none", stroke: "#fff", "stroke-width": 0.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, bd);
    houses.push({ g, sp, pk, ring: ringH, bd, vis: false, force: true, used: false, x: 0, y: 0, age: 0, dAge: -1, special: false, still: false });
    await pace();
  }
  if (gone()) return null;

  // Overlays in the host box (all above the map; none take layout space).
  const counter = div("pointer-events-none absolute right-2 top-2 z-10 rounded-card bg-bone/90 px-2.5 py-1.5 text-right shadow-card", host);
  counter.setAttribute("aria-hidden", "true");
  const simN = div("block font-display text-xl font-extrabold leading-none tabular-nums text-drop", counter, "b");
  simN.textContent = "0";
  const counterLabel = div("mt-0.5 block text-[10px] font-semibold uppercase leading-none tracking-wider text-smoke", counter, "small");
  counterLabel.textContent = "Simulated deliveries";
  // overflow-hidden: while zoomed, the buttons of hubs outside the frame sit far off the map and must not widen the page.
  const hitsEl = div("pointer-events-none absolute inset-0 z-10 overflow-hidden", host);
  hitsEl.setAttribute("role", "group");
  hitsEl.setAttribute("aria-label", "Delivery hubs");
  const bub = div("pointer-events-none absolute left-0 top-0 z-20 w-max max-w-[13rem] rounded-card border border-ink/10 bg-bone px-3 py-2 text-[13px] font-semibold leading-snug text-ink shadow-lift", host);
  bub.hidden = true;
  bub.setAttribute("aria-hidden", "true");
  const bubTitle = div("block", bub, "span");
  const bubSub = div("mt-0.5 block text-xs font-medium text-smoke", bub, "small");
  const zoomOut = div("btn-outline btn-sm absolute bottom-2 left-2 z-20 hidden min-h-[44px]", host, "button");
  zoomOut.type = "button";
  zoomOut.textContent = "Show whole map";
  // Spoken text for a tap or key press on a hub; the bubble itself is for eyes.
  const bubLive = div("sr-only", host);
  bubLive.setAttribute("role", "status");
  bubLive.setAttribute("aria-live", "polite");

  // The legend row that was reserved in the page: a truck swatch and the disclaimer.
  note.textContent = "";
  const swatch = mk("svg", { viewBox: "0 0 24 13", width: 24, height: 13, "aria-hidden": "true", class: "shrink-0 text-drop" });
  mk("use", { href: "#td-truck", width: 24, height: 13 }, swatch);
  const swatchLabel = document.createElement("span");
  swatchLabel.textContent = "Delivery truck";
  const noteText = document.createElement("span");
  note.append(swatch, swatchLabel, noteText);

  /* ---------------------------------- sizing --------------------------------- */
  const VB = { x: 0, y: 0, w: W, h: H };
  let MW = W;
  let MH = H;
  let U = 1; // map units per CSS pixel
  let TW = 15; // truck width in CSS px
  let KT = 1;
  let KH = 1;
  let HW = 8;
  // The hub pins are drawn at a fixed --pin factor (it changes with the
  // breakpoint); read once per layout, not per pointer move.
  let pinK = 1.3;
  const readPinK = () => (pinK = Number.parseFloat(getComputedStyle(svg).getPropertyValue("--pin")) || 1.3);
  // A pin is 20 units tall at --pin; this is half of it on screen.
  const pinHalfPx = () => 10 * pinK * (MW / W);
  const hubPx = (i) => [((hubs[i].x - VB.x) / VB.w) * MW, ((hubs[i].y - VB.y) / VB.h) * MH - pinHalfPx()];
  const toPx = (x, y) => [((x - VB.x) / VB.w) * MW, ((y - VB.y) / VB.h) * MH];

  function sizeSim() {
    U = VB.w / MW;
    TW = Math.max(15, Math.min(21, (MW / W) * 22)) * Math.min(1.6, 1 + (W / VB.w - 1) * 0.1);
    HW = Math.max(8.5, TW * 0.58);
    KT = (TW / 24) * U;
    KH = (HW / 12) * U;
    env.drop = Math.min((HW * 0.45 + ((TW * 13) / 24) * 0.5) * U * 0.9, map.haloRadius * 0.55);
  }

  /* ------------------------------- the simulation ----------------------------- */
  const rmq = matchMedia("(prefers-reduced-motion: reduce)");
  const SCENE = { live: "live", still: "still" };
  let mode = rmq.matches ? SCENE.still : SCENE.live;
  const hubBusy = new Uint8Array(N);
  const hubDel = new Uint32Array(N);
  let alive = [];
  let maxTrucks = 34;
  let limit = 34;
  let deliveries = 0;
  let dirty = false;

  const freeHouse = () => houses.find((h) => !h.used);
  const hubTrip = (hi) => makeTrip(hubs[hi], Math.random() < 0.5 ? 1 : 2, env);

  function releaseTruck(T) {
    if (T.hub >= 0 && !T.special && hubBusy[T.hub] > 0) hubBusy[T.hub]--;
    T.hub = -1;
    T.legs = null;
    T.ph = "wait";
    T.op = 0;
    T.t = 0;
  }
  function startTrip(T, hi, n, special) {
    const trip = n ? makeTrip(hubs[hi], n, env) : hubTrip(hi);
    if (!trip) return false;
    const hs = [];
    for (let i = 0; i < trip.stops.length; i++) {
      const h = freeHouse();
      if (!h) {
        hs.forEach((x) => (x.used = false));
        return false;
      }
      h.used = true;
      hs.push(h);
    }
    hs.forEach((h, i) => {
      const s = trip.stops[i];
      Object.assign(h, { x: s.hx, y: s.hy, age: -1, dAge: -1, special: !!special, still: false, force: true });
      trip.legs[i].house = h;
    });
    if (trip.legs[0].house) trip.legs[0].house.age = 0;
    T.cargo = CARGO[(Math.random() * CARGO.length) | 0];
    Object.assign(T, { hub: hi, legs: trip.legs, li: 0, ph: "drive", t: 0, tt: 0, counted: false });
    T.special = !!special || T.special;
    if (!special) hubBusy[hi]++;
    const p = pointAt(T.legs[0], 0);
    T.x = p.x;
    T.y = p.y;
    T.op = 0;
    return true;
  }
  function pickHub() {
    // While zoomed in, favour hubs in view and let a few trucks share a zone so the close-up stays lively.
    if (VB.w < W - 1)
      for (let k = 0; k < 14; k++) {
        const i = alive[(Math.random() * alive.length) | 0];
        const h = hubs[i];
        if (h.x > VB.x - h.r && h.x < VB.x + VB.w + h.r && h.y > VB.y - h.r && h.y < VB.y + VB.h + h.r && hubBusy[i] < 3) return i;
      }
    for (let k = 0; k < 10; k++) {
      const i = alive[(Math.random() * alive.length) | 0];
      if (!hubBusy[i]) return i;
    }
    return -1;
  }
  function stepTruck(T, idx, dt) {
    T.t += dt;
    if (T.ph === "wait") {
      if (T.special || idx >= limit || T.t < T.dur) return;
      const hi = pickHub();
      if (hi < 0 || !startTrip(T, hi, 0, false)) {
        T.t = 0;
        T.dur = rnd(0.3, 1.2);
      }
      return;
    }
    T.tt += dt;
    const L = T.legs[T.li];
    if (T.ph === "drive") {
      const f = clamp01(T.t / L.dur);
      const p = pointAt(L, smooth(f) * L.len);
      T.x = p.x;
      T.y = p.y;
      if (p.dx > 0.02) T.dir = 1;
      else if (p.dx < -0.02) T.dir = -1;
      const last = T.li === T.legs.length - 1;
      T.op = Math.min(clamp01(T.tt / 0.35), last ? clamp01((L.dur - T.t) / 0.35) : 1);
      if (f >= 1) {
        if (L.house) {
          T.ph = "stop";
          T.t = 0;
          T.counted = false;
          L.house.dAge = 0;
        } else {
          releaseTruck(T);
          T.dur = rnd(1.5, 5);
        }
      }
    } else {
      // At the house: the package pops, then on to the next leg.
      T.op = 1;
      if (!T.counted && T.t > 0.2) {
        T.counted = true;
        deliveries++;
        hubDel[T.hub]++;
        dirty = true;
      }
      if (T.t >= 1.7) {
        T.li++;
        T.ph = "drive";
        T.t = 0;
        const next = T.legs[T.li];
        if (next.house) next.house.age = 0;
      }
    }
  }
  const houseLife = (h) => (h.special ? 9 : 4.2);
  // Hidden things are display:none, not just transparent: ~100 idle house groups would otherwise cost style and layout every frame.
  function hideHouse(h) {
    h.used = false;
    h.still = false;
    if (h.vis) {
      h.vis = false;
      h.g.setAttribute("display", "none");
    }
  }
  function stepHouse(h, dt) {
    if (!h.used || h.still) return;
    if (h.age >= 0) h.age += dt;
    if (h.dAge >= 0) h.dAge += dt;
    if (h.dAge > houseLife(h)) hideHouse(h);
  }
  function drawSim() {
    for (const T of trucks) {
      if (T.ph === "wait" && T.hub < 0 && !T.parked) {
        if (T.shown) {
          T.g.setAttribute("display", "none");
          T.shown = false;
        }
        continue;
      }
      if (!T.shown) T.g.removeAttribute("display");
      T.shown = true;
      const bob = T.ph === "drive" ? Math.sin(T.tt * 18) * 0.1 * U : 0;
      T.g.setAttribute("transform", `translate(${T.x.toFixed(2)} ${(T.y + bob).toFixed(2)}) scale(${(T.dir * KT).toFixed(3)} ${KT.toFixed(3)})`);
      T.g.setAttribute("opacity", T.op.toFixed(2));
    }
    for (const h of houses) {
      if (!h.used || (h.age < 0 && !h.still)) continue; // not placed yet: the truck is still on its way out
      const life = houseLife(h);
      // A house only changes while it fades in, while its package and badge pop, and as it fades out
      // (or when the view changed size); the rest of its life it is left alone, which keeps a frame cheap.
      if (!h.force && !h.still && h.age > 0.5 && h.dAge < 0) continue;
      if (!h.force && !h.still && h.dAge >= 1.3 && h.dAge <= life - 1.05) continue;
      if (!h.force && h.still) continue;
      h.force = false;
      if (!h.vis) {
        h.vis = true;
        h.g.removeAttribute("display");
      }
      let op = h.still ? 1 : clamp01(h.age / 0.45);
      if (!h.still && h.dAge > life - 1) op *= clamp01(life - h.dAge);
      const d = h.still ? 99 : h.dAge;
      h.g.setAttribute("transform", `translate(${h.x.toFixed(2)} ${h.y.toFixed(2)}) scale(${KH.toFixed(3)})`);
      h.g.setAttribute("opacity", op.toFixed(2));
      h.pk.setAttribute("transform", `translate(5.6 4.2) scale(${pop((d - 0.15) / 0.35).toFixed(2)})`);
      h.bd.setAttribute("transform", `translate(4.8 -4.8) scale(${pop((d - 0.5) / 0.3).toFixed(2)})`);
      const q = h.still ? 1 : clamp01((d - 0.5) / 0.7);
      h.ring.setAttribute("opacity", d < 0.5 || q >= 1 ? 0 : (1 - q).toFixed(2));
      h.ring.setAttribute("r", (2.4 * (1 + 2 * q)).toFixed(2));
      h.sp.setAttribute("opacity", h.special ? (h.still ? 1 : (op * 0.9).toFixed(2)) : 0);
    }
    if (dirty) {
      dirty = false;
      simN.textContent = deliveries.toLocaleString("en-US");
    }
    updateBubble();
  }

  function clearScene() {
    for (const T of trucks) {
      Object.assign(T, { ph: "wait", hub: -1, legs: null, op: 0, parked: false, shown: false, t: 0, dur: rnd(0, 8) });
      T.g.setAttribute("display", "none");
    }
    houses.forEach(hideHouse);
    hubBusy.fill(0);
    hubDel.fill(0);
    deliveries = 0;
    dirty = true;
  }
  // A hub is "alive" for the scene when a trip fits inside its halo and on land.
  async function pickAlive() {
    alive = [];
    for (let i = 0; i < N; i++) {
      if (makeTrip(hubs[i], 1, env)) alive.push(i);
      await pace();
    }
    if (!alive.length) alive = hubs.map((_, i) => i);
  }
  function setNote() {
    const live = mode === SCENE.live;
    counter.hidden = !live;
    noteText.textContent = live ? "Simulated. Not live tracking." : "Animation is off because your device asks for reduced motion.";
    // Its own line on a phone, beside the truck swatch from sm up.
    noteText.className = live ? "basis-full sm:ml-4 sm:basis-auto" : "basis-full";
    note.classList.remove("invisible");
    host.dataset.scene = mode;
  }
  async function buildLive() {
    sizeSim();
    clearScene();
    if (!alive.length) await pickAlive();
    maxTrucks = truckBudget(MW, navigator.hardwareConcurrency);
    limit = maxTrucks;
    slowFrames = 0;
    // The pre-roll: the scene runs a few seconds before anyone sees it, so the first frame already has trucks out.
    for (let i = 0; i < PRE_ROLL_SECONDS / PRE_ROLL_STEP; i++) {
      for (let j = 0; j < trucks.length - 1; j++) stepTruck(trucks[j], j, PRE_ROLL_STEP);
      houses.forEach((h) => stepHouse(h, PRE_ROLL_STEP));
      await pace();
    }
    if (gone()) return;
    dirty = true;
    setNote();
    drawSim();
  }
  // Reduced motion: parked trucks and a few houses, nothing moves.
  async function buildStatic() {
    sizeSim();
    clearScene();
    if (!alive.length) await pickAlive();
    const n = Math.min(26, alive.length);
    const step = alive.length / n;
    for (let i = 0; i < n; i++) {
      const hi = alive[Math.floor(i * step)];
      const trip = makeTrip(hubs[hi], 1, env);
      if (!trip) continue;
      const T = trucks[i];
      const s = trip.stops[0];
      Object.assign(T, { ph: "wait", hub: hi, x: s.dx, y: s.dy, dir: i % 2 ? 1 : -1, op: 1, parked: true, shown: false, cargo: CARGO[i % CARGO.length] });
      if (i % 3 === 0) {
        const h = freeHouse();
        if (h) Object.assign(h, { used: true, still: true, special: false, x: s.hx, y: s.hy, age: 9, dAge: 9, force: true });
      }
      await pace();
    }
    if (gone()) return;
    setNote();
    drawSim();
  }
  function parkExtra(hi) {
    const trip = makeTrip(hubs[hi], 1, env);
    if (!trip) return;
    const T = trucks[SPECIAL];
    const s = trip.stops[0];
    houses.forEach((h) => h.special && hideHouse(h));
    Object.assign(T, { ph: "wait", hub: hi, x: s.dx, y: s.dy, dir: 1, op: 1, parked: true, shown: false, cargo: CARGO[0] });
    const h = freeHouse();
    if (h) Object.assign(h, { used: true, still: true, special: true, x: s.hx, y: s.hy, age: 9, dAge: 9, force: true });
    drawSim();
  }
  // The highlighted extra truck, sent to a house in the visitor's zone.
  function sendExtra(hi) {
    if (mode === SCENE.still) return parkExtra(hi);
    const T = trucks[SPECIAL];
    houses.forEach((h) => h.special && hideHouse(h));
    releaseTruck(T);
    T.special = true;
    T.parked = false;
    for (let k = 0; k < 6; k++) if (startTrip(T, hi, 1, true)) break;
    sync();
    drawSim();
  }

  /* ------------------------------------ loop ---------------------------------- */
  // rAF with a delta-time clock; paused when the tab is hidden or the map is off-screen.
  let onScreen = true;
  let raf = 0;
  let last = 0;
  let ema = 1 / 60;
  let slowFrames = 0;
  let boostT = 0;
  let selTruckT = 0;
  const shouldRun = () => mode === SCENE.live && onScreen && !document.hidden && !gone();
  function frame(ts) {
    raf = 0;
    if (!shouldRun()) return;
    const raw = last ? Math.min((ts - last) / 1000, 0.25) : 0;
    last = ts;
    const dt = Math.min(raw, 0.05);
    if (raw) {
      ema += (raw - ema) * 0.08;
      slowFrames++;
    }
    if (slowFrames > 90) {
      const next = throttledLimit(limit, ema);
      if (next !== limit) {
        limit = next;
        slowFrames = 0;
      }
    }
    const boosting = boostT > 0;
    if (boosting) boostT -= dt;
    if (selTruck) selTruckT += dt;
    for (let i = 0; i < trucks.length; i++) stepTruck(trucks[i], i, boosting && selHub >= 0 && trucks[i].hub === selHub ? dt * 2.2 : dt);
    for (const h of houses) stepHouse(h, dt);
    drawSim();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    if (shouldRun()) {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
  listen(document, "visibilitychange", sync);
  try {
    const io = new IntersectionObserver((es) => {
      onScreen = es[es.length - 1].isIntersecting;
      sync();
    });
    io.observe(svg);
    cleanups.push(() => io.disconnect());
  } catch {
    /* no observer: keep running while visible */
  }
  const onMotionPref = async () => {
    if (rmq.matches && mode === SCENE.live) {
      mode = SCENE.still;
      await buildStatic();
    } else if (!rmq.matches && mode === SCENE.still) {
      mode = SCENE.live;
      await buildLive();
    }
    sync();
  };
  try {
    listen(rmq, "change", onMotionPref);
  } catch {
    /* old Safari: no change events */
  }

  /* --------------------------- zoom and "you are here" ------------------------- */
  let pin = null;
  let zoomRaf = 0;
  let zoomed = false;
  const pulses = new Map();
  let ringAnim = null;

  function positionPin() {
    if (pin) pinG.setAttribute("transform", `translate(${pin.x.toFixed(2)} ${pin.y.toFixed(2)}) scale(${U.toFixed(4)})`);
  }
  function layout(remeasure) {
    if (remeasure) {
      const r = svg.getBoundingClientRect();
      MW = r.width || W;
      MH = r.height || H;
      readPinK();
    }
    // Pins are drawn at a fixed screen size, so they shrink in map units as the view zooms in.
    svg.style.setProperty("--zoom", String(VB.w / W));
    sizeSim();
    for (const h of houses) h.force = true; // their size follows the view
    positionHits();
    positionPin();
    drawSim();
  }
  function setVB(x, y, w) {
    // Clamped: easing can overshoot the map's edge by a hair, and "-0.00" is not a viewBox worth writing.
    x = Math.max(0, Math.min(W - w, x));
    y = Math.max(0, Math.min(H - (w * H) / W, y));
    VB.x = x;
    VB.y = y;
    VB.w = w;
    VB.h = (w * H) / W;
    const box = `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${VB.h.toFixed(2)}`;
    svg.setAttribute("viewBox", box);
    over.setAttribute("viewBox", box);
    layout(false);
  }
  // Ease the viewBox to a new frame over about 700 ms; at once for reduced motion.
  function zoomTo(frameTo) {
    cancelAnimationFrame(zoomRaf);
    zoomed = frameTo.w < W - 1;
    zoomOut.classList.toggle("hidden", !zoomed);
    if (rmq.matches) return setVB(frameTo.x, frameTo.y, frameTo.w);
    const from = { x: VB.x, y: VB.y, w: VB.w };
    const t0 = performance.now();
    const step = (now) => {
      const f = clamp01((now - t0) / ZOOM_MS);
      const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
      const b = blendFrame(from, frameTo, e);
      setVB(b.x, b.y, b.w);
      if (f < 1) zoomRaf = requestAnimationFrame(step);
    };
    zoomRaf = requestAnimationFrame(step);
  }
  listen(zoomOut, "click", (e) => {
    zoomTo(WHOLE_MAP);
    // The button hides itself: keep keyboard focus on the map instead of losing it.
    if (e.detail === 0) hitBtns[roving].focus({ preventScroll: true });
  });

  const HALO_ON = { fill: "rgb(0 104 232 / 0.32)", stroke: "rgb(0 104 232 / 0.85)" };
  function setHalo(i, on) {
    const s = halos[i].style;
    s.fill = on ? HALO_ON.fill : "";
    s.stroke = on ? HALO_ON.stroke : "";
  }
  function pulse(i) {
    setHalo(i, true);
    if (rmq.matches || !halos[i].animate) return;
    pulses.set(i, halos[i].animate([{ fill: HALO_ON.fill }, { fill: "rgb(0 104 232 / 0.12)" }], { duration: 1600, iterations: Infinity, direction: "alternate", easing: "ease-in-out" }));
  }
  function clearPin() {
    pin = null;
    pinG.style.display = "none";
    ringAnim?.cancel();
    ringAnim = null;
    for (const [i, a] of pulses) {
      a.cancel();
      if (i !== selHub) setHalo(i, false);
    }
    pulses.clear();
    for (let i = 0; i < N; i++) if (i !== selHub && halos[i].style.fill) setHalo(i, false);
  }
  function setPin(p) {
    pin = p;
    pinG.style.display = "";
    positionPin();
    if (!rmq.matches && ring.animate)
      ringAnim = ring.animate([{ transform: "scale(.6)", opacity: 0.75 }, { transform: "scale(2.6)", opacity: 0 }], { duration: 1800, iterations: Infinity, easing: "ease-out" });
  }
  function reveal() {
    const r = svg.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) host.scrollIntoView({ block: "nearest", behavior: rmq.matches ? "auto" : "smooth" });
  }
  // The page's answer for a ZIP or a location: zoom to the area, drop the pin, and for a zone send a truck.
  function focus(t) {
    clearPin();
    if (!t) return zoomTo(WHOLE_MAP);
    const hub = hubs[t.hub];
    if (!hub) return zoomTo(WHOLE_MAP);
    const at = t.inZone ? pinInZone(t, hub) : { x: t.x, y: t.y };
    setPin(at);
    if (t.inZone) {
      pulse(t.hub);
      sendExtra(t.hub);
    }
    zoomTo(frameFor(at.x, at.y, hub));
    if (t.reveal) reveal();
  }

  /* ----------------------------- tap to explore ------------------------------- */
  let selHub = -1;
  let selTruck = null;
  let lastSub = "";
  const hubText = (i) =>
    mode === SCENE.live ? `${hubDel[i].toLocaleString("en-US")} simulated ${hubDel[i] === 1 ? "delivery" : "deliveries"}` : "Approximate zone";
  const hitBtns = [];
  for (let i = 0; i < N; i++) {
    const b = div("pointer-events-none absolute left-0 top-0 -ml-[22px] -mt-[22px] h-11 w-11 rounded-full", hitsEl, "button");
    b.type = "button";
    b.tabIndex = i === 0 ? 0 : -1;
    b.setAttribute("aria-label", `Delivery hub ${i + 1} of ${N}`);
    b.setAttribute("aria-pressed", "false");
    hitBtns.push(b);
    await pace();
  }
  let roving = 0;
  function positionHits() {
    for (let i = 0; i < N; i++) {
      const [x, y] = hubPx(i);
      hitBtns[i].style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  function clearSel() {
    if (selHub >= 0) {
      if (!pulses.has(selHub)) setHalo(selHub, false);
      hitBtns[selHub].setAttribute("aria-pressed", "false");
      for (let i = 0; i < N; i++) halos[i].style.opacity = "";
    }
    selHub = -1;
    selTruck = null;
    boostT = 0;
    bub.hidden = true;
    bubLive.textContent = "";
  }
  function selectHub(i) {
    clearSel();
    // A hub chosen by key can be outside the zoomed frame: show the whole map so the choice is visible.
    const h = hubs[i];
    if (zoomed && (h.x < VB.x || h.x > VB.x + VB.w || h.y < VB.y || h.y > VB.y + VB.h)) zoomTo(WHOLE_MAP);
    selHub = i;
    setHalo(i, true);
    for (let j = 0; j < N; j++) if (j !== i) halos[j].style.opacity = "0.45";
    hitBtns[i].setAttribute("aria-pressed", "true");
    bubTitle.textContent = "Delivery hub";
    lastSub = bubSub.textContent = hubText(i);
    bub.hidden = false;
    bubLive.textContent = `Delivery hub ${i + 1} of ${N}. ${lastSub}.`;
    if (mode === SCENE.live) {
      boostT = BOOST_SECONDS;
      // Make sure the zone has a truck out to hurry along.
      if (!trucks.some((T) => T.hub === i && T.ph !== "wait") && !hubBusy[i]) {
        const k = trucks.findIndex((T, j) => j < Math.min(limit, maxTrucks) && T.ph === "wait" && !T.parked && !T.special && T.hub < 0);
        if (k >= 0) startTrip(trucks[k], i, 0, false);
      }
    }
    drawSim();
  }
  function selectTruck(T) {
    clearSel();
    selTruck = T;
    selTruckT = 0;
    bubTitle.textContent = T.cargo || CARGO[0];
    lastSub = bubSub.textContent = "Simulated";
    bub.hidden = false;
    bubLive.textContent = `${bubTitle.textContent}. Simulated.`;
    drawSim();
  }
  function updateBubble() {
    if (bub.hidden) return;
    let a;
    if (selTruck) {
      if (!(selTruck.op > 0.15) || (selTruck.ph === "wait" && !selTruck.parked) || selTruckT > 7) return clearSel();
      a = toPx(selTruck.x, selTruck.y);
      a[1] -= TW * 0.35 + 8;
    } else if (selHub >= 0) {
      const t = hubText(selHub);
      if (t !== lastSub) lastSub = bubSub.textContent = t;
      a = hubPx(selHub);
      a[1] -= pinHalfPx() + 6;
    } else return;
    const bw = bub.offsetWidth;
    const bh = bub.offsetHeight;
    const out = a[0] < -20 || a[0] > MW + 20 || a[1] < -20 || a[1] > MH + 60;
    bub.style.visibility = out ? "hidden" : "visible";
    const left = Math.max(4, Math.min(MW - bw - 4, a[0] - bw / 2));
    let top = a[1] - bh;
    if (top < 4) top = a[1] + (selTruck ? TW : pinHalfPx() * 2) + 12;
    bub.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`;
  }
  // The pointer is resolved against the map itself, nearest first: 105 overlapping 44px buttons would swallow taps.
  function hitAt(px, py) {
    let bt = null;
    let bd = 1e9;
    for (const T of trucks) {
      if (!(T.op > 0.3) || (T.ph === "wait" && !T.parked)) continue;
      const [tx, ty] = toPx(T.x, T.y);
      const dx = Math.abs(px - tx);
      const dy = Math.abs(py - ty);
      if (dx <= TW / 2 + 4 && dy <= TW * 0.3 + 5 && dx * dx + dy * dy < bd) {
        bd = dx * dx + dy * dy;
        bt = T;
      }
    }
    if (bt) return { t: bt };
    let bh = -1;
    bd = HIT_RADIUS;
    for (let i = 0; i < N; i++) {
      const [hx, hy] = hubPx(i);
      const d = Math.hypot(px - hx, py - hy);
      if (d <= bd) {
        bd = d;
        bh = i;
      }
    }
    return bh >= 0 ? { h: bh } : null;
  }
  const rel = (e) => {
    const r = svg.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  listen(host, "click", (e) => {
    if (hitsEl.contains(e.target) || zoomOut.contains(e.target)) return;
    const [x, y] = rel(e);
    const h = hitAt(x, y);
    if (!h) clearSel();
    else if (h.t) selectTruck(h.t);
    else selectHub(h.h);
  });
  listen(document, "click", (e) => {
    if (!host.contains(e.target)) clearSel();
  });
  listen(document, "keydown", (e) => {
    if (e.key === "Escape") clearSel();
  });
  listen(host, "pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const [x, y] = rel(e);
    host.style.cursor = hitAt(x, y) ? "pointer" : "";
  });
  listen(host, "pointerleave", () => {
    host.style.cursor = "";
  });
  hitBtns.forEach((b, i) => {
    b.addEventListener("click", () => selectHub(i));
    b.addEventListener("focus", () => {
      roving = i;
      hitBtns.forEach((o, j) => (o.tabIndex = j === i ? 0 : -1));
    });
    b.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) {
        e.preventDefault();
        hitBtns[(i + step + N) % N].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        hitBtns[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        hitBtns[N - 1].focus();
      }
    });
  });

  /* ------------------------------------ go ------------------------------------ */
  const ro = new ResizeObserver(() => layout(true));
  ro.observe(svg);
  cleanups.push(() => ro.disconnect());
  const measured = svg.getBoundingClientRect();
  MW = measured.width || W;
  MH = measured.height || H;
  readPinK();
  sizeSim();
  await pace();
  if (gone()) return null;
  await pickAlive();
  if (gone()) return null;
  if (mode === SCENE.still) await buildStatic();
  else await buildLive();
  if (gone()) return null;
  layout(false);
  sync();

  return {
    focus,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(zoomRaf);
      clearPin();
      cleanups.forEach((fn) => fn());
      for (let i = 0; i < N; i++) halos[i].style.cssText = "";
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.style.removeProperty("--zoom");
      [over, counter, hitsEl, bub, zoomOut, bubLive].forEach((n) => n.remove());
      note.textContent = "";
      note.classList.add("invisible");
      delete host.dataset.scene;
      host.style.cursor = "";
    },
  };
}
