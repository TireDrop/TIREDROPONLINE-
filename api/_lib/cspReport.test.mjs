// POST /api/csp-report, and the security headers in vercel.json that point
// at it. Run with: npm run test:api

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { createCspReportHandler } from "../csp-report.js";
import { summarizeReports } from "./cspReport.js";
import { GOOGLE_TRANSLATE_CSP } from "../../src/lib/translate.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function mockRes() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: undefined,
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    end(text) { this.body = text === undefined ? undefined : JSON.parse(text); },
  };
}

async function post(handler, body, ip = "203.0.113.9", method = "POST") {
  const res = mockRes();
  await handler({ method, headers: { "x-forwarded-for": ip }, body }, res);
  return res;
}

const LEGACY = {
  "csp-report": {
    "document-uri": "https://tiredroponline.com/track?order=1001&email=jo%40example.com#x",
    "violated-directive": "script-src-elem",
    "effective-directive": "script-src-elem",
    "blocked-uri": "https://evil.example/x.js?token=abc",
    "source-file": "https://tiredroponline.com/assets/index.js",
    disposition: "report",
    "original-policy": "default-src 'self'",
    referrer: "https://www.google.com/search?q=jo",
  },
};

test("a report is cut to directive, blocked origin and page path", () => {
  assert.deepEqual(summarizeReports(LEGACY), [
    {
      directive: "script-src-elem",
      blocked: "https://evil.example",
      page: "/track",
      source: "https://tiredroponline.com",
      disposition: "report",
    },
  ]);
});

test("Reporting API batches are read too; other report types ignored", () => {
  const out = summarizeReports([
    {
      type: "csp-violation",
      body: {
        documentURL: "https://tiredroponline.com/cart?x=1",
        effectiveDirective: "style-src-attr",
        blockedURL: "inline",
        disposition: "report",
      },
    },
    { type: "deprecation", body: { id: "x" } },
  ]);
  assert.deepEqual(out, [
    { directive: "style-src-attr", blocked: "inline", page: "/cart", source: "", disposition: "report" },
  ]);
  assert.deepEqual(summarizeReports({ nope: 1 }), []);
  assert.deepEqual(summarizeReports(null), []);
});

test("the handler logs one line with no query string, IP or email, and answers 204", async () => {
  const lines = [];
  const handler = createCspReportHandler({ log: (l) => lines.push(l) });
  const res = await post(handler, LEGACY);
  assert.equal(res.statusCode, 204);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^\[csp\] report script-src-elem blocked=https:\/\/evil\.example page=\/track/);
  assert.doesNotMatch(lines[0], /example\.com|order|token|203\.0\.113|google/);
});

test("only POST; junk bodies get 400", async () => {
  const handler = createCspReportHandler({ log: () => {} });
  assert.equal((await post(handler, undefined, "1.1.1.1", "GET")).statusCode, 405);
  assert.equal((await post(handler, "not json")).statusCode, 400);
});

test("rate limits per IP and caps the total log volume", async () => {
  let t = 0;
  const lines = [];
  const handler = createCspReportHandler({ now: () => t, log: (l) => lines.push(l) });
  for (let i = 0; i < 30; i++) assert.equal((await post(handler, LEGACY)).statusCode, 204);
  assert.equal((await post(handler, LEGACY)).statusCode, 429);
  assert.equal(lines.length, 30);
  // Many IPs: the log stops at 300 lines per 10 minutes.
  for (let i = 0; i < 400; i++) await post(handler, LEGACY, `198.51.100.${i % 250}-${i}`);
  assert.equal(lines.length, 300);
  t += 600_001;
  await post(handler, LEGACY, "192.0.2.1");
  assert.equal(lines.length, 301);
});

/* ------------------------- vercel.json headers ------------------------- */

const vercel = JSON.parse(read("../../vercel.json"));
const all = vercel.headers.find((h) => h.source === "/(.*)" && !h.has);
const header = (key) => all.headers.find((h) => h.key === key)?.value;

