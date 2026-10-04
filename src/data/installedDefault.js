// Should the installed price ("out the door") start ON for visitors inside
// the install area? One switch, one place. Justin's call; it ships OFF.
//
//   false  Everyone starts with the bare tire price and turns the toggle on
//          themselves. This is production today.
//   true   A visitor who has NOT made a choice starts with the toggle on, but
//          only when the site knows they are in Miami-Dade, Broward or Palm
//          Beach: /api/geo's ZIP (Vercel's IP headers, no permission prompt,
//          no third party) run through isInServiceArea(). Location unknown or
//          outside the area: off. A visitor's own choice, on or off, always
//          wins over this default.
//
// The prerendered HTML and the hydration render are "off" either way, so the
// on state arrives straight after hydration (src/lib/installedPrice.js).
//
// To look at it before turning it on: the preview flag ?installed=local
// behaves as if this were true AND the visitor were in the area, and
// ?installed=off forces off. Nothing is stored for either. See
// docs/ops/installed-price-default.md.

export const INSTALLED_DEFAULT_FOR_LOCAL = false;
