# TireDrop home page: conversion audit (code and data side)

Worktree: `/tmp/claude-0/-home-user-cannavibe/d34449fb-614b-55e4-9ef0-ecf19b08a954/scratchpad/homeaudit` (HEAD c22ee49). Read-only. Date 2026-10-17.
Everything below was read in code. Anything I could not verify is labelled GUESS. I did not run the app or a browser.

Files read: CLAUDE.md, `src/pages/HomePage.jsx` (all), `SearchPanel.jsx`, `ScanTireButton.jsx`, `ProductCard.jsx`, `Header.jsx`, `MobileCallBar.jsx`, `mobileBar.js`, `Footer.jsx` (newsletter part), `NewsletterSignup.jsx`, `ChatWidget.jsx` (launcher and events), `analytics.js`, `ga-events-check.mjs`, `business.js`, `services.js`, `pricing.js`, `api.js` (status), plus the call sites of every `trackEvent`. Prior docs: `2026-09-29-site-audit.md` and the four 2026-10-05 docs (checkout options, financing and add-ons, local pages, vehicle pages). I also grepped the 10-04 docs and `LAUNCH-CHECKLIST.md`.

## Verdict

The page is structurally sound. The hero finder sends people straight to results, the copy follows the house rules, and every form and widget degrades quietly when the API is offline. The conversion leaks are elsewhere:

1. **It makes a promise checkout does not keep.** Four places on the home page say checkout shows a delivery estimate. Checkout only says the estimate "is confirmed before your order ships" (F1). This is the same gap the 09-29 audit flagged and it is still open.
2. **The owner is blind on the highest-intent actions.** There is no GA event for a phone tap (at least 8 `tel:` links on the home page), for the quiz, for any category, brand or install CTA, or for the scan tap. `search` fires with the same params from the hero and from /tires (F2, F3, F6).
3. **The local install block is mislabelled and buried.** The "In the bay" card lists brake repair and lift kits, not tire installation, under a "Ship to store & install" button (F7). It is section 6 of 11, and the mobile bar says "Shop Tires" (F8).
4. **The new supply-network band is a dead end** with no next step. It repeats claims already made in the trust strip, the nationwide band and the FAQ (F9, F10), and it asserts "live inventory" while the home page still shows the sample catalog (F9, F11).

Nothing found breaks the house rules. No discounts, ratings, "since" years, "safe to drive", arrival dates, APR or lenders appear in the home code. F13, F15 and F9 are the nearest edges.

## 1. Funnel map

Interactions are counted as clicks or taps on the home page, starting at the hero. "Steps to cart" means to the first `add_to_cart`.

