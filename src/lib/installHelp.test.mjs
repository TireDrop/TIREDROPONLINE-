import { test } from "node:test";
import assert from "node:assert/strict";
import { deviceKind, installSteps } from "./installHelp.js";

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
  iphoneInstagram: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
  androidFacebook: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0]",
  winChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  winEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
};

test("devices and browsers", () => {
  assert.deepEqual(pick(deviceKind({ userAgent: UA.iphoneSafari })), ["ios", "safari"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.iphoneChrome })), ["ios", "other"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.iphoneInstagram })), ["ios", "inapp"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.androidChrome })), ["android", "chrome"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.androidFacebook })), ["android", "inapp"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.winChrome })), ["desktop", "chrome"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.winEdge })), ["desktop", "chrome"]);
  assert.deepEqual(pick(deviceKind({ userAgent: UA.macSafari, platform: "MacIntel", maxTouchPoints: 0 })), ["desktop", "other"]);
  // iPadOS reports a Mac user agent with touch points.
  assert.deepEqual(pick(deviceKind({ userAgent: UA.macSafari, platform: "MacIntel", maxTouchPoints: 5 })), ["ios", "safari"]);
  assert.deepEqual(pick(deviceKind(null)), ["desktop", "other"]);
});

test("steps match the device and never promise what a page cannot do", () => {
  const ios = installSteps(deviceKind({ userAgent: UA.iphoneSafari }));
  assert.match(ios.steps[0].text, /Share/);
  assert.match(ios.steps[1].text, /Add to Home Screen/);
  const inapp = installSteps(deviceKind({ userAgent: UA.iphoneInstagram }));
  assert.match(inapp.title, /browser first/i);
  const android = installSteps(deviceKind({ userAgent: UA.androidChrome }));
  assert.match(android.steps[1].text, /Install app/);
  const desk = installSteps(deviceKind({ userAgent: UA.winChrome }));
  assert.match(desk.steps[0].text, /address bar/);
  for (const s of [ios, inapp, android, desk]) for (const step of s.steps) assert.ok(step.text.length > 10);
});

function pick(d) {
  return [d.platform, d.browser];
}
