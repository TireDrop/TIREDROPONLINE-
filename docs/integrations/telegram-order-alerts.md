# Telegram order alerts

**Status: built and unit-tested with mocked Telegram and Shopify
(`api/_lib/telegram.test.mjs`). Off until Justin sets two Vercel env vars.
Never run against the real bot from this repository.**

Every PAID order sends one short message to Justin's Telegram (or a staff
group). It rides the existing Shopify `orders/paid` webhook
(`api/webhooks/shopify.js`, set up in [webhooks.md](webhooks.md)), so no new
Shopify setup is needed.

## What the message says

```
🛞 New TireDrop order #1042
💵 $612.40
• 4 × Michelin Pilot Sport 4S 245/40R18
🚚 Ships to customer        (or: Install at the shop / pickup, Mobile install (van))
📍 Orlando, FL
Open in Shopify
```

Order number, total, items, how it gets to the customer, destination city and
state, and a link to the order in Shopify admin. **Never** the customer's
name, email, phone or street address. The bot token is never logged.

## Behaviour

- Fires on `orders/paid` only, even when the ATD forwarder is off or the
  Admin API is not configured (it only reads the webhook body).
- One alert per order: a Shopify retry of the same order is not sent twice.
- A Telegram failure is logged (status code only) and never fails the
  webhook delivery, so ATD forwarding and install tagging are unaffected.
- Missing `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` = alerts off, no error.
- No discounts, delivery dates or review claims are ever written into it.

## Setup for Justin (about 5 minutes)

1. **Make the bot.** In Telegram, message **@BotFather**, send `/newbot`, pick
   a name and a username ending in `bot`. BotFather replies with a token.
   Treat it like a password: paste it only into Vercel.
2. **Start it.** Open your new bot and press Start (a bot cannot message you
   first). For a staff group: add the bot to the group and send any message.
3. **Get the chat id.** Message **@userinfobot** for your own id (a number),
   or for a group open
   `https://api.telegram.org/bot<TOKEN>/getUpdates` once in a browser after
   sending a message in it and read `"chat":{"id":-100…}`. Do not share the
   page, the URL contains the token.
4. **Add two Vercel env vars** (Production), then redeploy:
   `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
5. **Test.** Place a small test order, or in Shopify admin send a test
   notification for the `orders/paid` webhook. The message should arrive
   within seconds.

### Chrome prompt for step 4 (copy and paste)

> Open vercel.com, project **tiredrop**, Settings → Environment Variables.
> Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for **Production** only,
> mark both Sensitive. Stop and let me paste the values myself. Then
> Deployments → latest production deployment → Redeploy. Do not print or
> copy the token anywhere else.

## Not built yet

Customer-facing order tracking over Telegram (a bot customers message with an
order number). Say the word; it would reuse `/api/track` and its
number-plus-email check.
