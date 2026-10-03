// GET /api/geo: the visitor's approximate location, from the IP-geolocation
// headers Vercel adds to the request (api/_lib/geo.js). /local-delivery calls
// it once on load to answer "Is my ZIP in a zone?" without asking first.
//
// Private and uncached: the answer is about this one visitor, so no shared
// cache may keep it. Nothing is logged or stored, and the IP itself is never
// read here.

import { methodNotAllowed, send } from "./_lib/http.js";
import { parseGeoHeaders } from "./_lib/geo.js";

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return methodNotAllowed(res, "GET");
  }
  return send(res, 200, parseGeoHeaders(req.headers), {
    "Cache-Control": "private, no-store",
  });
}
