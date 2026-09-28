import { useEffect, useState } from "react";

import { FITMENT, FITMENT_YEAR_SPANS } from "./fitment.js";

/**
 * Vehicle picker data: every model year 1981-2027, every make sold in the US
 * in that span, and the models for a make + year. A port of the Shopify
 * theme's assets/td-vehicles.js, so the React finder and the theme offer the
 * same list.
 *
 * Models come live from the NHTSA vPIC database (vpic.nhtsa.dot.gov, free,
 * public, CORS-open), called straight from the browser and filtered to
 * passenger cars, trucks and SUVs/vans (vehicle types car, truck, mpv). The
 * typical-size table in fitment.js is merged in under its own spelling, so
 * every vehicle the Find My Tires tool can size still resolves to that size.
 *
 * NHTSA does not publish tire sizes, so a vehicle outside the size table is
 * still selectable; Find My Tires then asks for the size off the sidewall.
 *
 * If vPIC cannot be reached, the list falls back to the size-table models for
 * that make, and an "Other / not listed" choice is always offered.
 */

const FIRST_YEAR = 1981;
const LAST_YEAR = 2027;

/** Value of the "Other / not listed" model choice. */
export const OTHER = "Other";
export const OTHER_LABEL = "Other / not listed";

/** ["2027", ..., "1981"] */
export const YEARS = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => String(LAST_YEAR - i),
);

// [display name, [[firstYear, lastYear], ...], vPIC make (if different), model prefix to keep + strip]
// prettier-ignore
const MAKES = [
  ["Acura", [[1986, 2027]]],
  ["Alfa Romeo", [[1981, 1995], [2014, 2027]]],
  ["American Motors", [[1981, 1987]]],
  ["Aston Martin", [[1981, 2027]]],
  ["Audi", [[1981, 2027]]],
  ["Bentley", [[1985, 2027]]],
  ["BMW", [[1981, 2027]]],
  ["Buick", [[1981, 2027]]],
  ["Cadillac", [[1981, 2027]]],
  ["Chevrolet", [[1981, 2027]]],
  ["Chrysler", [[1981, 2027]]],
  ["Daewoo", [[1999, 2002]]],
  ["Daihatsu", [[1988, 1992]]],
  ["Datsun", [[1981, 1983]]],
  ["Dodge", [[1981, 2027]]],
  ["Eagle", [[1988, 1998]]],
  ["Ferrari", [[1981, 2027]]],
  ["Fiat", [[1981, 1982], [2012, 2027]]],
  ["Fisker", [[2012, 2012], [2023, 2024]]],
  ["Ford", [[1981, 2027]]],
  ["Genesis", [[2017, 2027]]],
  ["Geo", [[1989, 1997]]],
  ["GMC", [[1981, 2027]]],
  ["Honda", [[1981, 2027]]],
  ["Hummer", [[1992, 2010]]],
  ["Hyundai", [[1986, 2027]]],
  ["INEOS", [[2024, 2027]]],
  ["Infiniti", [[1990, 2027]]],
  ["Isuzu", [[1981, 2013]]],
  ["Jaguar", [[1981, 2027]]],
  ["Jeep", [[1981, 2027]]],
  ["Karma", [[2018, 2027]]],
  ["Kia", [[1994, 2027]]],
  ["Lamborghini", [[1981, 2027]]],
  ["Land Rover", [[1987, 2027]]],
  ["Lexus", [[1990, 2027]]],
  ["Lincoln", [[1981, 2027]]],
  ["Lotus", [[1981, 2027]]],
  ["Lucid", [[2022, 2027]]],
  ["Maserati", [[1981, 2027]]],
  ["Maybach", [[2003, 2012]]],
  ["Mazda", [[1981, 2027]]],
  ["McLaren", [[2012, 2027]]],
  ["Mercedes-Benz", [[1981, 2027]]],
  ["Mercury", [[1981, 2011]]],
  ["Merkur", [[1985, 1989]]],
  ["MINI", [[2002, 2027]]],
  ["Mitsubishi", [[1983, 2027]]],
  ["Nissan", [[1981, 2027]]],
  ["Oldsmobile", [[1981, 2004]]],
  ["Peugeot", [[1981, 1991]]],
  ["Plymouth", [[1981, 2001]]],
  ["Polestar", [[2021, 2027]]],
  ["Pontiac", [[1981, 2010]]],
  ["Porsche", [[1981, 2027]]],
  ["Ram", [[2012, 2027]]],
  ["Renault", [[1981, 1987]]],
  ["Rivian", [[2022, 2027]]],
  ["Rolls-Royce", [[1981, 2027]]],
  ["Saab", [[1981, 2011]]],
  ["Saturn", [[1991, 2010]]],
  ["Scion", [[2004, 2016]], "Toyota", "Scion "],
  ["smart", [[2008, 2019]]],
  ["Subaru", [[1981, 2027]]],
  ["Suzuki", [[1985, 2013]]],
  ["Tesla", [[2008, 2027]]],
  ["Toyota", [[1981, 2027]]],
  ["VinFast", [[2023, 2027]]],
  ["Volkswagen", [[1981, 2027]]],
  ["Volvo", [[1981, 2027]]],
  ["Yugo", [[1986, 1992]]],
];

