import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        width: 1280,
        height: 720,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov", "junit"],
      reportsDirectory: "./coverage",
      include: ["components/**", "stores/**", "lib/**", "server/**"],
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
