import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePreferencesStore } from "~/stores/preferences";

describe("usePreferencesStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("defaults to dark theme", () => {
    const store = usePreferencesStore();
    expect(store.theme).toBe("dark");
  });

  it("accepts light theme assignment", () => {
    const store = usePreferencesStore();
    store.theme = "light";
    expect(store.theme).toBe("light");
  });

  it("accepts dark theme assignment", () => {
    const store = usePreferencesStore();
    store.theme = "light";
    store.theme = "dark";
    expect(store.theme).toBe("dark");
  });

  it("initialises a fresh store independently from another instance", () => {
    const storeA = usePreferencesStore();
    storeA.theme = "light";

    setActivePinia(createPinia());
    const storeB = usePreferencesStore();
    expect(storeB.theme).toBe("dark");
  });
});
