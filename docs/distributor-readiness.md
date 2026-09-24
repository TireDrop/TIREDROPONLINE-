# Distributor readiness — TireDrop

Audience: a dealer-approval reviewer at American Tire Distributors (or U.S.
AutoForce) asking three questions — _is this a real business, is the site
finished enough to represent our products, and will it embarrass us._

**About the standards used here.** Nobody on this project has ATD's
dealer-approval checklist. Every item below is labelled with where its standard
comes from:

- **general norm** — ordinary US e-commerce / consumer-protection practice, or
  the FTC-style expectation that published claims be substantiated.
- **common practice** — what wholesale distributors are widely understood to
  look for. Informed expectation, not a document anyone has read.
- **documented** — something actually verified in this repository, in the
  running site, or in `src/data/business.js`.

No business fact has been invented anywhere in this pass. Where a page needed a
fact nobody has, the page was written to work without it and the fact is listed
under **Client must supply**.

---

## Blockers

### 1. The site names ATD and U.S. AutoForce as existing suppliers

**Standard: documented.** `src/pages/HomePage.jsx:704` reads:

> "orders drop-ship from the ATD and U.S. AutoForce networks, so you get
> distributor pricing and a catalog nobody could hold in a warehouse."

**Why a reviewer cares.** This is the single worst sentence on the site for this
specific audience. The whole purpose of the submission is to _obtain_ an ATD
account; the homepage asserts the relationship already exists. A reviewer reads
that as either a misunderstanding of the application they are processing, or as
a business willing to claim affiliations it does not have. It also names a
competing distributor in the same breath.

**Who fixes it: TireDrop.** The claim must come out before the site is sent.
The underlying truth — drop-shipped from national distributor warehouses rather
than held in a back room — can be said without naming anyone.

**Not fixed in this pass:** `HomePage.jsx` is outside this audit's file scope.
This is the highest-priority handover item.

---

### 2. There is no return window, restocking fee or damage-reporting deadline anywhere on the site

**Standard: general norm.** A returns and refunds policy that states a window,
condition requirements, who pays return freight, any restocking fee, and how a
damaged or wrong delivery is handled is baseline US e-commerce. **Common
practice:** a distributor reviewing a prospective dealer expects a customer to
be able to find it without calling.

**Verified state.** `grep` across `src/pages` and `src/data` finds no stated
return window — no "30 days", no restocking percentage, no damage deadline.
`/checkout` mentions returns nowhere at all.

**The defect that was fixable, and was fixed.** Terms §9 previously read _"The
return window and any restocking fee are stated at checkout and on your order
confirmation."_ They are not stated at checkout. A policy that forwards the
reader to a document that does not exist is worse than one that admits the
number is not set. That sentence has been replaced with language that does not
make a false cross-reference. `src/pages/support/LegalPage.jsx` also now carries
an explicit editing rule against reintroducing forward references to unpublished
facts.

**What is still blocked.** The actual numbers. **The client must supply them**
(see below). Until then the policy is honest but thin, and thin is what a
reviewer will notice.

---

### 3. There is no standalone shipping policy or returns policy document

**Standard: general norm / common practice.** Shipping and returns are normally
separate, linkable documents — partly so a distributor, a payment provider or a
marketplace can be pointed at a URL.

**Verified state.** `/shipping` is a marketing page. The only policy text lives
inside `/terms` as sections 6, 7, 9 and 10. Before this pass the footer's single
"Returns" link pointed at `/terms` with no anchor, dropping the reader at the
top of a fifteen-section document.

**Partly fixed.** Within the files this audit owns:

- The footer now links **Returns & Refunds** → `/terms#returns` and **Shipping
  Policy** → `/terms#shipping` (`src/data/business.js`).
- `LegalPage` now scrolls to the requested section on arrival — the app's
  global `ScrollToTop` was previously cancelling every anchor.
- The Terms page opens with a "The four people ask for most" panel linking
  directly to Shipping, Returns & refunds, Damaged or wrong items, and
  Warranties.

