import { FITMENT, FITMENT_YEAR_SPANS } from "./fitment.js";

/**
 * The vehicle lists themselves, with no React and no window, so the browser
 * (src/data/vehicles.js), the API (api/vehicles.js) and the build's vPIC
 * snapshot (scripts/vpic-snapshot.mjs) all read the same ones:
 *
 *   - YEARS: every model year 1981-2027;
 *   - makesFor(year): the makes sold in the US that year (a curated list:
 *     vPIC's own make list is thousands long, trailer and kit builders
 *     included);
 *   - vpicModelsUrl / vpicNames: how a make's models are asked of NHTSA vPIC
 *     and cleaned (passenger cars, trucks and SUVs/vans only; Scion split out
 *     of Toyota; replica-builder junk dropped);
 *   - mergeModels: vPIC's names with the size table's models merged in under
 *     the table's own spelling, so every model with a size on file still
 *     resolves to it.
 */

const FIRST_YEAR = 1981;
const LAST_YEAR = 2027;

/** ["2027", ..., "1981"] */
export const YEARS = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => String(LAST_YEAR - i),
);

// [display name, [[firstYear, lastYear], ...], vPIC make (if different), model prefix to keep + strip]
// prettier-ignore
export const MAKES = [
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

export const VPIC_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
/** vPIC vehicle types kept: passenger car, truck, SUV/van (MPV). */
export const VPIC_TYPES = ["car", "truck", "mpv"];
// vPIC files a few sub-brands under the parent make; they get their own entry above.
const EXCLUDE_PREFIX = { Toyota: "Scion " };
// Replica and kit builders that registered under a big make ("Classic Sedan", "'34").
const JUNK = /^(Classic|Cordova|Malibu) Sedan$|^['"(]/;

/** The MAKES entry for a display name, or null. */
export const findMake = (name) => MAKES.find((m) => m[0] === name) ?? null;

function soldIn(entry, year) {
  if (!year) return true;
  const y = Number(year);
  return entry[1].some(([first, last]) => y >= first && y <= last);
}

/** ["Acura", ...] sold in `year`; every make when `year` is "". */
export function makesFor(year) {
  return MAKES.filter((m) => soldIn(m, year)).map((m) => m[0]);
}

/**
 * vPIC's models URL for a listed make, one vehicle type, and a model year
 * (or every year, when `year` is "": the build's snapshot asks that way).
 */
export function vpicModelsUrl(make, year, type, base = VPIC_BASE) {
  const entry = findMake(make);
  const vpicMake = (entry && entry[2]) || make;
  const yearPart = year ? `/modelyear/${encodeURIComponent(year)}` : "";
  return `${base}/GetModelsForMakeYear/make/${encodeURIComponent(vpicMake)}${yearPart}/vehicletype/${type}?format=json`;
}

/**
 * The model names in vPIC answers (`Results` rows) for a listed make: a
 * sub-brand keeps only its own prefixed names (stripped), the parent drops
 * them, and replica-builder junk goes.
 */
export function vpicNames(make, rowLists) {
  const entry = findMake(make);
  const vpicMake = (entry && entry[2]) || make;
  const prefix = (entry && entry[3]) || "";
  const names = [];
  rowLists.forEach((rows) =>
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      let n = String((r && r.Model_Name) || "").trim();
      if (!n) return;
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
  return names;
}

// "GLC-Class" and "GLC", "3-Series" and "3 Series" are the same model.
export const normModel = (s) =>
  String(s)
    .toLowerCase()
    .replace(/class|series/g, "")
    .replace(/[^a-z0-9]/g, "");

/** The size table's models for a make in a model year (any year when ""). */
export function tableModels(make, year) {
  const y = Number(year);
  return Object.keys(FITMENT)
    .filter((key) => {
      if (key.split("|")[0] !== make) return false;
      const span = FITMENT_YEAR_SPANS[key];
      return !y || !span || (y >= span[0] && y <= span[1]);
    })
    .map((key) => key.split("|")[1]);
}

/**
 * The size-table models for the make and year, plus `names` (vPIC's)
 * de-duplicated and sorted. The table's spelling wins a tie.
 */
export function mergeModels(make, year, names) {
  const seen = new Set();
  const out = [];
  tableModels(make, year).forEach((m) => {
    seen.add(normModel(m));
    out.push(m);
  });
  names.forEach((m) => {
    const clean = String(m || "").trim();
    if (!clean || /^['"(]/.test(clean)) return; // drops replica-builder junk like "'34"
    const k = normModel(clean);
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(clean);
  });
  return out.sort((a, b) =>
    a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }),
  );
}
