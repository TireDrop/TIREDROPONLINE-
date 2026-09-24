# Functional audit — found, not fixed

Driven in Chromium (Playwright) against a `vite build --mode preview` bundle
served on hash routes, 2026-09-24. Everything below was reproduced in the
browser, not inferred from reading the code.

Items already fixed in this pass are not listed here — they are in the change
set. This file is only what is still open, with enough detail to act on.

The brief's known-and-deliberate list (no payment processing, no form backend,
representative catalog, illustrative rebates and reviews, generated product
art, null `BUSINESS.email`, draft legal pages, hand-written OE fitment) is not
re-reported, except where a specific piece of copy goes further than that list
allows — see item 2.

---

## 1. The home page vehicle finder does not narrow anything

**What happens.** On `/`, pick 2019 / Toyota / Camry and press **Find Tires**.
You land on `/tires?vy=2019&vmk=Toyota&vmd=Camry` showing all 20 tires —
including 285/70R17 truck tires and 255/35R19 sports sizes that cannot go on a
Camry. `src/pages/shop/TiresPage.jsx` reads `vy`/`vmk`/`vmd` only to render the
"Your vehicle" banner; the `results` memo filters on `w`/`a`/`d` and the facet
params, never on the vehicle.

**Why it matters.** The finder's own helper text (`src/components/shop/
SearchPanel.jsx`, vehicle tab) says _"We match your vehicle to the sizes we
stock"_. The page then does not. A distributor reviewer exercising the primary
finder on the home page hits this in the first thirty seconds.

**Not fixed because** it is a product decision, not a defect in isolation: the
banner underneath is honest ("Read us the size off your sidewall"), and the
alternative — filtering to one hand-written OE size — can leave the catalog
showing one tire, which may not be what you want before real fitment data
arrives.

**If you want it filtered:** the data already exists. `FITMENT` and
`fitmentFor(make, model)` are local constants in
`src/pages/tools/FindMyTiresPage.jsx` (around line 100–145). Lift them into
`src/data/` and have `TiresPage` apply the returned size as a `w`/`a`/`d`
filter when `hasVehicle` is true, labelling it as the typical original size
the way the quiz already does. Otherwise soften the finder's helper text so it
does not promise a match the page will not perform.

## 2. Every form's success state says the message was delivered

**What happens.** All five forms confirm with copy that asserts transmission:

| Form        | File                                                 | Confirmation says                                                                        |
| ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Contact     | `src/pages/support/ContactPage.jsx` (~line 104)      | "Message received… A real person reads these… will reply at {email} or {phone}"          |
| Financing   | `src/pages/support/FinancingPage.jsx` (~line 219)    | "Request received… Someone will call you at {phone}"                                     |
| Fleet quote | `src/pages/shop/CommercialTiresPage.jsx` (~line 199) | "we have your details… A fleet specialist will follow up… usually the same business day" |
| Review      | `src/pages/support/ReviewsPage.jsx` (~line 195)      | "Thank you… We read every one of these"                                                  |
| Booking     | `src/pages/services/SchedulePage.jsx` (~line 416)    | "We have your request. A dispatcher confirms your two-hour window by phone"              |

Nothing is sent. `ReviewsPage` says so in its own comment: _"Client-side review
composer — nothing is submitted anywhere."_

**Why it matters.** The no-backend architecture is known and deliberate. The
copy is a separate question: a reviewer who submits the contact form is told a
person will reply, and nobody will. Checkout handles this honestly — it never
claims more than "order received, we will call" and the order reference is
shown for a phone call. The five forms above do not have that escape hatch.

**Not fixed because** `ContactPage.jsx` and `FinancingPage.jsx` are off-limits
in this pass, and fixing only the two I own would leave the site saying two
different things. It needs one decision applied to all five.

**Options:** wire a real endpoint (Formspree/Netlify Forms/a serverless
handler) before the review, or reword all five to the checkout's register —
lead with the phone number as the channel that actually reaches someone, and
drop the claim that a reply is coming.

## 3. Choosing ship-to-store when no line has installation still promises a fitting

**Reproduce.** Add a set from the grid (installation off). Go to `/checkout`,
step 2, pick **"Ship free to the shop — we'll fit them"**, book a date, finish.
The confirmation says _"We fit them at the shop… Meet us there on Friday,
September 25"_ while the order summary shows `Installation at the shop —`
and charges nothing for it.

**The mirror image:** with lines set to install, picking **"Mobile install at
my address"** is allowed and bills the shop installation line — the summary
reads `Installation at the shop $100.00` while the confirmation says the van
comes to your address.

I fixed the third combination (ship-to-address while lines carry shop
installation), which was the one that both billed for a fitting and promised
delivery to a house. These two are less severe — nobody is charged for
something they do not get — but they still make the money and the promise
disagree.

**Where:** `validateInstall` in `src/pages/shop/CheckoutPage.jsx` now takes a
`{ hasShopInstall }` context; both cases are a couple of lines in the same
place. What they should _do_ is a policy call I could not make:

- Does free ship-to-store **without** a fitting exist (counter pickup)? If yes,
  the option list needs a fourth entry and the current one's copy is wrong. If
  no, the step should refuse it the way the ship-to-address case now does.
- Is mobile installation priced the same as shop installation? If yes, the
  summary row wants relabelling from "Installation at the shop" to
  "Installation" whenever the fulfillment is mobile. If no, the $25/tire in
  `data/products.js` is the wrong number for that path.

## 4. `/tire-size?compare=1` is a dead parameter

**Reproduce.** The header and footer both carry a **"Compare Two Sizes"** link
(`src/data/business.js` lines 172 and 221) pointing at `/tire-size?compare=1`.
`TireSizePage` reads only `size` and `vs`, so the link opens the ordinary empty
decoder — identical to clicking "Tire Size Calculator" right above it. Two nav
entries, one destination.

**Not fixed because** `src/data/business.js` is off-limits, and the only fix
available on the page side is to invent a behaviour for `compare=1`. Anything I
could make it do (prefilling example sizes, focusing the second field with no
first size typed) is a guess at intent.

**Suggested:** either drop the second nav entry, or have `compare=1` scroll to
`#decoder` and focus the **Compare against** field — which is honest but of
limited value until a primary size is typed.

