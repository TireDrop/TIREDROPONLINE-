// Service catalog. `mobile: true` means the van can perform it at the customer's
// location; everything else is bay work at the Sunrise shop.
// Slugs drive the /services/:slug route.
//
// The facts live in serviceFacts.js (price, duration, includes, symptoms). The
// words around them (H1, intro, steps, FAQ, closing line, sources) live in
// serviceCopy.js and are merged in below, so a price change never touches the copy.

import { SERVICE_COPY } from "./serviceCopy.js";
import { SERVICE_FACTS } from "./serviceFacts.js";

export const SERVICES = SERVICE_FACTS.map((s) => ({ ...s, ...SERVICE_COPY[s.slug] }));

export const getService = (slug) => SERVICES.find((s) => s.slug === slug);

export const MOBILE_SERVICES = SERVICES.filter((s) => s.mobile);
export const SHOP_SERVICES = SERVICES.filter((s) => !s.mobile);
