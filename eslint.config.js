import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
        globals: globals.node,
        ecmaVersion: 2025,
        sourceType: "module",
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
        "indent": ["error", 4],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
    }
  }
];
