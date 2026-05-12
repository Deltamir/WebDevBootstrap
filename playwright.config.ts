import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

// BASE_URL is injected by smoke.yml and points to the live Vercel production
// URL (e.g. https://myapp-abc123.vercel.app). When absent — in local dev or
// during regular E2E CI — tests run against the local preview server started
// by the webServer block at the bottom of this file.
const smokeBaseURL = process.env.BASE_URL;

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
    // smokeBaseURL takes effect when the "smoke" project overrides baseURL
    // below. The global value here is a fallback for all other projects.
    baseURL: smokeBaseURL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Firefox and WebKit are only added locally to avoid paying for extra
    // CI minutes on every PR. Chromium coverage is sufficient in CI.
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
    {
      name: "smoke",
      // testDir override is critical: by pointing the smoke project to its own
      // directory, running `playwright test` (without --project filter) correctly
      // sends chromium/firefox/webkit to test/e2e/ and smoke to test/smoke/.
      // Without this, smoke tests would also run on every browser project and
      // they would be counted twice in the JUnit report.
      testDir: "./test/smoke",
      use: {
        ...devices["Desktop Chrome"],
        // Always read smokeBaseURL so the project targets either the live
        // Vercel URL (when BASE_URL is set by smoke.yml) or localhost (when
        // running locally or in regular E2E CI without BASE_URL).
        baseURL: smokeBaseURL ?? "http://localhost:3000",
      },
    },
  ],

  // Skip the local webServer entirely when BASE_URL is set. The smoke tests
  // target an external Vercel URL; there is nothing to build or start locally.
  // When BASE_URL is absent, webServer builds and starts `yarn preview` so
  // both the regular E2E tests and the smoke project can hit localhost:3000.
  webServer: smokeBaseURL
    ? undefined
    : {
        command: "yarn preview",
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
