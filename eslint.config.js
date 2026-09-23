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
export default [
  { ignores: ["dist/**", "node_modules/**", ".scratch/**"] },
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
    files: ["scripts/**/*.mjs", "*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { "no-unused-vars": "off" },
  },
];
