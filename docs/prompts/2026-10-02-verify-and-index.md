# Verify and index: Chrome prompts for the 2026-10-02 content

Three copy-paste prompts for Justin's Chrome extension, for the content that
went live on 2026-10-02: blog batch 2 (`f776fc1`), the Learn Buying + Fitment
hubs (`2674d06`) and the home page redesign (`037b6d6`).

| Prompt | What it does | Changes anything? |
|---|---|---|
| A | Search Console: request indexing for the 17 new URLs and the home page | Yes: one STOP before the first request |
| B | Opens the cited source pages and checks five claims the writers could only see in search snippets | No, read only |
| C | Google Business Profile: reads the map pin, Place ID and review link | No, read only |

None of these prompts pay, publish, delete or touch DNS. Paste each prompt's
REPORT BACK into Claude; the "After this" line says what happens next.

Suggested order: B first (if a claim fails, Claude fixes the page before
Google indexes it), then A, then C whenever convenient.

## A. Search Console: request indexing for today's URLs

**Why:** the sitemap already lists these pages (home page `lastmod`
2026-10-02), but asking Google to crawl them directly gets new pages looked
at sooner. The hubs go first because they link to every guide under them.
Google limits how many indexing requests a property can make per day; if it
says the quota is used up, the prompt stops and lists what is left for
tomorrow.

```
TASK: In Google Search Console, inspect 18 URLs on tiredroponline.com and
request indexing for each one. I am logged into
search.google.com/search-console in this browser.

HARD RULES:
- Do not remove, add or change any property, user, sitemap, setting or
  removal request. Do not click "Remove", "Removals" or "Validate fix".
- STOP FOR SUBMIT before the FIRST "Request indexing": say which URL is
  ready and wait for me to reply "go all". After that you may click
  "Request indexing" for the rest of THIS list only, one URL at a time.
- If Google shows "Quota exceeded" or any error, stop at once and report.

1. Open the property for tiredroponline.com (the Domain property,
   "tiredroponline.com"). If you only see a different site, stop and tell
   me.
2. Read only: Indexing -> Sitemaps. Report the sitemap URL, its status and
   "Last read" date.
3. For each URL below, in this order:
   a. Paste it into the "Inspect any URL" bar at the top and press Enter.
   b. Wait for the result. Note "URL is on Google" or "URL is not on
      Google", and the line under Page indexing (for example "Discovered -
      currently not indexed").
   c. Click "Request indexing" (STOP FOR SUBMIT on the first one only, see
      the rules). Wait for "Indexing requested" and close the dialog.

   Home page and hubs
   https://tiredroponline.com/
   https://tiredroponline.com/learn/buying
   https://tiredroponline.com/learn/fitment

   Learn: Buying
   https://tiredroponline.com/learn/buying/all-season-vs-all-weather-tires
   https://tiredroponline.com/learn/buying/all-terrain-vs-highway-tires
   https://tiredroponline.com/learn/buying/lt-vs-p-metric
   https://tiredroponline.com/learn/buying/run-flat-tires
   https://tiredroponline.com/learn/buying/xl-vs-sl-tires

   Learn: Fitment
   https://tiredroponline.com/learn/fitment/bolt-pattern
   https://tiredroponline.com/learn/fitment/staggered-tires
   https://tiredroponline.com/learn/fitment/wheel-offset-backspacing

   Blog batch 2
   https://tiredroponline.com/blog/get-tires-installed-after-buying-online
   https://tiredroponline.com/blog/how-old-are-tires-bought-online
   https://tiredroponline.com/blog/new-tires-front-or-back
   https://tiredroponline.com/blog/nitrogen-in-tires-myth
   https://tiredroponline.com/blog/replace-all-four-tires-myth
   https://tiredroponline.com/blog/same-size-tires-different-prices
   https://tiredroponline.com/blog/sidewall-max-psi-myth

REPORT BACK:
- The sitemap line from step 2.
- A table with one row per URL: URL | on Google before? | Page indexing
  line | indexing requested Y/N (or the error text).
- If you stopped early, the URLs still to do.
```

