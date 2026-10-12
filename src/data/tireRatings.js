// Performance ratings, derived — not invented.
//
// Common store practice is to score a tire across a handful of axes so a
// shopper can compare two models without reading two spec sheets. Stores that
// do this usually score from their own road tests, which we do not have.
//
// So these scores are computed from the specs each tire already carries: the
// UTQG grades, the speed rating, the tread depth, the load range, the 3PMSF
// certification and the mileage warranty. That keeps them honest — a tire
// cannot score well here unless its published grades say so — and it means
// the scores recompute themselves when the real distributor catalog replaces
// `products.js`.
//
// Where a spec genuinely does not exist, the axis returns `null` and the UI
// prints "Not rated" rather than a number. Winter tires carry no UTQG
// treadwear grade and commercial LT tires are graded on a different scale, so
// this happens for real tires, not just gaps in our data.
//
// Scores are 0–10. `RATING_AXES` drives the UI, so adding an axis here adds a
// bar everywhere a rating is drawn.

export const RATING_AXES = [
  { key: "dry", label: "Dry grip" },
  { key: "wet", label: "Wet grip" },
  { key: "winter", label: "Snow & ice" },
  { key: "comfort", label: "Ride comfort" },
  { key: "quiet", label: "Quietness" },
  { key: "wear", label: "Tread life" },
];

const clamp = (n) => Math.max(0, Math.min(10, n));
const round1 = (n) => Math.round(n * 10) / 10;

/** UTQG reads "treadwear traction temperature", e.g. "560 AA A". */
function parseUtqg(utqg) {
  if (!utqg) return null;
  const [wear, traction, temp] = String(utqg).trim().split(/\s+/);
  const treadwear = Number.parseInt(wear, 10);
  if (!treadwear) return null;
  return { treadwear, traction: traction ?? "", temperature: temp ?? "" };
}

/** Speed ratings in ascending order of the speed they certify. */
const SPEED_ORDER = ["Q", "R", "S", "T", "H", "V", "W", "Y", "Z", "ZR"];
const speedIndex = (rating) => {
  const i = SPEED_ORDER.indexOf(String(rating ?? "").toUpperCase());
  return i < 0 ? 4 : i; // unknown ratings sit mid-table rather than skewing
};

/** Tread depth arrives as a fraction of an inch, e.g. "10.5/32". */
const parseDepth = (specs) =>
  Number.parseFloat(String(specs?.["Tread Depth"] ?? "").split("/")[0]) || 10;

/** "80,000 mile treadwear" → 80000. Winter tires say "no mileage warranty". */
const parseWarrantyMiles = (warranty) =>
  Number.parseInt(String(warranty ?? "").replace(/,/g, ""), 10) || 0;

const TRACTION_SCORE = { AA: 9.6, A: 8.2, B: 6.2, C: 4.2 };

export function ratingsFor(tire) {
  if (!tire || tire.kind !== "tire") return null;

  const specs = tire.specs ?? {};
  const utqg = parseUtqg(specs.UTQG);
  const depth = parseDepth(specs);
  const speed = speedIndex(tire.speedRating);
  const miles = parseWarrantyMiles(tire.warranty);
  const season = String(tire.seasons ?? "").toLowerCase();

  const is3pmsf = /3pmsf/i.test(
    `${specs.Certification ?? ""} ${tire.seasons ?? ""}`,
  );
  const isWinter = tire.category === "Winter" || season.includes("winter");
  const isSummer = season.includes("summer");
  const isOffRoad = /all-terrain|mud|terrain/.test(season);
  // Load range D and E are light-truck constructions: stiff sidewalls, heavy
  // casings. They ride and sound nothing like a passenger tire.
  const isLightTruck = /^[DEF]$/.test(String(specs["Load Range"] ?? ""));

  // Dry grip tracks the speed rating, the one spec that certifies sustained
  // high-speed behaviour, nudged by the UTQG traction grade where it exists.
  const dry = clamp(
    4.2 +
      speed * 0.62 +
      (utqg ? (TRACTION_SCORE[utqg.traction] ?? 7) * 0.12 : 0.85) -
      (isWinter ? 1.6 : 0) -
      (isOffRoad ? 0.6 : 0),
  );

  // Wet grip is exactly what the UTQG traction grade measures. Without one,
  // fall back to the tire's class, which is a much coarser signal.
  const wet = utqg
    ? clamp((TRACTION_SCORE[utqg.traction] ?? 7) - (isOffRoad ? 1.2 : 0))
    : isWinter
      ? 8.2 // winter compounds stay pliable and clear water well
      : isOffRoad
        ? 5.6
        : 7.2;

  // Snow is a certification, not a judgement call: 3PMSF means the tire
  // passed a severe-snow traction test. A summer compound stiffens below 45°F.
  const winter = isWinter
    ? 9.4
    : is3pmsf
      ? 8.2
      : isSummer
        ? 1.4
        : isOffRoad
          ? 6.4
          : clamp(6.6 - (speed - 4) * 0.35);

  // Comfort and quietness both fall as the casing stiffens and the tread
  // blocks get bigger — so a light-truck casing and a deep aggressive tread
  // are penalties, not bonuses.
  const comfort = clamp(
    9.4 -
      Math.max(0, speed - 3) * 0.5 -
      (isLightTruck ? 2.2 : 0) -
      (isOffRoad ? 1.2 : 0) -
      Math.max(0, depth - 12) * 0.15,
  );
  const quiet = clamp(
    9.3 -
      Math.max(0, speed - 3) * 0.45 -
      (isOffRoad ? 2.4 : 0) -
      (isLightTruck ? 1.1 : 0) -
      (isWinter ? 0.6 : 0) -
      Math.max(0, depth - 12) * 0.2,
  );

  // Tread life: the UTQG treadwear grade where there is one, otherwise the
  // mileage warranty the manufacturer is willing to stand behind. A tire with
  // neither — a winter or mud-terrain tire — is genuinely not rated for this.
  let wear = null;
  if (utqg) {
    wear = clamp(1.8 + (utqg.treadwear / 800) * 8 + (miles >= 70000 ? 0.5 : 0));
  } else if (miles > 0) {
    wear = clamp(1.6 + (miles / 80000) * 8);
  }

  const scored = { dry, wet, winter, comfort, quiet, wear };
  const values = Object.values(scored).filter((v) => v !== null);

  return {
    ...Object.fromEntries(
      Object.entries(scored).map(([k, v]) => [
        k,
        v === null ? null : round1(v),
      ]),
    ),
    // The headline number competitors print next to the model name. Snow is
    // weighted down because most of this catalog never sees it.
    overall: round1(
      clamp(
        (dry + wet + winter * 0.5 + comfort + quiet + (wear ?? 6)) /
          (4.5 + (wear === null ? 0.5 : 1)),
      ),
    ),
    ratedAxes: values.length,
    isWinter,
    isSummer,
    isLightTruck,
  };
}
