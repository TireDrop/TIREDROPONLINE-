import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateSeoFiles } from "./scripts/generate-seo-files.mjs";
import { loadContent } from "./src/content/node.js";
import { buildPageIndex, pageIndexContent } from "./src/lib/sitePages.js";
import { pickHomeReading } from "./src/lib/homeReading.js";

// robots.txt and sitemap.xml are derived from the router and the catalogs
// rather than maintained by hand, so they are regenerated at the start of
// every build. Writing into public/ (not dist/) keeps the generated output
// in the diff, where a stale or wrong URL is visible during review instead of
// only after a deploy.
const seoFiles = () => ({
  name: "tiredrop-seo-files",
  // Not on the server build scripts/prerender.mjs runs straight after.
  apply: (_config, { command, isSsrBuild }) =>
    command === "build" && !isSsrBuild,
  buildStart: () => generateSeoFiles(),
});

// The store search's page index (src/lib/sitePages.js) as a module the app
// imports as "virtual:site-pages": built here in Node from the same content
// store the sitemap reads, so the browser gets each page's title, path and a
// line of text rather than every article's Markdown. The header loads it the
// first time someone uses the search box; /search imports it outright.
const SITE_PAGES = "virtual:site-pages";
const sitePages = () => ({
  name: "tiredrop-site-pages",
  resolveId: (id) => (id === SITE_PAGES ? `\0${SITE_PAGES}` : null),
  load(id) {
    if (id !== `\0${SITE_PAGES}`) return null;
    const index = buildPageIndex(pageIndexContent(loadContent()));
    return `export default ${JSON.stringify(index)};`;
  },
});

// The home page's Learn cards (src/lib/homeReading.js) as "virtual:home-reading":
// a handful of titles, paths and reading times picked in Node, because the
// home page sits in the main bundle and src/content/index.js would pull every
// article's Markdown in with it.
const HOME_READING = "virtual:home-reading";
const homeReading = () => ({
  name: "tiredrop-home-reading",
  resolveId: (id) => (id === HOME_READING ? `\0${HOME_READING}` : null),
  load(id) {
    if (id !== `\0${HOME_READING}`) return null;
    return `export default ${JSON.stringify(pickHomeReading(loadContent()))};`;
  },
});

// `--mode preview` produces a build that runs from any static host without
// SPA rewrites: relative asset paths plus hash routing (see src/main.jsx).
//
// The manifest (dist/.vite/manifest.json) maps each lazy page to its chunk so
// scripts/prerender.mjs can add modulepreload links; the script deletes it
// once it is done. VITE_BUILD_YEAR is the footer's year in prerendered HTML
// (see Footer.jsx).
export default defineConfig(({ mode }) => ({
  plugins: [react(), seoFiles(), sitePages(), homeReading()],
  base: mode === "preview" ? "./" : "/",
  define: {
    "import.meta.env.VITE_BUILD_YEAR": JSON.stringify(
      String(new Date().getFullYear()),
    ),
  },
  build: { manifest: mode !== "preview" },
}));
