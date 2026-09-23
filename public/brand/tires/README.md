# Manufacturer logos

Drop each tire brand's logo file here, then set the matching `logo` path in
`TIRE_BRANDS` in `src/data/business.js`:

```js
{ name: "Continental", slug: "continental", logo: "brand/tires/continental.svg" }
```

Every brand strip reads from that one list, so the footer and the homepage both
pick the file up with no other change.

## What to supply

**White artwork on a transparent background.** Both brand strips sit on a dark
surface, so one white file works everywhere — no light and dark variants
needed.

- **SVG preferred**, otherwise PNG with real transparency, at least 240px wide.
- Horizontal lockup, not the stacked or icon-only variant.
- If you only have full-colour artwork, send it anyway — a white version can be
  derived from a vector or a clean transparent PNG.

## Where to get official files

These logos are trademarked. As an authorized dealer you are normally permitted
to show the brands you carry, but use files that come through a dealer or press
channel, which carry usage terms, rather than images pulled off a search
engine.

1. **ATD's dealer portal** — usually carries a brand asset library for the lines
   it distributes. Fastest way to get all four at once, and the files come with
   the terms attached.
2. **Nitto — Marketing Resource Site**: `marketingresource.intdev.nittotire.com`
   Built for exactly this: official assets for use on dealer websites.
3. **Nexen — Resources**: `nexentireusa.com/resources/` (logos and brand assets)
   Brand guide: search "NEXEN Visual Brand Identity Guide".
4. **Continental — Brand Assets**: `continentaltire.com/media`
   Truck-tire assets: `continental-tires.com/us/en/products/truck/resources/downloads/brand-assets/`
5. **Pirelli — Media Library**: `press.pirelli.com/media-library/`

Check the usage terms that come with the files before launch.
