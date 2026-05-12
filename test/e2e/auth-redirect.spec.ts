/**
 * E2E suite — middleware/auth.global.ts behaviour against the live app.
 *
 * The auth middleware has three branches (see its unit test). Here we
 * exercise the two that affect navigation:
 *
 *   1. Default-meta pages (`/protected`, `/settings`) must redirect
 *      anonymous visitors to `/login?redirect=<original path>`.
 *   2. The login page (`auth.unauthenticatedOnly: true`) must STAY on
 *      `/login` for anonymous visitors (no infinite redirect loop).
 *
 * We cannot easily test the authenticated branch in CI without seeding a
 * session row; the unit test covers it with a mocked `useSession`.
 */
import { test, expect } from "@playwright/test";

test.describe("Auth middleware redirects", () => {
  test("/protected → /login?redirect=/protected for anonymous visitors", async ({
    page,
  }) => {
    await page.goto("/protected");
    // The `/` in the query value may be percent-encoded (`%2F`) or kept
    // literal (`/`) depending on the URL serializer in use. Accept both
    // forms to stay independent of that detail — the only thing this
    // assertion really pins is "we landed on /login carrying the
    // original path".
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)protected$/);
  });

  test("/settings → /login?redirect=/settings for anonymous visitors", async ({
    page,
  }) => {
    // /settings is the second protected page; same middleware path as above
    // but a different `to.fullPath` — we pin both so a future change to the
    // middleware doesn't silently break only one.
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login\?redirect=(?:%2F|\/)settings$/);
  });

  test("login page stays on /login for anonymous visitors (no loop)", async ({
    page,
  }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("public page does not trigger an auth check or a redirect", async ({
    page,
  }) => {
    await page.goto("/public");
    await expect(page).toHaveURL(/\/public$/);
  });
});
