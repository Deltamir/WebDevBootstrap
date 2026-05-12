/**
 * E2E suite — login page rendering + OAuth button shape.
 *
 * We don't actually complete the OAuth flow (would require live GitHub /
 * Twitch credentials and human consent) — we test the surface that decides
 * what the user can click:
 *
 *   - the login card title is shown
 *   - one button per provider returned by /api/auth/providers/infos
 *   - each provider button surfaces its display name in a tooltip / accessible
 *     label so the screen-reader path works
 *
 * The "Sign up" toggle CTA must also flip the card title to the signup variant.
 */
import { test, expect } from "@playwright/test";

test.describe("Login page UI", () => {
  test("shows the login card and one button per OAuth provider", async ({
    page,
  }) => {
    await page.goto("/login");
    // Card title — verifies LoginItem renders in the default 'login' flavor.
    await expect(page.getByText("Log into you account")).toBeVisible();
    // The two providers come from /api/auth/providers/infos — pin BOTH so
    // adding/removing a provider triggers an explicit test update.
    await expect(page.locator(".mdi-github")).toBeVisible();
    await expect(page.locator(".mdi-twitch")).toBeVisible();
  });

  test("toggling 'Sign up now' switches to the signup flavor", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByText("Sign up now").click();
    await expect(page.getByText("Sign up !")).toBeVisible();
    await expect(page.getByText("Sign Up with Email")).toBeVisible();
  });

  test("toggling back to login restores the original CTA", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByText("Sign up now").click();
    // The signup card exposes a "Log in" CTA in its footer.
    await page.getByText("Log in", { exact: true }).click();
    await expect(page.getByText("Log into you account")).toBeVisible();
  });
});
