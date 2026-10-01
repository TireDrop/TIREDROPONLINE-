// POST /api/scan-tire-size: the Tire Size Finder (/tire-size-finder).
//
// Two kinds of request, one endpoint:
//
//   Photo   { mode: "auto" | "door" | "sidewall" | "vin", image }
//           image: a JPEG, PNG or WebP photo as base64 or a data URL (at most
//           3 MB decoded). Claude reads it (api/_lib/scanTireSize.js); a VIN
//           read off the photo is then decoded by NHTSA vPIC. Needs
//           ANTHROPIC_API_KEY; without it: 503 { error: "scanner_not_configured" }.
//           "auto" (one camera; what the page uses): the photo may be any of
//           the three, Claude says which, and the answer is that mode's
//           answer with `mode` set to the detected "door" | "sidewall" |
//           "vin" plus `requested: "auto"`. The specific modes are kept for
//           compatibility.
//   Typed   { mode: "vin", vin }
//           A VIN typed by hand, decoded by NHTSA vPIC (api/_lib/vpic.js).
//           Needs no key, so it works while photo scans are off.
//
// Guards: a per-IP rate limit (5 photo scans in 10 minutes; 20 typed VIN
// lookups), the body cap from api/_lib/spam.js, the image type read from its
// own bytes (JPEG/PNG/WebP only), and `mode` checked against the list.
// There is no honeypot or fill-time token: nothing here is stored or sent on
// to a person, and the rate limit is what keeps a script from running up the
// Claude bill (Justin also sets a monthly spend limit in the Anthropic
// Console; see docs/integrations/tire-size-finder.md).
//
// Privacy: the photo and the VIN are used for this one answer and never
// stored. The log line is "[scan] mode=… outcome=… confidence=… ms=…" and
// nothing more (no image, VIN, size or IP). An auto photo logs
// mode=auto:door / auto:sidewall / auto:vin, or mode=auto when it was none.
//
// Responses (JSON, never cached):
//   200 photo read    { ok, mode, status: "read", confidence, image_type, ... }
//                     (auto: mode is the detected one, plus requested: "auto")
//         door      front {size, load_index, speed_rating}, rear | null
//                   (staggered only), spare | null, pressure_front_psi,
//                   pressure_rear_psi (the pressures printed on the sticker)
//         sidewall  tire {size, load_index, speed_rating, dot_week_year}
//         vin       vin, vehicle {year, make, model, series, trim, drive,
//                   body} | null, decode: "ok" | "not_found" | "unavailable"
//   200 not read      { ok, mode, status: "unreadable", reason, confidence,
//                       image_type }  (reason: blurry, glare, too_dark,
//                       cut_off, wrong_image, no_size_visible,
//                       low_confidence, invalid_size, invalid_vin, refused,
//                       no_result). Auto: mode is the detected one, plus
//                       requested: "auto"; a photo that is none of the three
//                       is { ok, mode: "auto", requested: "auto",
//                       status: "unreadable", reason: "wrong_image", ... }
//   200 typed VIN     { ok, mode: "vin", source: "typed", vin, vehicle | null,
//                       decode }
//   400 { error: "bad_mode" | "missing_image" | "bad_image" | "bad_body" }
//   400 { error: "invalid_vin", problem }  typed VIN that fails the check digit
//   405, 413 { error: "image_too_large" | ... }, 415 { error: "unsupported_image" }
//   429 { error: "rate_limited" }
//   502 { error: "scanner_unavailable" }   Claude could not be reached, or
//                                          refused the key (401/403)
//   503 { error: "scanner_busy" }          Anthropic said 429 (rate or monthly
//                                          spend limit) or 529 (overloaded)
//
// Upstream failures log "[scan] mode=… outcome=upstream_error status=… hint=…"
// (hint: key_rejected, key_forbidden, rate_or_spend_limit, overloaded,
// anthropic_error, request_error, network) and never the key or the message.
//   503 { error: "scanner_not_configured" }

import Anthropic from "@anthropic-ai/sdk";

import { getConfig } from "./_lib/config.js";
import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { clientIp, createRateLimiter } from "./_lib/ratelimit.js";
import { BODY_LIMITS, logRateLimited } from "./_lib/spam.js";
import {
  BUSY_STATUSES,
  MODES,
  ScanInputError,
  defaultAnthropic,
  readImage,
  readPhoto,
  upstreamHint,
} from "./_lib/scanTireSize.js";
import { VpicError, decodeVin } from "./_lib/vpic.js";
import { normalizeVin, vinProblem } from "../src/data/vin.js";

const NO_STORE = { "Cache-Control": "no-store" };
const TEN_MINUTES = 10 * 60 * 1000;

const photoLimiter = createRateLimiter({ limit: 5, windowMs: TEN_MINUTES });
const vinLimiter = createRateLimiter({ limit: 20, windowMs: TEN_MINUTES });

