// The vehicle lists behind GET /api/vehicles, and the build's vPIC snapshot.
//
// Models come from NHTSA vPIC (free, public) through this server rather than
// straight from each shopper's browser, so Vercel's edge can cache one answer
// for everybody (model lists for a past year never change) and an ad or
// privacy blocker that stops vpic.nhtsa.dot.gov does not empty the picker.
// The lists themselves (makes, years, how vPIC names are cleaned and merged
// with the size table) are src/data/vehicleList.js, shared with the browser.
//
// Pure apart from `fetch`, which every function takes as an option, so the
// tests play vPIC with scripts/vpic-mock.mjs.

import {
  MAKES,
  VPIC_TYPES,
  YEARS,
  makesFor,
  mergeModels,
  vpicModelsUrl,
  vpicNames,
} from "../../src/data/vehicleList.js";

/**
 * One vPIC request may take this long before it is abandoned, and is tried
 * once more after a failure. Two attempts stay inside a serverless
 * function's 10-second budget; the browser waits a little longer than that
 * for this endpoint (src/data/vehicles.js).
 */
export const UPSTREAM_TIMEOUT_MS = 4000;
export const UPSTREAM_RETRIES = 1;

/** A full answer: a day at the edge, then a week served stale while it refreshes. */
export const CACHE_LONG =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
/** vPIC knows no models yet (next model year): ask again within the hour. */
export const CACHE_EMPTY =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
/** Some vehicle types answered and some did not: keep it briefly. */
export const CACHE_PARTIAL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
export const NO_STORE = "no-store";

const MEMO_TTL_MS = 24 * 60 * 60 * 1000;
const MEMO_MAX = 1000;
// "Make|Year" -> { at, models }: full answers only, per function instance.
const memo = new Map();

/** Forgets the per-instance answers (tests). */
export function clearVehiclesCache() {
  memo.clear();
}

async function fetchJson(url, { fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.Results)) throw new Error("no Results");
    return data.Results;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRows(url, opts) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetchJson(url, opts);
    } catch (e) {
      if (attempt >= opts.retries) throw e;
    }
  }
}

/**
 * The models vPIC lists for a make in a model year (`year` "" = every
 * year), as `{ names, failed }`: `failed` counts the vehicle types that did
 * not answer.
 */
export async function fetchVpicModels(
  make,
  year,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = UPSTREAM_TIMEOUT_MS,
    retries = UPSTREAM_RETRIES,
    base,
  } = {},
) {
  const parts = await Promise.all(
    VPIC_TYPES.map((type) =>
      fetchRows(vpicModelsUrl(make, year, type, base), {
        fetchImpl,
        timeoutMs,
        retries,
      }).catch(() => null),
    ),
  );
  const ok = parts.filter((p) => p !== null);
  return { names: vpicNames(make, ok), failed: parts.length - ok.length };
}

/** The listed spelling of a make ("bmw" -> "BMW"), or null. */
function listedMake(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s || s.length > 40) return null;
  const hit = MAKES.find((m) => m[0].toLowerCase() === s);
  return hit ? hit[0] : null;
}

const listedYear = (raw) => {
  const s = String(raw ?? "").trim();
  return YEARS.includes(s) ? s : null;
};

function bad(error) {
  return { status: 400, body: { error }, cache: NO_STORE };
}

/**
 * The answer to one /api/vehicles query, as `{ status, body, cache }`
 * (`cache` is the Cache-Control value). Options: `fetchImpl`, `timeoutMs`,
 * `retries`, `base` (vPIC), `now`, and `memo: false` to skip the
 * per-instance cache.
 *
 *   kind=makes[&year=2019]   { kind, year, makes, source: "curated" }
 *   kind=models&make=BMW&year=2019
 *                            { kind, make, year, models, source: "nhtsa", partial? }
 *                            or 502 { error, upstream: true } when vPIC did not answer
 */
