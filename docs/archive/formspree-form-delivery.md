> **Why retired:** on 2026-09-28 the forms and order requests moved to TireDrop's own `/api/forms` → Shopify customer → Flow "Website lead alert" (prompt 19 in [../business/shopify-admin-prompts.md](../business/shopify-admin-prompts.md)); `VITE_FORM_ENDPOINT` and `ORDER_WEBHOOK_URL` are no longer read, and the Formspree form can be deleted.

# Form delivery via Formspree (was prompt 17)

Moved here verbatim from `docs/business/shopify-admin-prompts.md`, where prompt 17 is now a short pointer so the other prompt numbers stay the same. Do not run it.

The React site's forms (contact, financing, fleet quote, booking) and its
order requests post JSON to one endpoint. Formspree turns each submission into
an email to info@tiredroponline.com, with spam filtering, and needs no code.
Its free plan has a monthly submission cap. Check the current limit and move
to a paid plan if leads outgrow it.

```
TASK: Set up Formspree so TireDrop's website forms email
info@tiredroponline.com.

1. Go to formspree.io → sign up (or log in) with info@tiredroponline.com
   and verify that email address when Formspree asks.
2. Create a new form named "TireDrop website", recipient
   info@tiredroponline.com.
3. In the form's settings: keep Formspree's built-in spam filtering ON,
   but leave reCAPTCHA OFF and "Restrict to domain" / allowed domains OFF.
   (The site posts JSON, and order requests are sent from Vercel's
   server, which a domain restriction would block.)
4. Copy the form endpoint URL (looks like https://formspree.io/f/xxxxxxx).
   It's not secret, so paste it in your report.
5. Choose the FREE plan. If it asks for payment, stop and tell me.

REPORT BACK: account verified Y/N, the endpoint URL, the plan and its
monthly limit.
```

**Then in Vercel:** Project → Settings → Environment Variables (Production):
- `VITE_FORM_ENDPOINT` = the Formspree URL
- `ORDER_WEBHOOK_URL` = the same URL

Redeploy (VITE_ variables are read at build time). Test one of each form
(contact, financing, fleet quote, booking) on the .vercel.app site, then
check the info@ inbox for subjects like "TireDrop contact form".
