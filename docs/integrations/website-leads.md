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
TireDrop Shopify app:

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
   About: Order Question
   Message:
   Do you have 225/45R17 for a 2019 Civic?
   ```

   - to the customer metafield **`tiredrop.last_lead`**
     (`multi_line_text_field`) with `metafieldsSet`: always the newest lead;
   - at the **top of the customer note** (`customerUpdate`), above earlier
     entries, separated by a `----------` line. The note is kept under
     4,500 characters by dropping the oldest website leads first; text staff
     typed into the note is only cut, from its end, if it alone is too long.
3. **Fire the alert:** `tagsRemove ["new-lead"]`, then
   `tagsAdd ["new-lead", "lead", "lead-<form>"]`. Removing first means a
   returning customer gets the tag *added* again, so Flow emails every lead,
   not just the first.
4. The site answers `{ ok: true }` and the form shows its "received"
   confirmation. If Shopify refuses or is down, the visitor sees the honest
   "could not get that through, please call" confirmation instead.

Form tags: `lead-contact`, `lead-financing`, `lead-fleet-quote`,
`lead-booking`, `lead-order-request`. `lead` is on everyone who ever sent
one, so Customers → filter by tag `lead` lists them all.

Spam: a hidden `website` honeypot field (a bot that fills it gets a success
and nothing is stored) and a per-IP limit of 5 submissions in 10 minutes.

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

  Earlier messages from this customer are in the customer's notes.
  ```

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
- If the email arrives with the lead section empty, replace the whole
  `{% for mf … %}…{% endfor %}` line with `{{ customer.note }}`. The newest
  lead is always at the top of the note, so the email still leads with it
  (followed by older ones).
- Use Flow's own **Add variable** picker if it names a field differently;
  the picker is always right.

**Test it** with your own details on the live site's contact form: one email
should reach info@ within a minute or two, the customer should show tags
`lead`, `lead-contact` (and no `new-lead` once Flow has run), and the note
and the "last lead" metafield should hold the message. Send a second message
with the same email: a second email should arrive.

### Optional: show the metafield on the customer page

Shopify admin → Settings → Custom data → Customers → Add definition:
name "Last website lead", namespace and key `tiredrop.last_lead`, type
**Multi-line text**. The type must be multi-line text, or the API's writes
are refused. Without a definition the value is still stored and still
emailed; it just is not shown on the customer page.

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
- linked to the customer; **no invoice is sent** (the API never calls
  `draftOrderInvoiceSend`).

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
  customer: customerByIdentifier(identifier: $identifier) { id note }
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
mutation leadTagsRemove($id: ID!, $tags: [String!]!) {
  tagsRemove(id: $id, tags: $tags) { node { id } userErrors { field message } }
}
mutation leadTagsAdd($id: ID!, $tags: [String!]!) {
  tagsAdd(id: $id, tags: $tags) { node { id } userErrors { field message } }
}
mutation draftOrderCreate($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) { draftOrder { id name invoiceUrl } userErrors { field message } }
}
```

`customerCreate` input is only `{ firstName, lastName, email, phone }`
(fields left out when empty). If Shopify refuses the phone for a new
customer (invalid, or already on another customer), the customer is created
without it and the phone stays in the lead text.
