/**
 * E2E suite — theme toggle + persistence.
 *
 * Pins two contracts:
 *
 *   1. Clicking the header theme button flips the Vuetify global theme
 *      (verified via the icon class change — mdi-weather-night ⇄
 *      mdi-weather-sunny).
 *
 *   2. The chosen theme survives a page reload (pinia-plugin-persistedstate
 *      writes the store to localStorage under the `preferencesStore` key).
 *      This is the user-visible contract of the persistence wiring — we
 *      assert it by toggling, reloading, and checking the icon.
 */
import { test, expect } from "@playwright/test";

test.describe("Theme toggle (persistence)", () => {
  test("clicking the theme button flips the icon and persists across reloads", async ({
    page,
  }) => {
    await page.goto("/public");
    // The toggle button has an icon class — find it via the icon name.
    const moonBtn = page.locator(".mdi-weather-night, .mdi-weather-sunny").first();
    await expect(moonBtn).toBeVisible();

    const initialClass = await moonBtn.getAttribute("class");
    const initiallyDark = initialClass?.includes("mdi-weather-night") ?? false;

    // Toggle theme. The button itself is the icon's parent v-btn.
    await moonBtn.click();
    // After toggle, the icon class should have flipped to the OTHER state.
    const flipped = page
      .locator(initiallyDark ? ".mdi-weather-sunny" : ".mdi-weather-night")
      .first();
    await expect(flipped).toBeVisible();

    // Reload — the persisted store should reapply the toggled theme.
    await page.reload();
    const stillFlipped = page
      .locator(initiallyDark ? ".mdi-weather-sunny" : ".mdi-weather-night")
      .first();
    await expect(stillFlipped).toBeVisible();
  });
});
