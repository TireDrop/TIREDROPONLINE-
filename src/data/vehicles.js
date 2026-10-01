import { useEffect, useState } from "react";

import {
  YEARS,
  findMake,
  makesFor,
  mergeModels,
  vpicModelsUrl,
  vpicNames,
} from "./vehicleList.js";

export { YEARS, makesFor };

/**
 * Vehicle picker data: every model year 1981-2027, every make sold in the US
 * in that span (src/data/vehicleList.js, shared with the API), and the models
 * for a make + year. The Shopify theme's assets/td-vehicles.js offers the same
 * makes and years.
 *
 * Models come from NHTSA vPIC (passenger cars, trucks and SUVs/vans), asked
 * in this order until one answers:
 *
 *   1. our own GET /api/vehicles (api/vehicles.js), which asks vPIC with a
 *      timeout and is cached at Vercel's edge for a day, so most shoppers get
 *      a cached list and a blocker that stops vpic.nhtsa.dot.gov does not
 *      matter;
 *   2. vPIC straight from the browser (CORS-open), when there is no API to
 *      ask (a static preview, local dev) - not when the API answered that
 *      vPIC is down, which would only make the shopper wait twice;
 *   3. the build's snapshot, /data/vpic-models.json (scripts/vpic-snapshot.mjs):
 *      every model of the make across all years, when the build could reach
 *      vPIC;
 *   4. the size-table models only ("fallback"), and the finders say so and
 *      let the shopper type the model or enter the door-jamb size.
 *
 * The typical-size table in fitment.js is merged in under its own spelling
 * every time, so every vehicle the size table knows still resolves to its
 * size. NHTSA does not publish tire sizes, so a vehicle outside the table is
 * still selectable; its tires say "Check fitment" and ask for the size off
 * the door-jamb sticker or sidewall.
 */

/** Value of the "Other / not listed" model choice. */
export const OTHER = "Other";
export const OTHER_LABEL = "Other / not listed";

// "Make|Year" -> Promise<{ models, source }>. Only a vPIC answer is kept, so
// the next pick after a failure tries the network again.
const cache = new Map();

function log(...args) {
  try {
    console.info("[TireDrop vehicles]", ...args);
  } catch {
    /* no console */
  }
}

/**
 * How long one vPIC request may take, body included, before it is abandoned,
 * and how many times a failed request is tried again. vPIC usually answers in
 * well under a second; when it hangs, a visitor should not watch "Loading
 * models…" for longer than about two of these before the fallback appears.
 */
export const VPIC_TIMEOUT_MS = 7000;
export const VPIC_RETRIES = 1;
/**
 * How long the browser waits for /api/vehicles: a little over the server's
 * own two vPIC attempts (api/_lib/vehicles.js), so a slow vPIC comes back as
 * the server's "vPIC is down" rather than a timeout here.
 */
export const API_TIMEOUT_MS = 10000;
export const API_URL = "/api/vehicles";
export const SNAPSHOT_URL = "/data/vpic-models.json";
const SNAPSHOT_TIMEOUT_MS = 5000;

