# Turning the forms on

The site's forms (contact, financing, fleet quote and install booking) and
checkout's order requests send to TireDrop's **own** backend, not to a
form service. Each message is stored on the customer in Shopify and Shopify
Flow emails it to **info@tiredroponline.com**. No Formspree, no Zapier, no
other app.

Until it is on, every confirmation says plainly that the message was not
sent and points at the phone. That is deliberate: a form that tells a real
visitor "a specialist will follow up" while sending their message nowhere is
the one thing on this site that makes a promise nothing keeps.

## What turns it on

1. **The TireDrop Shopify app is connected.** The same `SHOPIFY_*` variables
   in Vercel that checkout and the newsletter use (`docs/ops/deploy.md`). The app
   needs `read_customers` and `write_customers` (and the draft-order scopes
   for order requests). Once Shopify is configured, `/api/status` shows
   `forms: "on"` and every form starts sending. Nothing is rebuilt: the
   forms ask the server when the page loads.
2. **The Flow workflow "Website lead alert" is built and on.** It is what
   turns a stored lead into an email. The exact trigger, condition, email
   and tag step are in `docs/integrations/website-leads.md`. Without it,
   leads are still stored on the customer in Shopify, but nobody is emailed.

## What arrives

One email per message, to info@, subject "New website lead: <name>". The
body starts with the lead exactly as stored, for example:

```text
TireDrop fleet quote request — 2026-09-28 14:05 ET
Name: Jo Park
Email: jo@acme.test
Company: Acme Vans
Fleet size: 6-15
Tire sizes: LT245/75R16 x 24
Notes: Box trucks.
```

The first line names the form: "TireDrop contact form", "TireDrop financing
request", "TireDrop fleet quote request", "TireDrop install booking request"
or "TireDrop order request". The email is sent by Shopify, not by the
customer, so answer by writing to the customer's address in it or calling
the phone in it; check where "Reply" goes before relying on it.

In Shopify, the customer carries tags `lead` and `lead-<form>`, the newest
lead in the "last lead" metafield, and every lead (newest first) in the
customer's notes. Nobody is subscribed to marketing by sending a form.

## Order requests

Until ATD is live, checkout does not take payment. An order request (and
every mobile install booking) sends the same kind of email, and also puts a
**draft order** in Shopify → Orders → Drafts with the tires, quantities and
the site's prices. No invoice is sent. Confirm the price and availability
(add the install for mobile), then click **Send invoice**; the customer pays
on Shopify's checkout. Details: `docs/integrations/website-leads.md`.

## Checking it worked

1. Open `https://tiredroponline.com/api/status`: it should include
   `"forms":"on"`.
2. Submit the contact form with your own details. The confirmation should
   say "Message received". If it says the form is not connected, Shopify is
   not configured yet (step 1 above).
3. The email should reach info@ within a minute or two. If it does not,
   check the customer in Shopify: if the note and tags are there, the site
   worked and the Flow workflow is off or wrong.

If the server cannot reach Shopify, the confirmation says so specifically
("We could not get that through just now…") rather than claiming delivery.
That branch is deliberate and should not be removed.

## The email address

`BUSINESS.email` in `src/data/business.js` is `info@tiredroponline.com`, the
single address for every form, business enquiry and contact.
`VITE_CONTACT_EMAIL` (optional, build time) is the address a confirmation
quotes back to the visitor; left empty it falls back to `BUSINESS.email`.
It does not turn anything on.

## Retired

`VITE_FORM_ENDPOINT` and `ORDER_WEBHOOK_URL` (Formspree) are no longer read.
Delete them from Vercel; while `ORDER_WEBHOOK_URL` is still set,
`/api/status` lists it under `issues`. The Formspree form can be deleted.
