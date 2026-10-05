// Copy for the two Spanish test pages: the mobile-service hub
// (/es/instalacion-movil) and Hialeah (/es/instalacion-movil/hialeah-fl),
// rendered by src/pages/services/SpanishMobilePage.jsx.
//
// WHY THEY EXIST (competitor gap 10): no South Florida competitor shows
// Spanish booking or pricing. This is a small test of whether Spanish
// searchers show up, before more is built. The site's page translator
// (src/lib/translate.js) is not the same thing: it leaves nothing for a search
// engine to index.
//
// NOT REVIEWED BY A NATIVE SPEAKER YET. Until one signs off, the pages are
// noindex and out of the sitemap (SPANISH_PAGES_INDEXABLE in
// src/data/spanishRoutes.js; steps and reviewer checklist in
// docs/ops/spanish-pages.md).
//
// VOICE: plain, friendly US Spanish for South Florida drivers, written for
// the page rather than translated word for word. "Usted" throughout (never
// "tú"). "Llantas" for tires, "instalación móvil", "camioneta" for the van.
//
// FACTS are the English pages' and nothing more: the county, the ZIP rule,
// the shop on West Oakland Park Blvd near University Dr in Sunrise, the van
// does the install, the roadside rule. No claim about who on the crew speaks
// Spanish, and none about the community or its demographics (Justin has not
// confirmed any). The install price is never written here: it is read from
// the catalog (src/lib/mobilePrice.js) so it cannot drift from the English
// strip. No offers or promotions, no arrival times, no "since" years.
//
// Plain data with no JSX, so spanishPages.test.mjs can check it under Node.

import { BUSINESS } from "./business.js";
import { mobilePriceLineEs } from "../lib/mobilePrice.js";
import { MOBILE_SERVICES } from "./services.js";
import { ES_HUB_PATH, esCityPath } from "./spanishRoutes.js";

/** Justin's highway wording (cityPages.js HIGHWAY_LINE), in Spanish. */
const HIGHWAY_LINE_ES =
  "¿Se quedó en el hombro de una autopista? Por su seguridad, llame primero al 911 o al *347 (FDOT Road Rangers). Cuando ya esté fuera de la autopista, llámenos.";

const ARRIVAL_ES = "Le confirmamos la ventana de llegada al reservar.";

/** The three counties, as the Spanish pages say them. */
export const AREA_ES = "los condados de Miami-Dade, Broward y Palm Beach";

/** The mobile services, by catalog slug, in Spanish. */
const SERVICE_NAMES_ES = {
  "tire-installation": "Instalación de llantas",
  "tire-balancing": "Balanceo de llantas",
  "tire-repair": "Reparación de ponchaduras",
  "tire-rotation": "Rotación de llantas",
  "wheel-installation": "Instalación de rines",
  "oil-change": "Cambio de aceite",
  "tpms-service": "Servicio de sensores TPMS (presión de las llantas)",
};

/** The catalog's mobile services with their Spanish names (no link: the service pages are English). */
export const MOBILE_SERVICE_NAMES_ES = MOBILE_SERVICES.map(
  (s) => SERVICE_NAMES_ES[s.slug],
).filter(Boolean);

