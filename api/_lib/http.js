// Small request/response helpers.
//
// They use only what plain Node's http objects have (statusCode, setHeader,
// end), so the handlers run the same under Vercel, `vercel dev`, and the
// mock req/res objects the tests use.

import { Buffer } from "node:buffer";

/** An error that maps directly onto an HTTP response. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  send(
    res,
    405,
    { error: `Use ${allowed}.` },
    { Allow: allowed, "Cache-Control": "no-store" },
  );
}

/** Query parameters as plain strings (first value wins when repeated). */
export function getQuery(req) {
  let source = req.query;
  if (!source || typeof source !== "object") {
    const url = new URL(req.url ?? "/", "http://localhost");
    source = Object.fromEntries(url.searchParams);
  }
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

const MAX_BODY_BYTES = 32 * 1024;
const TOO_LARGE = "Request body is too large.";

/**
 * The JSON body, at most `maxBytes` (default 32 KB; the write endpoints pass
 * their own, smaller caps from api/_lib/spam.js). Vercel pre-parses JSON into
 * `req.body` (and its getter throws on malformed JSON), accepting bodies up
 * to its own 4.5 MB limit, so the cap is checked on the declared
 * Content-Length first and on the parsed body too; anything else is read
 * from the stream here, stopping as soon as it passes the cap.
 */
export async function readJsonBody(req, { maxBytes = MAX_BODY_BYTES } = {}) {
  const declared = Number(req?.headers?.["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, TOO_LARGE);
  }

  let body;
  try {
    body = req.body;
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }

  if (body !== undefined && body !== null && typeof body === "object" && !Buffer.isBuffer(body)) {
    let size;
    try {
      size = Buffer.byteLength(JSON.stringify(body));
    } catch {
      throw new HttpError(400, "Request body is not valid JSON.");
    }
    if (size > maxBytes) throw new HttpError(413, TOO_LARGE);
    return body;
  }

  let text;
  if (typeof body === "string" || Buffer.isBuffer(body)) {
    text = String(body);
  } else if (req && typeof req[Symbol.asyncIterator] === "function") {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) {
        throw new HttpError(413, TOO_LARGE);
      }
      chunks.push(Buffer.from(chunk));
    }
    text = Buffer.concat(chunks).toString("utf8");
  } else {
    text = "";
  }

  if (Buffer.byteLength(text) > maxBytes) {
    throw new HttpError(413, TOO_LARGE);
  }
  if (!text.trim()) throw new HttpError(400, "Request body is empty.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }
}
