# Website leads (forms and order requests → Shopify → info@)

**Status: built and unit-tested with a mocked Shopify. Never run against a
real store from this repository.** It turns on by itself once the
`SHOPIFY_*` variables are set (`/api/status` shows `forms: "on"`). The only
thing to build by hand is the Flow workflow below.

No form service, no Zapier, no extra app. The website's own API writes each
lead to the Shopify customer, and Shopify Flow (already installed) emails it
to info@tiredroponline.com.

## What happens on each submission

`POST /api/forms` (`api/forms.js`, `api/_lib/leads.js`) for the contact,
financing, fleet quote and install booking forms, and checkout's order
requests (`api/_lib/orders.js`), all do the same four things through the
TireDrop Shopify app (after the spam guard below lets them through):

1. **Find or create the customer.** `customerByIdentifier` by email (or by
   phone when the form has no email). No match: `customerCreate` with first
   and last name, email and phone, **nothing else: no marketing consent, no
   tags.** A contact form never subscribes anyone. A match keeps its name and
   email untouched.
2. **Write the lead** as plain text, for example:

   ```text
   TireDrop contact form — 2026-09-28 14:05 ET
   Name: Pat Lee
   Email: pat@example.com
   Phone: (954) 555-0100
   Email check: UNVERIFIED. Typed on the website; anyone can enter any address. Confirm with the customer before sharing order or account details.
   Customer: Existing customer. Their Shopify note was NOT changed; this and earlier website messages are in the customer metafield tiredrop.leads.
   About: Order Question
   Message:
   Do you have 225/45R17 for a 2019 Civic?
   ```

   Nobody proves they own the email or phone they type, so every lead says
   so ("Email check", or "Phone check" for a phone-only lead). A booking
   for a paid order says instead "Matches the email on paid order #1001;
   not otherwise verified." The "Customer: Existing customer …" line is
   there only when the email (or phone) already belonged to a customer.

   Where it goes:

   - the customer metafield **`tiredrop.last_lead`**
     (`multi_line_text_field`): always the newest lead. This is what the
     Flow emails;
   - the customer metafield **`tiredrop.leads`** (`json`): the last 10
     leads, newest first, each `{ at, form, text }`. One submission can
     only add an entry, never rewrite another's;
   - the **customer note**, ONLY for a customer this submission created.
     **An existing customer's note is never read, appended to or
     overwritten from the website**, because anyone can type anyone's email:
     what staff wrote there stays exactly as they left it.

   Both metafields are written in one `metafieldsSet` call.
3. **Fire the alert:** `tagsAdd ["new-lead", "lead", "lead-<form>"]`.
   Tags are only ever **added** from the website, never removed. Flow
   removes `new-lead` itself after each email (action 2 below), so a
   returning customer's next lead adds it again and Flow emails every lead.
   If `new-lead` is still on the customer when a lead arrives (Flow has not
   finished the previous one, or failed), Vercel logs
   `[leads] … still has "new-lead"`; the lead is saved in both metafields
   either way.
4. The site answers `{ ok: true }` and the form shows its "received"
   confirmation. If Shopify refuses or is down, the visitor sees the honest
   "could not get that through, please call" confirmation instead.

Form tags: `lead-contact`, `lead-financing`, `lead-fleet-quote`,
`lead-booking`, `lead-order-request`. `lead` is on everyone who ever sent
one, so Customers → filter by tag `lead` lists them all.

## Spam guard (no captcha, no app)

`api/_lib/spam.js`, on `/api/forms`, `/api/checkout`, `/api/newsletter` and
`/api/book-install`:

| Check | What happens |
| --- | --- |
| Per-IP rate limit (per warm instance) | forms 5 / 10 min, newsletter 5 / 10 min, checkout 10 / 10 min, book-install 5 / 10 min plus the 10 / 10 min lookup budget it shares with `/api/track`. Over it: `429` with `Retry-After: 600`. Vercel sets the client IP header itself, so a client cannot fake it. |
| Body size cap | forms 16 KB, checkout 16 KB, newsletter 2 KB, book-install 4 KB: `413`. Checked on Content-Length, on Vercel's pre-parsed body and on a streamed one. Every field also has its own length cap (validators). |
| Honeypot `website` | `<FormTrap />`: off-screen, `aria-hidden`, `tabindex -1`, `autocomplete off`, labelled "Leave this empty". Filled: bot. |
| Fill time `ft` | `src/data/formGuard.js`: each form notes when it appeared and sends how long it was on screen, with a checksum. Under **2 seconds**, or a forged token: bot. No token at all (a page loaded before this shipped): `400` "This page is out of date… reload", nothing stored. |
| Content | a link (`http://`, `https://`, `www.`, `<a`, `[url`) in a person's name; more than 3 links in the text; HTML/BBCode link markup; or a link together with a classic spam phrase (SEO services, backlinks, casino…). Nothing else: a false positive silently loses a customer. |

