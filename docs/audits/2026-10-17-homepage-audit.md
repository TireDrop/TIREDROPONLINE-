# Homepage audit: conversion and usability (2026-10-17)

Audited on main `c22ee49`. Three read-only passes, each in its own file:
[visual and measured](2026-10-17-homepage-audit-visual.md) (V1 to V16),
[code and funnel](2026-10-17-homepage-audit-funnel.md) (F1 to F22, experiments E1 to E8) and
[real-world usability](2026-10-17-homepage-audit-usability.md) (U1 to U13).
This page is the merged, ranked list. Screenshots and scripts named in the
three reports lived in a scratch folder and are not in the repo.

Limits, stated once: the catalog was in sample mode (`atd: sample`), so product
cards and prices may differ in production; speed numbers are local and
unthrottled except the Slow 4G test; nothing was tested on a real iPhone or
with a real on-screen keyboard; the FAQ answers were not expanded and read.

## Verdict

Desktop passes the 5-second test. The basics are solid: the page is
prerendered and works with JavaScript off, no sideways scroll at 320, 360 or
844x390, layout shift is about 0, the focus ring is clear, and no invented
reviews, ratings, "since" years, discounts or delivery dates were found.

Mobile is where it loses people: the first screen never says "48 states + DC",
the main button (Find Tires) sits about 1.7 screens down, the page is 17.7
screens long, and the first priced tire is almost 4 screens down. The owner
also cannot measure phone taps, the quiz or the install offer. One copy
promise (a delivery estimate at checkout) is not true today.

## Do first (small, high payoff)

| # | Fix | From | Effort |
|---|---|---|---|
| 1 | Say "Free shipping to 48 states + DC" in the mobile first screen (the only line there reads as South-Florida-only) | V1, V9 | S |
| 2 | Rewrite the copy that says checkout shows a delivery estimate; checkout only says "confirmed before your order ships" (house rule: no delivery promises) | F1 | S |
| 3 | Make the chat button small (icon-only) on phones: it covers the H1, the Find Tires label, form fields and cart/menu buttons | V4, U3, F22 | S |
| 4 | Give the search form `action="/search"` and the input `name="q"` so Enter before the page finishes loading, or with JS off, still searches | U2 | S |
| 5 | Track what matters: phone taps (8+ links, no event), the quiz (no event), the hero scan tap, install CTAs; add `placement` to `search`; stop counting newsletter sign-ups as `generate_lead` | F2, F3, F4, F6 | M |
| 6 | Shorten the mobile hero so the first field and Find Tires are both visible (headline wraps to 4 lines; hero is 1365px) | V2, U8, V10 | M |
| 7 | Fix the "In the bay" card: it lists brakes, alignment and lift kits, not tire installation; give the install offer an earlier, linked place with its price | F7, F8 | M |
| 8 | Raise inputs to 16px (iOS zooms under 16px, a guess) and shorten the clipped mobile search placeholder | V5, V6 | S |
| 9 | Add the shop hours next to the phone number | F21, V11 | S |
| 10 | Add "(South Florida)" to `install +$25/tire` on product cards | F12 | S |

## Next (medium)

- **Page length:** collapse the 3.3-screen install block on phones, put the product row before the category tiles, fold "How it works" and the network band (V3).
- **Supply-network band (shipped 2026-10-17):** no button, repeats shipping claims made elsewhere (free shipping appears about 10 times on the page), and says "live inventory" while the featured tires come from the sample catalog. Fold it into three tiles, add a button, or remove it (F9, F10, V12, E4). Needs Justin's call.
- **Featured tires** are the first 4 rows of the static sample catalog even after the live feed is on (F11); cards share one generic image and open with an amber "Check fitment" warning above the price (V8).
- **Checkout is request-only** ("not paid yet, we call to confirm") and the home page never says so while saying "Order tires online" (F13).
- **Reviews card:** the Google link is a Maps search because `reviewUrl` is empty (F15, already on the checklist).
- **Accessibility:** the 400% zoom mobile menu has a 32px scroll area for 1984px of links (U1); at 200% text the page widens to 498px and the H1 is clipped (U4, U5); landscape phones lose 60% of the screen to the header and call bar (U6); `/search` overflows on a long unbroken query (U7).
- **Button labels (WCAG 2.5.3):** fixed on branch `preview/a11y-labels`, waiting on Justin's OK to ship (F20).

## Later (low)

Tap targets under 44px (footer phone 36px, top phone link, desktop header controls), cart and menu buttons 6px apart, text under 12px (41 nodes on mobile), desktop sticky header 159px tall, 80px logo soft on 2x phones, no Spanish home page, forced-colors nav polish, hero eyebrow stray period, "fresh, DOT-dated" and "rolling out" claims, CTA label consistency ("Shop Tires" / "All tires" / "Shop all tires"), the local-delivery teaser for a feature that is not live.

## Experiments (existing GA events; build items 5 first)

E1 link the trust items to /shipping and /install with "from $25 per tire"; E2 show the free-shipping line on phone cards; E3 install band above the network band; E4 fold the network band; E5 hide the hero's second button row on phones; E6 ship the F1 copy fix; E7 hours plus `phone_click`; E8 shorter reviews card with a real Google link. Details and metrics are in the funnel report.

## What works well

Phone number visible from the first pixel; a persistent Shop Tires / Call bar on phones; fast, stable load (LCP is text at 0.2 to 0.3 s locally, CLS about 0); clear price display (set of 4, per tire, install add-on, free shipping, "estimate at checkout" instead of a date); fast search with an instant "Shop 225/45R17 tires"; tab order, skip link and focus ring; no keyboard traps; reduced motion respected; honest proof wording on reviews.

## Status vs earlier audits

Already fixed since 2026-09-29: the hero goes straight to /tires, the pop-up became a footer form, the mobile bar is route-aware. Still open: delivery-estimate wording (F1), the "Add 4" label mismatch (F20), the Google review link (F15), hours near the phone (F21).
