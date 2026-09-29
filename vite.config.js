import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { generateSeoFiles } from "./scripts/generate-seo-files.mjs";

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

// `--mode preview` produces a build that runs from any static host without
// SPA rewrites: relative asset paths plus hash routing (see src/main.jsx).
//
// The manifest (dist/.vite/manifest.json) maps each lazy page to its chunk so
// scripts/prerender.mjs can add modulepreload links; the script deletes it
// once it is done. VITE_BUILD_YEAR is the footer's year in prerendered HTML
// (see Footer.jsx).
export default defineConfig(({ mode }) => ({
  plugins: [react(), seoFiles()],
  base: mode === "preview" ? "./" : "/",
  define: {
    "import.meta.env.VITE_BUILD_YEAR": JSON.stringify(
      String(new Date().getFullYear()),
    ),
  },
  build: { manifest: mode !== "preview" },
}));
