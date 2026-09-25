# ATD integration (tire data, dealer cost, stock)

**Status: not connected. The site runs in SAMPLE mode.** No ATD credentials or
API documentation exist yet. The adapter in `api/_lib/atd.js` has all the
plumbing (timeout, retry, cache, pricing, fail-loud checks), but **every piece
that touches ATD's wire format is a placeholder** marked
`TODO(confirm with ATD docs)`. None of it is taken from ATD documentation.

## What the site does today

| Mode | When | Tire data comes from |
| --- | --- | --- |
| `sample` | no `ATD_*` variable is set | `src/data/products.js`: 20 representative tires at retail shelf prices. `available` and `qty` are `null` (unknown), `image` is `null`. |
| `live` | any `ATD_*` variable is set | ATD, through `api/_lib/atd.js`. |

`GET /api/status` reports which mode is active (`"atd": "sample"` or `"live"`).
`GET /api/tires` returns `"source": "sample"` or `"atd"` with every response,
so the UI never presents sample data as live data.

### Fail-loud rules

- **Partially configured** (some `ATD_*` variables set, others missing):
  `/api/tires` returns **503** naming the missing variables, and
  `/api/status` lists them under `issues`. The site never quietly falls back to
  sample prices while claiming to be live.
- **Configured, but the endpoints are unconfirmed**: `ENDPOINTS` in
  `api/_lib/atd.js` are `null` on purpose. Until a path is filled in from ATD's
  docs, live searches return **501** with a message naming the missing
  endpoint. The code never sends real credentials to a guessed URL.
- **Checkout in live mode** re-prices every line from ATD at checkout time,
  uncached. An unknown SKU is a 400, and known-short stock is a 409.

## Environment variables

Set these in Vercel under Project → Settings → Environment Variables, then
redeploy. Once ATD is live, **all seven are required**:

| Variable | Purpose |
| --- | --- |
| `ATD_API_BASE` | Base URL of ATD's API (https). |
| `ATD_API_KEY` | API key or client ID. |
| `ATD_API_SECRET` | Secret, if the auth scheme uses one. If it doesn't, remove it from `ATD_REQUIRED` in `api/_lib/config.js`. |
| `ATD_ACCOUNT_NUMBER` | TireDrop's ATD dealer account number. |
| `ATD_SHIP_TO` | Ship-to or location identifier for Ship to Home orders. |
| `PRICE_MARKUP_PCT` | Retail markup over dealer cost, in percent. Must be set explicitly (`0` is allowed). |
| `FREIGHT_PER_TIRE` | Dollars added to each tire's price to cover freight, because shipping is advertised as free. Must be set explicitly. |

**Retail price per tire** = `cost × (1 + PRICE_MARKUP_PCT/100) + FREIGHT_PER_TIRE`,
rounded to cents (`retailPrice` in `atd.js`). The dealer cost never leaves the
server; `mapAtdProduct` drops it. Sample prices are already retail, so markup
and freight are **not** applied to them.

## What the adapter expects (to confirm)

Everything the adapter needs from ATD sits in these functions in
`api/_lib/atd.js`:

| Function | What it must become | Placeholder today |
| --- | --- | --- |
| `ENDPOINTS.searchBySize` | Path for searching catalog and stock by size | `null` → 501 |
| `ENDPOINTS.searchByVehicle` | Path for fitment search by year/make/model, if ATD offers one | `null`. Vehicle searches fall back to the local OE-size table (`src/data/fitment.js`) and then run a size search. |
| `ENDPOINTS.lookupSkus` | Path for current price and stock of specific SKUs, used at checkout | `null` → 501 |
| `ENDPOINTS.getBySku` | Path for one product's details, price and stock, for its `/tires/p/:sku` page (`GET /api/tires?sku=`). May be the same call as `lookupSkus` | `null` → 501 |
| `atdAuthHeaders` | The real auth scheme | HTTP Basic `key:secret` |
| `build*Request` | Real parameter names; where the account and ship-to go | `size`, `year`/`make`/`model`, `skus`, `account`, `shipTo` |
| `extractAtdList` | Where the product list sits in a response | bare array or `items` array; anything else throws |
| `extractAtdItem` | Where one product sits in a single-SKU response, and whether an unknown SKU is a 404 or an empty result | one record, a bare array or `items`; a 404 or no match is "not found" |
| `mapAtdProduct` | Real field names | `sku`, `dealerCost`, `brand`, `model`, `size`, `loadIndex`, `speedRating`, `quantityAvailable`, `imageUrl` |