## 5. ~~Free shipping is measured on parts only~~ — superseded

The owner has since confirmed that shipping is free to every address in the
continental US, with no minimum. The flat fee and the order threshold are gone
from the cart and checkout, so this no longer applies.

## 6. ~~A rebate is capped at one per order~~ — superseded

The owner has confirmed the manufacturer rebates were not real. Rebate data,
pricing and copy have been removed from the site, so this no longer applies.

## 7. Smaller things, in descending order of how likely a reviewer is to see them

- **Vehicle-mode quiz links cannot resume without `size`.**
  `/find-my-tires?q=r&mode=vehicle&vy=2019&vmk=Toyota&vmd=Tacoma&roads=…`
  drops to question 1 with "That link is missing an answer", even though
  make and model are enough to derive the size — which is exactly what step 1
  does when you pick them by hand. Links the quiz produces itself always carry
  `size`, so this only bites hand-built or hand-edited links.
  `missingStep` in `src/pages/tools/FindMyTiresPage.jsx` (~line 1175).
- **An unknown slug in the compare store silently blocks the table.** Put
  `["does-not-exist","nexen-npriz-ah5-205-55r16"]` in
  `localStorage["tiredrop.compare.v1"]` and `/compare` shows the "Pick at least
  two tires" empty state while the tray counts two. `CompareTray` already drops
  unmatched slugs for display; `CompareContext` never prunes them from storage.
  Low impact with a static catalog, real once the catalog turns over.
- **`/tire-size` prints its parse error twice.** With `?size=bananas`, "That is
  not a size we can read yet." appears in the result strip and again in the
  field callout, back to back.
- **Nonsense tread parameters still produce a verdict.**
  `/tire-check?method=bogus&bars=nonsense&nd=99&tread=-5` clamps to 0/32" and
  answers "Yes — these need replacing." Every value is clamped to something
  safe, so nothing wrong is asserted, but the page answers a question it was
  never really asked.
- **The booking confirmation prints the phone number unformatted.** Enter
  `9545550123` on `/schedule` and the confirmation reads it back as
  `9545550123`. Checkout echoes whatever was typed too. A shared formatter
  would fix both.
- **Filter changes replace the history entry.** `patchParams` on `/tires` and
  `/wheels` uses `{ replace: true }`, so Back after filtering leaves the
  catalog rather than undoing the filter. Deliberate-looking, and defensible;
  noted because "Back undoes my last filter" is the other common convention.

---

## What was exercised and came back clean

Worth recording so nobody re-walks it.

- **All 32 routes** load with a unique `<h1>`, a unique `<title>` and no
  console or page errors, at 1280px and at 390px. No route renders a duplicate
  element id or a `label[for]` pointing at nothing, at either width. (The two
  header search boxes did share an id mid-audit; the header rebuild fixed it
  before this was written.)
- **The header**, at phone width: the drawer opens, all 36 of its links
  resolve, Escape closes it, and a search that matches nothing says so in
  place — "Nothing matched \"zzzzz\". Try a size like 225/45R17, a brand, or a
  model." — rather than navigating somewhere unhelpful.
- **Every internal link on every route** (139 distinct hrefs) resolves to a
  real route. Every in-page anchor target exists. The footer, the mobile
  drawer and the sitemap all resolve; `/compare` was missing from the sitemap
  and has been added.
- ~~**Promo arithmetic**~~ — superseded. The owner confirmed none of the
  deals were real, so every promo code, the promo field and the Deals page
  (`/coupons`, now a redirect to `/tires`) have been removed. The cart,
  checkout rail and confirmation now total subtotal + installation + tax.
- **Compare**: tick from the grid or the product page, the tray, the table,
  remove from any of the three, clear all, the four-item cap (the fifth
  checkbox is genuinely disabled, not just ignored), and a mid-way refresh.
  All correct.
- **The three tools' arithmetic** against `src/data/tireMath.js`: metric,
  flotation (`31x10.50R15`), Z-rated (`225/45ZR17`) and LT sizes all decode
  and draw correctly; overall diameter, sidewall, revolutions per mile,
  diameter change and speedometer error all match the module. Junk input is
  rejected with a specific message in every field. The DOT decoder's
  unreadable-code message is unusually good ("It needs four digits where the
  first two are a week from 01 to 53 — so 0624 works and 6024 cannot").
- **The quiz's no-match path**: an answer set that matches nothing says so,
  names the constraint doing it, says how many tires relaxing it brings back,
  and offers to relax it — without inventing a recommendation.
- **Form validation**: empty, invalid and valid submissions on contact, fleet
  quote, review, financing and the five-step booking wizard. Every message is
  specific and field-level. Dates refuse Sundays and past days by name; the
  Saturday late window is disabled on `/schedule` and cleared from the
  selection on `/checkout` when the date changes to a Saturday.
- **Filters, sort and search** on `/tires` and `/wheels`: every facet, the URL
  round-trip (including reload), clear-all, the empty-result state, unknown
  sort values, and out-of-range facet values.
- **Back and forward** across catalog → product → back → forward, deep links
  into every tool, and bad slugs on `/tires/…`, `/wheels/…` and `/services/…`.
