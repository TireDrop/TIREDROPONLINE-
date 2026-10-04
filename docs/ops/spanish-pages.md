# Spanish test pages

Two native Spanish pages, to find out whether Spanish searchers show up before more are built (competitor gap 10: no South Florida competitor shows Spanish booking or pricing).

| Page | URL | English twin |
| --- | --- | --- |
| Mobile service hub | `/es/instalacion-movil` | `/mobile-service` |
| Hialeah | `/es/instalacion-movil/hialeah-fl` | `/mobile-service/hialeah-fl` |

They are not the page translator in the header. The translator leaves nothing for a search engine to index; these are real pages with their own title, description, canonical and `<html lang="es">`.

## The indexing switch

Justin cannot review Spanish copy, so the pages ship **switched off**. One constant controls everything:

```js
// src/data/spanishRoutes.js
export const SPANISH_PAGES_INDEXABLE = false;
```

| | `false` (now) | `true` |
| --- | --- | --- |
| Spanish pages build and render (preview works) | yes | yes |
| Robots meta on the Spanish pages | `noindex, follow` | `index, follow` |
| In `sitemap.xml` | no | yes |
| hreflang on the Spanish pages and on their English twins | none | `en-US`, `es-US`, `x-default` (English), on both pages of each pair |
| "Español" link on the English pages | not shown (English pages are unchanged) | shown on the hub and on Hialeah |
| "English" link on the Spanish pages | shown | shown |

Everything above reads that one constant: the sitemap script (`scripts/generate-seo-files.mjs`), the Seo component (`src/components/ui/index.jsx`), the English pages' link (`src/components/services/TwinLink.jsx`) and the Spanish pages themselves. `scripts/prerender.mjs` fails the build if a Spanish page that is out of the sitemap would be indexable, and `npm run check:links` checks the whole picture in the built site.

## Turning it on

Only after a native Spanish speaker has approved the copy (checklist below):

1. Change the constant to `true` in `src/data/spanishRoutes.js`.
2. `npm run build`, then `npm run check:links`, `npm run check:schema` and `npm run check:prerender`. `check:links` expects the other half of each state (links and hreflang present).
3. Ship it like any other change, then in Search Console submit `/es/instalacion-movil` and `/es/instalacion-movil/hialeah-fl` for indexing.
4. Add a date and the reviewer's name to the line in `docs/LAUNCH-CHECKLIST.md`.

To pull the pages back out of search, set it to `false` again and ship.

## Where the copy is

- `src/data/spanishPages.js`: every Spanish sentence (hub, Hialeah, the words both share). Edit the copy there; no page code needs to change.
- `src/pages/services/SpanishMobilePage.jsx`: the one template for both pages, built from the same blocks as the English mobile pages.
- The install price is **not** in the copy. The strip ("Instalación desde $X por llanta") and the hub FAQ read the catalog through `src/lib/mobilePrice.js`, the same source as the English strip, so a price change in `src/data/services.js` updates both languages.

## What the pages do and do not say

Same facts as the English pages: the county, the ZIP rule, the shop at 7712 West Oakland Park Blvd near University Dr in Sunrise, the van does the install, the roadside rule (911 or *347 first on a highway). Not said, on purpose, until Justin confirms: that anyone on the crew speaks Spanish, anything about the community or its demographics. Also never: offers, "since" years, arrival times or speed promises, "safe to drive", or a competitor.

Still English on these pages, because they are shared with the rest of the site: the header, the footer, the booking form (`/schedule`), checkout, `/shipping`, `/install` and `/tires`. The Spanish pages link to them. The language control still offers every language; on a Spanish page it knows the page is Spanish (Español does nothing, another language translates from Spanish).

## Reviewer checklist (for the native speaker)

Read both pages on a phone, at `/es/instalacion-movil` and `/es/instalacion-movil/hialeah-fl` on the Vercel preview (they are noindex there), and the strings in `src/data/spanishPages.js`.

**Tone**
- [ ] Sounds like a South Florida shop talking to a driver: plain, friendly, not stiff, not a literal translation of the English.
- [ ] "Usted" everywhere, no "tú", and the commands (Reserve, Elija, Llámenos) read as polite, not bossy.
- [ ] Nothing reads like an advertisement shouting; no promises about speed or arrival times.

**Words (approve or give the word to use instead)**
- [ ] "llantas" for tires (not "neumáticos"). "Instalación móvil". "Camioneta" for the van.
- [ ] "llanta ponchada" and "ponchadura" for a flat and a puncture repair. Is that what Miami drivers say?
- [ ] "Hombro de una autopista" for highway shoulder (the 911 / *347 line). Better: "acotamiento", "orilla"?
- [ ] "Rines" for wheels (Instalación de rines). Better: "ruedas", "aros"?
- [ ] "Banda de rodamiento" for tread and "caucho" for rubber, in the DOT-code note.
- [ ] "Código postal (ZIP)" for ZIP code. "Ventana de llegada" for arrival window.
- [ ] "Elevador para vehículos" for a car lift.

**Accents and punctuation**
- [ ] Every accent, "ñ", and the opening "¿" and "¡" are in place (instalación, móvil, código, técnico, está).
- [ ] Times written the US way: "8:00 a. m. a 6:30 p. m."

**Numbers and units**
- [ ] Hours match the shop: lunes a viernes 8:00 a. m. a 6:30 p. m.; sábado 8:00 a. m. a 4:00 p. m.; domingo cerrado.
- [ ] "Instalación desde $… por llanta" matches the English strip.
- [ ] Phone (954) 773-1896, "10 pies (3 metros)", "2524 = semana 25 de 2024".
- [ ] "48 estados contiguos y DC".

**Sign-off**
- [ ] Reviewer's name and date: __________ (put it in the checklist line when the switch is turned on).

## Tests

- `src/data/spanishPages.test.mjs` (`npm run test:data`): Spanish titles and descriptions within the limits, the price read from the catalog, hreflang pairs reciprocal, switch off means noindex and out of the sitemap, no banned words, no competitor names, usted and llantas.
- `npm run check:links`: both pages are built with `<html lang="es">`, link to their English twin, each other, the booking page and the phone; the English pages link to them only while the switch is on.
- `npm run check:translate`: the language control on a Spanish page.
