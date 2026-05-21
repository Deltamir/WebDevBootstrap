import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    include: ["test/unit/**/*.{test,spec}.ts"],
    // helpers/ holds test plumbing (h3 stubs, event factories) — exclude it
    // from collection so vitest does not try to run it as a suite.
    exclude: ["test/unit/helpers/**", "node_modules/**", ".nuxt/**"],
    // The setup file installs the h3 / Nitro auto-import stubs (defineEventHandler,
    // createError, readBody, …) so that source files in server/api/** can be
    // imported by unit tests without booting a Nitro instance.
    setupFiles: ["./test/unit/helpers/setup.ts"],
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        width: 1280,
        height: 720,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      reportsDirectory: "./coverage",
      // Coverage scope is intentionally narrow: every file here is tested
      // by a self-contained unit suite under test/unit/**.
      // `components/**` and `pages/**` are NOT listed — they are Vue SFCs
      // whose behaviour requires a real Nuxt + Vuetify runtime to exercise
      // (auto-imports, plugins, router). Mocking that surface from a unit
      // test is brittle; we cover those files with Playwright in test/e2e/**.
      // Coverage scope is intentionally narrow: only files unit-testable
      // WITHOUT a live Nuxt + Vuetify runtime. `composables/**` is NOT
      // included because the project's composables (e.g. useApiAction)
      // depend on Nuxt-runtime composables like `useLoadingIndicator`
      // and `$fetch` that the auto-import transform binds to the real
      // Nuxt instance — mocking that surface is the brittle complexity
      // we removed deliberately. Components / pages / middleware are
      // out of scope for the same reason and are covered by Playwright.
      include: ["stores/**", "lib/**", "server/**"],
      exclude: [
        "**/*.spec.ts",
        "**/*.test.ts",
        "node_modules/**",
        ".nuxt/**",
        "coverage/**",
      ],
    },
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./coverage/junit.xml",
    },
    globals: true,
  },
});
