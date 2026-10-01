/**
 * Writes dist/data/vpic-models.json: every listed make's models across all
 * years, from NHTSA vPIC, so the vehicle finders still offer the real model
 * list when neither /api/vehicles nor vPIC answers in the shopper's browser
 * (src/data/vehicles.js, step 3). Run by `npm run build` after the prerender.
 *
 * It never fails the build. One probe request decides whether vPIC can be
 * reached; if not (a sandbox, an outage), it writes nothing and the finders
 * fall back to the size-table models, saying so. A make is kept only when
 * all three vehicle types answered, and the whole run stops asking after
 * two minutes.
 *
 *   VPIC_SNAPSHOT=off     skip it
 *   VPIC_BASE=<url>       ask another vPIC (a mock: scripts/vpic-mock.mjs)
 *   VPIC_SNAPSHOT_OUT=<path>   write somewhere else
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { buildSnapshot } from "../api/_lib/vehicles.js";

const OUT = process.env.VPIC_SNAPSHOT_OUT ?? "dist/data/vpic-models.json";
const log = (msg) => console.log(`[vpic-snapshot] ${msg}`);

if (/^(off|0|false|no)$/i.test(process.env.VPIC_SNAPSHOT ?? "")) {
  log("skipped (VPIC_SNAPSHOT=off)");
} else {
  try {
    const snap = await buildSnapshot({
      base: process.env.VPIC_BASE || undefined,
      log,
    });
    if (snap) {
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, JSON.stringify(snap));
      const models = Object.values(snap.makes).reduce((n, l) => n + l.length, 0);
      log(`wrote ${OUT}: ${Object.keys(snap.makes).length} makes, ${models} models`);
    } else {
      log("no snapshot written; the finders fall back to the size-table models");
    }
  } catch (e) {
    log(`no snapshot written (${e?.message ?? e})`);
  }
}
