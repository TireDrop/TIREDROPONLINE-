// The Spanish test pages (spanishPages.js, spanishRoutes.js): Spanish titles
// and descriptions within the limits, the price read from the catalog, hreflang
// pairs that are reciprocal, the indexing guard (switch off = noindex and out
// of the sitemap), and copy that follows the house rules.
//
//   npm run test:data      (node --test "src/data/*.test.mjs")
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AREA_ES,
  ES_CITY_PAGES,
  ES_HUB,
  ES_SHARED,
  HOURS_ES,
  MOBILE_SERVICE_NAMES_ES,
  timeEs,
} from "./spanishPages.js";
import {
  ES_CITY_SLUGS,
  ES_HUB_PATH,
  SPANISH_PAGES_INDEXABLE,
  SPANISH_TWINS,
  esCityPath,
  hreflangFor,
  isSpanishPath,
  langFor,
  spanishPaths,
  twinPath,
} from "./spanishRoutes.js";
import { CITY_PAGES } from "./cityPages.js";
import { BUSINESS } from "./business.js";
import { MOBILE_SERVICES, getService } from "./services.js";
import { EXCLUDE } from "../../scripts/generate-seo-files.mjs";
import { mobilePriceLine, mobilePriceLineEs } from "../lib/mobilePrice.js";
import { findCompetitorHosts, findCompetitorNames } from "../lib/competitors.js";
import { BANNED_WORDS } from "../components/demos/demoLogic.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const PAGE = read("../pages/services/SpanishMobilePage.jsx");
const COPY = read("./spanishPages.js");
const APP = read("../App.jsx");
const SEO_FILES = read("../../scripts/generate-seo-files.mjs");

function strings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  // Routing fields (path, slug) are not copy.
  if (value && typeof value === "object")
    return Object.entries(value)
      .filter(([k]) => !["path", "slug", "enSlug"].includes(k))
      .flatMap(([, v]) => strings(v));
  return [];
}

const PAGES = [ES_HUB, ...ES_CITY_PAGES];
const ALL_COPY = strings([ES_HUB, ES_CITY_PAGES, ES_SHARED, HOURS_ES, MOBILE_SERVICE_NAMES_ES, AREA_ES]);

/* ------------------------------ head ------------------------------ */

test("every Spanish page has a Spanish title and description inside the limits", () => {
  for (const p of PAGES) {
    const full = `${p.seoTitle} | ${BUSINESS.name}`;
    assert.ok(full.length <= 60, `${p.path}: title ${full.length}: ${full}`);
    assert.ok(p.description.length <= 155, `${p.path}: description ${p.description.length}`);
    assert.ok(p.description.length >= 80, `${p.path}: description too thin`);
    // Spanish, not the English page's: the words and the accents.
    assert.match(p.seoTitle, /llantas/i, p.path);
    assert.match(p.seoTitle, /instalación móvil/i, p.path);
    assert.match(p.description, /llantas|camioneta/i, p.path);
    assert.ok(!/mobile|tire|installation/i.test(`${p.seoTitle} ${p.description}`.replace(/Extreme Tires|TireDrop/g, "")), `${p.path}: English words in the head`);
  }
  const titles = PAGES.map((p) => p.seoTitle);
  assert.equal(new Set(titles).size, titles.length, "duplicate Spanish titles");
  const descriptions = PAGES.map((p) => p.description);
  assert.equal(new Set(descriptions).size, descriptions.length);
});

test("titles and descriptions differ from the English twins' (a translation, not a copy)", () => {
  const hialeahEn = CITY_PAGES.find((c) => c.slug === "hialeah-fl");
  assert.notEqual(ES_CITY_PAGES[0].seoTitle, hialeahEn.seoTitle);
  assert.notEqual(ES_CITY_PAGES[0].description, hialeahEn.description);
});

/* ------------------------------ wiring ------------------------------ */

test("each Spanish page has its English twin, and the city has an English page", () => {
  assert.deepEqual(spanishPaths(), [ES_HUB_PATH, esCityPath("hialeah-fl")]);
  assert.deepEqual(ES_CITY_SLUGS, ES_CITY_PAGES.map((c) => c.slug));
  for (const c of ES_CITY_PAGES) {
    assert.ok(CITY_PAGES.some((e) => e.slug === c.enSlug), `${c.slug}: no English city page`);
    assert.equal(c.path, esCityPath(c.slug));
    assert.ok(SPANISH_TWINS.some(([en, es]) => es === c.path && en === `/mobile-service/${c.enSlug}`));
    assert.ok(c.intro.includes(c.name), `${c.slug}: intro never names the city`);
    assert.ok(c.h1.includes(c.name));
  }
  assert.ok(SPANISH_TWINS.some(([en, es]) => en === "/mobile-service" && es === ES_HUB_PATH));
});