async function getJson(url, timeoutMs, credentials = "omit") {
  const controller =
    typeof AbortController === "undefined" ? null : new AbortController();
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const res = await fetch(url, {
      credentials,
      signal: controller ? controller.signal : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON: a page, not an answer */
    }
    return { ok: res.ok, status: res.status, data };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Asks /api/vehicles: `{ models }`, or "down" when the API answered that vPIC
 * is down (or took too long to say), or "none" when there is no API here.
 */
async function fromApi(make, year) {
  const url = `${API_URL}?kind=models&make=${encodeURIComponent(make)}&year=${encodeURIComponent(year)}`;
  try {
    const r = await getJson(url, API_TIMEOUT_MS, "same-origin");
    if (r.ok && r.data && Array.isArray(r.data.models)) {
      return { models: r.data.models.map(String) };
    }
    if (r.data && r.data.upstream === true) return "down";
    log("no vehicles API", r.status);
    return "none";
  } catch (e) {
    if (e && e.name === "AbortError") {
      log("vehicles API timed out");
      return "down";
    }
    log("no vehicles API", e && e.message);
    return "none";
  }
}

async function fetchType(make, year, type) {
  const url = vpicModelsUrl(make, year, type);
  for (let attempt = 0; ; attempt += 1) {
    try {
      const r = await getJson(url, VPIC_TIMEOUT_MS);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (r.data && r.data.Results) || [];
    } catch (e) {
      if (attempt >= VPIC_RETRIES) throw e;
      log("retrying", type, e && (e.name === "AbortError" ? "timed out" : e.message));
    }
  }
}

/** vPIC straight from the browser: the model names, or null. */
async function fromVpic(make, year) {
  const parts = await Promise.all(
    ["car", "truck", "mpv"].map((t) =>
      fetchType(make, year, t).catch((e) => {
        log("fetch failed", make, year, t, e && e.message);
        return null;
      }),
    ),
  );
  const ok = parts.filter((x) => x !== null);
  return ok.length ? vpicNames(make, ok) : null;
}

// The build's snapshot, fetched once per page load: { makes } or null.
let snapshot = null;
function loadSnapshot() {
  if (!snapshot) {
    snapshot = getJson(SNAPSHOT_URL, SNAPSHOT_TIMEOUT_MS, "same-origin")
      .then((r) =>
        r.ok && r.data && r.data.makes && typeof r.data.makes === "object"
          ? r.data
          : null,
      )
      .catch(() => null);
  }
  return snapshot;
}

/** Forgets every answer (tests). */
export function resetVehicleModels() {
  cache.clear();
  snapshot = null;
}

/**
 * Models for a make in a model year:
 * `Promise<{ models: string[], source: "nhtsa" | "snapshot" | "fallback" | "none" }>`.
 * Never rejects: when nothing answers it falls back to the size table.
 */
export function modelsFor(make, year) {
  const entry = findMake(make);
  if (!entry || !year) return Promise.resolve({ models: [], source: "none" });
  const key = `${make}|${year}`;
  if (cache.has(key)) return cache.get(key);

  const p = (async () => {
    const api = await fromApi(make, year);
    if (api && typeof api === "object") {
      return { models: mergeModels(make, year, api.models), source: "nhtsa" };
    }
    if (api === "none") {
      const names = await fromVpic(make, year);
      if (names) return { models: mergeModels(make, year, names), source: "nhtsa" };
    }
    cache.delete(key); // try the network again next time
    const snap = await loadSnapshot();
    const names = snap && Array.isArray(snap.makes[make]) ? snap.makes[make] : null;
    if (names && names.length) {
      log("using the build snapshot for", make, year);
      return { models: mergeModels(make, year, names.map(String)), source: "snapshot" };
    }
    log("falling back to size table for", make, year);
    return { models: mergeModels(make, year, []), source: "fallback" };
  })();
  cache.set(key, p);
  return p;
}

/**
 * The model list for a make + year as React state:
 * `{ models, loading, source }`. Empty and not loading until both are picked;
 * a newer pick always wins over a slower earlier answer.
 */
export function useVehicleModels(make, year) {
  const key = make && year ? `${make}|${year}` : "";
  const [state, setState] = useState({ key: "", models: [], source: "none" });

  useEffect(() => {
    if (!key) return undefined;
    let live = true;
    modelsFor(make, year).then((res) => {
      if (live) setState({ key, models: res.models, source: res.source });
    });
    return () => {
      live = false;
    };
  }, [key, make, year]);

  if (!key) return { models: [], loading: false, source: "none" };
  if (state.key !== key) return { models: [], loading: true, source: "none" };
  return { models: state.models, loading: false, source: state.source };
}

/* ------------------------------------------------------------------ *
 * The last vehicle picked in a finder, so a form can start from it
 * ------------------------------------------------------------------ */

const LAST_VEHICLE_KEY = "tiredrop.vehicle.v1";

/**
 * Remembers the vehicle picked in the hero finder or Find My Tires, so the
 * checkout and booking forms can offer it back. "Other / not listed" is not
 * a model, so it is kept as a blank. Storage can be off or full; then the
 * forms simply start empty.
 */
export function rememberVehicle({ year = "", make = "", model = "" } = {}) {
  if (!year || !make) return;
  try {
    window.localStorage.setItem(
      LAST_VEHICLE_KEY,
      JSON.stringify({
        year: String(year),
        make: String(make),
        model: model === OTHER ? "" : String(model || ""),
      }),
    );
  } catch {
    /* storage unavailable */
  }
}

/** `{ year, make, model }` last remembered, or null. Call it in an effect. */
export function recallVehicle() {
  try {
    const raw = window.localStorage.getItem(LAST_VEHICLE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    const text = (x) => (typeof x === "string" ? x.trim().slice(0, 60) : "");
    const out = { year: text(v?.year), make: text(v?.make), model: text(v?.model) };
    return out.year && out.make ? out : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * What the shopper is shopping for (the fitment selection)
 * ------------------------------------------------------------------ */

/**
 * The one saved selection, in localStorage, so it survives a browser
 * restart until the shopper clears their site data (or taps "Shopping for a
 * different car?"):
 *
 *   tiredrop.fitment.v1 = { "v": 1, "type": "vehicle", "year": "2019",
 *                           "make": "BMW", "model": "3 Series",
 *                           "pick"?: trim option, "size"?: "225/40R19",
 *                           "rear"?: "255/35R19" }
 *                       | { "v": 1, "type": "size", "size": "225/40R19",
 *                           "rear"?: "255/35R19" }
 *
 * `v` is the format version. An entry from before it existed (no `v`) is
 * read as version 1; one from a newer format this build does not know is
 * ignored rather than misread. Every read and write is wrapped in
 * try/catch: with storage blocked (private mode, site data off) the
 * selection lasts for the page session only (VehicleContext.jsx keeps it in
 * memory) and Shop Tires shows the finder again next time.
 *
 * `size` on a vehicle is a size the shopper confirmed (the door-jamb
 * sticker, or typed over the typical size in Find My Tires); only a
 * confirmed size can rule a tire out (fitmentCheck.js). `rear` (added
 * 2026-10-01, main dee5157) is the rear size of a staggered setup and is
 * only kept next to a `size`. It is an optional extra field, so the key and
 * `v` stay at 1: a build from before it reads the entry as the front size
 * only, and an entry from before it simply has no rear. Bump `v` only for a
 * change an older build would misread (a renamed or re-meant field).
 */
const SELECTION_KEY = "tiredrop.fitment.v1";
export const SELECTION_VERSION = 1;

const clip = (x, n = 60) => (typeof x === "string" ? x.trim().slice(0, n) : "");

/** A stored selection checked field by field, or null. */
function cleanSelection(v) {
  if (!v || typeof v !== "object") return null;
  if (v.v != null && v.v !== SELECTION_VERSION) return null;
  if (v.type === "size") {
    const size = clip(v.size, 40);
    if (!size) return null;
    const out = { type: "size", size };
    if (clip(v.rear, 40)) out.rear = clip(v.rear, 40);
    return out;
  }
  if (v.type === "vehicle") {
    const out = { type: "vehicle", year: clip(v.year), make: clip(v.make), model: clip(v.model) };
    if (!out.year || !out.make) return null;
    if (clip(v.pick, 80)) out.pick = clip(v.pick, 80);
    if (clip(v.size, 40)) {
      out.size = clip(v.size, 40);
      if (clip(v.rear, 40)) out.rear = clip(v.rear, 40);
    }
    return out;
  }
  return null;
}

/**
 * The vehicle or size the shopper is shopping for, as the fitment store
 * keeps it (src/context/VehicleContext.jsx), or null. Falls back to the last
 * vehicle a finder remembered, so a vehicle picked before this existed still
 * counts. Call it in an effect, never while rendering.
 */
export function loadSelection() {
  try {
    const raw = window.localStorage.getItem(SELECTION_KEY);
    if (raw) return cleanSelection(JSON.parse(raw));
  } catch {
    /* storage unavailable or junk */
  }
  const last = recallVehicle();
  return last ? { type: "vehicle", ...last } : null;
}

/**
 * Stores the selection. A vehicle is also remembered for the checkout and
 * booking forms. null forgets both, so "Shopping for a different car?"
 * leaves nothing behind to come back on the next visit.
 */
export function saveSelection(selection) {
  const clean = cleanSelection(selection);
  try {
    if (!clean) {
      window.localStorage.removeItem(SELECTION_KEY);
      window.localStorage.removeItem(LAST_VEHICLE_KEY);
      return null;
    }
    window.localStorage.setItem(
      SELECTION_KEY,
      JSON.stringify({ v: SELECTION_VERSION, ...clean }),
    );
  } catch {
    /* storage unavailable: the selection lasts for this page load */
  }
  if (clean.type === "vehicle") rememberVehicle(clean);
  return clean;
}

/**
 * `{ year, make, model }` from a vehicle written as one line, the way
 * checkout stores it on an order ("Vehicle: 2020 Land Rover Range Rover
 * Sport"): the four-digit year, then the longest make this list knows for
 * that year (so two-word makes stay whole), and the rest as the model (trim
 * included). A make the list does not know is the first word. Blanks when
 * there is no leading year. Used to prefill the booking form from an order
 * /track verified; the dropdowns show anything unlisted as "Other".
 */
export function splitVehicle(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const m = /^(\d{4}) (.+)$/.exec(clean);
  if (!m) return { year: "", make: "", model: "" };
  const [, year, rest] = m;
  const lower = rest.toLowerCase();
  const known = [...new Set([...makesFor(year), ...makesFor("")])]
    .filter((make) => {
      const l = make.toLowerCase();
      return lower === l || lower.startsWith(`${l} `);
    })
    .sort((a, b) => b.length - a.length)[0];
  if (known) {
    return { year, make: known, model: rest.slice(known.length).trim() };
  }
  const [first, ...others] = rest.split(" ");
  return { year, make: first, model: others.join(" ") };
}
