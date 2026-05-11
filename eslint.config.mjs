import withNuxt from "./.nuxt/eslint.config.mjs";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import pluginSecurity from "eslint-plugin-security";

/** @type {import('eslint').Linter.Config[]} */
export default withNuxt(
  { files: ["**/*.{js,mjs,cjs,ts,vue}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  {
    plugins: { security: pluginSecurity },
    rules: {
      // Rules compatible with ESLint 10 flat config
      // (detect-unsafe-regex and detect-no-csrf-before-method-override omitted:
      //  they use context.getSourceCode() removed in ESLint 10)
      "security/detect-buffer-noassert": "warn",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "warn",
      "security/detect-eval-with-expression": "error",
      "security/detect-new-buffer": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-require": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "warn",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ["pages/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  {
    files: ["test/**"],
    rules: {
      // Test files may use dynamic requires for fixtures
      "security/detect-non-literal-fs-filename": "off",
    },
  }
);
