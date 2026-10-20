// When /track's My Orders asks the server again.
//
// Every status check is one POST /api/track, and that endpoint allows ten
// lookups per client per ten minutes (api/_lib/track.js). So the refresh is
// deliberately modest: one order at a time (the one on screen), every 5
// minutes while the page is visible, pausing when it is hidden, backing off
// after trouble, giving way to a rate limit, and stopping after 30 minutes
// of watching (a tap on Refresh starts a new 30 minutes).

export const AUTO_REFRESH_MS = 5 * 60 * 1000;
export const AUTO_REFRESH_STOP_MS = 30 * 60 * 1000;
export const MAX_BACKOFF_MS = 10 * 60 * 1000;
export const RATE_LIMIT_PAUSE_MS = 10 * 60 * 1000; // the server's Retry-After

/** Milliseconds until the next automatic check, after `failures` in a row. */
export function nextDelay({ failures = 0, rateLimited = false } = {}) {
  if (rateLimited) return RATE_LIMIT_PAUSE_MS;
  if (failures <= 0) return AUTO_REFRESH_MS;
  return Math.min(AUTO_REFRESH_MS * 2 ** failures, MAX_BACKOFF_MS);
}

/** True once the watching window (started at `since`) has run out. */
export function watchExpired(since, now) {
  return now - since >= AUTO_REFRESH_STOP_MS;
}

/**
 * Whether a refresh is due when the page becomes visible again: only when
 * the last check is older than one interval (so flipping tabs never hammers).
 */
export function dueOnReturn(lastCheckedAt, now) {
  return !lastCheckedAt || now - lastCheckedAt >= AUTO_REFRESH_MS;
}