export async function vehiclesAnswer(query, opts = {}) {
  const kind = String(query?.kind ?? "").trim();
  const now = opts.now ?? Date.now();

  if (kind === "makes") {
    const rawYear = String(query?.year ?? "").trim();
    const year = rawYear ? listedYear(rawYear) : "";
    if (year === null) {
      return bad(`year must be a model year from ${YEARS.at(-1)} to ${YEARS[0]}.`);
    }
    return {
      status: 200,
      body: { kind, year, makes: makesFor(year), source: "curated" },
      cache: CACHE_LONG,
    };
  }

  if (kind !== "models") return bad('kind must be "makes" or "models".');

  const year = listedYear(query?.year);
  if (!year) return bad(`year must be a model year from ${YEARS.at(-1)} to ${YEARS[0]}.`);
  const make = listedMake(query?.make);
  if (!make) return bad("make must be one of the makes /api/vehicles?kind=makes lists.");
  if (!makesFor(year).includes(make)) {
    // Not sold that year: nothing to ask vPIC.
    return {
      status: 200,
      body: { kind, make, year, models: [], source: "curated" },
      cache: CACHE_LONG,
    };
  }

  const key = `${make}|${year}`;
  const remember = opts.memo !== false;
  const hit = remember ? memo.get(key) : null;
  if (hit && now - hit.at < MEMO_TTL_MS) {
    return {
      status: 200,
      body: { kind, make, year, models: hit.models, source: "nhtsa" },
      cache: hit.models.length ? CACHE_LONG : CACHE_EMPTY,
    };
  }

  const { names, failed } = await fetchVpicModels(make, year, opts);
  if (failed === VPIC_TYPES.length) {
    return {
      status: 502,
      body: {
        error: "Vehicle models are unavailable right now (NHTSA vPIC did not answer).",
        upstream: true,
      },
      cache: NO_STORE,
    };
  }
  const models = mergeModels(make, year, names);
  if (failed) {
    return {
      status: 200,
      body: { kind, make, year, models, source: "nhtsa", partial: true },
      cache: CACHE_PARTIAL,
    };
  }
  if (remember) {
    if (memo.size >= MEMO_MAX) memo.delete(memo.keys().next().value);
    memo.set(key, { at: now, models });
  }
  return {
    status: 200,
    body: { kind, make, year, models, source: "nhtsa" },
    cache: names.length ? CACHE_LONG : CACHE_EMPTY,
  };
}

/* ------------------------------------------------------------------ *
 * The build's snapshot (scripts/vpic-snapshot.mjs)
 * ------------------------------------------------------------------ */

/**
 * Every listed make's models across all years, from vPIC, for the browser
 * to fall back on when neither this endpoint nor vPIC answers:
 *
 *   { v: 1, generated, source: "NHTSA vPIC", years: "all", makes: { BMW: [...] } }
 *
 * A make is kept only when all three vehicle types answered. Returns null
 * when vPIC cannot be reached at all (one probe request fails), so a build
 * without network stops after a single timeout.
 */
export async function buildSnapshot({
  fetchImpl = globalThis.fetch,
  timeoutMs = 8000,
  retries = 1,
  concurrency = 6,
  deadlineMs = 120000,
  base,
  log = () => {},
} = {}) {
  const started = Date.now();
  const opts = { fetchImpl, timeoutMs, retries, base };
  try {
    await fetchRows(vpicModelsUrl("Toyota", "", "car", base), {
      fetchImpl,
      timeoutMs,
      retries: 0,
    });
  } catch (e) {
    log(`vPIC unreachable (${e && e.name === "AbortError" ? "timed out" : e?.message})`);
    return null;
  }

  const queue = MAKES.map((m) => m[0]);
  const makes = {};
  let missed = 0;
  async function worker() {
    while (queue.length) {
      const make = queue.shift();
      if (Date.now() - started > deadlineMs) {
        missed += 1;
        continue;
      }
      const { names, failed } = await fetchVpicModels(make, "", opts);
      if (failed) {
        missed += 1;
        continue;
      }
      makes[make] = mergeModels(make, "", names);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const count = Object.keys(makes).length;
  log(`${count} makes, ${missed} missed`);
  if (!count) return null;
  return {
    v: 1,
    generated: new Date().toISOString(),
    source: "NHTSA vPIC",
    years: "all",
    makes: Object.fromEntries(
      Object.keys(makes)
        .sort()
        .map((k) => [k, makes[k]]),
    ),
  };
}
