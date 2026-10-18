/**
 * Blog hero images: one 16:9 picture per post, shown on the post page and as
 * the thumbnail on the /blog cards.
 *
 * Files live in public/brand/blog/<slug>.webp (1344x752). Keys are blog post
 * slugs; the value is the alt text, written as a plain description of the
 * scene. A post with no entry here simply renders without a picture, so a
 * new post never breaks the page while its image is being made.
 *
 * The pictures are AI-generated scenes with no logos, brand names, licence
 * plates or readable text in them, so they never imply a product, a rating
 * or a claim the copy does not make. src/content/blogImages.test.mjs checks
 * that every entry has a file and every file has an entry.
 */
export const BLOG_IMAGES = {
  "alligator-alley-drive-tires":
    "A sedan driving a straight highway across Everglades sawgrass at sunrise",
  "back-to-school-car-check-broward":
    "A parent and a teenager crouched beside a family car's front tire in a driveway, checking the tread",
  "best-time-to-buy-tires-south-florida":
    "Stacks of new tires in a bright garage with palm trees outside the open bay door",
  "bigger-wheels-myth":
    "Two wheels side by side, one with a tall sidewall tire and one with a large rim and thin low-profile tire",
  "bought-tires-online-install-broward":
    "A technician mounting a tire in a South Florida shop bay, delivered tire boxes stacked nearby",
  "buy-tires-online-vs-local-shop":
    "A laptop on a desk beside a local tire shop bay with a car on a lift",
  "choosing-between-tire-brands":
    "Four unmarked tires with different tread patterns lined up on a dark floor",
  "cold-front-tpms-light-florida":
    "A car covered in dew on a misty South Florida morning, front tire in focus",
  "curb-pothole-tire-alignment-signs":
    "A tire and alloy wheel splashing through a pothole beside a curb on a wet street",
  "ev-tire-wear-budget":
    "An electric sedan charging at night in Miami, alloy wheel and tire in the foreground",
  "flat-tire-on-i-95":
    "A silver sedan with a flat rear tire pulled onto a highway shoulder at golden hour",
  "flooded-car-tires-wheels":
    "A sedan stranded in shallow floodwater, its tire half under water on a Florida street",
  "florida-sun-dry-rot-tires":
    "Close-up of fine cracks in a tire sidewall under harsh Florida sun",
  "ford-f-150-tires-p-vs-lt":
    "A full-size pickup truck hitched to a trailer in a driveway at sunset",
  "get-tires-installed-after-buying-online":
    "Four new tires stacked on a porch as a mobile tire technician walks toward them",
  "glovebox-tire-kit-florida":
    "A tire emergency kit with a gauge, inflator, flashlight and gloves laid out in a car",
  "honda-civic-tires-guide":
    "A compact sedan on a palm-lined Miami boulevard at golden hour, alloy wheel in focus",
  "honda-cr-v-tires-guide":
    "A white crossover loaded with a cooler and bikes on a sunny Florida beach road",
  "how-old-are-tires-bought-online":
    "A fingertip pointing at the molded date-code area on a tire sidewall",
  "hurricane-season-tire-check":
    "A hand checking tire tread with a gauge in a driveway under a storm sky",
  "hydroplaning-broward-downpours":
    "A tire throwing spray on a rain-soaked highway during a thunderstorm",
  "jeep-wrangler-tires-guide":
    "A boxy open-air off-road SUV with all-terrain tires on a sandy Florida beach trail",
  "king-tide-salt-water-wheels":
    "A car wheel moving through shallow king-tide saltwater on a Miami Beach street",
  "low-rolling-resistance-hybrids":
    "A hybrid hatchback on an empty highway at dawn, one smooth tire in close focus",
  "mobile-tire-install-condo-office":
    "A mobile tire technician mounting a tire on a car in a condo parking garage",
  "moving-to-florida-tire-tips":
    "A loaded car driving over a bridge toward the Miami skyline",
  "new-car-tires-wear-out-early":
    "A new sedan on a dealership lot with its front tire showing uneven wear",
  "new-tires-front-or-back":
    "A technician carrying a new tire toward the rear wheel of a car on a lift",
  "nitrogen-in-tires-myth":
    "A hand connecting an air hose to a tire valve stem beside a gas cylinder",
  "packed-car-weight-limit":
    "A hatchback with its rear open, packed with luggage, a cooler and a roof box",
  "replace-all-four-tires-myth":
    "Four tires lined up in a shop, three with deep tread and one visibly worn, with a tread depth gauge on the floor",
  "rideshare-driver-tires":
    "A sedan with a dashboard phone mount driving through Miami streets at night",
  "same-size-tires-different-prices":
    "Two tires of the same size side by side, one with a more complex tread pattern",
  "sidewall-max-psi-myth":
    "A hand pressing a digital tire pressure gauge onto a valve stem",
  "silverado-boat-towing-tires":
    "A full-size pickup backing a boat trailer down a ramp into calm water at sunrise",
  "small-fleet-tire-checklist":
    "A fleet manager checking a tire on a white work van in a South Florida lot",
  "snowbird-car-sat-all-summer-tires":
    "A dusty car under a carport with a front tire that looks slightly flat-spotted",
  "storm-cleanup-nail-in-tire":
    "A roofing nail embedded in a tire tread on wet pavement",
  "tesla-model-y-tires-guide":
    "An electric crossover with aero wheels parked in front of palm trees at dusk",
  "thanksgiving-road-trip-tire-check":
    "A packed family SUV at dawn as an adult checks a front tire with a pressure gauge",
  "tire-recall-notice-what-to-do":
    "A hand holding a paper notice next to a tire in a garage",
  "tire-rotation-upsell-myth":
    "A technician loosening a lug nut on a car raised on a lift in a shop bay",
  "toyota-camry-tires-guide":
    "A midsize sedan driving along a quiet palm-lined road at dusk",
  "toyota-rav4-tires-guide":
    "A white compact crossover on a wet palm-lined Florida road after rain",
  "tpms-still-need-tire-gauge":
    "A glowing tire-pressure warning light on a dashboard with a gauge held in front",
  "turnpike-orlando-drive-tires":
    "A sedan heading north on a Florida toll highway at sunrise",
  "unused-tires-still-age-myth":
    "Tires and a spare stacked in a dusty home garage",
  "used-car-after-storm-season-tires":
    "A flashlight shining on the spare-tire well of a used car's open trunk",
  "worn-tires-florida-rain-4-32":
    "A tire channeling water through its tread grooves in a heavy downpour",
};

/** `/brand/blog/<slug>.webp` for a blog post that has a picture, else null. */
export function blogImageSrc(slug) {
  return Object.hasOwn(BLOG_IMAGES, slug) ? `/brand/blog/${slug}.webp` : null;
}

/** The alt text for a post's picture ("" when it has none). */
export function blogImageAlt(slug) {
  return Object.hasOwn(BLOG_IMAGES, slug) ? BLOG_IMAGES[slug] : "";
}

/** Intrinsic size of every file, so the page reserves the space (no layout shift). */
export const BLOG_IMAGE_SIZE = { width: 1344, height: 752 };
