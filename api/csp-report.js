// POST /api/csp-report — where browsers send Content-Security-Policy
// violation reports (the report-uri in vercel.json's
// Content-Security-Policy-Report-Only header).
//
// Logs a one-line summary per report (directive, blocked host, page path;
// api/_lib/cspReport.js) and stores nothing. Always answers 204 for a
// readable report so a browser never retries. Brakes per warm instance:
// 30 reports per client IP per minute, and at most 300 logged lines per
// 10 minutes in total, so a flood cannot fill the log.

import { HttpError, methodNotAllowed, readJsonBody, send } from "./_lib/http.js";
import { clientIp, createRateLimiter } from "./_lib/ratelimit.js";
import { formatSummary, summarizeReports } from "./_lib/cspReport.js";

const NO_STORE = { "Cache-Control": "no-store" };

/** The handler, with the clock and logger injectable for tests. */
export function createCspReportHandler({ now = Date.now, log = console.warn } = {}) {
  const perIp = createRateLimiter({ limit: 30, windowMs: 60_000 });
  const total = createRateLimiter({ limit: 300, windowMs: 600_000 });

  return async function handler(req, res) {
    if (req.method !== "POST") return methodNotAllowed(res, "POST");

    let payload;
    try {
      payload = await readJsonBody(req, { maxBytes: 16 * 1024 });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 400;
      return send(res, status, { error: "Not a CSP report." }, NO_STORE);
    }

    const at = now();
    if (perIp.hit(clientIp(req), at)) {
      return send(res, 429, { error: "Too many reports." }, { ...NO_STORE, "Retry-After": "60" });
    }

    for (const summary of summarizeReports(payload)) {
      if (total.hit("all", at)) break;
      log(formatSummary(summary));
    }
    res.statusCode = 204;
    res.setHeader("Cache-Control", "no-store");
    res.end();
  };
}

export default createCspReportHandler();
