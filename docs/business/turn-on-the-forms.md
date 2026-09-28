# Turning the forms on

The five forms on this site — contact, financing, fleet quote, review and
install booking — collect and validate what people type, and then hand it to
`submitForm()` in `src/data/forms.js`. Whether that goes anywhere depends on
two environment variables. Nothing in the code needs changing.

Until they are set, every confirmation says plainly that the message was not
sent and points at the phone. That is deliberate: a form that tells a real
visitor "a specialist will follow up" while sending their message nowhere is
the one thing on this site that makes a promise nothing keeps.

## What is needed

Two values, both filled in at deploy time:

| Variable             | What it is                                              |
| -------------------- | ------------------------------------------------------- |
| `VITE_FORM_ENDPOINT` | The URL the forms POST to                               |
| `VITE_CONTACT_EMAIL` | The address the confirmations quote back to the visitor |

## Getting an endpoint

Any service that accepts a JSON POST works. The quickest is Formspree, which
needs no server of our own:

1. Sign up at <https://formspree.io> with **info@tiredroponline.com** — the
   business address, and the inbox that should receive the messages.
2. Create a form. Name it something like "TireDrop site forms" — one form
   handles all five, because every submission names the form it came from
   (`contact`, `financing`, `fleet-quote`, `review`, `booking`) in its
   subject line and in a `form` field.
3. Copy the endpoint it gives you. It looks like
   `https://formspree.io/f/xxxxxxxx`.
4. Confirm the address when Formspree emails to verify it, or nothing is
   delivered.

The free tier allows 50 submissions a month, which is ample for a site that has
not launched. Basin, Netlify Forms and a Cloudflare Worker all work the same
way if you would rather not use Formspree.

## What Formspree receives

Each form sends one JSON POST (`Content-Type` and `Accept` both
`application/json`, which is how Formspree answers with JSON instead of a
redirect). Besides the fields the visitor filled in, the body carries:

| Field          | Why                                                        |
| -------------- | ---------------------------------------------------------- |
| `_subject`     | The email subject: "TireDrop contact form", "TireDrop financing request", "TireDrop fleet quote request", "TireDrop install booking request", "TireDrop review" |
| `email`        | The visitor's email. Formspree uses it as the reply-to, so "Reply" answers the customer. Every form requires it. |
| `form`, `_form`| Which form it came from (`form` is the copy Formspree shows; underscore fields are settings to Formspree) |
| `_submittedAt` | When the browser sent it                                   |

`src/data/forms.js` (`formPayload`) builds this body; a test pins it.

### Order requests use Formspree too

Checkout's order requests (and every mobile install booking) are sent by the
server, not the browser, to `ORDER_WEBHOOK_URL`. That can be the **same**
Formspree endpoint. The body has `_subject` "TireDrop order request
#TD-… (NOT PAID)" (or "TireDrop mobile install booking request #TD-…"), the
customer's `email` as reply-to, a readable `message` and the structured
`order`. It is a runtime variable, so a change takes effect on the next
request after a redeploy; no rebuild needed for it.

Two Formspree settings to leave alone for that to work:

- **Don't restrict the form to a domain** (Settings → "Restrict to domain").
  That check uses the browser's `Origin`/`Referer`, which a server-side POST
  from Vercel does not send, so order requests would be refused. If you want
  the restriction for the browser forms, create a second Formspree form for
  `ORDER_WEBHOOK_URL`.
- **Leave reCAPTCHA off** for the form. JSON submissions have no way to
  solve one.

If Formspree ever refuses an order request, checkout answers `delivered:
false` and the shopper is told to call; the full order is in the Vercel
function log.

## Setting them

Locally, copy `.env.example` to `.env` and fill both in. On the host (Netlify,
Vercel, Cloudflare Pages), set them as build environment variables.

Both are read at **build** time, so a change means a rebuild and a redeploy.

## Checking it worked

1. Build and open the site.
2. Submit the contact form with your own details.
3. The confirmation should now say the message is on its way and name the
   address from `VITE_CONTACT_EMAIL`. If it still says the form is not
   connected, the variable did not reach the build.
4. The message should arrive in the inbox within a minute.

If the endpoint is set but the POST fails — the service is down, the address
was never confirmed, a network block — the confirmation says so specifically
rather than claiming delivery. That branch is deliberate and should not be
removed.

## The other email

`BUSINESS.email` in `src/data/business.js` is now `info@tiredroponline.com`.
The owner confirmed it as the single address for every form, business enquiry
and contact, and the site publishes it — in the footer, on the contact,
locations and legal pages, and in structured data.

`VITE_CONTACT_EMAIL` is what a confirmation quotes back to the person who just
typed a message. When it is left empty it falls back to `BUSINESS.email`, so
the confirmations already name info@tiredroponline.com; set it to that same
address anyway so the deploy environment says so explicitly.

Neither value turns the forms on. Only `VITE_FORM_ENDPOINT` does: until it is
set, every confirmation still says the message was not sent, whatever address
it quotes.
