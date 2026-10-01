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
 * The same table by model year: the size on the mainstream trim for the
 * generation that contains the year, not the fleet-only base or the sport and
 * luxury packages. Mirrors FITMENT_YEARS in the Shopify theme's Find My Tires
 * tool (shopify/sections/td-tool-find-my-tires.liquid).
 *
 *   "Make|Model": [[firstYear, lastYear, size, bodyStyle?], ...]
 *
 * bodyStyle is only given where it differs from FITMENT (the body-on-frame
 * Explorer and Pathfinder). A year outside every range means the model was
 * not sold in the US that year, so no size is guessed. Source: tiresize.com
 * trim-by-trim OE listings, 2005-2026, checked September 2026. Trims still
 * vary, so the sidewall and the door-jamb sticker stay the authority.
 */
// prettier-ignore
export const FITMENT_YEARS = {
  "Toyota|Camry": [[2005, 2006, "205/65R15"], [2007, 2011, "215/60R16"], [2012, 2017, "205/65R16"], [2018, 2024, "215/55R17"], [2025, 2026, "205/65R16"]],
  "Toyota|Corolla": [[2005, 2011, "195/65R15"], [2012, 2026, "205/55R16"]],
  "Toyota|RAV4": [[2005, 2008, "215/70R16"], [2009, 2025, "225/65R17"], [2026, 2026, "235/65R17"]],
  "Toyota|Tacoma": [[2005, 2023, "245/75R16"], [2024, 2026, "245/70R17"]],
  "Toyota|Highlander": [[2005, 2007, "225/70R16"], [2008, 2013, "245/65R17"], [2014, 2019, "245/60R18"], [2020, 2026, "235/65R18"]],
  "Toyota|4Runner": [[2005, 2009, "265/70R16"], [2010, 2024, "265/70R17"], [2025, 2026, "245/70R17"]],
  "Honda|Accord": [[2005, 2007, "205/65R15"], [2008, 2012, "215/60R16"], [2013, 2017, "205/65R16"], [2018, 2026, "225/50R17"]],
  "Honda|Civic": [[2005, 2005, "195/60R15"], [2006, 2011, "205/55R16"], [2012, 2015, "195/65R15"], [2016, 2026, "215/55R16"]],
  "Honda|CR-V": [[2005, 2006, "215/65R16"], [2007, 2011, "225/65R17"], [2012, 2016, "215/70R16"], [2017, 2026, "235/65R17"]],
  "Honda|Pilot": [[2005, 2008, "235/70R16"], [2009, 2011, "245/65R17"], [2012, 2015, "235/65R17"], [2016, 2022, "245/60R18"], [2023, 2026, "255/60R18"]],
  "Honda|Odyssey": [[2005, 2010, "235/65R16"], [2011, 2017, "235/65R17"], [2018, 2026, "235/60R18"]],
  "Ford|F-150": [[2005, 2008, "255/70R17"], [2009, 2009, "235/75R17"], [2010, 2026, "265/70R17"]],
  "Ford|Explorer": [[2005, 2010, "235/70R16", "truck"], [2011, 2014, "245/65R17"], [2015, 2019, "245/60R18"], [2020, 2026, "255/65R18"]],
  "Ford|Escape": [[2005, 2012, "235/70R16"], [2013, 2019, "235/55R17"], [2020, 2026, "225/65R17"]],
  "Ford|Mustang": [[2005, 2009, "215/65R16"], [2010, 2010, "215/60R17"], [2011, 2014, "225/60R17"], [2015, 2023, "235/55R17"], [2024, 2026, "235/50R18"]],
  "Ford|Transit-250": [[2015, 2026, "235/65R16"]],
  "Chevrolet|Silverado": [[2005, 2006, "265/70R17"], [2007, 2013, "245/70R17"], [2014, 2026, "255/70R17"]],
  "Chevrolet|Equinox": [[2005, 2009, "235/65R16"], [2010, 2024, "225/65R17"], [2025, 2026, "235/65R17"]],
  "Chevrolet|Tahoe": [[2005, 2006, "265/70R16"], [2007, 2014, "265/70R17"], [2015, 2026, "265/65R18"]],
  "Chevrolet|Malibu": [[2005, 2007, "205/65R15"], [2008, 2008, "215/60R16"], [2009, 2012, "215/55R17"], [2013, 2015, "215/60R16"], [2016, 2025, "205/65R16"]],
  "Chevrolet|Colorado": [[2005, 2008, "225/75R15"], [2009, 2012, "235/75R16"], [2015, 2026, "255/65R17"]],
  "Nissan|Altima": [[2005, 2025, "215/60R16"], [2026, 2026, "215/55R17"]],
  "Nissan|Rogue": [[2008, 2013, "215/70R16"], [2014, 2026, "225/65R17"]],
  "Nissan|Sentra": [[2005, 2006, "195/60R15"], [2007, 2012, "205/60R15"], [2013, 2019, "205/55R16"], [2020, 2026, "205/60R16"]],
  "Nissan|Frontier": [[2005, 2026, "265/70R16"]],
  "Nissan|Pathfinder": [[2005, 2007, "265/70R16", "truck"], [2008, 2012, "265/65R17", "truck"], [2013, 2020, "235/65R18"], [2022, 2026, "255/60R18"]],
  "Jeep|Wrangler": [[2005, 2006, "225/75R15"], [2007, 2017, "225/75R16"], [2018, 2026, "245/75R17"]],
  "Jeep|Grand Cherokee": [[2005, 2006, "235/65R17"], [2007, 2010, "245/65R17"], [2011, 2026, "245/70R17"]],
  "Jeep|Cherokee": [[2014, 2023, "225/60R17"], [2026, 2026, "225/60R18"]],
  "Jeep|Gladiator": [[2020, 2026, "245/75R17"]],
  "BMW|3 Series": [[2005, 2011, "205/55R16"], [2012, 2018, "225/50R17"], [2019, 2026, "225/45R18"]],
  "BMW|5 Series": [[2005, 2010, "225/50R17"], [2011, 2016, "225/55R17"], [2017, 2023, "245/45R18"], [2024, 2026, "245/45R19"]],
  "BMW|X3": [[2005, 2010, "235/55R17"], [2011, 2012, "245/55R17"], [2013, 2017, "245/50R18"], [2018, 2021, "225/60R18"], [2022, 2026, "245/50R19"]],
  "BMW|X5": [[2005, 2006, "235/65R17"], [2007, 2018, "255/55R18"], [2019, 2023, "265/50R19"], [2024, 2026, "275/45R20"]],
  "Mercedes-Benz|C-Class": [[2005, 2007, "205/55R16"], [2008, 2014, "225/45R17"], [2015, 2021, "225/50R17"], [2022, 2026, "225/45R18"]],
  "Mercedes-Benz|E-Class": [[2005, 2005, "225/55R16"], [2006, 2016, "245/45R17"], [2017, 2021, "225/55R17"], [2022, 2023, "245/45R18"], [2024, 2026, "225/55R18"]],
  "Mercedes-Benz|GLC": [[2016, 2026, "235/60R18"]],
  "Mercedes-Benz|Sprinter 2500": [[2005, 2006, "225/75R16"], [2007, 2026, "245/75R16"]],
  "Hyundai|Elantra": [[2005, 2006, "195/60R15"], [2007, 2012, "195/65R15"], [2013, 2013, "205/55R16"], [2014, 2026, "195/65R15"]],
  "Hyundai|Sonata": [[2005, 2005, "205/65R15"], [2006, 2010, "215/60R16"], [2011, 2026, "205/65R16"]],
  "Hyundai|Tucson": [[2005, 2009, "215/65R16"], [2010, 2021, "225/60R17"], [2022, 2026, "235/65R17"]],
  "Hyundai|Santa Fe": [[2005, 2006, "225/70R16"], [2007, 2009, "235/70R16"], [2010, 2020, "235/65R17"], [2021, 2026, "235/60R18"]],
  "Ram|1500": [[2005, 2008, "245/70R17"], [2009, 2018, "265/70R17"], [2019, 2026, "275/65R18"]],
  "Ram|2500": [[2005, 2008, "245/70R17"], [2009, 2013, "265/70R17"], [2014, 2026, "275/70R18"]],
  "Ram|ProMaster": [[2014, 2026, "225/75R16"]],
};

