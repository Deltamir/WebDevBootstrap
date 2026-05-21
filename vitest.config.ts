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
      include: ["stores/**", "lib/**", "server/**", "composables/**"],
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
