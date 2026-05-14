/**
 * E2E suite — global layout (header + footer).
 *
 * Goal: assert the app-shell renders the documented chrome on every page,
 * regardless of auth status. These are user-visible regressions that would
 * survive a passing unit-test build (e.g. a typo in the footer copyright
 * year, or removing a NuxtLink in the header by accident).
 *
 * We hit /public because it is the only definite-public page with no
 * server-side data dependencies (no `useFetch`, no DB hit) — so failures
 * here cleanly point at the layout, not at backend state.
 */
import { test, expect } from "@playwright/test";

test.describe("App layout (chrome)", () => {
  test("renders the footer with both legal links on /public", async ({
    page,
  }) => {
    await page.goto("/public");
    const tos = page.getByRole("link", { name: "Terms of Service" });
    const pp = page.getByRole("link", { name: "Privacy Policy" });
    await expect(tos).toBeVisible();
    await expect(pp).toBeVisible();
    await expect(tos).toHaveAttribute("href", "/terms-of-service");
    await expect(pp).toHaveAttribute("href", "/privacy-policy");
  });

  test("renders the current year in the footer copyright", async ({
    page,
  }) => {
    await page.goto("/public");
    const year = new Date().getFullYear();
    await expect(page.locator("footer")).toContainText(String(year));
    await expect(page.locator("footer")).toContainText("All rights reserved");
  });

  test("renders the app bar title 'Name' linking to /", async ({ page }) => {
    await page.goto("/public");
    // The title is a <NuxtLink to="/">Name</NuxtLink> inside <v-app-bar-title>.
    const titleLink = page.getByRole("link", { name: "Name" });
    await expect(titleLink).toBeVisible();
    await expect(titleLink).toHaveAttribute("href", "/");
  });
});