| Path | How it works (file:line) | Steps to cart / to a lead | GA events fired today | Gap |
|---|---|---|---|---|
| Size search | Hero "Shop by Tire Size" tab, 1 to 3 selects, "Search Sizes" (`SearchPanel.jsx:393-439`). It prefetches the search, then `/tires?w&a&d` (`HomePage.jsx:116-129`). | 2 to 4 taps and one page load, then Add (1). About 3 to 5 taps to cart. | `search` {search_type:tire_size, search_term} (`SearchPanel.jsx:234`), `view_search_results` (`TiresPage.jsx:449`), then `add_to_cart`. | `search` carries no placement, so hero and /tires finders are indistinguishable. Use the auto `page_location` (F6). |
| Vehicle search | Default tab: year, make, model (the model box is disabled until year and make are set), "Find Tires" (`SearchPanel.jsx:317-391`), then `/tires?vehicle=...` (`HomePage.jsx:107-114`). | 4 taps/inputs, then Add (1). About 5 to cart. | `search` {search_type:vehicle} (`:183`), `view_search_results` {results}. | Same as above. A returning visitor with a saved vehicle sees an empty finder because Hero passes no `initial` (F14). |
| Scan | Hero "Scan door sticker, tire or VIN" (`HomePage.jsx:196`). On a phone with scanner on it opens the camera, the photo goes to `/tire-size-finder`, then the size is read (`ScanTireButton.jsx:43-54`). On desktop, or with scanner off, it just navigates (`:44-45`). | About 3 taps plus a photo, then the finder page, then (unverified) on to /tires. | Only `tool_use` {tool_id} when the finder page is touched (`TireSizeFinderPage.jsx:260,347,395`). | The hero tap itself has no event. Whether the scan result carries on to a tire list is not measured. |
| Quiz | Link "Answer 5 quick questions" (`HomePage.jsx:206-215`), and tool card "Find my tires" (`:821`), to `/find-my-tires`. | 1 tap, then 5 answers, then a result card with Add. About 7 to cart. | **None.** `FindMyTiresPage.jsx` has no `trackEvent`, `trackToolUse` or `DemoEmbed`. Only the generic `add_to_cart` fires. | Quiz starts, completions and quiz-to-cart are all unmeasurable (F3). |
| Shop by category | 5 cards to `/tires?category=X` (`HomePage.jsx:366-391`). | 1 tap, then Add: 2 taps. | No `search` and no `view_search_results`. The latter only fires with a vehicle or size (`TiresPage.jsx:439-451`). | Category and brand clicks are invisible, except as a `page_view` path. |
| Shop by brand | Brand chips to `/tires?brand=` (`:403-412`). | 2 taps. | Same. | Same. |
| Featured tires | First 4 catalog rows (`:343`), `ProductCard` "Add set of 4" adds without leaving the page (`ProductCard.jsx:80-106,254-275`). | **1 tap to cart**, the shortest path on the page. | `add_to_cart` (`CartContext.jsx:131`), `page_location` = `/`. | Nothing for which card, and no `view_item_list` or `select_item`. Segment by `page_location`. Sample catalog (F11). |
| Install, bay | Install band "Ship to store & install" to `/install` (`:722-724`), also How-it-works button (`:619-622`). | Tires first, so install is not a cart step. No lead form on /install from here (unverified beyond the link). | `page_view` only. | Nothing marks "came for install". |
| Install, van | "Book your install" inside MobilePriceStrip (`MobilePriceStrip.jsx:78-85`) to `/schedule?service=tire-installation`. | 2 taps to the form, then submit. | `generate_lead` {form_name:booking} only when forms are on and delivered (`forms.js:140-144`, `SchedulePage.jsx:558`). `install_booking` fires only on `/track` (`TrackOrderPage.jsx:229,421`). | The home page is not marked as the source of a booking. Segment by landing page or path exploration. |
| Call | `tel:` links at `Header.jsx:35-41`, drawer `:262-268`, `HomePage.jsx:307-312`, `:775-778`, `:1262-1265`, the fixed `MobileCallBar.jsx:52-70`, the footer. | 1 tap. | **None.** The only call-related event is `chat_handoff_click` method=call, from inside the chat (`ChatWidget.jsx:344`). | The phone is the most important lead channel (the hero says "Questions? Talk to the shop") and is entirely unmeasured (F2). |
| Chat | Floating launcher (`ChatWidget.jsx:361-366`), rendered only if `/api/status` chat is "on" (`:289`). | 1 tap to open. | `chat_open`, `chat_message`, `chat_handoff_click` (`:293,303,344`). | None. Hidden on main until the Anthropic key is set (checklist). |
| Newsletter | Footer only (`Footer.jsx:131-137`), rendered only if status newsletter is "on". | 1 field plus submit. | `generate_lead` {form_name:newsletter} (`NewsletterSignup.jsx:141`). | Shares the event name with real leads (F4). |
| Local delivery | "Check your ZIP" to `/local-delivery#zip-check` (`HomePage.jsx:653-659`). | 1 tap. | None. | The feature is not live (F18). |
| Order | Cart, then checkout, then a request. | | `view_cart`, `begin_checkout`, `add_shipping_info`, `order_request` (`CheckoutPage.jsx:619,772`). | `purchase` is intentionally not sent (`analytics.js:133-137`). |

