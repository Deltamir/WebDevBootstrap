import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./test/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }], ["junit", { outputFile: "test-results/junit.xml" }]]
    : [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    ...(isCI
      ? []
      : [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
          },
        ]),
  ],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/testdb",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ||
        "ci-test-secret-minimum-32-chars-padding-ok",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    },
  },
});