**Who finishes it: TireDrop,** once the client supplies the numbers. Promoting
returns and shipping to their own routes (`/returns`, `/shipping-policy`)
requires edits to `src/App.jsx`, outside this audit's file scope. Recommended
before sending — a reviewer who can paste a returns-policy URL into a form is a
reviewer who stops asking.

---

### 4. `/tire-check` gives a safety verdict the business cannot stand behind

**Standard: general norm** (product-safety claims must be substantiated and
must not displace professional inspection). Tire retail carries real liability
here.

**Verified state.** `src/pages/tools/TireCheckPage.jsx:983` tells a visitor, on
the strength of one self-measured tread number:

> "Hydroplaning starts here too. **Safe to drive on**, worth planning to
> replace."

The page carries no disclaimer that the tool is not a substitute for physical
inspection. Tread depth is one of several things that condemn a tire — sidewall
damage, age, belt separation, uneven wear and prior repairs are not asked about
and cannot be. The same page elsewhere models good practice (the size-comparison
tool says outright "We are not going to tell you this swap is safe"), so the
standard is already understood in this codebase; it just is not applied here.

**Why a reviewer cares.** A distributor is asking whether this site will
embarrass them. A tire retailer's website declaring a tire "safe to drive on"
sight-unseen is the kind of sentence that ends up in a demand letter.

**Who fixes it: TireDrop.** Change the verdict from a safety declaration to a
tread statement ("the tread is still legal, but …"), and add a standing note
that the tool reads tread only and does not replace an inspection.

**Not fixed in this pass:** outside this audit's file scope.

---

### 5. The business publishes no email address

**Standard: common practice.** A distributor's dealer-approval process runs on
email — applications, W-9s, resale certificates, credit references, EDI setup.
**General norm:** most e-commerce sites publish a contact email.

**Verified state.** `BUSINESS.email` is `null`. No email address appears
anywhere in the rendered site (checked across all seven support and legal
routes).

**The defect that was fixable, and was fixed.** The contact page previously
turned the gap into a stated policy: _"We do not publish an email address,
because email is where questions go to sit for two days."_ To a reviewer whose
own process is email-based, that reads as evasive rather than principled. Both
that line and the matching sentence in Terms §1 now say plainly that a dedicated
address is being set up and that the phone reaches a person until it is.

**Who fixes it properly: the client.** One mailbox on the `tiredroponline.com`
domain, then set `BUSINESS.email` — every page picks it up.

**Resolved.** The owner confirmed `info@tiredroponline.com` as the single
business address. `BUSINESS.email` now holds it; the footer, contact, locations
and legal pages link to it, the Organization structured data emits it, and the
"being set up" sentences are gone.

---

### 6. No legal entity is named anywhere

**Standard: general norm / common practice.** A reviewer wants the registered
entity, and wants it to match the name on the dealer application and the resale
certificate.

**Verified state.** `business.js` previously asserted `legalName: "TireDrop"`,
which is a trade name, not a registered company — and nothing rendered it
anyway. No entity, state of formation or document number appears on the site.

**Partly fixed.** `legalName` is now `null` alongside `entityState` and
`entityNumber`, with a comment explaining that these are deliberately empty and
must not be guessed. Two places now render an entity line **only when the field
is populated** — the Terms/Privacy/Accessibility closing address block, and a
new "Who you are dealing with" panel on `/locations` (trading name, registered
entity, place of business, where it ships, where it installs). Fill in one
field in `business.js` and the site states its entity correctly everywhere.

**Who finishes it: the client**, by supplying the name.

---

### 7. The privacy policy described a site that does not exist

**Standard: general norm.** An inaccurate privacy policy is a worse defect than
a thin one — it is a representation to consumers, and every claim in it is
checkable from the browser in about fifteen seconds.

