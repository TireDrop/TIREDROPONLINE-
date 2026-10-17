// The document-level click listener's classification: which links are counted
// and where they are said to sit. No DOM here: a link is a stub with the
// `closest` and `getAttribute` the code uses.
//
//   npm run test:lib

import { test } from "node:test";
import assert from "node:assert/strict";

import { eventForLink, placementFor } from "./clickTracking.js";

/** A link whose ancestors match the given selectors (substring match). */
function link(href, { inside = {}, section = null } = {}) {
  return {
    getAttribute: (name) => (name === "href" ? href : null),
    closest: (selector) => {
      if (selector === "[data-home-section]")
        return section ? { getAttribute: () => section } : null;
      for (const [needle, hit] of Object.entries(inside)) {
        if (hit && selector.includes(needle)) return {};
      }
      return null;
    },
  };
}

test("placement reads the markup around a link", () => {
  assert.equal(placementFor(link("tel:1", { inside: { footer: true } })), "footer");
  assert.equal(placementFor(link("tel:1", { inside: { header: true } })), "header");
  assert.equal(placementFor(link("tel:1", { inside: { "Quick actions": true } })), "mobile_bar");
  assert.equal(placementFor(link("tel:1", { section: "cta" })), "home_cta");
  assert.equal(placementFor(link("tel:1", { inside: { dialog: true } })), "dialog");
  assert.equal(placementFor(link("tel:1")), "page");
  assert.equal(placementFor(null), "page");
});

test("tel: links are phone_click with a placement and nothing else", () => {
  const hit = eventForLink(link("tel:+19547890000", { section: "trust" }), "https://x.test");
  assert.deepEqual(hit, { name: "phone_click", params: { placement: "home_trust" } });
  assert.ok(!JSON.stringify(hit).includes("9547890000"));
  assert.equal(eventForLink(link("TEL:5551234", { inside: { footer: true } }), "https://x.test").params.placement, "footer");
});

test("install links count only inside a home page section", () => {
  const o = "https://x.test";
  assert.deepEqual(eventForLink(link("/install", { section: "install" }), o), {
    name: "install_cta_click",
    params: { placement: "home_install", install_type: "shop" },
  });
  assert.equal(eventForLink(link("/mobile-service/", { section: "hero" }), o).params.install_type, "mobile");
  assert.equal(eventForLink(link("https://x.test/schedule?a=1", { section: "cta" }), o).params.install_type, "schedule");
  assert.equal(eventForLink(link("/install", { inside: { header: true } }), o), null);
  assert.equal(eventForLink(link("/install"), o), null);
  assert.equal(eventForLink(link("https://other.test/install", { section: "cta" }), o), null);
  assert.equal(eventForLink(link("/tires", { section: "shop" }), o), null);
  assert.equal(eventForLink(link("/installation-guide", { section: "shop" }), o), null);
  assert.equal(eventForLink(link(null), o), null);
});
