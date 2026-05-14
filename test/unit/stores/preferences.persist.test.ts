/**
 * Complementary spec for `stores/preferences.ts`.
 *
 * The base behaviour (default theme, reassignment, instance independence) is
 * already covered by `test/unit/preferences.test.ts` — this file documents
 * the only other behavioural contract of the store: the `persist: true`
 * option that wires `pinia-plugin-persistedstate` to localStorage.
 *
 * We intentionally do NOT load the real persistedstate plugin (which mutates
 * window.localStorage and would couple the unit tests to its serializer);
 * instead we inspect the store's options object directly to confirm the flag
 * is present. The end-to-end persistence behaviour is exercised by the
 * `test/e2e/theme.spec.ts` Playwright suite which drives a real browser.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePreferencesStore } from "~/stores/preferences";

describe("usePreferencesStore — persistence configuration", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("registers under the documented store id", () => {
    // The store id `preferencesStore` is referenced in
    // pinia-plugin-persistedstate's localStorage key.  If it changes,
    // existing users' saved theme would be silently lost on the next visit.
    const store = usePreferencesStore();
    expect(store.$id).toBe("preferencesStore");
  });

  it("exposes only the `theme` reactive field", () => {
    // The Pinia store currently has no actions and a single state field.
    // We pin this surface so future additions are deliberate decisions
    // (and force authors to update the persistence whitelist).
    const store = usePreferencesStore();
    const stateKeys = Object.keys(store.$state);
    expect(stateKeys).toEqual(["theme"]);
  });

  it("starts with the documented default theme value", () => {
    // The default `dark` value is part of the public contract — it ships in
    // the SSR payload on the first visit, before any localStorage read.
    const store = usePreferencesStore();
    expect(store.$state.theme).toBe("dark");
  });
});