test("every route gets the security headers", () => {
  assert.equal(header("X-Content-Type-Options"), "nosniff");
  assert.equal(header("X-Frame-Options"), "SAMEORIGIN");
  assert.equal(header("Referrer-Policy"), "strict-origin-when-cross-origin");
  // No preload: that is Justin's call (docs/ops/deploy.md).
  assert.equal(header("Strict-Transport-Security"), "max-age=63072000; includeSubDomains");
  for (const f of ["camera", "microphone", "payment", "usb"]) {
    assert.match(header("Permissions-Policy"), new RegExp(`\\b${f}=\\(\\)`));
  }
  // Our own pages may ask for location (/local-delivery); =() blocked it everywhere.
  assert.match(header("Permissions-Policy"), /\bgeolocation=\(self\)/);
});

test("the CSP allows every host Google Translate's element loads from (src/lib/translate.js)", () => {
  const csp = header("Content-Security-Policy-Report-Only");
  for (const [directive, hosts] of Object.entries(GOOGLE_TRANSLATE_CSP)) {
    const sources = csp.match(new RegExp(`(?:^|; )${directive} ([^;]*)`))?.[1]?.split(/\s+/) ?? [];
    for (const host of hosts) {
      assert.ok(sources.includes(`https://${host}`), `${directive} is missing https://${host}`);
    }
  }
  assert.match(csp, /img-src [^;]*\bhttps:(?:\s|;)/, "img-src allows https: (Translate's icons)");
});

test("the Tire Size Finder talks to our own API only (photo read and VIN decode are server-side)", () => {
  const csp = header("Content-Security-Policy-Report-Only");
  const connect = csp.match(/(?:^|; )connect-src ([^;]*)/)[1].split(/\s+/);
  assert.ok(connect.includes("'self'"), "connect-src 'self' covers POST /api/scan-tire-size");
  assert.ok(!connect.some((s) => /anthropic/i.test(s)), "the browser never calls Anthropic");
  // vPIC stays: the vehicle pickers load model lists from the browser
  // (src/data/vehicles.js). The VIN decode itself runs on the server.
  assert.ok(connect.includes("https://vpic.nhtsa.dot.gov"));
  // The photo preview is a blob: URL.
  assert.match(csp, /img-src [^;]*\bblob:/);
  // <input type="file" capture> opens the phone's own camera app; it never
  // uses the Camera API, so camera=() stays off.
  assert.match(header("Permissions-Policy"), /\bcamera=\(\)/);
  const scan = vercel.headers.find((h) => h.source === "/api/scan-tire-size");
  assert.equal(scan?.headers.find((h) => h.key === "Cache-Control")?.value, "no-store");
  assert.ok(vercel.functions["api/scan-tire-size.js"].maxDuration >= 45);
});

test("the CSP is report-only and allows the inline gtag snippet by hash", () => {
  assert.equal(header("Content-Security-Policy"), undefined, "not enforced yet");
  const csp = header("Content-Security-Policy-Report-Only");
  assert.ok(csp, "report-only CSP present");
  assert.match(csp, /report-uri \/api\/csp-report/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);
  assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /'unsafe-inline'/);

  // Every executable inline script in the page template must have its hash
  // in script-src (the prerender copies the snippet byte for byte). Edit the
  // snippet in index.html and this fails until vercel.json is updated.
  // As the repo stores it (LF): a Windows checkout with core.autocrlf has
  // CRLF on disk, which hashes differently from what Vercel serves.
  const html = read("../../index.html").replace(/\r\n/g, "\n");
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter(
    ([, attrs]) => !/application\/ld\+json/.test(attrs),
  );
  assert.ok(inline.length >= 1);
  for (const [, , body] of inline) {
    const hash = `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`;
    assert.ok(csp.includes(hash), `script-src is missing ${hash}`);
  }

  // Every external script and stylesheet the template loads is allowed.
  const script = csp.match(/script-src[^;]*/)[0];
  const style = csp.match(/style-src[^;]*/)[0];
  for (const [, url] of html.matchAll(/<script[^>]*\bsrc="(https:[^"]+)"/g)) {
    const host = new URL(url).host;
    assert.ok(
      script.includes(`https://${host}`) || script.includes(`https://*.${host.split(".").slice(1).join(".")}`),
      `script-src allows ${host}`,
    );
  }
  for (const [, url] of html.matchAll(/<link[^>]*href="(https:[^"]+)"[^>]*rel="stylesheet"/g)) {
    assert.ok(style.includes(`https://${new URL(url).host}`), `style-src allows ${url}`);
  }
});
