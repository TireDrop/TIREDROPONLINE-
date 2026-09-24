# Extreme Tires — the parent business, as its own listings state it

Reference for anything on TireDrop that asserts a fact about the shop behind
it. `src/data/business.js` is the code's source of truth; this file records
**where those values came from** and how far each one can be trusted.

> **How this was gathered.** The sandbox's egress proxy refuses
> `extrememobiletires.com`, so the site could not be read directly. Everything
> below comes from public listings and search result pages. Each line carries
> its confidence. Nothing here was inferred to fill a gap.

Last checked: 24 September 2026.

---

## Confirmed — two or more independent sources agree

| Fact | Value | Where |
|---|---|---|
| Trading name | **Extreme Tires** | Own site page titles, Yelp, Goodyear and Cooper dealer locators |
| Street address | 7712 West Oakland Park Blvd, Sunrise, FL 33351 | Yelp, Pirelli, SimpleTire, Chamber of Commerce |
| Phone | (954) 773-1896 | Yelp, Chamber of Commerce, own site |
| Hours | Mon–Fri 8:00 AM – 6:30 PM · Sat 8:00 AM – 4:00 PM · Sun closed | Yelp, own site |
| Established | **2006** | Own About page, directory listings |
| Ownership | Family owned | Own About page |

⚠️ **The site said 2007 until this check.** It is 2006, and that value feeds
every "since ____" line and the years-in-business figure.

### The name question, settled

The domain is `extrememobiletires.com`, but the business trades as
**Extreme Tires** — that is what its own page titles, its Yelp listing and
every manufacturer locator call it. `BUSINESS.parent` is correct as written.

Some aggregators list it as "Extreme Tires & Extreme Mobile Tires", which
suggests both names are in use. **The registered entity name is still
unknown** and must come from the client — see the open items below.

---

## Review profiles — real, and now linked from `/reviews`

| Platform | URL | In code |
|---|---|---|
| Yelp | https://www.yelp.com/biz/extreme-tires-sunrise | `YELP_PROFILE.url` |
| Google | Maps search by name — no place ID yet | `GOOGLE_PROFILE.searchUrl` |

Aggregators reported figures in the range of several hundred reviews at
roughly 4.6 stars when checked. **Those numbers are deliberately not in the
code and not on any page.** They move, an aggregate this site cannot verify
at source must never be published as structured data, and a number typed into
a page is wrong the week after. The pages link to the profiles instead.

`GOOGLE_PROFILE.reviewsAreReal` stays `false`: it gates review markup, and
the reviews rendered on `/reviews` are still written samples. It flips only
when real reviews are rendered from a real feed.

---

## Distributor and manufacturer presence — useful for the ATD application

Extreme Tires already appears as a location in:

- Goodyear dealer locator
- Cooper Tire dealer locator
- Pirelli shop finder
- SimpleTire shop directory

That is independent evidence of an established tire retailer rather than a new
storefront, and it is worth citing in the dealer application.

⚠️ It also means the shop has existing manufacturer relationships that the
TireDrop catalog does not reflect — the catalog carries six brands and no
Goodyear, while the shop is a listed Goodyear location. Worth reconciling
before anyone from ATD compares the two.

---

## Services the parent lists, against what TireDrop sells

Listed by the parent: used tires · flat tire repair · wheel alignment ·
mobile tire repair · tire installation · tire balancing · commercial tires ·
wheels.

⚠️ **Used tires are absent from TireDrop entirely.** That is a real part of
the parent's business and may be deliberate for a national drop-ship store —
but it is a decision nobody has recorded, not an oversight to leave standing.

---

## Open — only the client can answer these

1. **Registered entity name** — "Extreme Tires", "Extreme Mobile Tires", or an
   LLC name behind both. Must match the dealer application exactly.
2. **EIN**, Florida resale certificate, certificate of insurance.
3. **A TireDrop email address.** `BUSINESS.email` is null and every page falls
   back to the phone.
4. **Google Place ID**, to replace the Maps search fallback with a direct
   review link.
5. **Instagram and YouTube** — Facebook is confirmed and wired; the other two
   stay hidden until someone confirms they exist.
6. **Return policy numbers**: window, who pays return freight, restocking fee,
   damage-claim deadline.
7. **Whether the owner and team names on `/about` are accurate.** A reviewer
   may compare them against the name on the dealer application.

---

## Sources

- https://www.yelp.com/biz/extreme-tires-sunrise
- https://www.extrememobiletires.com/ (titles and descriptions via search; the page itself is unreachable from this environment)
- https://www.facebook.com/Extremetires/
- https://www.goodyear.com/en_US/location/SUNRISE-FL-33351-US-000123213
- https://www.coopertire.com/en_US/location?storeid=000123213
- https://www.pirelli.com/tires/en-us/car/near-tire-shops-and-repair/united-states/lauderdale-lakes/us0007078748
- https://simpletire.com/tire-shops/shop/extreme-tires/95041
- https://www.chamberofcommerce.com/business-directory/florida/sunrise/tire-shop/2023085762-extreme-tires
