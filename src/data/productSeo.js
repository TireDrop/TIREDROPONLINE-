// Title, H1 and meta description for /tires/<slug> and /wheels/<slug>.
// Pure functions so the page and the unit test read the same output.
//
// Rules (SEO re-audit, house rules):
//  - the H1 carries brand + model + size (tire) or size/finish (wheel);
//  - the full <title> (this plus " | TireDrop", see headFor in
//    src/components/ui/index.jsx) stays within 60 characters and says
//    "Tire" or "Wheel";
//  - the meta description is 120-155 characters, carries no price (the
//    catalog is sample data until the ATD feed is live) and no popularity or
//    other unverifiable claim.
import { BUSINESS } from "./business.js";

export const TITLE_MAX = 60;
export const DESC_MIN = 120;
export const DESC_MAX = 155;

const SUFFIX = ` | ${BUSINESS.name}`;

const wheelSize = (p) => `${p.diameter}x${p.wheelWidth}`;

/** H1 text: brand + model + size (tire) or size and finish (wheel). */
export function productH1(product) {
  const name = `${product.brand} ${product.model}`;
  if (product.kind === "wheel") {
    return [name, wheelSize(product), product.finish].filter(Boolean).join(" ");
  }
  return `${name} ${product.size}`;
}

/** Page title without the site suffix; the full title fits TITLE_MAX. */
export function productTitle(product) {
  const isWheel = product.kind === "wheel";
  const noun = isWheel ? "Wheel" : "Tire";
  const name = `${product.brand} ${product.model}`;
  const size = isWheel ? wheelSize(product) : product.size;
  const candidates = [
    `${name} ${size}${isWheel && product.finish ? ` ${product.finish}` : ""} ${noun}`,
    `${name} ${size} ${noun}`,
    `${name} ${noun}`,
  ];
  const fit = candidates.find((t) => t.length + SUFFIX.length <= TITLE_MAX);
  return fit ?? candidates[candidates.length - 1];
}

/** Meta description, 120-155 characters, no price, no popularity claims. */
export function productDescription(product) {
  const isWheel = product.kind === "wheel";
  const noun = isWheel ? "wheel" : "tire";
  const name = `${product.brand} ${product.model}`;
  const ship =
    "Free shipping to the 48 contiguous states and DC; installation in South Florida.";
  const shortShip = "Free shipping to the 48 states and DC; South Florida installation.";
  const detail = isWheel
    ? `${product.boltPattern} bolt pattern, ${product.finish} finish`
    : [
        product.category ? `${product.category} tire` : "Tire",
        product.loadIndex ? `load index ${product.loadIndex}` : "",
        product.speedRating ? `speed rating ${product.speedRating}` : "",
      ]
        .filter(Boolean)
        .join(", ");
  const lead = isWheel
    ? `${name} ${wheelSize(product)} ${noun}`
    : `${name} ${product.size} ${noun}`;
  const candidates = [
    `${lead}: ${detail}. ${ship}`,
    `${lead}: ${detail}. ${shortShip}`,
    `${lead}. ${ship}`,
    `${lead}. ${shortShip} Check fit with your vehicle before ordering.`,
    `Shop the ${lead} at TireDrop. ${ship}`,
  ];
  const ok = candidates.find(
    (d) => d.length >= DESC_MIN && d.length <= DESC_MAX,
  );
  return ok ?? candidates[candidates.length - 1];
}