/** Test hook: forget every client's attempts. */
export function resetScanRateLimit() {
  photoLimiter.reset();
  vinLimiter.reset();
}

/** The one log line, with nothing personal in it. */
function logScan(log, { mode, outcome, confidence = null, ms }) {
  log.info(
    `[scan] mode=${mode} outcome=${outcome} confidence=${confidence ?? "-"} ms=${Math.round(ms)}`,
  );
}

/** vPIC's answer for a checked VIN: `{ vehicle, decode }`. */
async function lookUp(vin, fetchImpl) {
  try {
    const vehicle = await decodeVin(vin, { fetchImpl });
    return { vehicle, decode: vehicle ? "ok" : "not_found" };
  } catch (err) {
    if (err instanceof VpicError) return { vehicle: null, decode: "unavailable" };
    throw err;
  }
}

/**
 * The handler. `anthropic(apiKey)` returns the SDK client (the tests pass a
 * fake with beta.messages.parse); `fetchImpl` is used for vPIC.
 */
export function createScanTireSizeHandler({
  env,
  anthropic = defaultAnthropic,
  fetchImpl = (...args) => globalThis.fetch(...args),
  now = () => performance.now(),
  log = console,
} = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");
    const started = now();
    const ip = clientIp(req);

    let body;
    try {
      body = await readJsonBody(req, { maxBytes: BODY_LIMITS["scan-tire-size"] });
    } catch (err) {
      if (err instanceof HttpError) {
        return send(
          res,
          err.status,
          { error: err.status === 413 ? "image_too_large" : "bad_body" },
          NO_STORE,
        );
      }
      throw err;
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return send(res, 400, { error: "bad_body" }, NO_STORE);
    }

    const mode = typeof body.mode === "string" ? body.mode : "";
    if (!MODES.includes(mode)) return send(res, 400, { error: "bad_mode" }, NO_STORE);

    // ---- A VIN typed by hand: vPIC only, no key needed ---------------------
    if (mode === "vin" && body.image == null && typeof body.vin === "string") {
      if (vinLimiter.hit(ip)) {
        logRateLimited("scan-tire-size");
        return send(res, 429, { error: "rate_limited" }, { ...NO_STORE, "Retry-After": "600" });
      }
      const problem = vinProblem(body.vin);
      if (problem) {
        logScan(log, { mode: "vin-typed", outcome: "invalid_vin", ms: now() - started });
        return send(res, 400, { error: "invalid_vin", problem }, NO_STORE);
      }
      const vin = normalizeVin(body.vin);
      const { vehicle, decode } = await lookUp(vin, fetchImpl);
      logScan(log, { mode: "vin-typed", outcome: decode, ms: now() - started });
      return send(
        res,
        200,
        { ok: true, mode: "vin", source: "typed", vin, vehicle, decode },
        NO_STORE,
      );
    }

    // ---- A photo ------------------------------------------------------------
    const config = getConfig(env ?? process.env);
    if (config.scanner.mode !== "on") {
      return send(res, 503, { error: "scanner_not_configured" }, NO_STORE);
    }
    if (photoLimiter.hit(ip)) {
      logRateLimited("scan-tire-size");
      return send(res, 429, { error: "rate_limited" }, { ...NO_STORE, "Retry-After": "600" });
    }

    let image;
    try {
      image = readImage(body.image);
    } catch (err) {
      if (err instanceof ScanInputError) {
        return send(res, err.status, { error: err.code }, NO_STORE);
      }
      throw err;
    }

    let result;
    try {
      result = await readPhoto(anthropic(config.scanner.apiKey), mode, image);
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        // Status and hint only: an SDK error message can quote the request.
        log.error(
          `[scan] mode=${mode} outcome=upstream_error status=${err.status ?? "-"} hint=${upstreamHint(err.status)}`,
        );
        if (BUSY_STATUSES.includes(err.status)) {
          return send(res, 503, { error: "scanner_busy" }, { ...NO_STORE, "Retry-After": "60" });
        }
        return send(res, 502, { error: "scanner_unavailable" }, NO_STORE);
      }
      log.error(`[scan] mode=${mode} outcome=error`);
      return send(res, 500, { error: "scanner_unavailable" }, NO_STORE);
    }

    // Keyed off the answer's mode, so an auto photo that turned out to be a
    // VIN is decoded too.
    if (result.status === "read" && result.mode === "vin") {
      Object.assign(result, await lookUp(result.vin, fetchImpl));
    }
    logScan(log, {
      // auto:door / auto:sidewall / auto:vin, or plain auto when not detected.
      mode: mode === "auto" && result.mode !== "auto" ? `auto:${result.mode}` : mode,
      outcome: result.status === "read" ? "read" : result.reason,
      confidence: result.confidence,
      ms: now() - started,
    });
    return send(res, 200, result, NO_STORE);
  };
}

export default createScanTireSizeHandler();
