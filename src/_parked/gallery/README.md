# Parked: the Gallery page

The Gallery was taken off the site (2026-10-04) until there are real photos.
Nothing imports this folder, so it is not in the build, the sitemap or the
search index. Tailwind skips `src/_parked/` too (see `tailwind.config.js`).

`GalleryPage.jsx` is the page as it was: three tabs (Gallery, Videos, Tire
Tips). Its tiles are labelled "Example" illustrations, not photos. Replace
them with real photos and real captions (no customer, place, vehicle or job
count) before bringing it back. Its imports (`../../data`, `../../components`)
resolve the same from here and from `src/pages/support/`, so the file moves
back untouched.

## Bring it back (about 10 minutes)

1. `git mv src/_parked/gallery/GalleryPage.jsx src/pages/support/GalleryPage.jsx`
2. `src/App.jsx`: re-add the lazy import beside the other support pages
   ```js
   const GalleryPage = lazyPage("pages/support/GalleryPage.jsx", () =>
     import("./pages/support/GalleryPage.jsx"),
   );
   ```
   and the route `<Route path="/gallery" element={<GalleryPage />} />`
   (after `/locations`/`/reviews`). The sitemap and prerender read the router,
   so both pick it up on the next build.
3. `src/data/business.js`: add `{ label: "Gallery", to: "/gallery" }` to the
   About dropdown in `NAV` (between Locations and Contact) and to the Company
   column in `FOOTER_COLUMNS` (between Financing and Contact).
4. `src/lib/sitePages.js`: add the search entry
   `{ path: "/gallery", title: "Gallery", keywords: "photos pictures shop work", text: "Photos from the shop and the vans." }`
   (after `/reviews`). `/sitemap` lists the nav, so it follows step 3.
5. `vercel.json`: delete the two 302 redirects (`/gallery` and
   `/pages/gallery`) and put `gallery` back into the
   `/pages/:page(...)` 301 list (after `reviews`).
6. `src/lib/internalLinks.js`: empty `PARKED_ROUTES`, or the link check fails
   on the new links. Add `/gallery` back to `scripts/mobile-audit.mjs` ROUTES.
7. `npm run build` (rewrites `public/sitemap.xml`), then `npm run lint`,
   `npm run test:lib` and `npm run check:links`. Re-submit the sitemap in
   Search Console and request indexing for `/gallery`.
