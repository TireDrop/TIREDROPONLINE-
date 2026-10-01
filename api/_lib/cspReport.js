// Content-Security-Policy violation reports (POST /api/csp-report).
//
// The browser sends one when a page breaks the Content-Security-Policy-
// Report-Only header in vercel.json. Each report is boiled down to a
// one-line summary for the function log: which directive, which host was
// blocked, on which page path. Nothing else is kept. URLs lose their query
// string and fragment (a /track link can carry an order number and email),
// and a blocked full URL is cut to its origin. No IP, user agent or cookie
// is logged. docs/ops/deploy.md says how to read the log and when to
// switch the policy from report-only to enforced.

/** "https://host/path?q" → "https://host"; "inline", "eval" etc. kept. */
function originOf(value) {
  if (typeof value !== "string" || !value) return "";
  const text = value.trim().slice(0, 300);
  if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) return text.slice(0, 40); // inline, eval, self
  try {
    const url = new URL(text);
    return url.origin !== "null" ? url.origin : `${url.protocol}`;
  } catch {
    return "";
  }
}

/** "https://tiredroponline.com/track?order=1&email=x" → "/track". */
function pathOf(value) {
  if (typeof value !== "string" || !value) return "";
  try {
    return new URL(value).pathname.slice(0, 120);
  } catch {
    return "";
  }
}

const clip = (v, n = 60) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** One report body (either format) → a summary, or null when unusable. */
function summarizeOne(r) {
  if (!r || typeof r !== "object") return null;
  // Legacy report-uri format uses dashed keys; the Reporting API camelCase.
  const directive = clip(
    r["effective-directive"] ?? r.effectiveDirective ?? r["violated-directive"] ?? r.violatedDirective,
  ).split(" ")[0];
  if (!directive) return null;
  return {
    directive,
    blocked: originOf(r["blocked-uri"] ?? r.blockedURL ?? r.blockedUri),
    page: pathOf(r["document-uri"] ?? r.documentURL ?? r.documentUri),
    source: originOf(r["source-file"] ?? r.sourceFile),
    disposition: clip(r.disposition, 10) || "report",
  };
}

/**
 * The summaries in a request body: `{ "csp-report": {...} }` from
 * report-uri, or `[{ type: "csp-violation", body: {...} }]` from the
 * Reporting API. At most 10 per request.
 */
export function summarizeReports(payload) {
  let bodies = [];
  if (Array.isArray(payload)) {
    bodies = payload.filter((r) => r?.type === "csp-violation").map((r) => r.body);
  } else if (payload && typeof payload === "object" && payload["csp-report"]) {
    bodies = [payload["csp-report"]];
  }
  return bodies.slice(0, 10).map(summarizeOne).filter(Boolean);
}

/** The log line for one summary. */
export const formatSummary = (s) =>
  `[csp] ${s.disposition} ${s.directive} blocked=${s.blocked || "-"} page=${s.page || "-"} source=${s.source || "-"}`;