**Verified state before the fix.** The site sets **no cookies at all**
(`document.cookie` is empty on every route), runs **no analytics**, loads **no
tracking pixels**, makes **no network requests** (`grep` finds no `fetch`, no
`axios`, no third-party script), captures **no email addresses**, and takes
**no payment** — `/checkout` says so itself: "No card is charged on this site."
The only browser storage is `localStorage` for the cart, an applied promo code
and the comparison tray. _(Superseded: promo codes have since been removed, so
storage is now the cart and the comparison tray only.)_

The policy nevertheless claimed: a payment processor holding card data; cookies
including optional analytics cookies; aggregate traffic measurement; and
"Payment processors" as a category of third party receiving customer data.

**Fixed.** `LegalPage.jsx` privacy sections 1, 2, 3, 4, 6 and 7 now describe the
actual implementation — including a §3 that states outright that the site sets
no cookies and runs no analytics, names the three `localStorage` keys, and
invites the reader to check in developer tools. This is now a _stronger_ privacy
story than the boilerplate it replaced, and it is true.

**Standing requirement:** if analytics, a payment processor or an email platform
is ever added, §3 has to change in the same commit. That rule is written into
the file header.

---

### 8. Contact and financing forms confirm a reply that nothing sends

**Standard: general norm.** Known and deliberate per the project brief (forms
validate and confirm; there is no backend), so the _stub_ is not the finding —
the **copy** is.

**Verified state.** The contact form told the customer "A real person reads
these during business hours and **will get back to you**", and the financing
form promised a call-back. Nothing is transmitted.

**Partly fixed.** Both confirmations now route urgency to the phone explicitly
("the phone is the only channel we treat as urgent"), and neither states a
response time the business has not committed to. The contact page's message
panel now says the form is not monitored around the clock.

**Who finishes it: TireDrop.** Before this site takes a real customer, both
forms need a destination — a mailbox, a form service, anything. A form that
silently discards a message while confirming receipt is a consumer-facing
defect independent of what any distributor thinks.

---

### 9. Advertised brand with an empty catalog

**Standard: general norm** (do not advertise what cannot be bought).

**Verified state.** `TIRE_BRANDS` listed Goodyear, which appeared in the footer
brand strip, the homepage brand row, the coupons page (since removed) and the
About page brand list — seven brands advertised. `src/data/products.js` contains **zero**
Goodyear products. Clicking Goodyear in the footer landed on
`/tires?brands=Goodyear` → _"0 tires of 20 — No tires match those filters."_
The About page simultaneously claimed "7 Tire brands in the catalog" while the
brand filter offered six.

**Fixed.** Goodyear removed from `TIRE_BRANDS`, with a comment explaining that
the roster must stay equal to `TIRE_BRAND_NAMES` derived from the catalog. The
About page now derives its brand count and brand list from the products
themselves, so that number can never again exceed what a visitor can filter to.
Verified: footer now shows six brand links, About reads "6 — Tire brands you can
buy today".

**Client decision:** if Extreme Tires does carry Goodyear, add the products
first; do not re-add the name on its own.

---

### 10. Dead social links in the footer

**Standard: general norm.** Four social icons in the footer point at `href="#"`.

**Why a reviewer cares.** Minor on its own, but a reviewer checking whether a
business is real usually clicks the social links. Four that go nowhere reads as
unfinished.

**Who fixes it: the client supplies the URLs** (or confirms there are none, in
which case TireDrop removes the icons). `src/components/layout/Footer.jsx`,
outside this audit's file scope.

---

## Categories that are clean

Worth stating plainly, per the brief:

- **Financing page.** No lender is named, no APR is quoted, no approval odds are
  implied, and the disclosure block is genuinely careful. The only correction
  needed was the payment-method contradiction (see Changes). A reviewer will
  have no complaint here.
- **Accessibility statement.** Measured, commits to WCAG 2.1 AA as a target
  rather than claiming conformance, has a real "known limitations" section, and
  gives a reporting route. Its specific claims — keyboard access, labelled
  fields, reduced-motion support — hold up in the code
  (`prefers-reduced-motion` is honoured in `src/index.css:209`).
