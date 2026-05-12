import { test, expect } from "@playwright/test";

test.describe("Public navigation", () => {
  test("public page is accessible without authentication", async ({ page }) => {
    await page.goto("/public");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("root page is accessible without authentication", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("protected page redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/protected");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/$/);
    await expect(page.locator("body")).toBeVisible();
  });
});
