# scripts/

Build, check and dev scripts. They stay in one flat folder on purpose:
`vite.config.js` imports `generate-seo-files.mjs`, the generated
`public/robots.txt` and `public/sitemap.xml` name that script in their
header comment, and `shopify/assets/td-tiremath.js` names
`build-shopify-assets.mjs`. Moving them would change served files.

## Build (run by `npm run build`)

| Script | What it does |
| --- | --- |
| `generate-seo-files.mjs` | Writes `public/robots.txt` and `public/sitemap.xml` from the router and content. Runs at the start of every `vite build` (plugin in `vite.config.js`) and again from the prerender. `ALLOW_INDEXING` lives here. |
| `prerender.mjs` | After `vite build`: renders every route to `dist/<route>.html`, plus `dist/404.html` and `dist/spa.html`. |

## Gates (run before every push to `main`)

| Script | npm script | What it checks |
| --- | --- | --- |
| `prerender-check.mjs` | `check:prerender` | The built site in Chromium: per-page head tags with JavaScript off, hydration without mismatch, client-side navigation. |
| `forms-keep-values-check.mjs` | `check:forms` | Every form keeps and sends a value however it was entered (typing, automation, autofill), at 390px and 1440px. |
| `newsletter-signup-check.mjs` | `check:newsletter` | The newsletter is only the footer form: no pop-up, validation, success and failure messages. |
| `translate-check.mjs` | `check:translate` | The header's Language control: nothing loads from Google until it is opened, keyboard and 320px use, translating in place with a stand-in for Google's element (routes, cart and a form throw nothing; prices and sizes stay as written), the translate.google.com fallback, and the site served from Google's translate.goog proxy. `TRANSLATE_SHOTS=<dir>` saves screenshots. |
| `docs-links-check.mjs` | `check:docs` | Every relative Markdown link and every `docs/...` path in the docs resolves to a real file. |

The four Chromium checks need `npm run build` first. They start
`vite preview` themselves and mock every `/api` call, so nothing reaches
Shopify. `test:api`, `test:content` and `test:lib` are `node --test` suites in
`api/_lib/`, `src/content/` and `src/lib/`, not scripts here.

## Run by hand

| Script | How | What it does |
| --- | --- | --- |
| `mobile-audit.mjs` | `npm run audit:mobile` with `vite preview` running | Phone-width audit of every route: sideways scroll, small tap targets, tiny text. |
| `demos-check.mjs` | `node scripts/demos-check.mjs` with `npx vite --port 5173` running | Learn demos: prerender safety, browser behaviour at 390/1440px, optional axe-core. |
| `theme-redirect-check.mjs` | `LIQUIDJS_DIR=... node scripts/theme-redirect-check.mjs` | The Shopify theme's shop. → main-site redirect block, rendered with liquidjs (not a repo dependency). |
| `build-shopify-assets.mjs` | `node scripts/build-shopify-assets.mjs` | Regenerates `shopify/assets/td-tiremath.js` from the site's tire maths. Upload to the draft theme only. |

## Helpers

| Script | Used by |
| --- | --- |
| `vpic-mock.mjs` | `forms-keep-values-check.mjs`: a stand-in for NHTSA vPIC's make/model lookup, which the sandbox cannot reach. |
