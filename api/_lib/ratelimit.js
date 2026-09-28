// Per-client-IP rate limiting for the public POST endpoints (newsletter,
// forms).
//
// Per warm function instance: instances are not shared, so this is a brake on
// one noisy client rather than a hard global quota. With the honeypot it keeps
// casual bots from turning an endpoint into a customer-creation loop.

/** The caller's IP as Vercel reports it, or "unknown". */
export function clientIp(req) {
  const h = req?.headers ?? {};
  const forwarded = String(h["x-forwarded-for"] ?? "").split(",")[0].trim();
  return forwarded || String(h["x-real-ip"] ?? "").trim() || req?.socket?.remoteAddress || "unknown";
}

/**
 * A limiter allowing `limit` attempts per IP in `windowMs`. `hit(ip, now)`
 * records one attempt and answers true when the caller is over the limit;
 * `reset()` is a test hook. Each limiter keeps its own counts.
 */
export function createRateLimiter({ limit, windowMs }) {
  const hits = new Map();
  return {
    limit,
    windowMs,
    hit(ip, now = Date.now()) {
      const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
      recent.push(now);
      hits.set(ip, recent);
      if (hits.size > 5000) {
        // Drop idle entries so a flood of distinct IPs cannot grow this forever.
        for (const [key, times] of hits) {
          if (!times.some((t) => now - t < windowMs)) hits.delete(key);
        }
      }
      return recent.length > limit;
    },
    reset() {
      hits.clear();
    },
  };
}
