import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AUTO_REFRESH_MS,
  AUTO_REFRESH_STOP_MS,
  MAX_BACKOFF_MS,
  RATE_LIMIT_PAUSE_MS,
  dueOnReturn,
  nextDelay,
  watchExpired,
} from "./orderRefresh.js";

test("a minute between checks, backing off after errors up to ten minutes", () => {
  assert.equal(AUTO_REFRESH_MS, 60000);
  assert.equal(nextDelay(), 60000);
  assert.deepEqual([1, 2, 3, 4].map((failures) => nextDelay({ failures })), [120000, 240000, 480000, MAX_BACKOFF_MS]);
  assert.equal(nextDelay({ failures: 50 }), MAX_BACKOFF_MS);
});

test("a rate limit waits out the server's ten minutes", () => {
  assert.equal(nextDelay({ failures: 0, rateLimited: true }), RATE_LIMIT_PAUSE_MS);
});

test("watching stops after 30 minutes", () => {
  assert.equal(AUTO_REFRESH_STOP_MS, 30 * 60 * 1000);
  assert.equal(watchExpired(0, AUTO_REFRESH_STOP_MS - 1), false);
  assert.equal(watchExpired(0, AUTO_REFRESH_STOP_MS), true);
});

test("coming back to the tab refreshes only when the last check is a minute old", () => {
  assert.equal(dueOnReturn(0, 5), true);
  assert.equal(dueOnReturn(1000, 30000), false);
  assert.equal(dueOnReturn(1000, 61000), true);
});
