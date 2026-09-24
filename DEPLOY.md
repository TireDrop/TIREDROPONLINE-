# Deploying TireDrop

## The one thing that goes wrong

This repository holds **two** sites:

| Path        | Site      | Vercel project |
| ----------- | --------- | -------------- |
| `/`         | Cannavibe | `cannavibe`    |
| `/tiredrop` | TireDrop  | (new)          |

TireDrop needs its **own Vercel project** with **Root Directory set to
`tiredrop`**. Deploy the repository without that and Vercel builds the root
app and publishes Cannavibe under the TireDrop domain.

## Steps

1. Vercel → Add New → Project → import `jja8991/cannavibe`.
2. **Root Directory: `tiredrop`.** This is the step that matters.
3. Framework preset: Vite. Build `npm run build`, output `dist` — both are
   detected automatically, and `.nvmrc` pins Node 22.
4. Deploy. `vercel.json` in this folder already handles SPA rewrites, security
   headers, immutable asset caching, and `noindex` on `*.vercel.app` previews
   so a preview URL can never outrank the real domain.

## Environment variables

Set these in Vercel → Settings → Environment Variables. Both are read at
**build** time, so changing either needs a redeploy.

| Variable             | Effect when set                                            |
| -------------------- | ---------------------------------------------------------- |
| `VITE_FORM_ENDPOINT` | The five forms **and orders** start sending. Until then the |
|                      | site says plainly that nothing was sent and leads with the  |
|                      | phone. See `docs/business/turn-on-the-forms.md`.            |
| `VITE_CONTACT_EMAIL` | The address confirmations quote back.                       |

Do **not** set `VITE_HASH_ROUTER` on Vercel. That is only for static hosts
with no SPA rewrite; `vercel.json` provides the rewrite, so the production
build uses real paths.

## Before pointing tiredroponline.com at it

The domain currently serves the previous site. Nothing here is urgent until
you cut over, but do these in order:

1. **Flip indexing.** `public/robots.txt` is generated with `Disallow: /` on
   purpose — an unlaunched store must not be indexed under this brand. Set
   `ALLOW_INDEXING = true` in `scripts/generate-seo-files.mjs`, rebuild,
   commit, and confirm `https://tiredroponline.com/robots.txt` before
   submitting the sitemap.
2. Add the domain in Vercel and follow its DNS instructions. Point the apex
   and `www` at Vercel; it issues the certificate automatically.
3. Submit `https://tiredroponline.com/sitemap.xml` in Google Search Console.

## Free alternative

Cloudflare Pages runs this at $0 with commercial use permitted, where Vercel's
free Hobby tier does not allow it. It needs the same Root Directory setting
and a `public/_redirects` file containing `/*  /index.html  200` in place of
`vercel.json`'s rewrite. Worth it only if the $20/month matters.