- **Terms of Use** structure. Fifteen sections covering ordering, pricing,
  fitment responsibility, shipping, ship-to-store, appointments, returns,
  damage, warranties, liability and Florida governing law, with a working
  in-page contents nav. The gaps are missing _numbers_, not missing _sections_.
- **Locations / install area.** All ten towns in `installArea` are genuinely in
  Broward County, matching the "Broward County only" claim. The 48-state
  shipping figure is consistent with Terms §6 excluding Alaska, Hawaii and US
  territories.
- **Contactability.** Phone appears on every page, in the header, the footer and
  a persistent mobile call bar, with a working `tel:` link.

---

## Changes made in this pass

Files touched (the only files this audit owned):

**`src/data/business.js`**

- `legalName` changed from the trade name `"TireDrop"` to `null`, joined by
  `entityState` and `entityNumber`, all commented as must-not-guess fields.
- Goodyear removed from `TIRE_BRANDS`; comment added tying the roster to the
  catalog.
- `email: null` comment rewritten to say why the gap matters and that it is the
  first one to close.
- Footer: single "Returns → /terms" replaced with "Returns & Refunds →
  /terms#returns" and "Shipping Policy → /terms#shipping".

**`src/pages/support/LegalPage.jsx`**

- Privacy §§1, 2, 3, 4, 6, 7 rewritten to match the implementation: no cookies,
  no analytics, no tracking, no card data on this site, `localStorage` named
  and explained.
- Terms §9 no longer cross-references a return window "stated at checkout".
- Terms §10 no longer cross-references a reporting period on an order
  confirmation; it asks for a same-day call and says we will state the deadline.
- Terms §1 no longer frames the missing email as policy.
- New "The four people ask for most" panel on the Terms page.
- Hash-anchor scrolling added, so the new footer deep links actually land on
  their sections (verified: `#returns` scrolls to the section, 96px from the top).
- Entity line in the closing address block, gated on `BUSINESS.legalName`.
- File header now carries two standing editing rules: keep the privacy policy
  synchronised with the code, and never point at a document that does not exist.

**`src/pages/support/ContactPage.jsx`**

- "We do not publish an email address, because email is where questions go to
  sit for two days" → an honest statement that an address is being set up.
- Form confirmation no longer implies a reply commitment the business has not
  made; the phone is named as the only urgent channel.
- "Reach Us" now states the TireDrop ↔ Extreme Tires relationship and the shop
  address, so the business identity is visible on the page a reviewer opens
  first.
- Form privacy note now states there is no mailing list.

**`src/pages/support/AboutPage.jsx`**

- Brand count and brand list now derived from `TIRE_BRAND_NAMES` (the catalog),
  not from the display roster. Reads 6, matches the filter.
- Stat labels tightened; the footnote no longer describes verifiable figures as
  "directional and illustrative" — it now says where each number comes from.
- "Every brand we list is one we have fitted, balanced and seen come back after
  30,000 Florida miles" — an unverifiable absolute — replaced.
- "Family-run" / "family shop" replaced with "independent" in three places, as
  family ownership is not recorded in `business.js` and nobody has confirmed it.
  **Reversible the moment the client confirms it** — see below.

**`src/pages/support/LocationsPage.jsx`**

- New "who you are dealing with" definition list: trading name, registered
  entity (renders only when supplied), place of business, shipping area,
  install area.
- Hero now states the TireDrop ↔ Extreme Tires relationship as "one business,
  one address, one phone number".

**`src/pages/support/FinancingPage.jsx`**

- "Card at checkout ... processed by our payment provider" → "Card, by phone",
  matching what `/checkout` actually says. Same correction in the payment-methods
  FAQ.
- New disclosure paragraph: financing availability is not guaranteed and this
  page describes how it works when it is available.
- Request-form confirmation no longer implies a call-back window.

