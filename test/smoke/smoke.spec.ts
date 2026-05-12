// Smoke tests run against the live Vercel production deployment immediately
// after every successful deploy (triggered by the deployment_status CI event
// in .github/workflows/smoke.yml). They are intentionally minimal — just
// enough to confirm the app did not ship catastrophically broken. Full
// functional and integration coverage lives in test/e2e/.
//
// On failure, smoke.yml posts a commit comment on the deployed SHA with a
// link to this run and manual rollback instructions (Vercel dashboard →
// previous deployment → Promote to Production).
import { test, expect } from "@playwright/test";

test.describe("Production smoke", () => {
  // Verifies the root page returns a 2xx/3xx — not a 500 server crash.
  // The root page is public (definePageMeta({ auth: false }) in index.vue).
  test("root page is reachable", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  // Verifies the dedicated public page is reachable without authentication.
  test("public page is reachable", async ({ page }) => {
    const res = await page.goto("/public");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  // Verifies the login page renders — a 500 here would block all authentication.
  test("login page is reachable", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  // Verifies that auth.global.ts middleware is alive: unauthenticated users
  // hitting a protected route must be redirected to /login, not served a 500.
  test("protected page redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/protected");
    await expect(page).toHaveURL(/\/login/);
  });

  // Verifies the Nitro server and Better Auth backend are responding.
  // /api/auth/session is the lightest possible backend probe — it requires
  // no DB write and returns 200 with a null session for unauthenticated callers.
  test("auth session API responds without 5xx", async ({ request }) => {
    const res = await request.get("/api/auth/session");
    expect(res.status()).toBeLessThan(500);
  });
});
