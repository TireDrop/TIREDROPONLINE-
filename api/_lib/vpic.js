// VIN decode through NHTSA vPIC (DecodeVinValues), on the server.
//
// Free, public and keyless. The Tire Size Finder (/tire-size-finder) uses it
// for a VIN typed by hand and for a VIN read off a photo, through POST
// /api/scan-tire-size, so the browser never calls vPIC for a VIN and the VIN
// goes to one place only. vPIC gives the year, make, model, series, trim,
// drive type and body. It does NOT give tire sizes: the page asks for the
// door sticker for those.
//
// Nothing is stored and the VIN is never logged.

import { isValidVin, normalizeVin } from "../../src/data/vin.js";

export const VPIC_DECODE_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/";
/** One request, body included, before it is abandoned. */
export const VPIC_DECODE_TIMEOUT_MS = 7000;

/** vPIC could not be reached or answered with something unusable. */
export class VpicError extends Error {
  constructor(message) {
    super(message);
    this.name = "VpicError";
  }
}

const text = (v) => (typeof v === "string" ? v.trim().slice(0, 80) : "");

// vPIC writes most makes in capitals ("TOYOTA", "MERCEDES-BENZ"). Short ones
// stay as they are; the page maps the name onto its own make list.
const KEEP_CAPS = new Set(["BMW", "GMC", "MINI", "RAM", "FIAT", "INEOS", "AMC"]);
function tidyMake(make) {
  const m = text(make);
  if (!m || KEEP_CAPS.has(m.toUpperCase())) return m;
  if (m !== m.toUpperCase()) return m;
  return m
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// "AWD/All-Wheel Drive" -> "AWD"; "4WD/4-Wheel Drive/4x4" -> "4WD".
const tidyDrive = (d) => text(d).split("/")[0].trim();
// "Sedan/Saloon" -> "Sedan"; "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)" -> "Sport Utility Vehicle (SUV)".
const tidyBody = (b) => text(b).split("/")[0].trim();

/**
 * The vehicle a VIN decodes to:
 *   { year, make, model, series, trim, drive, body }   strings, "" when
 *   vPIC has nothing; or null when vPIC has no year, make and model for it.
 * Throws VpicError when vPIC cannot be reached in time. `fetchImpl` is the
 * test hook.
 */
export async function decodeVin(
  vin,
  { fetchImpl = globalThis.fetch, timeoutMs = VPIC_DECODE_TIMEOUT_MS } = {},
) {
  const v = normalizeVin(vin);
  if (!isValidVin(v)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let data;
  try {
    const res = await fetchImpl(
      `${VPIC_DECODE_URL}${encodeURIComponent(v)}?format=json`,
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) throw new VpicError(`vPIC answered HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    if (err instanceof VpicError) throw err;
    throw new VpicError(
      err?.name === "AbortError" ? "vPIC timed out" : "vPIC unreachable",
    );
  } finally {
    clearTimeout(timer);
  }

  const row = Array.isArray(data?.Results) ? data.Results[0] : null;
  if (!row || typeof row !== "object") {
    throw new VpicError("vPIC answered without a result");
  }
  const out = {
    year: /^\d{4}$/.test(text(row.ModelYear)) ? text(row.ModelYear) : "",
    make: tidyMake(row.Make),
    model: text(row.Model),
    series: text(row.Series),
    trim: text(row.Trim),
    drive: tidyDrive(row.DriveType),
    body: tidyBody(row.BodyClass),
  };
  if (!out.year || !out.make || !out.model) return null;
  return out;
}