Verification: `npm run lint` → **0 errors** (4 pre-existing warnings, none in
these files). `npx vite build` clean. All seven routes driven in Chromium at
390px and 1280px — no console errors, no horizontal overflow, deep links and the
identity panel confirmed rendering.

---

## Client must supply

Justin / Extreme Tires — these are the facts, documents and decisions nobody on
the build side can supply. Ordered by what blocks the distributor submission
first.

**Identity and paperwork**

1. **Registered legal entity name** — the exact name on the state filing (e.g.
   "Extreme Tires LLC"). → `BUSINESS.legalName`.
2. **State of formation** and, if you want it published, the **Sunbiz document
   number**. → `BUSINESS.entityState`, `BUSINESS.entityNumber`.
3. **EIN** — for the distributor application. Not published on the site.
4. **Florida resale / sales tax certificate** — a distributor will not open a
   wholesale account without one. Not published on the site.
5. **Certificate of insurance** — garage liability and, if the vans are doing
   mobile work, commercial auto. Commonly requested at dealer approval. Not
   published on the site.
6. **Confirm the relationship as you want it stated**: is TireDrop a DBA of the
   same entity as Extreme Tires, or a separate company? The ATD account and the
   website need to obviously belong to the same business, and right now the site
   says "Powered by Extreme Tires" without saying what that means legally.

**Contact**

7. **A working email address** on `tiredroponline.com`. This is the single
   highest-value item on the list — it unblocks the dealer paperwork itself and
   removes the most conspicuous gap on the site. → `BUSINESS.email`.
8. **Where the contact form and the financing request should go** — that
   mailbox, or a form service. Until then both forms confirm and discard.
9. **Social media URLs**, or confirmation that there are none so the four dead
   footer icons can be removed.

**Returns, shipping and warranty decisions**

10. **The return window in days.** Change-of-mind returns: how long?
11. **Who pays return shipping** on a change-of-mind return (the terms currently
    say "generally the customer's cost" — confirm or correct).
12. **Restocking fee** — a percentage, or none.
13. **Damage / wrong-item / shortage reporting deadline** — how many days from
    delivery. This is usually dictated by the distributor and the carrier; once
    the ATD account exists, take it from their terms.
14. **Condition requirements** beyond "unused and uninstalled" — is a mounted
    tire final, are labels and chalk marks required.
15. **Special orders** — returnable or not.
16. **When title and risk of loss pass** on a drop-shipped order — a question
    for counsel, informed by the distributor's own terms.

Items 10–13 should be published in three places once decided: Terms §9 and §10,
the checkout page, and the order confirmation.

**Claims to confirm or correct**

17. **Is the business family-owned?** Three references to "family" were changed
    to "independent" because nothing on record confirms it. Say the word and
    they go back.
18. **Resolved — no personal names on the site.** The team section and every
    staff, reviewer and sample name were removed from both the React site and
    the Shopify theme at the owner's request. If names are added back later,
    they must match the dealer application exactly.
19. **"A fleet of vans"** — both About and Locations say vans, plural, and a
    stat counts ten towns covered. Confirm the real number of mobile units.
20. **Founding year 2007** — confirm; every "years in business" figure on the
    site is computed from it.
21. **Which brands the shop can actually supply.** The catalog currently
    supports six tire brands. Anything the shop genuinely carries should be
    added to `products.js` before it is advertised anywhere.
22. **Financing** — is a lender program actually in place, and which one? If
    none is signed, the financing page should say "coming soon" rather than
    describe a process that cannot start today.

**Legal review**

23. **Counsel review of all three legal documents** before launch. The
    file header in `LegalPage.jsx` lists the specific open questions: entity and
    state of formation, the return numbers above, title and risk of loss,
    warranty administration, whether an arbitration or class-action waiver is
    wanted, and state-specific privacy rights language (CA, VA, CO and others).
    The privacy policy is now accurate to the implementation, but accurate is
    not the same as reviewed.
