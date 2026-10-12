import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

// A deliberately narrow config. Its job is the one class of mistake a Vite
// build cannot catch: an identifier used but never imported. That produces a
// build which compiles cleanly and then throws on mount, leaving a blank
// page — exactly how a missing `useEffect` import reached a preview once.
//
// `no-unused-vars` is off rather than configured, because tracking JSX usage
// needs eslint-plugin-react and its only finding here would be tidiness, not
// correctness. Add it when there is a reason to.
//
// `shopify/` is a byte-for-byte mirror of the live theme (Dawn-based script
// globals, no modules), synced from the store rather than written here, so it
// is not linted as app code.
export default [
  // vite.config.js.timestamp-*.mjs: Vite's short-lived bundle of its config; a
  // build running beside lint deletes it mid-read and crashed the lint gate.
  {
    ignores: ["dist/**", "node_modules/**", ".scratch/**", "shopify/**", ".claude/worktrees/**", "vite.config.js.timestamp-*"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": "off",
      // Advisory, not a defect. It fires on resetting state when a prop
      // changes and on hydrating from localStorage on mount — both are what
      // CartContext has always done and both are correct here. Kept visible
      // as a warning rather than silenced outright.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // The content loader's Node half and its tests run in Node, not the page.
    files: ["src/content/node.js", "src/**/*.test.mjs"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.js", "api/**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { "no-unused-vars": "off" },
  },
];