**Undo:** nothing to undo; a request only asks Google to crawl.

**After this:** if any URL was left over, run the prompt again the next day
with only those URLs. If a URL reports an error other than the quota (for
example "Page with redirect" or "Excluded by noindex"), tell Claude: that is
a site bug.

## B. Check five claims on their source pages

**Why:** when these pages were written, the sandbox could not open these
sources, so each claim rests on a search-result snippet. This prompt reads
the real page. A claim is only VERIFIED when the page itself says it.

```
TASK: Open five source pages and check, word for word, whether each one
says what tiredroponline.com quotes it as saying. This is READ ONLY.

HARD RULES:
- Do not sign in, fill a form, subscribe, buy or download anything except
  opening the PDF links below in the browser.
- If a cookie banner covers the page, pick "Reject" or close it; if only
  "Accept" is offered, accept and say so in the report.
- Use Ctrl+F (find on page) with the search words given, then read the
  sentences around each hit. Quote the page EXACTLY; do not paraphrase.
- Verdict per check: VERIFIED (the page says it; give the exact quote),
  DIFFERENT (the page says something close but not the same; quote what it
  does say), NOT FOUND (nothing on the page supports it), or BLOCKED (the
  page did not load, redirected elsewhere, or the PDF text could not be
  read; say which and give the final URL).

CHECK B1. Bridgestone: new tires go on the rear, regardless of drivetrain
  Open: https://www.bridgestoneamericas.com/en/company/safety/choosing-tires/replacement-guidance
  Our page says: "If you replace just two tires, install them only on the
  rear axle, regardless of your vehicle's drivetrain."
  Find: rear, axle, drivetrain, two tires
  Also check on the same page: Bridgestone says to choose tires in the same
  category as your existing ones. Find: category

CHECK B2. Bridgestone: sipes, slots and high-silica compounds
  Open: https://tires.bridgestone.com/en-us/learn/shopping-for-tires/all-season-tires
  Our page says: Bridgestone points to features like sipes, slots and
  high-silica compounds as contributors to balanced performance in
  changing weather.
  Find: sipe, slot, silica
  Also check on the same page: all-season tires are designed for dry and
  wet roads and some snow. Find: snow, wet

CHECK B3. fueleconomy.gov: tire pressure and gas mileage
  Open: https://www.fueleconomy.gov/feg/maintain.jsp
  Our pages say:
  (i)   keeping tires at the proper pressure can improve gas mileage by
        0.6% on average, and up to 3% in some cases
  (ii)  under-inflated tires can lower gas mileage by about 0.2% for every
        1 psi drop in the average pressure of all tires
  (iii) do not use the maximum pressure printed on the tire's sidewall
  Find: 0.6, 3%, 0.2, psi, sidewall
  Give a verdict for (i), (ii) and (iii) separately.

CHECK B4. XL vs SL reference pressures (35 psi and 41 psi)
  Open first: https://www.toyotires.com/media/2125/application_of_load_inflation_tables_20170203.pdf
  Then: https://www.tirerack.com/upgrade-garage/what-is-maximum-load-for-a-tire
  Our page says: in the load tables for P-metric tires, 35 psi is the
  reference pressure for standard load and 41 psi for extra load; and (Tire
  Rack) at the SAME pressure an XL tire carries about the same load as a
  standard load tire of the same size.
  Find: 35, 41, extra load, standard load, reinforced
  Give a verdict for each of the two sources separately.

CHECK B5. Load range C, D, E = 6, 8, 10-ply rating
  Open first: https://tires.bridgestone.com/en-us/learn/automotive/tire-terminology
  Our page says: load range "replaces the former ply rating term" and
  identifies a tire's load and inflation limits; and in a table, load range
  C = 6-ply rating, D = 8-ply rating, E = 10-ply rating.
  Find: load range, ply
  If Bridgestone does not give the C/D/E = 6/8/10 numbers, look for them on
  these, in order, and stop at the first that does:
    https://www.toyotires.com/media/bszlobyw/tsd-12-011_replacing_tires_on_light_trucks.pdf
    https://www.coopertire.com/en_US/tire-education/tire-sidewall-information/tire-load-index-sidewall-info.html
    https://www.michelinman.com/auto/auto-tips-and-advice/tires-101/tire-markings-explained
  Give a verdict for the "replaces the ply rating" sentence and for the
  6/8/10 numbers separately, and name the source that has the numbers.

REPORT BACK: one block per check, in this form:
  B1 | VERIFIED / DIFFERENT / NOT FOUND / BLOCKED
  URL actually read: ...
  Exact quote: "..."
  Notes: ...
```