/**
 * Factory sizes by trim, including staggered fronts and rears, for the model
 * years where they have been checked trim by trim:
 *
 *   "Make|Model": [[firstYear, lastYear, [option, ...]], ...]
 *   option: { trim, front, rear?, alternates? }
 *
 * `rear` is set only on a staggered car (a different size on the rear axle).
 * `alternates` lists sizes the vehicle maker approves besides the factory
 * one; nothing else counts as a fit, so a plus size is never inferred.
 *
 * Empty on purpose. No trim-by-trim source has been checked for this site
 * yet, and a wrong "fits" is worse than an honest "check fitment", so no row
 * goes in from memory. When a year is listed here it wins over FITMENT_YEARS;
 * otherwise the single mainstream-trim size there is used and every surface
 * says it is the typical size. The distributor's fitment data (ATD) is what
 * fills this in. src/data/fitmentCheck.js reads it.
 */
export const FITMENT_TRIMS = {};

/**
 * [size, bodyStyle] for the generation that contains `year`, or null when the
 * table has no record of the make and model at all. The size is null until a
 * year is given (it cannot be told without one) and for a year the model was
 * not sold, so the caller asks for the sidewall size instead of guessing.
 */
export function fitmentForYear(make, model, year) {
  const base = fitmentFor(make, model);
  if (!base) return null;
  const gens = FITMENT_YEARS[`${make}|${model}`];
  const y = Number(year);
  if (!gens) return base;
  if (!y) return [null, base[1]];
  const gen = gens.find(([first, last]) => y >= first && y <= last);
  return gen ? [gen[2], gen[3] ?? base[1]] : [null, base[1]];
}

/**
 * First and last model year the table can size each model for, e.g.
 * "Toyota|Camry" -> [2005, 2026]. The vehicle picker only merges a table
 * model into a year's list inside this span.
 */
export const FITMENT_YEAR_SPANS = Object.fromEntries(
  Object.entries(FITMENT_YEARS).map(([key, gens]) => [
    key,
    [Math.min(...gens.map((g) => g[0])), Math.max(...gens.map((g) => g[1]))],
  ]),
);

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
