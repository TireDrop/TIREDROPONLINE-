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
  apply: "build",
  buildStart: () => generateSeoFiles(),
});

// `--mode preview` produces a build that runs from any static host without
// SPA rewrites: relative asset paths plus hash routing (see src/main.jsx).
export default defineConfig(({ mode }) => ({
  plugins: [react(), seoFiles()],
  base: mode === "preview" ? "./" : "/",
}));