test("routed under /es/ and in the prerender list, through the router and the data", () => {
  assert.match(APP, /path="\/es\/instalacion-movil"\s*\n\s*element=\{<SpanishMobilePage kind="hub" \/>\}/);
  assert.match(APP, /path="\/es\/instalacion-movil\/:city"\s*\n\s*element=\{<SpanishMobilePage kind="city" \/>\}/);
  assert.match(SEO_FILES, /ES_CITY_SLUGS\.map\(\(slug\) => \(\{\s*path: esCityPath\(slug\)/);
});

test("the <html lang> follows the path: es under /es/, en everywhere else", () => {
  for (const [, es] of SPANISH_TWINS) assert.equal(langFor(es), "es");
  for (const p of ["/", "/mobile-service", "/mobile-service/hialeah-fl", "/tires"]) assert.equal(langFor(p), "en");
  assert.ok(isSpanishPath("/es/instalacion-movil/") && !isSpanishPath("/essential"));
});

/* ------------------------------ hreflang ------------------------------ */

test("hreflang pairs are reciprocal: both pages of a pair list the same three entries", () => {
  for (const [en, es] of SPANISH_TWINS) {
    const fromEn = hreflangFor(en, true);
    const fromEs = hreflangFor(es, true);
    assert.deepEqual(fromEn, fromEs, `${en} and ${es} must list the same alternates`);
    assert.deepEqual(fromEn, [
      { hreflang: "en-US", path: en },
      { hreflang: "es-US", path: es },
      { hreflang: "x-default", path: en },
    ]);
    // Each page names itself, and the other page.
    assert.ok(fromEn.some((a) => a.path === en) && fromEn.some((a) => a.path === es));
  }
  assert.deepEqual(hreflangFor("/mobile-service/sunrise-fl", true), [], "pages with no twin list nothing");
  assert.deepEqual(hreflangFor("/", true), []);
});

test("with the switch off no page names a Spanish alternate, and English pages have no Spanish link", () => {
  for (const [en, es] of SPANISH_TWINS) {
    assert.deepEqual(hreflangFor(en, false), []);
    assert.deepEqual(hreflangFor(es, false), []);
    assert.equal(twinPath(en, false), null, `${en} shows no Español link while off`);
    assert.equal(twinPath(en, true), es);
    // The Spanish side always links back to English: it is a preview.
    assert.equal(twinPath(es, false), en);
    assert.equal(twinPath(es, true), en);
  }
  assert.equal(twinPath("/mobile-service/sunrise-fl", true), null);
});

/* --------------------------- indexing guard --------------------------- */

test("the one switch is a boolean in src/data/spanishRoutes.js", () => {
  assert.equal(typeof SPANISH_PAGES_INDEXABLE, "boolean");
  assert.match(read("./spanishRoutes.js"), /export const SPANISH_PAGES_INDEXABLE = (true|false);/);
});

test("switch off means noindex and not in the sitemap; switch on means indexable and listed", () => {
  for (const path of spanishPaths()) {
    assert.equal(EXCLUDE.has(path), !SPANISH_PAGES_INDEXABLE, `${path} in EXCLUDE (the sitemap's skip list)`);
  }
  // The sitemap script excludes them from this one switch, and the pages read the same switch.
  assert.match(SEO_FILES, /\.\.\.\(SPANISH_PAGES_INDEXABLE \? \[\] : spanishPaths\(\)\)/);
  assert.match(PAGE, /noindex=\{!SPANISH_PAGES_INDEXABLE\}/);
  // The English pages' twin link and hreflang come from the same switch.
  assert.match(read("./spanishRoutes.js"), /twinPath\(pathname, indexable = SPANISH_PAGES_INDEXABLE\)/);
  assert.match(read("./spanishRoutes.js"), /hreflangFor\(pathname, indexable = SPANISH_PAGES_INDEXABLE\)/);
  // The English routes themselves never leave the sitemap because of it.
  assert.ok(!EXCLUDE.has("/mobile-service") && !EXCLUDE.has("/mobile-service/hialeah-fl"));
});

/* ------------------------------ the price ------------------------------ */

test("the price is the catalog's, never typed into the Spanish page or its copy", () => {
  const s = getService("tire-installation");
  const es = mobilePriceLineEs();
  assert.equal(es.text, `Instalación desde $${s.priceFrom} por llanta`);
  // Same number as the English strip.
  assert.equal(es.from.match(/\$[\d.]+/)[0], mobilePriceLine().from.match(/\$[\d.]+/)[0]);
  // The FAQ's price sentence comes from it too.
  const faq = ES_HUB.faq.find((f) => /cuesta más/i.test(f.q));
  assert.ok(faq.a.includes(`$${s.priceFrom}`), "FAQ shows the catalog price");
  // And no dollar figure is written by hand in the page or the copy.
  assert.ok(!/\$\s?\d/.test(COPY.replace(/\$\{[^}]*\}/g, "").replaceAll("$1", "")), "spanishPages.js has a typed price");
  assert.ok(!/\$\s?\d/.test(PAGE), "SpanishMobilePage.jsx has a typed price");
  // The copy's own strings hold no dollar amount except via the FAQ template above.
  for (const text of strings([ES_SHARED, ES_CITY_PAGES, { ...ES_HUB, faq: ES_HUB.faq.filter((f) => f !== faq) }]))
    assert.ok(!/\$\s?\d/.test(text), text);
  // The page uses the shared strip, in Spanish, rather than its own.
  assert.match(PAGE, /<MobilePriceStrip lang="es"/);
  assert.match(PAGE, /MOBILE_BOOK/);
  assert.match(PAGE, /BUSINESS\.phoneHref/);
});

/* ------------------------------ the facts ------------------------------ */

test("same facts as the English pages: county, ZIP rule, shop, van, roadside rule", () => {
  const hialeah = ES_CITY_PAGES[0];
  const text = strings(hialeah).join("\n");
  assert.match(text, /Miami-Dade/);
  assert.match(text, /código postal de cinco dígitos/);
  assert.match(text, /Miami-Dade, Broward o Palm Beach/);
  assert.match(text, /camioneta/);
  assert.match(text, /tienda de Sunrise/);
  assert.match(ES_SHARED.shopAddress, /7712 West Oakland Park Blvd, cerca de University Dr, en Sunrise/);
  assert.ok(ES_SHARED.shopAddress.includes(BUSINESS.shop.street));
  // Justin's highway wording, in Spanish: 911, *347, off the highway first.
  assert.match(ES_SHARED.highwayLine, /911 o al \*347 \(FDOT Road Rangers\)/);
  assert.ok(ES_SHARED.scope.includes(ES_SHARED.highwayLine));
  assert.ok(ES_HUB.faq.some((f) => f.a.includes(ES_SHARED.highwayLine)));
  // Installs and flat help away from the highway, during shop hours.
  assert.match(ES_SHARED.scope[0], /calles laterales, estacionamientos, casas y lugares de trabajo, durante el horario de la tienda/);
  // The phone in the copy is the business's.
  assert.ok(hialeah.faq.some((f) => f.a.includes(BUSINESS.phone)));
  // Installation is in three counties only.
  assert.match(ES_HUB.faq[0].a, /fuera de esos tres condados/);
  assert.match(ES_HUB.zipNote, /Los Cayos de Florida no están cubiertos/);
});

test("the hours are the shop's, in Spanish, with no English left over", () => {
  assert.deepEqual(HOURS_ES, [
    { days: "Lunes a viernes", time: "8:00 a. m. a 6:30 p. m." },
    { days: "Sábado", time: "8:00 a. m. a 4:00 p. m." },
    { days: "Domingo", time: "Cerrado" },
  ]);
  assert.equal(HOURS_ES.length, BUSINESS.hours.length);
  for (const h of HOURS_ES) assert.doesNotMatch(`${h.days} ${h.time}`, /\b(Mon|Fri|Saturday|Sunday|AM|PM|Closed)\b/);
  assert.equal(timeEs("9:00 AM – 12:15 PM"), "9:00 a. m. a 12:15 p. m.");
});

test("every mobile service in the catalog has a Spanish name", () => {
  assert.equal(MOBILE_SERVICE_NAMES_ES.length, MOBILE_SERVICES.length);
});

test("FAQs are short and visible: 4 to 6 questions each, written as Spanish questions", () => {
  for (const p of PAGES) {
    assert.ok(p.faq.length >= 4 && p.faq.length <= 6, `${p.path}: ${p.faq.length} questions`);
    for (const { q, a } of p.faq) {
      assert.match(q, /^¿.+\?$/, q);
      assert.ok(a.length > 20, q);
    }
  }
  // Rendered in the page (visible), and as FAQ schema from the same data.
  assert.match(PAGE, /<Accordion items=\{ES_HUB\.faq\}/);
  assert.match(PAGE, /<Accordion items=\{city\.faq\}/);
  assert.match(PAGE, /faqSchema\(page\.faq, path\)/);
});

/* ------------------------------ house rules ------------------------------ */

const OFF_LIMITS = [
  [/descuent|cupón|cupon|rebaja|oferta|promoci|promo\b|ahorr|liquidaci|especial del mes/i, "an offer or discount"],
  [/\bseguro\b|\bsegura\b|\bseguros\b|\bsin riesgo|\bgarantiza|\bgarantía/i, "a safe or guaranteed claim (seguro, garantizado)"],
  [/\bdesde (19|20)\d\d\b|\bdesde hace\b|\bmás de \d+ años|\b\d+ años de experiencia|\bfundad/i, "a since year or years of experience"],
  [/\b(hoy mismo|mañana|esta noche|mismo día|en minutos|en \d+ (minutos|horas|días)|\d+ minutos|rápido|rápida|inmediat|al instante|sin demora|24\s*\/\s*7|24 horas)\b/i, "an arrival time or speed promise"],
  [/\bAPR\b|tasa de interés|financiamiento|financiaci/i, "financing"],
  [/\b(Justin|Melissa|dueño|propietari)/i, "an owner name"],
  [/habla(mos|n)?\b|bilingüe|atención en español|servicio en español|personal que|nuestro equipo habla|latin[oa]|hispan|cuban|comunidad|inmigr|demogr|\bfamilias\b/i, "a language, community or demographic claim"],
  [/\b\d{1,2}(\.\d+)?\s*(millas?|km)\b|tiempo de manejo|a minutos de/i, "a distance or drive time"],
  [/\b(reseñas?|estrellas?|calificaci|opiniones de clientes)\b/i, "a review or rating"],
];

test("the Spanish copy follows the house rules (no offers, since-years, safe claims, arrival promises, language claims)", () => {
  for (const s of ALL_COPY) {
    for (const [re, what] of OFF_LIMITS) assert.ok(!re.test(s), `${what}: "${s}"`);
    assert.ok(!BANNED_WORDS.test(s), `banned word in "${s}"`);
  }
  // The one approved arrival sentence, in Spanish, and nothing else about arrival.
  for (const s of ALL_COPY) {
    const rest = s.replaceAll("Le confirmamos la ventana de llegada al reservar.", "");
    assert.doesNotMatch(rest, /\bllegad|\bllegar|\bllega\b|\bllegamos\b|\bentrega|\benvío en\b/i, `arrival wording in "${s}"`);
  }
  // Tires are never called "safe to drive", in either language.
  assert.ok(!/safe to drive|seguras? para (manejar|conducir)/i.test(ALL_COPY.join("\n")));
});

test("no competitor names or links in the Spanish copy, the page or the switch file", () => {
  for (const text of [ALL_COPY.join("\n"), PAGE, COPY, read("./spanishRoutes.js")]) {
    assert.deepEqual(findCompetitorNames(text), []);
    assert.deepEqual(findCompetitorHosts(text), []);
  }
  // No outside link at all in the Spanish page.
  assert.ok(!/href="https?:/i.test(PAGE));
});

test("usted throughout, llantas and camioneta, with the accents in place", () => {
  const all = ALL_COPY.join("\n");
  assert.ok(!/\b(tú|tu|tus|ti|contigo|puedes|tienes|quieres|necesitas|llámanos|reserva tu|elige|compra tus)\b/i.test(all), "tú forms found");
  assert.match(all, /\busted\b/i);
  assert.ok(!/neumátic|furgoneta/i.test(all), "use llantas and camioneta");
  assert.match(all, /llantas/);
  assert.match(all, /camioneta/);
  assert.match(all, /instalación móvil/i);
  // Words that need an accent never appear without one.
  assert.ok(!/\b(instalacion|movil|codigo|reparacion|rotacion|alineacion|suspension|sera|estara|despues)\b/i.test(all), "a missing accent");
  assert.ok(!/\b(mobile|install|tires?|booking|schedule|service|call)\b/i.test(all.replace(/Road Rangers|West Oakland Park Blvd|University Dr|Extreme Tires|TireDrop|TPMS/g, "")), "English words in the Spanish copy");
});

test("the page links the English twin, the booking page, the shop's shipping page and nothing external", () => {
  assert.match(PAGE, /twinPath\(path\)/);
  assert.match(PAGE, /hrefLang="en-US"/);
  assert.match(PAGE, /to="\/shipping"/);
  assert.match(PAGE, /to="\/tires"/);
});
