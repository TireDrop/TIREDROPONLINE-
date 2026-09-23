import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `--mode preview` produces a build that runs from any static host without
// SPA rewrites: relative asset paths plus hash routing (see src/main.jsx).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "preview" ? "./" : "/",
}));
