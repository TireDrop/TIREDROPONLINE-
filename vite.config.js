import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateSeoFiles } from "./scripts/generate-seo-files.mjs";
import { relative, sep } from "node:path";
import { CONTENT_DIR, loadContent } from "./src/content/node.js";
import { articleDetail, articleSummary } from "./src/content/core.js";
import { buildPageIndex, pageIndexContent } from "./src/lib/sitePages.js";
import { pickHomeReading } from "./src/lib/homeReading.js";
import { TOOL_PAGES } from "./src/components/demos/toolPages.js";

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

// A few fields of a big data file as a small module, for code that sits on
// every page or on the home page and needs only those fields. The build
// inlines just the picked fields as JSON; `vite dev` re-exports the real file
// instead, so an edit there still hot-reloads.
//
//   "virtual:tool-links"  each tool page's path, label and blurb, for the
//                         home page's tool list. toolPages.js is mostly the
//                         tool pages' own copy (intro, how-to, FAQ).
const picked = (name, file, exportName, rows, fields) => {
  const id = `virtual:${name}`;
  const pick = (row) => Object.fromEntries(fields.map((f) => [f, row[f]]));
  let serve = false;
  return {
    name: `tiredrop-${name}`,
    configResolved(config) {
      serve = config.command === "serve";
    },
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(source) {
      if (source !== `\0${id}`) return null;
      if (serve)
        return `import { ${exportName} } from "${file}";
export default ${exportName}.map((row) => Object.fromEntries(${JSON.stringify(fields)}.map((f) => [f, row[f]])));`;
      return `export default ${JSON.stringify(rows.map(pick))};`;
    },
  };
};
const toolLinks = () =>
  picked("tool-links", "/src/components/demos/toolPages.js", "TOOL_PAGES", TOOL_PAGES, [
    "path",
    "label",
    "blurb",
  ]);
// Learn and Blog content for the browser, split so no page downloads an
// article it does not show (src/content/index.js, src/content/details.js):
//   "virtual:content-summaries"  every visible article's list fields (title,
//                                description, hub, dates, minutes), no body;
//   "<file>.md?article"           one article's remaining frontmatter and its
//                                body rendered to HTML, one chunk each.
// Both read one store per build, with drafts shown exactly when
// src/content/index.js shows them (dev and --mode preview).
const CONTENT_SUMMARIES = "virtual:content-summaries";
const contentModules = () => {
  let showDrafts = false;
  let logger = null;
  let store = null;
  const getStore = () => {
    if (store) return store;
    store = loadContent({ includeDrafts: showDrafts });
    if (showDrafts)
      for (const p of store.problems)
        logger?.[p.level === "error" ? "error" : "warn"](
          `[content] ${p.file}: ${p.message}`,
        );
    return store;
  };
  const visible = () => [
    ...getStore().getLearnArticles(),
    ...getStore().getBlogPosts(),
  ];
  return {
    name: "tiredrop-content",
    configResolved(config) {
      showDrafts = config.command === "serve" || config.mode === "preview";
      logger = config.logger;
    },
    buildStart() {
      store = null;
    },
    resolveId: (id) =>
      id === CONTENT_SUMMARIES ? `\0${CONTENT_SUMMARIES}` : null,
    load(id) {
      if (id === `\0${CONTENT_SUMMARIES}`)
        return `export default ${JSON.stringify(visible().map(articleSummary))};`;
      const [file, query = ""] = id.split("?");
      if (!new URLSearchParams(query).has("article")) return null;
      const key = `./${relative(CONTENT_DIR, file).split(sep).join("/")}`;
      const article = visible().find((a) => a.file === key);
      // null for a draft in a production build, or a file with errors: the
      // summaries never list it, so nothing asks for it.
      const detail = article
        ? articleDetail(article, getStore().renderArticle(article))
        : null;
      return `export default ${JSON.stringify(detail)};`;
    },
    // A content edit in dev can change any page (links, hubs, lists), so
    // rebuild the store and reload.
    handleHotUpdate({ file, server }) {
      if (!file.startsWith(CONTENT_DIR)) return;
      store = null;
      server.moduleGraph.invalidateAll();
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
};

// `--mode preview` produces a build that runs from any static host without
// SPA rewrites: relative asset paths plus hash routing (see src/main.jsx).
//
// The manifest (dist/.vite/manifest.json) maps each lazy page to its chunk so
// scripts/prerender.mjs can add modulepreload links; the script deletes it
// once it is done. VITE_BUILD_YEAR is the footer's year in prerendered HTML
// (see Footer.jsx).
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    seoFiles(),
    sitePages(),
    homeReading(),
    toolLinks(),
    contentModules(),
  ],
  base: mode === "preview" ? "./" : "/",
  define: {
    "import.meta.env.VITE_BUILD_YEAR": JSON.stringify(
      String(new Date().getFullYear()),
    ),
  },
  build: { manifest: mode !== "preview" },
}));
