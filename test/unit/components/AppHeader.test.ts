/**
 * Unit tests for `components/AppHeader.vue`.
 *
 * AppHeader is the largest component:
 *
 *   - Initialises the active Vuetify theme from `usePreferencesStore().theme`
 *     on mount (so the stored preference is reapplied on page reload).
 *
 *   - Owns a `drawer` ref (open/closed sidebar) and a `themeIcon` computed
 *     (chooses sun/moon based on current theme).
 *
 *   - `toggleTheme()` flips the store theme and the Vuetify global theme in
 *     lock-step.
 *
 *   - Renders the navigation tree from a `useState`-stored array of items —
 *     leaves go to `navigateTo(item.to)`, branches expand a nested menu.
 *
 * The stubs collapse Vuetify; we exercise the script through the public
 * interface (theme toggle button, drawer-nav icon, items prop).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref, computed } from "vue";
import AppHeader from "~/components/AppHeader.vue";
import { mountWithStubs } from "../helpers/component";
import { usePreferencesStore } from "~/stores/preferences";

describe("AppHeader", () => {
  // Captures the Vuetify theme name set during the component's lifecycle so
  // we can assert `useTheme().global.name.value = store.theme` ran on mount.
  const themeName = ref<"light" | "dark">("dark");
  const themeMock = {
    global: {
      name: themeName,
      current: computed(() => ({ dark: themeName.value === "dark" })),
    },
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    themeName.value = "dark";
    vi.stubGlobal("useTheme", () => themeMock);
    vi.stubGlobal("useRoute", () => ({ path: "/" }));
    // The component reads its items from `useState("appHeaderItems", () => [...])`.
    // Our generic stub returns whatever the init() factory produces — that's
    // the literal item tree defined in the .vue file.
  });

  it("applies the stored preferences theme on mount", () => {
    // Pre-seed the Pinia store to "light", expect the Vuetify theme to follow.
    const store = usePreferencesStore();
    store.theme = "light";
    mountWithStubs(AppHeader);
    expect(themeName.value).toBe("light");
  });

  it("renders the configured top-level menu items", () => {
    const wrapper = mountWithStubs(AppHeader);
    const text = wrapper.text();
    // These titles are hard-coded in AppHeader's items array — they're a
    // bootstrap example; if a future author renames them this assertion
    // ensures the change is intentional.
    expect(text).toContain("Menu 1");
    expect(text).toContain("Menu 2");
    expect(text).toContain("Menu 3");
    expect(text).toContain("Protected");
  });

  it("toggles between dark and light via toggleTheme()", async () => {
    const store = usePreferencesStore();
    store.theme = "dark";
    const wrapper = mountWithStubs(AppHeader);

    // Locate the theme-toggle button. It carries an mdi-weather-* icon —
    // our stub forwards `:icon` as an HTML attribute, so we search for it.
    const html = wrapper.html();
    expect(html).toContain("mdi-weather-night"); // initial: dark → moon

    // Invoke the toggle by triggering a click on the button-stub bearing the
    // theme icon. We grep through wrapper.findAll for a stub holding the
    // icon prop. The stub forwards `@click` to the v-btn DOM node.
    const themeBtn = wrapper
      .findAll("[icon]")
      .find((el) =>
        ["mdi-weather-night", "mdi-weather-sunny"].includes(
          el.attributes("icon") ?? "",
        ),
      );
    expect(themeBtn).toBeDefined();
    await themeBtn!.trigger("click");

    // After toggle: store.theme flipped to "light" and Vuetify global name too.
    expect(store.theme).toBe("light");
    expect(themeName.value).toBe("light");
  });
});
