// GET /api/tires?size=225/45R17
// GET /api/tires?year=2020&make=Toyota&model=Camry
//   optional: &brand=Continental &limit=24
//   Returns { source: "atd" | "sample", query, items }.
//
// GET /api/tires?sku=<sku>
//   One tire, for its product page. Returns { source, item }, or 404
//   { error } when the catalog in play does not carry that sku.
//
// In sample mode the items come from src/data/products.js; in live mode from
// ATD. A half-configured ATD is a 503, never a quiet fallback to sample
// prices, and an unconfirmed ATD endpoint is a 501.

import { getConfig } from "./_lib/config.js";
import { getQuery, methodNotAllowed, send } from "./_lib/http.js";
import { validateTiresQuery } from "./_lib/validate.js";
import { getTireBySku, searchTires } from "./_lib/catalog.js";
import { AtdError } from "./_lib/atd.js";

const NO_STORE = { "Cache-Control": "no-store" };

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return methodNotAllowed(res, "GET");
  }

  const checked = validateTiresQuery(getQuery(req));
  if (!checked.ok) return send(res, 400, { error: checked.error }, NO_STORE);

  const config = getConfig();
  if (!config.atd.ok) {
    console.error("[tires] ATD misconfigured:", config.atd.issues.join(" "));
    return send(
      res,
      503,
      { error: `Tire search is misconfigured. ${config.atd.issues.join(" ")}` },
      NO_STORE,
    );
  }

  // Short CDN cache; ATD results are also cached per instance for 5 min.
  const CACHED = {
    "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=240",
  };

  try {
    if (checked.value.type === "sku") {
      const result = await getTireBySku(checked.value.sku, config);
      if (!result.item) {
        return send(
          res,
          404,
          { error: "We couldn't find that tire. Search by size or vehicle to see what's available." },
          NO_STORE,
        );
      }
      return send(res, 200, result, CACHED);
    }
    const result = await searchTires(checked.value, config);
    return send(res, 200, result, CACHED);
  } catch (err) {
    if (err instanceof AtdError) {
      console.error("[tires]", err.message);
      return send(
        res,
        err.status,
        { error: `Tire data from the distributor is unavailable right now. ${err.message}` },
        NO_STORE,
      );
    }
    console.error("[tires] unexpected error", err);
    return send(res, 500, { error: "Tire search failed." }, NO_STORE);
  }
}
