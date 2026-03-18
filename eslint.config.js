import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Load the recommended rules first
  js.configs.recommended,

  // Your General Rules for everything in src/
  {
    files: ["src/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.node } },
    rules: {
      // Error Prevention
      "no-undef": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unreachable": "error",
      "no-console": "off",
      "no-debugger": "warn",

      // Code Quality
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "default-case": "warn",
      "no-implicit-coercion": "warn",
      "no-multi-spaces": "error",

      // Readability & Maintainability
      "prefer-const": ["warn", { destructuring: "all" }],
      "no-var": "error",
      "object-shorthand": ["warn", "always"],
      "prefer-template": "warn",
      "consistent-return": "warn",

      // Functions & Style
      "arrow-body-style": ["warn", "as-needed"],
      "func-style": ["warn", "declaration", { allowArrowFunctions: true }],
      "no-nested-ternary": "warn",

      // DX Safety Nets
      "no-warning-comments": ["warn", { terms: ["todo", "fixme"], location: "start" }],
    },
  },

  // Specific override for server.js
  {
    files: ["src/server.js"],
    rules: { "consistent-return": "off" },
  },
]);