A bot gets the endpoint's normal success (`{ ok: true }`; checkout a
request-mode answer that looks sent; book-install its usual 404) and nothing
is priced, looked up, created or written. Each block is logged as
`[spam] blocked <endpoint> <reason>` (and `[spam] rate-limited <endpoint>`)
with no name, email, phone, message or IP.

The token is obfuscation, not a signature: it stops scripts that post blind,
which is most form spam, without a server round trip before every form. The
2-second threshold is below anything a person manages on these forms, even
with autofill (the browser checks fill them in about 0.6 s, which is why they
use test mode).

**Test mode:** `SPAM_GUARD_TEST_MODE=1` drops the minimum fill time to 0
for the browser checks (`npm run check:forms`), which run the real guard
over every submission the pages send. It is ignored when `VERCEL_ENV` is
`production`, and nothing sets it on Vercel.

## The Flow workflow: "Website lead alert"

Build it once in Shopify admin → Apps → Flow → Create workflow. Name it
exactly **Website lead alert** and turn it **on**.

**Trigger:** `Customer tags added`

**Condition:** `Customer` / `Tags` → **includes** → `new-lead`

(If the trigger's condition picker offers the tags that were just added,
for example "Tags added" or "Added tags", checking that list for `new-lead`
is equally right and slightly stricter. Either works: the API only ever adds
`new-lead` together with a fresh lead.)

**Then, action 1: Send internal email**

- **To:** `info@tiredroponline.com`
- **Subject:**

  ```liquid
  New website lead: {{ customer.displayName }}
  ```

- **Message:**

  ```liquid
  {% for mf in customer.metafields %}{% if mf.namespace == "tiredrop" and mf.key == "last_lead" %}{{ mf.value | newline_to_br }}{% endif %}{% endfor %}

  Customer: {{ customer.displayName }}
  Email: {{ customer.defaultEmailAddress.emailAddress }}
  Phone: {{ customer.defaultPhoneNumber.phoneNumber }}
  Open in Shopify: https://{{ shop.myshopifyDomain }}/admin/customers/{{ customer.legacyResourceId }}

  Earlier website messages from this customer are in the customer metafield tiredrop.leads.
  ```

  (Workflows built before 2026-10-01 end with "Earlier messages from this
  customer are in the customer's notes." That line is now only true for new
  customers; prompt 24 in `docs/business/shopify-admin-prompts.md`
  updates it.)

**Then, action 2: Remove customer tags** → `new-lead`

Order matters: the email step first, then the tag removal. Removing a tag
fires "Customer tags removed", not "Customer tags added", so this does not
loop.

### What was confirmed, and what to check when you build it

Confirmed from Shopify's developer docs and schema (not by running Flow):

- Shopify emits a **customer tags added** event whenever tags are added to
  a customer, from the admin or an app (`CUSTOMER_TAGS_ADDED`,
  `customer.tags_added`: "Triggers when tags are added to a customer",
  scope `read_customers`). That is the event behind Flow's "Customer tags
  added" trigger.
- Every field the email uses exists on the Admin API `Customer` object,
  which is what Flow's Liquid variables are named after: `displayName`,
  `defaultEmailAddress.emailAddress`, `defaultPhoneNumber.phoneNumber`,
  `note`, `tags`, `legacyResourceId`, and `metafields` (each with
  `namespace`, `key`, `value`); and `shop.myshopifyDomain`. Checked with
  the schema validator.

Not confirmed from here: Shopify's Flow help pages (help.shopify.com) could
not be opened from this environment, so the exact name of the trigger's
own "added tags" variable and Flow's filter support were not read first
hand. When you paste the message, Flow checks the Liquid on save:

