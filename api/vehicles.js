// GET /api/vehicles?kind=makes[&year=2019]
//   { kind: "makes", year, makes: ["Acura", ...], source: "curated" }
//
// GET /api/vehicles?kind=models&make=BMW&year=2019
//   { kind: "models", make, year, models: ["2 Series", "3 Series", ...],
//     source: "nhtsa", partial?: true }
//   502 { error, upstream: true } when NHTSA vPIC did not answer.
//
// The vehicle finders' Year / Make / Model lists (src/data/vehicles.js).
// Models are NHTSA vPIC's (passenger cars, trucks, SUVs and vans) merged
// with the size table's own spelling, fetched here with a timeout and cached
// at Vercel's edge for a day (then served stale for a week while it
// refreshes), so one lookup serves every shopper. Errors are never cached.
// Logic and tests: api/_lib/vehicles.js.

import { getQuery, methodNotAllowed, send } from "./_lib/http.js";
import { vehiclesAnswer } from "./_lib/vehicles.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return methodNotAllowed(res, "GET");
  }
  try {
    const { status, body, cache } = await vehiclesAnswer(getQuery(req));
    if (status === 502) console.error("[vehicles]", body.error);
    return send(res, status, body, { "Cache-Control": cache });
  } catch (err) {
    console.error("[vehicles] unexpected error", err);
    return send(
      res,
      500,
      { error: "Vehicle lookup failed." },
      { "Cache-Control": "no-store" },
    );
  }
}