const VPIC =
  "https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/";
const TYPES = ["car", "truck", "mpv"];
// vPIC files a few sub-brands under the parent make; they get their own entry above.
const EXCLUDE_PREFIX = { Toyota: "Scion " };
// Replica and kit builders that registered under a big make ("Classic Sedan", "'34").
const JUNK = /^(Classic|Cordova|Malibu) Sedan$|^['"(]/;

// "Make|Year" -> Promise<{ models, source }>. A failed lookup is dropped so
// the next pick tries the network again.
const cache = new Map();

function log(...args) {
  try {
    console.info("[TireDrop vehicles]", ...args);
  } catch {
    /* no console */
  }
}

const findMake = (name) => MAKES.find((m) => m[0] === name) ?? null;

function soldIn(entry, year) {
  if (!year) return true;
  const y = Number(year);
  return entry[1].some(([first, last]) => y >= first && y <= last);
}

/** ["Acura", ...] sold in `year`; every make when `year` is "". */
export function makesFor(year) {
  return MAKES.filter((m) => soldIn(m, year)).map((m) => m[0]);
}

// "GLC-Class" and "GLC", "3-Series" and "3 Series" are the same model.
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/class|series/g, "")
    .replace(/[^a-z0-9]/g, "");

function tableModels(make, year) {
  const y = Number(year);
  return Object.keys(FITMENT)
    .filter((key) => {
      if (key.split("|")[0] !== make) return false;
      const span = FITMENT_YEAR_SPANS[key];
      return !y || !span || (y >= span[0] && y <= span[1]);
    })
    .map((key) => key.split("|")[1]);
}

async function fetchType(vpicMake, year, type) {
  const url = `${VPIC}${encodeURIComponent(vpicMake)}/modelyear/${encodeURIComponent(year)}/vehicletype/${type}?format=json`;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data && data.Results) || [];
}

function merge(make, year, names) {
  const seen = new Set();
  const out = [];
  // Size-table spellings go in first, so they win a tie.
  tableModels(make, year).forEach((m) => {
    seen.add(norm(m));
    out.push(m);
  });
  names.forEach((m) => {
    const clean = String(m || "").trim();
    if (!clean || /^['"(]/.test(clean)) return; // drops replica-builder junk like "'34"
    const k = norm(clean);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(clean);
  });
  return out.sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }),
  );
}

/**
 * Models for a make in a model year:
 * `Promise<{ models: string[], source: "nhtsa" | "fallback" | "none" }>`.
 * Never rejects: when vPIC is unreachable it answers from the size table.
 */
export function modelsFor(make, year) {
  const entry = findMake(make);
  if (!entry || !year) return Promise.resolve({ models: [], source: "none" });
  const key = `${make}|${year}`;
  if (cache.has(key)) return cache.get(key);

  const vpicMake = entry[2] || make;
  const prefix = entry[3] || "";
  const p = Promise.all(
    TYPES.map((t) =>
      fetchType(vpicMake, year, t).catch((e) => {
        log("fetch failed", make, year, t, e && e.message);
        return null;
      }),
    ),
  )
    .then((parts) => {
      const ok = parts.filter((x) => x !== null);
      if (!ok.length) throw new Error("vPIC unreachable");
      const names = [];
      ok.forEach((rows) =>
        rows.forEach((r) => {
          let n = r.Model_Name || "";
          if (prefix) {
            if (!n.startsWith(prefix)) return;
            n = n.slice(prefix.length);
          } else if (
            EXCLUDE_PREFIX[vpicMake] &&
            n.startsWith(EXCLUDE_PREFIX[vpicMake])
          ) {
            return; // Scion lives under its own make
          }
          if (JUNK.test(n)) return;
          names.push(n);
        }),
      );
      return { models: merge(make, year, names), source: "nhtsa" };
    })
    .catch((e) => {
      log("falling back to size table for", make, year, e && e.message);
      cache.delete(key); // try the network again next time
      return { models: merge(make, year, []), source: "fallback" };
    });
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
