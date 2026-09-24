/**
 * Typical original-equipment tire size by make and model.
 *
 * Hand-written, and deliberately one size per vehicle: real fitment has trims,
 * staggered fronts and rears, and factory options, none of which this table
 * carries. It is enough to answer "which of the tires on this page go on my
 * car" honestly, and every surface that uses it says the size is the typical
 * original one and to check the sidewall. Once the distributor fitment API is
 * wired, this table is what it replaces.
 *
 * Shape: "Make|Model": [size, bodyStyle]
 */
export const FITMENT = {
  "Toyota|Camry": ["215/60R16", "sedan"],
  "Toyota|Corolla": ["205/55R16", "sedan"],
  "Toyota|RAV4": ["225/65R17", "crossover"],
  "Toyota|Tacoma": ["265/70R17", "truck"],
  "Toyota|Highlander": ["245/60R18", "crossover"],
  "Toyota|4Runner": ["265/70R17", "truck"],
  "Honda|Accord": ["225/50R17", "sedan"],
  "Honda|Civic": ["215/55R16", "sedan"],
  "Honda|CR-V": ["235/65R17", "crossover"],
  "Honda|Pilot": ["245/60R18", "crossover"],
  "Honda|Odyssey": ["235/60R18", "crossover"],
  "Ford|F-150": ["265/70R17", "truck"],
  "Ford|Explorer": ["255/55R20", "crossover"],
  "Ford|Escape": ["225/65R17", "crossover"],
  "Ford|Mustang": ["235/50R18", "sports"],
  "Ford|Transit-250": ["235/65R16", "van"],
  "Chevrolet|Silverado": ["265/70R17", "truck"],
  "Chevrolet|Equinox": ["225/65R17", "crossover"],
  "Chevrolet|Tahoe": ["275/60R20", "truck"],
  "Chevrolet|Malibu": ["225/55R17", "sedan"],
  "Chevrolet|Colorado": ["265/65R17", "truck"],
  "Nissan|Altima": ["215/60R16", "sedan"],
  "Nissan|Rogue": ["225/65R17", "crossover"],
  "Nissan|Sentra": ["205/55R16", "sedan"],
  "Nissan|Frontier": ["265/70R17", "truck"],
  "Nissan|Pathfinder": ["235/65R18", "crossover"],
  "Jeep|Wrangler": ["245/75R17", "offroad"],
  "Jeep|Grand Cherokee": ["265/60R18", "truck"],
  "Jeep|Cherokee": ["225/60R17", "crossover"],
  "Jeep|Gladiator": ["255/75R17", "offroad"],
  "BMW|3 Series": ["225/45R18", "sports"],
  "BMW|5 Series": ["245/45R18", "sports"],
  "BMW|X3": ["245/50R19", "crossover"],
  "BMW|X5": ["275/45R20", "crossover"],
  "Mercedes-Benz|C-Class": ["225/45R18", "sports"],
  "Mercedes-Benz|E-Class": ["245/45R18", "sports"],
  "Mercedes-Benz|GLC": ["235/60R18", "crossover"],
  "Mercedes-Benz|Sprinter 2500": ["245/75R16", "van"],
  "Hyundai|Elantra": ["205/55R16", "sedan"],
  "Hyundai|Sonata": ["215/55R17", "sedan"],
  "Hyundai|Tucson": ["235/65R17", "crossover"],
  "Hyundai|Santa Fe": ["235/65R17", "crossover"],
  "Ram|1500": ["275/60R20", "truck"],
  "Ram|2500": ["275/70R18", "truck"],
  "Ram|ProMaster": ["225/75R16", "van"],
};

/** The OE size and body style for a vehicle, or null when we have no record. */
export const fitmentFor = (make, model) =>
  make && model ? (FITMENT[`${make}|${model}`] ?? null) : null;

/**
 * The OE size split into the numbers the catalog filters on, or null.
 *
 * Every entry in the table is plain P-metric, so this parses without the
 * general size parser and stays cheap enough to call on every render.
 */
export function oeSizeFor(make, model) {
  const record = fitmentFor(make, model);
  if (!record) return null;
  const [size, bodyStyle] = record;
  const m = /^(\d{3})\/(\d{2})R(\d{2})$/.exec(size);
  if (!m) return null;
  return {
    size,
    bodyStyle,
    width: Number(m[1]),
    aspect: Number(m[2]),
    rimDiameter: Number(m[3]),
  };
}
