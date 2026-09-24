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

/**
 * The JSON body. Vercel pre-parses JSON into `req.body` (and its getter
 * throws on malformed JSON); anything else is read from the stream here.
 */
export async function readJsonBody(req) {
  let body;
  try {
    body = req.body;
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }

  if (body !== undefined && body !== null && typeof body === "object" && !Buffer.isBuffer(body)) {
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
      if (size > MAX_BODY_BYTES) {
        throw new HttpError(413, "Request body is too large.");
      }
      chunks.push(Buffer.from(chunk));
    }
    text = Buffer.concat(chunks).toString("utf8");
  } else {
    text = "";
  }

  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError(413, "Request body is too large.");
  }
  if (!text.trim()) throw new HttpError(400, "Request body is empty.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }
}