const DAYS_ES = {
  "Mon – Fri": "Lunes a viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

/** "8:00 AM – 6:30 PM" -> "8:00 a. m. a 6:30 p. m."; "Closed" -> "Cerrado". */
export function timeEs(time) {
  if (time === "Closed") return "Cerrado";
  return time
    .replace(/\s*[–-]\s*/, " a ")
    .replace(/(\d{1,2}:\d{2})\s*AM/g, "$1 a. m.")
    .replace(/(\d{1,2}:\d{2})\s*PM/g, "$1 p. m.");
}

/** The shop's published hours, from BUSINESS.hours, as `[{ days, time }]` in Spanish. */
export const HOURS_ES = BUSINESS.hours.map((h) => ({
  days: DAYS_ES[h.days] ?? h.days,
  time: timeEs(h.time),
}));

/** The words every Spanish page shares. */
export const ES_SHARED = {
  howItWorks: [
    {
      title: "Elija sus llantas",
      body: "Compre en TireDrop y escoja la instalación móvil al pagar, o reserve la camioneta para llantas que ya tiene.",
    },
    {
      title: "Reserve la visita",
      body: ARRIVAL_ES,
    },
    {
      title: "Instaladas donde estaciona",
      body: "Montaje, balanceo, apriete al torque especificado y retiro de las llantas viejas.",
    },
  ],
  servicesLede: "Cada servicio se hace junto a su vehículo.",
  scope: [
    "Instalaciones y ayuda con llantas ponchadas en calles laterales, estacionamientos, casas y lugares de trabajo, durante el horario de la tienda.",
    HIGHWAY_LINE_ES,
    ARRIVAL_ES,
    "Sin cargo por traslado en citas estándar.",
    "Alineación, frenos y suspensión son trabajo de taller, en la tienda de Sunrise.",
  ],
  highwayLine: HIGHWAY_LINE_ES,
  roadsideItems: [
    {
      title: "Cambio de llanta",
      body: "Se coloca su llanta de repuesto, o una llanta que usted compró.",
    },
    {
      title: "Reparación de ponchadura",
      body: "Si se puede reparar. Un técnico revisa primero el interior de la llanta.",
    },
    {
      title: "Llanta de repuesto",
      body: "Se instala y se ajusta la presión.",
    },
  ],
  shopLine: `¿Prefiere la tienda? Envíe sus llantas gratis a la tienda de ${BUSINESS.shop.city}.`,
  zipLabel: "Código postal (ZIP) donde estará el vehículo",
  ctaBody: `Elija las llantas y el día. ${ARRIVAL_ES}`,
  shopAddress: `Nuestra tienda está en ${BUSINESS.shop.street}, cerca de University Dr, en ${BUSINESS.shop.city} (condado de Broward).`,
};

// The price sentence in the hub FAQ comes from the catalog; with no usable
// price the answer simply leaves the number out.
const price = mobilePriceLineEs();
const PRICE_FAQ = price
  ? `No. La mano de obra móvil se cobra a la misma tarifa que en el taller: ${price.text.toLowerCase()} en ambos casos. Dentro del área de instalación local no hay cargo por traslado en citas estándar.`
  : "No. La mano de obra móvil se cobra a la misma tarifa que en el taller. Dentro del área de instalación local no hay cargo por traslado en citas estándar.";

/** /es/instalacion-movil */
export const ES_HUB = {
  path: ES_HUB_PATH,
  seoTitle: "Instalación móvil de llantas en el sur de Florida",
  description:
    "La camioneta de Extreme Tires instala sus llantas en su casa, trabajo u obra en Miami-Dade, Broward y Palm Beach. Reserve en línea o llame.",
  crumb: "Instalación móvil",
  eyebrow: "Instalación móvil · Miami-Dade, Broward y Palm Beach",
  h1: "Instalación móvil de llantas en el sur de Florida",
  lede: `Usted compró las llantas; nosotros vamos a instalarlas. Una camioneta de ${BUSINESS.parent}, con el equipo completo, lleva su juego de llantas a su casa, su trabajo o su obra en ${AREA_ES} y las instala donde ya está estacionado el vehículo.`,
  howTitle: "Compradas en TireDrop, instaladas donde estaciona",
  vanTitle: "Qué hace la camioneta junto a su vehículo",
  areaTitle: "Dónde trabaja la camioneta",
  areaLede: `La camioneta sale de la tienda de ${BUSINESS.shop.city} y cubre ${AREA_ES}. Si su código postal está en uno de ellos, vamos a donde usted está. Cada ciudad con página propia en español aparece abajo; las demás páginas de ciudades están en inglés.`,
  zipNote:
    "Si su ciudad no tiene página, igual puede tener servicio. La cobertura se decide por código postal: si el lugar donde está estacionado el vehículo tiene un código postal de Miami-Dade, Broward o Palm Beach, vamos. Los Cayos de Florida no están cubiertos.",
  roadsideTitle: "Ayuda con llantas ponchadas, fuera de la autopista",
  roadsideLede: `¿Una llanta ponchada en una calle lateral, en un estacionamiento, en su entrada o en su trabajo? Llame durante el horario de la tienda y la camioneta va hasta el vehículo en ${AREA_ES}. Se cambia la llanta, se repara si se puede, o se coloca su repuesto.`,
  ctaTitle: "Que su día no dependa de un taller de llantas",
  ctaBody: `Díganos el vehículo y la dirección. Llevamos las llantas y las herramientas, y nos llevamos las viejas. ${ARRIVAL_ES}`,
  faq: [
    {
      q: "¿La instalación móvil está disponible en todos los lugares adonde envían llantas?",
      a: `No. ${BUSINESS.name} envía llantas a los 48 estados contiguos y DC, pero las camionetas son un servicio del sur de Florida, que sale de la tienda de ${BUSINESS.shop.city} y cubre ${AREA_ES}. Si usted está fuera de esos tres condados, sus llantas se envían a su dirección y las instala el taller que usted prefiera.`,
    },
    {
      q: "¿Me las lleva la camioneta si compré mis llantas aquí?",
      a: `Para eso es el servicio. Al pagar, elija el envío gratis a la tienda de ${BUSINESS.shop.city} y luego reserve una instalación móvil: la camioneta carga su juego y se lo lleva a su dirección. Si pidió que se las enviaran a su casa, déjelas donde están y las instalamos allí.`,
    },
    {
      q: "¿Cuesta más que ir a la tienda?",
      a: PRICE_FAQ,
    },
    {
      q: "¿Cuánto espacio necesita la camioneta?",
      a: "Un espacio de estacionamiento estándar junto a su vehículo y unos 10 pies (3 metros) de espacio libre del lado donde se trabaja. Sirve una entrada de casa, un tramo plano de calle, el estacionamiento de una oficina o una obra. No necesitamos su garaje ni un elevador para vehículos.",
    },
    {
      q: "¿Pueden ayudarme si se me ponchó una llanta lejos de casa?",
      a: `Sí: en una calle lateral, en un estacionamiento, en su casa o en su trabajo, en cualquiera de los tres condados y durante el horario de la tienda. El técnico cambia la llanta, le pone su repuesto o repara la ponchadura si se puede; antes, un técnico revisa el interior de la llanta. ${ARRIVAL_ES} ${HIGHWAY_LINE_ES}`,
    },
  ],
};

/** The Spanish city pages: one entry per city in ES_CITY_SLUGS. */
export const ES_CITY_PAGES = [
  {
    slug: "hialeah-fl",
    enSlug: "hialeah-fl",
    path: esCityPath("hialeah-fl"),
    name: "Hialeah",
    county: "Miami-Dade",
    seoTitle: "Instalación móvil de llantas en Hialeah, FL",
    description:
      "Llantas de TireDrop instaladas en su casa o trabajo en Hialeah, FL por la camioneta de Extreme Tires. Verifique su código postal en Miami-Dade.",
    eyebrow: "Instalación móvil · Condado de Miami-Dade",
    h1: "Instalación móvil de llantas en Hialeah, FL",
    intro: `Nuestra tienda está al otro lado de la línea del condado, en ${BUSINESS.shop.city}, pero la camioneta de ${BUSINESS.parent} también trabaja en Miami-Dade. Las llantas que compre en TireDrop se pueden instalar en Hialeah: en su entrada, en el estacionamiento de su edificio o en su lugar de trabajo. Elija la instalación móvil al pagar y el técnico hace el resto junto a su vehículo.`,
    whereTitle: "Dónde trabajamos en Hialeah",
    whereWeWork: [
      "Miami-Dade es uno de los tres condados que cubre la camioneta, junto con Broward y Palm Beach, y en los tres rige una sola regla: el código postal de cinco dígitos del lugar donde estará estacionado el vehículo. Si ese código postal es de Miami-Dade, Broward o Palm Beach, la camioneta va.",
      "Esta es nuestra primera página para una ciudad de Miami-Dade, así que dice solo lo que podemos respaldar: el condado, la regla del código postal y lo que hace la camioneta. No publicamos una lista de códigos postales porque ninguno está confirmado. El verificador de esta página responde para cualquier código postal.",
    ],
    route: `Las camionetas de ${BUSINESS.parent} salen de nuestra tienda de ${BUSINESS.shop.city}, en el condado de Broward, así que una visita a Hialeah empieza al otro lado de la línea del condado. Reservamos por código postal. ${ARRIVAL_ES}`,
    beforeTitle: "Qué conviene saber antes de la visita",
    beforeLede:
      "Como la camioneta sale de Broward, unos datos nos ayudan a planear la visita a Hialeah. Ninguno es obligatorio.",
    beforePoints: [
      "Dé el código postal del lugar donde estará el vehículo, junto con la dirección. El formulario de reservas lo verifica.",
      "Díganos si hay una puerta con control de acceso, un guardia o una oficina del edificio con la que el técnico deba presentarse.",
      `Si prefiere no usar la camioneta, las llantas se envían gratis a la tienda de ${BUSINESS.shop.city}, en el condado de Broward, para instalarlas en el taller.`,
    ],
    notesTitle: "Notas sobre llantas para conductores de Hialeah",
    notes: [
      "Una llanta envejece aunque el vehículo no se mueva. Cada una lleva un código DOT en el costado, y los últimos cuatro dígitos indican la semana y el año de fabricación: 2524 significa la semana 25 de 2024. El calor y el sol maltratan el caucho, así que una llanta vieja puede tener buena banda de rodamiento y aun así estar agrietada en el costado.",
      "Pídale al técnico que le muestre el código en sus llantas viejas y en las nuevas durante la visita. Toma unos segundos y le dice la edad de cada llanta.",
    ],
    roadsideTitle: "Ayuda con llantas ponchadas en Hialeah",
    roadsideLede:
      "¿Se le ponchó una llanta en un estacionamiento, una entrada o una calle lateral de Hialeah? La reparación móvil empieza con una llamada durante el horario de la tienda. Si el daño se puede reparar, el técnico lo hace donde está el vehículo; si no, se coloca su repuesto.",
    vanTitle: "Qué hace la camioneta en Hialeah",
    scopeTitle: "Qué esperar",
    faqTitle: "Preguntas desde Hialeah",
    ctaTitle: "Reserve una instalación móvil en Hialeah",
    faq: [
      {
        q: "¿De verdad va la camioneta a Miami-Dade?",
        a: "Sí. La instalación móvil cubre los condados de Miami-Dade, Broward y Palm Beach, y se decide por código postal. Verifique en esta página el código postal del lugar donde estará el vehículo; al pagar se hace la misma verificación.",
      },
      {
        q: "¿Dónde está la tienda? ¿Está en Hialeah?",
        a: `La tienda está en ${BUSINESS.shop.city}, en el condado de Broward, no en Hialeah. La camioneta es la forma en que los conductores de Hialeah instalan sus llantas sin hacer ese viaje.`,
      },
      {
        q: "¿Qué pasa si mi código postal no está cubierto?",
        a: `El verificador y el pago se lo dicen antes de pagar. Si está fuera de Miami-Dade, Broward y Palm Beach, envíe las llantas gratis a nuestra tienda de ${BUSINESS.shop.city} o llame al ${BUSINESS.phone}.`,
      },
      {
        q: "¿Tengo que comprar mis llantas en TireDrop para reservar la camioneta?",
        a: "No. Si ya tiene las llantas en su garaje, reserve la camioneta para instalarlas.",
      },
      {
        q: "¿Puede la camioneta instalar llantas en mi lugar de trabajo en Hialeah?",
        a: "Sí. El estacionamiento necesita espacio junto al vehículo y la propiedad debe permitir vehículos de servicio. Díganos el edificio, el estacionamiento y la fila.",
      },
      {
        q: "¿Cómo puedo saber cuántos años tienen mis llantas?",
        a: "Lea el código DOT en el costado. Los últimos cuatro dígitos son la semana y el año de fabricación, así que 2524 es la semana 25 de 2024. El técnico puede mostrarle el código de cada llanta durante la visita.",
      },
    ],
  },
];

export const getEsCityPage = (slug) =>
  ES_CITY_PAGES.find((c) => c.slug === slug) ?? null;