**Where these claims live on the site** (for Claude, when fixing):

| Check | Pages |
|---|---|
| B1 | `src/content/blog/new-tires-front-or-back.md` (summary, FAQ, table, body) |
| B2 | `src/content/blog/same-size-tires-different-prices.md` |
| B3 | `src/content/blog/sidewall-max-psi-myth.md`, `src/content/blog/nitrogen-in-tires-myth.md` |
| B4 | `src/content/learn/buying/xl-vs-sl-tires.md` |
| B5 | `src/content/learn/buying/lt-vs-p-metric.md` |

**After this:** paste the report into Claude. VERIFIED items stay as they
are. For DIFFERENT, Claude rewrites the sentence to match the quote; for NOT
FOUND, Claude cuts the claim or its attribution; for BLOCKED, the claim stays
flagged on the checklist until someone can read the page.

## C. Google Business Profile: map pin, Place ID and review link

**Why:** three site items wait on these numbers: the map coordinates in the
shop's structured data, the Google Place ID, and a real "leave a review"
link for the home page reviews card (it points at a Maps search today). All
three go into `src/data/business.js`. Never guess them from the street
address.

```
TASK: Read three things about the Google listing for Extreme Tires in
Sunrise, FL. READ ONLY.

HARD RULES:
- Do not click "Edit profile", "Suggest an edit", "Claim this business",
  "Reply" or any Save button. Do not change any profile field, photo, hour
  or post.
- Do not send or share anything (no email, text or social share buttons).
  Copying a link to the clipboard is fine.

The listing must match ALL of these; if it does not, or there are two
listings, stop and tell me what you see:
  Name: Extreme Tires
  Address: 7712 West Oakland Park Blvd, Sunrise, FL 33351
  Phone: (954) 773-1896

1. MAP PIN. Open google.com/maps and search
   "Extreme Tires 7712 West Oakland Park Blvd Sunrise FL 33351".
   Click the result so the listing panel opens. Right-click the red pin
   itself (not the road next to it). The first line of the menu is the
   coordinates, like "26.1xxxxx, -80.2xxxxx". Report that text exactly.
   Also report the numbers after "!3d" and "!4d" in the address bar URL as
   a cross-check.
2. PLACE ID. Open
   https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
   Type "Extreme Tires Sunrise FL" in the map's search box, pick the
   listing at 7712 West Oakland Park Blvd, and report the Place ID shown
   (it usually starts with "ChIJ"). If the demo does not load, say so.
3. REVIEW LINK. Search google.com for "Extreme Tires Sunrise FL".
   If the Business Profile manager panel appears (it does when this Google
   account manages the listing), click "Ask for reviews" or "Get more
   reviews" and copy the short link it shows (often g.page/r/...). Close
   the dialog without sharing. If no manager panel appears, say "not a
   manager on this account" and skip this step.

REPORT BACK:
- Name, address and phone exactly as the listing shows them.
- Pin coordinates (step 1) and the !3d / !4d numbers.
- Place ID (step 2).
- Review link (step 3), or "not a manager on this account".
```

**After this:** paste the report into Claude. Claude sets `geo`,
`GOOGLE_PROFILE.placeId` and `GOOGLE_PROFILE.reviewUrl` in
`src/data/business.js`, runs `npm run check:schema` (it fails if the pin
lands outside South Florida), and ticks the checklist items "map
coordinates", "Homepage reviews card" and "Google Business Profile link +
map pin". If step 3 was skipped, Claude can build the review link from the
Place ID and will check that it opens the review box before using it.
