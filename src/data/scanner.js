/**
 * The Tire Size Finder's client side (/tire-size-finder): shrinking a phone
 * photo before it is sent, and the two calls to POST /api/scan-tire-size
 * (a photo, or a VIN typed by hand). The server does the reading and the
 * checking (api/scan-tire-size.js); this file only carries the answer back.
 *
 * Whether photo scans are on comes from /api/status (`scanner: "on"`); with
 * no API at all (vite dev, a static preview) it is off, the photo buttons say
 * "Photo scan coming soon", and typing a size still works.
 *
 * Nothing here stores the photo or the VIN. The photo is drawn onto a canvas
 * in memory, sent once, and dropped.
 */

import { getStatus } from "./api.js";
import { makesFor } from "./vehicles.js";

const BASE = String(import.meta.env?.VITE_API_BASE || "/api").replace(
  /\/+$/,
  "",
);

/** The long edge a photo is shrunk to, and its JPEG quality. */
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.85;

/**
 * The longest photo data URL sent: about 3 MB of JPEG, the server's own cap
 * (MAX_IMAGE_BYTES in api/_lib/scanTireSize.js) and under Vercel's 4.5 MB
 * request limit. A 1600 px JPEG is far below it; this only stops an odd
 * device's huge canvas from going up the wire just to be refused.
 */
export const MAX_UPLOAD_CHARS = Math.ceil((3 * 1024 * 1024 * 4) / 3);

// A photo read takes a few seconds; a typed VIN is one vPIC call.
const TIMEOUT_MS = { photo: 45000, vin: 15000 };

/** True when /api/status says photo scans are on. */
export async function scannerOn() {
  const status = await getStatus();
  return status?.scanner === "on";
}

/* ------------------------------------------------------------------ *
 * The photo
 * ------------------------------------------------------------------ */

/** The photo could not be opened on this device (an unsupported format). */
export class PhotoError extends Error {
  constructor(message = "unreadable_photo") {
    super(message);
    this.name = "PhotoError";
  }
}

async function decode(file) {
  // createImageBitmap applies the camera's rotation (EXIF) where it can.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img>, which also decodes HEIC on Safari */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new PhotoError();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * The photo as a JPEG data URL, at most MAX_EDGE pixels on its long edge.
 * Drawing it onto a canvas also turns an iPhone HEIC photo into a JPEG.
 */
export async function shrinkPhoto(file, { maxEdge = MAX_EDGE, quality = JPEG_QUALITY } = {}) {
  if (!file) throw new PhotoError("no_photo");
  const source = await decode(file);
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  if (!w || !h) throw new PhotoError();
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError();
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (!dataUrl.startsWith("data:image/jpeg")) throw new PhotoError();
  return dataUrl;
}

/* ------------------------------------------------------------------ *
 * The calls
 * ------------------------------------------------------------------ */

/**
 * One POST to /api/scan-tire-size. Resolves
 *   { ok: true, data }                      the server's answer
 *   { ok: false, error, status, problem? }  error: "scanner_not_configured",
 *                                           "rate_limited", "image_too_large",
 *                                           "unsupported_image", "invalid_vin",
 *                                           "scanner_unavailable", "unreachable"…
 * Never rejects.
 */
async function post(body, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${BASE}/scan-tire-size`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: "same-origin",
    });
    let data = null;
    if (/json/i.test(res.headers.get("content-type") || "")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }
    if (res.ok && data && typeof data === "object") return { ok: true, data };
    // Vercel answers an oversized body itself, with a page that is not JSON.
    const error =
      data && typeof data.error === "string"
        ? data.error
        : res.status === 413
          ? "image_too_large"
          : "unreachable";
    return {
      ok: false,
      error,
      status: res.status,
      ...(data?.problem ? { problem: data.problem } : null),
    };
  } catch {
    return { ok: false, error: "unreachable", status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

/** Sends one photo (a data URL from shrinkPhoto) to be read. */
export const scanPhoto = (mode, image) =>
  String(image ?? "").length > MAX_UPLOAD_CHARS
    ? Promise.resolve({ ok: false, error: "image_too_large", status: 0 })
    : post({ mode, image }, TIMEOUT_MS.photo);

/** Decodes a VIN typed by hand (no photo, works with scans off). */
export const lookUpVin = (vin) => post({ mode: "vin", vin }, TIMEOUT_MS.vin);

/* ------------------------------------------------------------------ *
 * A decoded vehicle, in the site's own terms
 * ------------------------------------------------------------------ */

/** vPIC's make ("Mercedes-Benz", "Bmw") as the site's make list spells it. */
export function siteMake(make) {
  const m = String(make ?? "").trim();
  const lower = m.toLowerCase();
  return makesFor("").find((x) => x.toLowerCase() === lower) ?? m;
}

/**
 * `{ year, make, model }` for the vehicle store, plus `label` ("2021 BMW
 * M340i xDrive") and `details` ("AWD · Sedan") to show. null for nothing.
 */
export function vehicleFromDecode(v) {
  if (!v || !v.year || !v.make || !v.model) return null;
  const make = siteMake(v.make);
  const extra = [v.series, v.trim]
    .map((s) => String(s ?? "").trim())
    .filter((s, i, all) => s && all.indexOf(s) === i && !v.model.includes(s));
  return {
    year: String(v.year),
    make,
    model: String(v.model),
    label: [v.year, make, v.model, ...extra].join(" "),
    details: [v.drive, v.body].filter(Boolean).join(" · "),
  };
}
