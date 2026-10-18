/**
 * Blog hero images: one 16:9 picture per post, shown on the post page and as
 * the thumbnail on the /blog cards.
 *
 * Files live in public/brand/blog/<slug>.webp (1344x752). Keys are blog post
 * slugs; the value is the alt text, written as a plain description of the
 * scene. A post with no entry here simply renders without a picture, so a
 * new post never breaks the page while its image is being made.
 *
 * The pictures are generated documentary-style photos with no logos, brand names, licence
 * plates or readable text in them, so they never imply a product, a rating
 * or a claim the copy does not make. src/content/blogImages.test.mjs checks
 * that every entry has a file and every file has an entry.
 */
export const BLOG_IMAGES = {
  "alligator-alley-drive-tires":
    "A man beside a silver crossover with a flat rear tire and a spare leaning on the bumper on the shoulder of a flat Everglades highway.",
  "back-to-school-car-check-broward":
    "A teen crouches at a car's front tire with a tread gauge while a parent watches, on a concrete driveway in front of a stucco house.",
  "best-time-to-buy-tires-south-florida":
    "A man crouches in a Florida driveway pressing a tread depth gauge into the groove of a worn tire on a silver crossover.",
  "bigger-wheels-myth":
    "A tall-sidewall tire on a small wheel and a thin-sidewall tire on a larger wheel, side by side with a level across both tops.",
  "bought-tires-online-install-broward":
    "A technician's hands photograph the raised DOT date code on a new tire stacked with others beside an opened box in a tire shop.",
  "buy-tires-online-vs-local-shop":
    "A technician fits a new tire in a shop bay while a set of delivered tires in stretch wrap leans against the wall.",
  "choosing-between-tire-brands":
    "A woman in a home garage rests a hand on one of two new tires with different tread patterns leaning against a workbench.",
  "cold-front-tpms-light-florida":
    "A person in a hoodie crouches in a Florida driveway checking a car tire's pressure with a pencil gauge on a cool, overcast morning.",
  "curb-pothole-tire-alignment-signs":
    "A hand points to a round bulge in the sidewall of a front tire next to a chipped concrete curb, with scraped rubber and a gouged wheel rim.",
  "ev-tire-wear-budget":
    "A person measures the worn inner edge of a plugged-in electric hatchback's front tire with a tread gauge in a garage.",
  "flat-tire-on-i-95":
    "A silver sedan with a flat rear tire on an interstate shoulder while a woman stands by the guardrail on her phone.",
  "flooded-car-tires-wheels":
    "A silver sedan parked in brown floodwater up to its wheels, with a dried silt waterline on its lower doors and bumper.",
  "florida-sun-dry-rot-tires":
    "A hand flexes the faded gray sidewall of a car tire covered in fine dry rot cracks, parked in strong sun on a Florida driveway.",
  "ford-f-150-tires-p-vs-lt":
    "A man crouches at a pickup's rear tire, hand on the sidewall marked LT265/70R17 Load Range E, with a boat trailer hitched behind.",
  "get-tires-installed-after-buying-online":
    "A technician and customer inspect a stack of four newly delivered tires on the floor of a tire shop before mounting.",
  "glovebox-tire-kit-florida":
    "An open hatchback trunk with a tire gauge, 12-volt inflator, sealant bottle, flashlight and reflective triangle laid out beside the spare.",
  "honda-civic-tires-guide":
    "A person points to the tire information sticker on the driver's door pillar of an open silver compact sedan parked in a driveway.",
  "honda-cr-v-tires-guide":
    "A parent checks a rear tire's pressure with a pencil gauge beside a crossover with its hatch open, loaded with luggage and beach chairs.",
  "how-old-are-tires-bought-online":
    "A hand rests on a new tire's sidewall beside the molded DOT 3524 date code while another hand photographs it with a phone.",
  "hurricane-season-tire-check":
    "Hands press a tread depth gauge into a tire groove in a driveway, with plywood panels and bottled water stacked against the house.",
  "hydroplaning-broward-downpours":
    "View from the driver's seat through a rainy windshield at standing water on a multi-lane highway with spray from the trucks ahead.",
  "jeep-wrangler-tires-guide":
    "A hand measures an all-terrain tire's tread groove on a boxy SUV on wet, sandy pavement in a palm-lined beach parking lot.",
  "king-tide-salt-water-wheels":
    "A white sedan drives slowly through murky tidal floodwater halfway up its wheels on a sunny South Florida waterfront street.",
  "low-rolling-resistance-hybrids":
    "A technician in a gray work shirt examines a new tire's tread in a shop bay while rain falls on the parking lot outside.",
  "mobile-tire-install-condo-office":
    "A technician in a work shirt removes a wheel from a silver sedan in a condo lot, with a white work van and a new tire on a cart beside it.",
  "moving-to-florida-tire-tips":
    "A man rolls a deep-treaded winter tire toward a stack of moving boxes in a Florida garage, a sedan parked beside it.",
  "new-car-tires-wear-out-early":
    "A technician checks uneven wear across the inner edge of a front tire on a fairly new silver crossover while the owner watches.",
  "new-tires-front-or-back":
    "A technician lifts a new deep-tread tire toward the rear hub of a sedan on a lift, while the front tire looks more worn.",
  "nitrogen-in-tires-myth":
    "A hand presses a pencil tire gauge onto a valve stem while holding a green valve cap between two fingers beside a dusty wheel.",
  "packed-car-weight-limit":
    "A person leans in to read the door-edge sticker on a midsize sedan overloaded with a roof box, suitcases, a cooler and beach chairs.",
  "replace-all-four-tires-myth":
    "A new tire and a worn tire with a sidewall cut stand side by side as a technician measures tread depth, with a crossover on a lift behind.",
  "rideshare-driver-tires":
    "A driver checks tread with a gauge on a curb-scuffed tire of a sedan at an airport pickup curb, a dark phone mounted inside.",
  "same-size-tires-different-prices":
    "A technician's hand traces the sidewall of one of two same-size tires with different tread patterns leaning on a rack in a tire shop.",
  "sidewall-max-psi-myth":
    "A hand holds an air hose to a tire valve beside the sidewall marking MAX. PRESS. 44 PSI at a gas station air pump.",
  "silverado-boat-towing-tires":
    "A man checks the rear tire pressure of a white full-size pickup hitched to a boat trailer at a Florida boat ramp.",
  "small-fleet-tire-checklist":
    "A worker in a work shirt checks tire pressure on the first of three white work vans parked in a yard, a log clipboard on the hood.",
  "snowbird-car-sat-all-summer-tires":
    "A man in a linen shirt checks a slightly soft tire with a pressure gauge on a dusty, debris-covered car in a Florida condo parking lot.",
  "storm-cleanup-nail-in-tire":
    "A finger points to a roofing nail head in a sedan's tire tread beside a curbside pile of shingles and storm debris.",
  "tesla-model-y-tires-guide":
    "A woman reads the tire information sticker on the open door pillar of a silver electric crossover plugged in at a home charger.",
  "thanksgiving-road-trip-tire-check":
    "An adult kneels to check a rear tire's pressure on a hatchback packed with luggage and a cooler in a driveway at dawn.",
  "tire-recall-notice-what-to-do":
    "A person kneels in a garage photographing the DOT code on a tire sidewall with a phone, with a folded letter lying face-down on the floor.",
  "tire-rotation-upsell-myth":
    "A technician compares tread wear on two tires on the shop floor, with a sedan on a lift behind him missing two wheels.",
  "toyota-camry-tires-guide":
    "A gray sedan drives through an afternoon rain shower on a Florida road with its front tire throwing up water from a puddle.",
  "toyota-rav4-tires-guide":
    "Four identical new tires lined up on a shop floor in front of a compact crossover on a lift with all four wheels off.",
  "tpms-still-need-tire-gauge":
    "A person crouches at a slightly soft front tire with a pencil gauge on the valve while the open car door shows a dark dashboard.",
  "turnpike-orlando-drive-tires":
    "A driver crouches to check a loaded crossover's tire pressure in a highway service plaza lot with flat Florida scrub beyond.",
  "unused-tires-still-age-myth":
    "A hand wipes dust off a stored tire in a Florida garage to show the DOT 1816 date code and fine cracks in the sidewall.",
  "used-car-after-storm-season-tires":
    "A buyer shines a phone flashlight into a used sedan's spare tire well showing dried silt, rust and mud.",
  "worn-tires-florida-rain-4-32":
    "A hand holds a quarter upside down in a shallow groove of a worn damp tire after a Florida rain shower.",
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