- If it rejects `newline_to_br`, delete `| newline_to_br` (the lead then
  arrives as one paragraph, still complete).
- If the email arrives with the lead section empty, use Flow's **Add
  variable** picker to insert the customer's `tiredrop.last_lead`
  metafield value instead of the loop. **Do not fall back to
  `{{ customer.note }}`:** since 2026-10-01 the website never writes an
  existing customer's note, so the note would show old text, not the new
  lead.
- Use Flow's own **Add variable** picker if it names a field differently;
  the picker is always right.

**Test it** with your own details on the live site's contact form: one email
should reach info@ within a minute or two, the customer should show tags
`lead`, `lead-contact` (and no `new-lead` once Flow has run), and the "last
lead" metafield should hold the message (the note too, if the form created
the customer). Send a second message with the same email: a second email
should arrive, marked "Existing customer", and the note should not change.

### Optional: show the metafields on the customer page

Shopify admin → Settings → Custom data → Customers → Add definition:
name "Last website lead", namespace and key `tiredrop.last_lead`, type
**Multi-line text**; and name "Website leads", namespace and key
`tiredrop.leads`, type **JSON**. The types must match, or the API's writes
are refused. Without definitions the values are still stored and still
emailed; they just are not shown on the customer page.

## Order requests (checkout "request" mode)

Until ATD is live, checkout does not take payment. Each order request (and
every mobile install booking, always) is recorded like a form, with form
`order-request`, **and** becomes a Shopify **draft order**:

- the same custom line items and server prices a paid checkout would use,
  the `Delivery`, `Source` and `Order ref` attributes, discounts switched
  off (`docs/integrations/shopify-checkout.md`);
- tags `order-request`, `vercel-live` and `ship-to-home`, `ship-to-store` or
  `mobile-install`;
- a note starting "Request only — confirm price and availability, then Send
  invoice."; mobile drafts have no shipping line and a note to add the
  install charge quoted on the call;
- linked to the customer only when the request created that customer. A
  request typed with an existing customer's email is NOT linked to them,
  and every request draft's note says "Email UNVERIFIED (typed on the
  website): confirm it with the customer by phone before you send the
  invoice." The typed name, address and notes live on the draft and in the
  lead, never on the existing customer;
- **no invoice is sent** (the API never calls `draftOrderInvoiceSend`).

The lead email lists the items, quantities, prices, total before tax and
fees, delivery choice and address (or pickup), the order reference and the
draft's name (e.g. `#D12`). To finish the sale: Shopify → Orders → Drafts →
open the draft, confirm the price and availability (add the install for
mobile), then **Send invoice**. The customer pays on Shopify's checkout and
the draft becomes a normal order.

If the draft cannot be created, the lead email says so and the full order is
in the Vercel function log; enter it by hand. If the lead itself cannot be
recorded, checkout tells the shopper plainly that the request did not reach
the shop and to call.

## Scopes

`read_customers` and `write_customers` (customers, note, metafield, tags) and
`write_draft_orders` / `read_draft_orders` (order-request drafts). Both pairs
are already in the app's list (`docs/integrations/shopify-checkout.md`). No
other scope and no other app is needed.

## The operations (validated against the Admin GraphQL schema)

```graphql
query leadCustomer($identifier: CustomerIdentifierInput!) {
  customer: customerByIdentifier(identifier: $identifier) {
    id tags leads: metafield(namespace: "tiredrop", key: "leads") { value }
  }
}
mutation leadCustomerCreate($input: CustomerInput!) {
  customerCreate(input: $input) { customer { id } userErrors { field message } }
}
mutation leadNoteUpdate($input: CustomerInput!) {
  customerUpdate(input: $input) { customer { id } userErrors { field message } }
}
mutation leadMetafieldSet($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) { metafields { id } userErrors { field message code } }
}
mutation leadTagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) { node { id } userErrors { field message } }
}
mutation draftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) { draftOrder { id name invoiceUrl } userErrors { field message } }
}
```

`leadNoteUpdate` (`customerUpdate`) runs only for a customer the same
submission just created. `customerCreate` input is only
`{ firstName, lastName, email, phone }`
(fields left out when empty). If Shopify refuses the phone for a new
customer (invalid, or already on another customer), the customer is created
without it and the phone stays in the lead text.
