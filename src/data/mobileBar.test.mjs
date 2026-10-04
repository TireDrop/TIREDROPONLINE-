import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_ACTION, mobileBarFor } from "./mobileBar.js";

const action = (path) => mobileBarFor(path)?.action ?? null;

test("product pages get no global bar (their own buy bar is the one)", () => {
  for (const p of [
    "/tires/continental-purecontact-ls-225-50r17",
    "/tires/p/ATD-123",
    "/wheels/some-wheel",
  ]) {
    assert.equal(mobileBarFor(p), null, p);
  }
});

test("/tires goes to the cart (the size is found on the page itself)", () => {
  assert.deepEqual(action("/tires"), {
    to: "/cart",
    label: "Cart",
    icon: "cart",
  });
  assert.equal(action("/tires/").to, "/cart");
  // A tire's own page keeps its buy bar instead.
  assert.equal(mobileBarFor("/tires/some-tire"), null);
});

test("mobile hub, city and service pages book the service", () => {
  assert.equal(action("/mobile-service").to, "/schedule?service=tire-installation");
  assert.equal(action("/mobile-service/sunrise").label, "Book install");
  assert.equal(action("/services/tire-installation").label, "Book install");
  assert.deepEqual(action("/services/tire-repair"), {
    to: "/schedule?service=tire-repair",
    label: "Book service",
    icon: "calendar",
  });
  // An unknown service slug is a not-found page: the default bar.
  assert.deepEqual(action("/services/nope"), DEFAULT_ACTION);
});

test("articles shop tires; checkout and track show only Call", () => {
  assert.equal(action("/learn/tire-sizes/how-to-read-a-tire-size").to, "/tires");
  assert.equal(action("/blog/some-post").label, "Shop tires");
  assert.deepEqual(mobileBarFor("/checkout"), { action: null });
  assert.deepEqual(mobileBarFor("/track"), { action: null });
});

test("the cart's bar goes to checkout", () => {
  assert.deepEqual(action("/cart"), { to: "/checkout", label: "Checkout", icon: "cart" });
  assert.deepEqual(action("/cart/"), action("/cart"));
  // Only the cart page itself: checkout still shows only Call.
  assert.deepEqual(mobileBarFor("/checkout"), { action: null });
});

test("everything else keeps the default", () => {
  for (const p of ["/", "/contact", "/learn", "/learn/tire-sizes", "/blog", "/schedule"]) {
    assert.deepEqual(action(p), DEFAULT_ACTION, p);
  }
});

test("Spanish mobile pages book the van, with the bar in Spanish", () => {
  for (const p of ["/es/instalacion-movil", "/es/instalacion-movil/hialeah-fl", "/es/instalacion-movil/"]) {
    const bar = mobileBarFor(p);
    assert.equal(bar.lang, "es", p);
    assert.deepEqual(bar.action, {
      to: "/schedule?service=tire-installation",
      label: "Reservar",
      icon: "calendar",
    });
  }
  assert.equal(mobileBarFor("/mobile-service").lang, undefined);
});