Cart to order: after Add the visitor needs cart, checkout, at least two "Continue" taps (`ga-events-check.mjs:209,216`) and a submit. From a size search to an `order_request` is about 9 to 11 interactions (estimate from the GA check script, not counted in a browser).

### Event inventory (`analytics.js:98-131`)

- **Ecommerce and funnel:** `page_view` (route changes, `analytics.js:41-92`), `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `order_request`.
- **Search:** `search` (hero, /tires finder, header, /search), `view_search_results`, `search_suggestion`.
- **Leads:** `generate_lead` {form_name: contact, size-quote, booking, financing, fleet-quote, newsletter}, `install_booking` (/track only).
- **Tools and other:** `tool_use`, `installed_price_toggle`, `installed_price_default`, `chat_open`, `chat_message`, `chat_handoff_click`.
- **Allowed parameters** (`analytics.js:146-162`) include `placement` and `method`, so a placement label needs no allow-list change.
- **Not covered by `check:ga`** (`ga-events-check.mjs:168-246`): the hero `search`, `order_request`, `tool_use`, `install_booking`, the chat events, and the newsletter and booking leads.

## 2. Message and CTA audit (page order from `HomePage.jsx:1290-1300`)

| # | Section | Single job | CTA label to destination | Next step? | Notes |
|---|---|---|---|---|---|
| 1 | Hero (`:97-241`) | Get a size or vehicle into the finder | "Find Tires" / "Search Sizes"; "Scan door sticker, tire or VIN"; "Answer 5 quick questions →"; "Shop Tires" to /tires; "How Shipping Works" to /shipping | Yes | 6 actions. The finder is first on a phone (`:180`, order-2). "Shop Tires" duplicates the finder's job. The ghost CTA to /shipping repeats the How section and trust strip. |
| 2 | Trust strip (`:249-318`) | Remove doubts: free shipping, fresh, installed, phone | Only the phone is a link | Partial | The three claims are not links. "Installed in South Florida" has no price here. |
| 3 | Shop (`:340-461`) | Pick a category, brand or tire | "All tires"; card "Shop" x5; brand chips; "Wheels"; "Commercial & fleet"; "Shop all tires"; "Add set of 4" | Yes | "All tires" (`:351`) and "Shop all tires" (`:442`) point to the same place within one section. |
| 4 | How it works + local delivery (`:538-678`) | Explain order, ship, install | "How shipping works"; "Ship to store & install"; "Check your ZIP" | Yes, but none leads to the catalog | Step 1 "Order online" (`:468-471`) is not linked to the finder. The delivery card promotes a feature that is not live. |
| 5 | Supply network (`:1019-1077`) | Reassure with scale | **None** | **No (dead end)** | Six tiles, no link, no price. |
| 6 | Install band (`:702-807`) | Convert the local buyer | "Ship to store & install" to /install; "How the van works"; "Book your install" (inside MobilePriceStrip); phone; "Visit the shop"; "Google reviews"; "Yelp" | Yes | The in-bay list is wrong (F7). The page's only install price in a section is here (`:708`). |
| 7 | Tools (`:834-933`) | Help the unsure | "Scan my size"; "Open it" x3; ~12 calculators | Yes | A 15-link grid sits between the install band and Learn. |
| 8 | Learn (`:937-1010`) | Education and SEO | "All guides", "Blog", 6 cards | Content only | No shopping CTA in the section. |
| 9 | Nationwide (`:1081-1149`) | Reassure non-locals | "Shipping to 48 states + DC" to /tires-shipped; 7 state chips | Yes | Re-states free shipping and the area three times. |
| 10 | FAQ (`:1154-1230`) | Remove last objections | Chips: Shipping, Ship to store, Returns & Refunds, Contact | Informational | No buy CTA. |
| 11 | Final CTA (`:1234-1274`) | Close | "Shop Tires"; "Call (954) 773-1896" | Yes | The only place the page's two main actions sit together. |

**Label consistency.** The same destinations carry different words:

- "Shop Tires" in the hero, header, drawer, mobile bar and final CTA, versus "All tires" and "Shop all tires" (`HomePage.jsx:351,442`).
- "How Shipping Works" (`:232`) versus "How shipping works" (`:617`).
- "Ship to store & install" twice, versus "Ship to store" in the FAQ chip (`:1200`), all to /install.
- The quiz is "Answer 5 quick questions →", "Find my tires" and, in the nav, "Find My Tires".
- Scan is "Scan door sticker, tire or VIN", "Scan my size" and "Tire Size Finder".
- Card buttons read "Add 4" / "Add set of 4" (`ProductCard.jsx:268-272`) while the rest of the site says "Add to Cart" (`ga-events-check.mjs:176`).

**Dead ends:** Supply network (no link), Learn (no shopping CTA), FAQ (no buy CTA), and the trust strip, whose claims are not links.

## 3. Section order versus the visitor story

The visitor story is: find my fit, do I trust this, what will it cost, how does it reach me, can I get it fitted, who do I call. Where each important item sits:

- **Free shipping:** utility bar, hero lede, trust #1, product card (desktop only), How step 2, and so on. It appears about 10 times (`HomePage.jsx:94,252,263,475,635,1108,1157,1173,1255,1286`). Visibility is not the problem. Repetition is.
- **Install price ($25/tire):** utility bar, hero lede (`:222`), install band (`:708`), the mobile card, and the Seo description. The trust strip item "Installed in South Florida" has no price. The band that answers "can you install it, for how much" is section 6 and starts roughly five screens down on a phone.
- **Phone:** utility bar, trust strip #4, install band, final CTA, mobile bar. Well placed. No hours anywhere (grep for "hours" in `HomePage.jsx` finds nothing).
- **Reviews:** a self-described absence ("It is new, so its own reviews are still being collected", `:769-772`) at the bottom of section 6, plus two outbound links.

**Overlap:**

- Supply-network band (`:1019-1077`) versus trust strip, nationwide band and FAQ: they all make shipping or network claims. The distributor figures are the only new information. Verdict: **cut or fold**.
- Trust #2 "Shipped direct rather than pulled off a back-room shelf" (`:258`) and the How lede "Orders ship direct from a distributor warehouse rather than sitting on a shelf to age" (`:547`) say the same thing twice, 290 lines apart.
- Network footnote (`:1069-1073`), How step 2 (`:475`) and FAQ #2 (`:1161`) all say "checkout shows the estimate" (false, F1).
- Nationwide band repeats the free-shipping and area claim of the hero lede and trust #1, plus a "48+DC" graphic.

**Recommended order:** Hero, Trust strip (with links and the install price), Shop, How it works (without the local-delivery card), **Install band**, Tools, Nationwide (shortened), Learn, FAQ, Final CTA. Fold the network figures into one line in How it works or the trust strip (3 tiles at most), or drop the section. Move the local-delivery card to /shipping or below FAQ. `scripts/home-check.mjs:33` asserts the section order (the `ORDER` array), so any reorder must update it.

## 4. Pricing and offer clarity

What a visitor sees on the home page:

- **Featured tires:** `$X set of 4`, `$Y each`, and on sm and up `install +$25/tire` and "Free shipping (48 states + DC) · estimate at checkout" (`ProductCard.jsx:193-222`, `pricing.js:33`). No MSRP, strike-through, "save" or badge. This reads as no discount, which matches house rules.
- **Install:** "from $25 per tire" from `services.js:14-15` in the hero lede, header, install band, Seo description and the mobile card (`MobilePriceStrip`). The ServiceList rows show other services as "from $X · duration" (`HomePage.jsx:693-695`).
- **Ship-to-store:** called "free" next to the install price in the hero (`:221-223`), the header utility bar (`Header.jsx:49-55`) and the install band lede (`:708`). FAQ #5 (`:1172-1174`) says plainly that tires and installation are paid separately. Good: the free-shipping wording never implies a free install.

**Could mislead (labelled):**

- "Checkout shows the delivery estimate" (F1). Verified false.
- The card line `install +$25/tire` has no "South Florida" qualifier (`ProductCard.jsx:209-211`). A Texas visitor reads it as a price they can buy. The same card on /tires may be seen as qualified by the toggle. GUESS on impact.
- Mobile cards hide both the install and shipping lines (`ProductCard.jsx:207,219`), so a phone visitor sees "$568 set of 4" with no mention that shipping is free.
- "from $25 per tire" has no scope on the home page: the includes list (disposal, mount, balance, valve stem, TPMS reset, `services.js:16-22`) lives only on the service page. Sales tax and Florida's $1 tire fee are not mentioned (open in 09-29 trust #4; I did not re-check the order code).
- "Fresh, DOT-dated rubber" (`:257-259`) and "so what turns up is fresh rubber" (`:547`) are guarantees of age. The site cannot know the date code before shipping. The competitor audit notes Priority Tire's reviews complain about old DOT dates. Judgement call, not a hard rule hit.
- "Every order is filled through a nationwide distribution network" and "24/7 visibility into live inventory" (`:1019-1044`) are stated as fact, while the catalog is a "representative catalog until the distributor feed replaces it" (`products.js:2-6`) and `api.js:134` defaults `atd` to "sample". Whether ATD is live today is a GUESS; the checklist still shows ATD credentials pending (`LAUNCH-CHECKLIST.md:260`).

## 5. Forms and lead capture on the home page

- **No form lives in the home page body.** The only email capture is the footer newsletter (`Footer.jsx:131-137`). The quiz asks nothing personal. The size-quote form lives on /tires.
- **Newsletter copy:** heading "TireDrop emails"; body "Seasonal tire checks, fitment help for your vehicle, and first word when new sizes and brands land. No spam. Unsubscribe anytime." (`NewsletterSignup.jsx:38-39`). One field, single opt-in, source "footer" (the API only accepts "popup" or "footer", `:24`). It is at the very bottom of an 11-section page. No offer, which is correct.
- **Consent wording:** "By signing up you agree to receive marketing emails from TireDrop. Unsubscribe anytime. See our Privacy Policy." (`:235-240`). Reasonable. No pre-ticked box.
- **API offline:** `status.newsletter !== "on"` returns `null` (`:118`); the footer wrapper collapses. `getStatus()` never throws (`api.js`). The chat widget also hides (`ChatWidget.jsx:289`). The scan button and the model list both fall back (`SearchPanel.jsx:197-221`, `ScanTireButton.jsx:44-45`). The prefetch in the hero is wrapped in `.catch(() => {})` (`HomePage.jsx:124-128`). Verdict: graceful, with two exceptions: the static "We read the size for you." line (F14) and the featured cards still showing sample data (F11).
- **On a failed sign-up** the visitor sees "We couldn't sign you up just now..." (`:46`).

## Findings

| ID | Sev | Where | Issue | Why it costs conversions | Suggested fix | Effort | Status vs prior audits |
|---|---|---|---|---|---|---|---|
| F1 | High | `HomePage.jsx:475,1070-1072,1160-1161`; `pricing.js:29,33`; `CheckoutPage.jsx:185` | The home page says "Checkout shows the delivery estimate before you commit", "checkout shows the estimate for your order" and, in the FAQ, that checkout shows one. Checkout has no estimate. It says the estimate "is confirmed before your order ships". | A visitor who wants to know "when" is told to find out at checkout, gets nothing there, and either abandons or calls. A false statement at the decision point costs trust. | Rewrite to what is true: "We confirm your delivery estimate by phone before the order ships." If a real estimate is built later, change it then. Same fix in `pricing.js` so the cards change too. | S | Still open (09-29 UX #9 and trust #8). |
| F2 | High | `Header.jsx:35-41,262-268`; `HomePage.jsx:307-312,775-778,1262-1265`; `MobileCallBar.jsx:52-70`; Footer | A phone tap has no GA event on any of 8+ `tel:` links. The only call signal is `chat_handoff_click` from inside the chat. | The owner cannot tell which page, section or button produces calls, which is probably the highest-value lead. Any A/B on call buttons is unreadable. | Add one `trackEvent("phone_click", { placement })` on the `tel:` links (`placement` is already an allowed key, `analytics.js:161`). Mark it a key event. | S | New. |
| F3 | High | `FindMyTiresPage.jsx` (no tracking); `HomePage.jsx:206-215` | The quiz, one of the three hero ways in, fires no event at all: no start, no completion, no result click. | A third of the hero's entry paths cannot be compared with size or vehicle search. The 09-29 audit asked for the quiz to be optional; nobody can now tell if it helps. | `trackToolUse("find-my-tires")` on first touch, plus `trackEvent("tool_use", { tool_id, placement: "result" })` on result. Also `tool_use` with `placement:"home_hero"` on the hero scan tap. | S | New. |
| F4 | Med | `analytics.js:114`; `NewsletterSignup.jsx:141` | `generate_lead` is used for newsletter, contact, size-quote, booking, financing and fleet-quote alike. | If `generate_lead` is a GA key event, a newsletter email counts as much as a booking, and the lead count is inflated. | Mark key events by `form_name` (GA custom definition) or send newsletter as its own event (`newsletter_signup`). | S | New. |
| F5 | Low | `ga-events-check.mjs:168-246` | `check:ga` does not cover the hero `search`, `order_request`, `tool_use`, `install_booking`, the chat events or the newsletter and booking leads. | A broken event goes unseen until the numbers look wrong. | Add checks for hero size search and for `order_request`; add the F2 and F3 events when built. | M | New. |
| F6 | Med | `SearchPanel.jsx:183,234`; `HeaderSearch.jsx:219` | `search` from the hero and from /tires are identical (`search_type`, `search_term`). | Home-hero performance is not separable. Workaround without code: GA adds `page_location`; segment `search` on `page_location = /`. | Pass `placement` ("home_hero", "tires") through SearchPanel props. | S | New. |
| F7 | High | `HomePage.jsx:720,739`; `services.js:9,167,190,212,234,257,280-281` | The "In the bay" card shows `SHOP_SERVICES` = `!mobile`: brake repair, alignment, suspension, lift kits, diagnostics. Tire installation, balancing and repair are `mobile: true`, so they appear only in the van card. The bay card's button is "Ship to store & install". | The one block that should say "Sunrise installs your tires from $25" lists services that do not match the button or the headline ("We'll put them on for you"). A local buyer sees $599 lift kits instead. | Build the bay list from the tire services (installation, balancing, repair, rotation, wheel install), or split by `shop`/`mobile` flags so tire install is in both. Keep brake and lift kits on /auto-service. | S | New. |
| F8 | Med | `HomePage.jsx:702-747,1294-1295`; `MobilePriceStrip.jsx:78-85`; `mobileBar.js:9`; `HomePage.jsx:261-264` | The install offer is in section 6. "Book your install" is only inside the van card; the bay card goes to /install. The mobile bar on the home page is "Shop Tires". The trust item "Installed in South Florida" has no price or link. | Local visitors (the high-margin ones) have no early path to install or booking. | Make the three trust items links (shipping, fresh, install) and put the price in the install item. Move the install band above the network band. Consider a "Book install" mobile bar action for FL visitors (GUESS: region is not known on the client). | S | New. Competitor gap #3 (book at checkout) is separate and still open. |
| F9 | Med | `HomePage.jsx:1019-1077,1294` | The network band has no CTA; it repeats claims made elsewhere; it asserts "live inventory" and "every order is filled through" while the site runs a sample catalog; the figures (110+ DCs, 900+ vehicles, 40 million miles) are third-party. Shipped 2026-10-17. | A full-width dark block, six tiles, no next step. It sits between How it works and the install offer. The live-inventory claim is a risk if ATD is not connected (GUESS). | Fold three tiles into the How section or the trust strip, add a "Shop tires" link, or cut. Keep the footnote. | S | New (checklist line 11, shipped 09e30d5). |
| F10 | Med | `HomePage.jsx:94,252,263,475,635,1108,1157,1173,1255,1286`; `:258` vs `:547` | "Free shipping" and "shipped direct, fresh" are repeated 10 times and twice. | Repetition lowers the weight of each. It lengthens the page; the Learn and Tools bands sit far down. | Keep it in the utility bar, trust strip, one FAQ and the cart. Drop it from the nationwide lede, the How lede and the network footnote. | S | New. |
| F11 | Med | `HomePage.jsx:343,432-459`; `products.js:2-6,19`; `ProductCard.jsx:207-222` | Featured tires are the first 4 rows of the static sample catalog, forever, even once ATD is live (the listing replaces sample data, `TiresPage.jsx:340`). On phones the cards hide the install and shipping lines. | After go-live, the home cards would show non-live tires and prices that differ from /tires. Adding one puts a sample SKU in the cart (GUESS whether checkout accepts it). Phone buyers see price only. | Feed featured from live results or hide the row while `status.atd !== "live"`. Show "Free shipping" in the row heading on phones. | M | New. |
| F12 | Med | `ProductCard.jsx:209-211` | `install +$25/tire` has no "South Florida only" qualifier. | A visitor in Atlanta sees an install price they cannot use. House rule: install is South Florida only. | `install +$25/tire (South Florida)` or move the install line to a tooltip with the area. | S | New. |
| F13 | Med | `HomePage.jsx:170-173,468-471,1253-1256`; `CheckoutPage.jsx:848` | The home page says "Order tires online" and "add a set to your cart". Checkout is request-only: "It is not paid yet: we call to confirm fitment, delivery and payment". The home page never says so. | A visitor who expects a card form meets "not paid yet" at the end and may drop. Honest on checkout, not set up on the home page. | Add one line under the hero CTAs or in How step 1: "You send a request; we call to confirm fitment before anything is charged." Status depends on `checkout` mode (GUESS: unchanged until Shopify live). | S | New. |
| F14 | Low | `HomePage.jsx:187,200-202`; `ScanTireButton.jsx:41-46`; `scanner.js:44-47` | The hero copy "We read the size for you." and the scan button show even when scanner is off or the API is offline. A tap before `/api/status` answers goes to the finder page, not the camera. A saved vehicle is not prefilled (`<SearchPanel onSearch>` has no `initial`). | Over-promise when scan is off; a returning visitor retypes the car. | Show the scan hint only when `photoOn`; pass the saved selection as `initial`. | S | New. |
| F15 | Med | `HomePage.jsx:759-804`; `business.js:96-104` | The "real shop" card says reviews "are still being collected" and sends two outbound new-tab links. The Google link falls back to a Maps search because `reviewUrl` is null. | A trust gap spelled out in the install band, with two exits that leave the funnel. | Keep honesty, shorten it, put the phone and "Visit the shop" first; set `GOOGLE_PROFILE.reviewUrl` (or drop the Google link). | S | Still open (checklist line 138). |
| F16 | Low | See section 2 | CTA label inconsistency: "Shop Tires" / "All tires" / "Shop all tires" / "Shop"; "How Shipping Works" / "How shipping works"; quiz and scan names. | Visitors may think two links go to different places. | Pick one label per destination: "Shop tires", "How shipping works", "Ship to store & install". | S | New. |
| F17 | Low | `HomePage.jsx:351,442` | Two links to /tires in one section. | Clutter. | Keep one. | S | New. |
| F18 | Low | `HomePage.jsx:638-678` | The "Local delivery - rolling out" card promotes a feature that is not live, between How it works and the install offer. | A tangent in the middle of the buying story; "Until it launches, every order ships free" admits no benefit yet. | Move to /shipping or below the FAQ. | S | New (checklist line 34, intentional). |
| F19 | Low | `Footer.jsx:131-137`; `NewsletterSignup.jsx:118` | Email capture is footer-only and hidden when the API is down. | Few visitors reach it; the value line is generic. | Optionally add a light inline sign-up after Learn with `source` "footer" and a concrete benefit (rotation and tire-age reminders). Keep the no-offer rule. | S | New. |
| F20 | Low | `ProductCard.jsx:258-269` | `aria-label` "Add a set of 4 ..." does not contain the visible "Add 4". | Voice control users cannot say what they see. | Make the label start with the visible text. | S | Still open (09-29 technical #8). |
| F21 | Low | `HomePage.jsx` (no "hours"); `MobileCallBar.jsx:65-69` | No opening hours near any phone number; the mobile bar button reads only "Call". | A caller at 9pm gets voicemail; competitor audit #10 advises posting hours. | Show hours beside the phone in the trust strip and the final CTA (needs the real hours from `business.js`). | S | Still open (competitor gap #10). |
| F22 | Low | `ChatWidget.jsx:353-366` | Launcher sits fixed at the right, lifted above the call bar (`lift`), z-40. Overlap with the right-hand "Add 4" buttons of the swipe row is possible. GUESS, not rendered. | A covered Add button loses a tap. | Check once in a phone viewport after the key is set. | S | New. |

## 6. Quick-win experiments (max 8)

"Home sessions" below means GA sessions whose landing page or `page_location` is `/`. Because every event carries `page_location` automatically, `add_to_cart`, `search` and `generate_lead` can be segmented to the home page without new code.

| # | Hypothesis | Exact change | Metric | How to measure with existing events |
|---|---|---|---|---|
| E1 | If the trust claims link out, local buyers reach install sooner. | Make the three TRUST titles (`HomePage.jsx:249-265`) links to /shipping, /shipping, /install; add "from $25 per tire" to the install item. | Share of home sessions that reach /install, /schedule or /mobile-service; `generate_lead` form_name=booking. | `page_view` path exploration from `/`; segment `generate_lead` by landing page. |
| E2 | Mobile shoppers add more when the free-shipping line is visible on the cards. | Un-hide `ProductCard.jsx:219` on phones (or put the line in the row heading at `HomePage.jsx:438-441`). | `add_to_cart` per home session on phones. | `add_to_cart` filtered to `page_location` = `/` and device = mobile, before and after. |
| E3 | Moving the install band above the network band raises booking and /install traffic. | Swap order in `HomePage.jsx:1294-1295` and update `scripts/home-check.mjs:33`. | /install and /schedule visits from home; booking leads. | Path exploration plus `generate_lead` booking, Florida region only. |
| E4 | Dropping or folding the network band shortens the page without losing conversion. | Replace `<SupplyNetwork />` with a 3-tile row in How it works, or remove it (F9). | `add_to_cart` and `search` per home session; engagement time. | Compare `search` / `add_to_cart` rates for `page_location = /` before and after. |
| E5 | On phones, hiding the hero's second CTA row lifts finder use. | Hide the "Shop Tires" / "How Shipping Works" row below `md` (`HomePage.jsx:226-234`); the header and mobile bar still link to /tires. | Home `search` per session; `view_search_results`. | `search` with `page_location = /` divided by home sessions. |
| E6 | Fixing the false estimate promise reduces bounce from checkout and phone questions. | Ship F1 (no A/B). | `begin_checkout` to `order_request` rate; phone calls once F2 exists. | `begin_checkout`, `add_shipping_info`, `order_request` rates before and after. |
| E7 | A visible number with hours drives more calls. | Add hours next to the phone in the trust strip and final CTA (F21), and add `phone_click` (F2). | `phone_click` per home session, by placement. | Needs F2 first; then `phone_click` {placement}. |
| E8 | A shorter reviews card and a fixed Google link keeps visitors on the page and raises trust. | Shorten `HomePage.jsx:768-772`; set `GOOGLE_PROFILE.reviewUrl` (F15). | Clicks on "Visit the shop" and the phone; outbound clicks. | GA enhanced-measurement outbound clicks if enabled (GUESS: not confirmed on); otherwise add `phone_click`. |

Do first, since the later experiments need them: F2 (`phone_click`), F3 (quiz and scan events) and F6 (`placement` on `search`). Together they are about one small commit.
