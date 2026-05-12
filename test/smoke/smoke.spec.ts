import { test, expect } from "@playwright/test";

test.describe("Production smoke", () => {
  test("root page is reachable", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("public page is reachable", async ({ page }) => {
    const res = await page.goto("/public");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page is reachable", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("protected page redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/protected");
    await expect(page).toHaveURL(/\/login/);
  });

  test("auth session API responds without 5xx", async ({ request }) => {
    const res = await request.get("/api/auth/session");
    expect(res.status()).toBeLessThan(500);
  });
});