Behaviour that is real and tested (`npm run test:api`):

- **Timeout and retry.** Each ATD call times out at 4.5 s and is retried
  **once** after a timeout, network error, 429 or 5xx. Other 4xx responses are
  not retried. Worst case is about 9.3 s, inside a 10 s function limit.
- **Cache.** Search results are cached in memory for **5 minutes** per function
  instance, keyed by account, pricing and query. Brand and limit filters run
  after the cache, so one ATD call serves every filter. On top of that, the
  CDN caches `/api/tires` for 60 s (`s-maxage=60`). Single-tire lookups for
  product pages (`GET /api/tires?sku=`) are cached the same way. SKU lookups
  at checkout are never cached.
- **Stock honesty.** If ATD gives no usable quantity, `available` and `qty`
  stay `null`. They are never reported as in stock.

## Still unconfirmed

- Whether TireDrop's ATD account includes **Ship to Home API** access at all,
  or only ATDOnline (the web portal).
- The auth scheme, base URLs, sandbox vs. production, and rate limits.
- Response formats, including how stock is expressed (a count, per-warehouse,
  or a flag).
- Which price field is our cost for Ship to Home, and whether ATD adds a
  drop-ship or freight charge per tire or per order.
- Fitment data (vehicle → size), and whether it covers staggered and
  trim-level fitments.
- Order submission and tracking. Neither is built yet. Today an order becomes
  either a Tire Guru payment or an emailed request (see `tireguru.md`), and
  someone places the ATD order by hand.

## Questions for the ATD rep

1. **Access:** Does our account include API access to Ship to Home? What do we
   sign or enable to get it, and is there a sandbox with test credentials?
2. **Auth:** What is the auth scheme (API key header, Basic, OAuth2 client
   credentials, signed requests)? How long do tokens last, and how are they
   rotated? Do calls need both the account number and a ship-to number, and
   where do they go?
3. **Search by size:** What endpoint searches by tire size? Does it accept
   `225/45R17` or separate width/aspect/rim fields? Does it return price and
   stock in the same call, or do those need a second call?
4. **Search by vehicle / fitment:** Is there a fitment endpoint by
   year/make/model (and trim or option)? Does it return OE sizes, including
   staggered front/rear? Are we licensed to show it to consumers?
5. **Pricing:** Which price is our cost for Ship to Home? Are there MAP or
   UMAP rules we must enforce on the site? How often do prices change?
6. **Freight:** What does Ship to Home cost per tire (or per order) to the 48
   contiguous states? Does it vary by zone, size or weight? Is there a
   residential or signature surcharge? We fold freight into the tire price
   because the site advertises free shipping.
7. **Stock:** Is quantity real-time? Is it per warehouse, and which warehouses
   serve our ship-to? What is the typical transit time by ZIP?
8. **Images and content:** Does the API provide product images, descriptions
   and specs, and are we allowed to display them?
9. **Order submission:** Is there an endpoint to submit a Ship to Home order
   with the consumer's address? How do we cancel or modify one, and what are
   the cutoff times?
10. **Tracking and webhooks:** Do you push order status, shipment and tracking
    updates by webhook, or do we poll? What do the payloads look like, and how
    are they signed?
11. **Limits:** What are the rate limits, SLAs and maintenance windows? Is
    in-memory caching of search results for 5 minutes acceptable?
12. **Returns:** How do returns and damaged deliveries work for a Ship to Home
    order?
