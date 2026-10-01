// The switch for the Returns, Warranty & Road Hazard page (/returns).
//
// The page is written from what the site already says (Terms §9–11, the
// shipping page, the financing FAQ). Where no policy has been confirmed, it
// shows a visible {TODO_JUSTIN: ...} marker instead of a made-up number. A
// page like that must not reach customers, so it is held back two ways:
//
//   RETURNS_PAGE_LIVE = false (now)
//     - production builds: no /returns page at all (the route renders the
//       404 page and nothing is prerendered for it), and none of the links to
//       it from the product page, cart, checkout, footer or shipping FAQ;
//     - preview and dev builds (DRAFT_BUILD below): the page and the links
//       render so Justin can review them, with the page marked noindex and
//       left out of sitemap.xml.
//
//   RETURNS_PAGE_LIVE = true (once every TODO_JUSTIN is answered)
//     - the page and the links render everywhere, and /returns joins the
//       sitemap. scripts/prerender.mjs fails the build if any sitemap page
//       still contains "TODO_JUSTIN", so flipping this early cannot ship a
//       placeholder.
//
// No imports: src/data/business.js reads RETURNS_FOOTER_LINK from here, and
// the scripts in scripts/ import this file in plain Node.

export const RETURNS_PATH = "/returns";

/** Flip to true only after every TODO_JUSTIN in returnsPolicy.js is answered. */
export const RETURNS_PAGE_LIVE = false;

/**
 * Whether a build is allowed to show the draft. Takes a process.env-like
 * object, so vite.config.js and the Node scripts decide the same way.
 *
 * Off unless something says otherwise: a build that cannot tell where it is
 * going is treated as production. RETURNS_DRAFT=on|off overrides, for a local
 * build; otherwise only a Vercel preview deployment (VERCEL_ENV=preview)
 * shows it.
 */
export function draftAllowedByEnv(env = {}) {
  const forced = String(env.RETURNS_DRAFT ?? "").toLowerCase();
  if (forced === "on") return true;
  if (forced === "off") return false;
  return env.VERCEL_ENV === "preview";
}

// In the app, vite.config.js bakes the answer in as VITE_RETURNS_DRAFT
// ("on"/"off"; always "on" under `vite` dev). In plain Node there is no
// import.meta.env, so read the environment directly.
function readDraftBuild() {
  let baked;
  try {
    baked = import.meta.env.VITE_RETURNS_DRAFT;
  } catch {
    baked = undefined;
  }
  if (baked === "on" || baked === "off") return baked === "on";
  const env = globalThis.process?.env;
  return Boolean(env) && draftAllowedByEnv(env);
}

export const DRAFT_BUILD = readDraftBuild();

/** Whether this build renders the page and the links to it. */
export const RETURNS_PAGE_SHOWN = RETURNS_PAGE_LIVE || DRAFT_BUILD;

/** The footer's returns link: the new page when shown, else the terms. */
export const RETURNS_FOOTER_LINK = RETURNS_PAGE_SHOWN
  ? { label: "Returns & Warranty", to: RETURNS_PATH }
  : { label: "Returns & Refunds", to: "/terms#returns" };
