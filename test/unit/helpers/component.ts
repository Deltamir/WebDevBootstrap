/**
 * Shared mounting helpers for the Vue component tests.
 *
 * These components are written for a real Nuxt + Vuetify runtime; lifting
 * them into vitest's `happy-dom` requires us to:
 *
 *   1. Stub Vuetify components — they are dozens of plugins deep and
 *      registering them all here would explode the dependency surface
 *      (we'd boot the entire Vuetify CSS / theme machinery for a unit
 *      test of one button). We replace them with passthrough stubs that
 *      preserve children/slots so test assertions on the rendered DOM
 *      still see the right text and attributes.
 *
 *   2. Stub Nuxt-only components (`NuxtLink`) — they aren't registered in
 *      a bare Vue test environment.
 *
 *   3. Provide a fresh Pinia store on each mount — Vue's `provide/inject`
 *      tree starts empty here, so any store the component relies on must
 *      be re-installed per test.
 *
 * Tests can extend these defaults via the `extraGlobal` arg
 * (e.g. inject a custom `providersInfos` list, override a specific stub).
 */
import { mount, type MountingOptions, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { h, defineComponent, Suspense, type Component } from "vue";

/**
 * Passthrough stub used for every Vuetify component we encounter.
 * Renders a `<div>` carrying the original tag name as `data-stub` so DOM
 * assertions remain debuggable, and forwards every named slot so text
 * children (titles, button labels, activator buttons, prepend icons, …)
 * are all in the output.
 *
 * Some Vuetify components — notably `<v-menu>` — surface their content
 * through TWO slots (`#activator` for the trigger button + the default slot
 * for the dropdown content). Production hides one and shows the other based
 * on user interaction; the test stub renders BOTH so assertions on either
 * can succeed without simulating mouse events.
 */
const vuetifyStub = defineComponent({
  name: "VuetifyStub",
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    return () => {
      const renderedSlots: unknown[] = [];
      // Vuetify exposes several text-bearing props that DON'T have a matching
      // slot — `<v-list-item title="Alice" />` renders "Alice" as visible text
      // via the prop alone. We mirror that by surfacing `title`, `subtitle`,
      // and `text` attrs at the start of the rendered children so text()
      // assertions can find them.
      for (const key of ["title", "subtitle", "text"]) {
        const value = (attrs as Record<string, unknown>)[key];
        if (typeof value === "string" && value.length > 0) {
          renderedSlots.push(value);
        }
      }
      // Default slot — most components' main content.
      if (slots.default) renderedSlots.push(slots.default());
      // Scoped activator slot — used by v-menu, v-tooltip, v-dialog, … to
      // pass an empty `props` object the activator can `v-bind` against.
      if (slots.activator) renderedSlots.push(slots.activator({ props: {} }));
      // Decorative slots — used for icons / leading content.
      if (slots.prepend) renderedSlots.push(slots.prepend());
      if (slots.append) renderedSlots.push(slots.append());
      return h(
        "div",
        {
          ...attrs,
          "data-vuetify-stub":
            (attrs as { "data-tag"?: string })["data-tag"] ?? "v-*",
        },
        renderedSlots,
      );
    };
  },
});

const nuxtLinkStub = defineComponent({
  name: "NuxtLink",
  props: { to: { type: [String, Object], required: false, default: "" } },
  setup(props, { slots }) {
    return () => h("a", { href: String(props.to ?? "") }, slots.default?.());
  },
});

/**
 * Project components are Nuxt auto-imports — they reference each other by
 * tag name (`<menu-item />`, `<user-item />`, …) without an explicit
 * `import` statement. In a vitest environment those auto-imports don't
 * exist, so we register a passthrough stub for each one (with both kebab
 * and pascal aliases — Vue resolves either). Tests that target a specific
 * project component override its entry via `global.stubs` to swap in a
 * spy-able stub.
 */
const PROJECT_COMPONENT_TAGS = [
  "AppHeader",
  "AppFooter",
  "AccountItem",
  "LoginItem",
  "MenuItem",
  "NavItem",
  "UserItem",
  "app-header",
  "app-footer",
  "account-item",
  "login-item",
  "menu-item",
  "nav-item",
  "user-item",
  // Built-in Nuxt page helpers — rendered as anchors / wrappers.
  "NuxtPage",
  "NuxtRouteAnnouncer",
  "nuxt-page",
  "nuxt-route-announcer",
];

const VUETIFY_TAGS = [
  "v-app-bar",
  "v-app-bar-nav-icon",
  "v-app-bar-title",
  "v-avatar",
  "v-alert",
  "v-btn",
  "v-card",
  "v-card-actions",
  "v-card-text",
  "v-card-title",
  "v-col",
  "v-container",
  "v-divider",
  "v-expand-transition",
  "v-footer",
  "v-icon",
  "v-layout",
  "v-list",
  "v-list-group",
  "v-list-item",
  "v-list-item-subtitle",
  "v-list-item-title",
  "v-list-subheader",
  "v-main",
  "v-menu",
  "v-navigation-drawer",
  "v-row",
  "v-skeleton-loader",
  "v-spacer",
  "v-text-field",
  "v-tooltip",
  "v-window",
  "v-window-item",
];

export type ComponentMountOptions = MountingOptions<unknown> & {
  /** Extra entries merged into `global.provide`. */
  provide?: Record<string, unknown>;
  /**
   * Wrap the mounted component in a `<Suspense>` boundary. Required for any
   * component whose `<script setup>` uses a top-level `await` (Vue suspends
   * such components until the promise resolves; without a Suspense ancestor
   * the mount throws). Tests must follow the mount with `await flushPromises()`
   * to drain the suspended setup.
   */
  suspense?: boolean;
};

/**
 * Mount a component with the project-wide default stubs + Pinia.
 *
 * Always installs a fresh Pinia. Always stubs Vuetify components and
 * NuxtLink. Test files only need to supply `props`, `provide`, and any
 * extra component-specific stubs.
 */
export function mountWithStubs<C extends Component>(
  component: C,
  options: ComponentMountOptions = {},
): VueWrapper {
  setActivePinia(createPinia());

  const stubs: Record<string, unknown> = {
    NuxtLink: nuxtLinkStub,
    "nuxt-link": nuxtLinkStub,
  };
  for (const tag of VUETIFY_TAGS) {
    stubs[tag] = vuetifyStub;
  }
  for (const tag of PROJECT_COMPONENT_TAGS) {
    // Same passthrough stub — keeps slot content (titles, labels) visible to
    // text() assertions while preventing real recursive renders that would
    // require pulling in every dependency of every project component.
    stubs[tag] = vuetifyStub;
  }

  // Merge user-supplied stubs LAST so a test can override any of the
  // defaults — e.g. swap `v-btn` for a thinner stub that exposes events.
  const userStubs = (options.global?.stubs ?? {}) as Record<string, unknown>;
  Object.assign(stubs, userStubs);

  const target: Component = options.suspense
    ? defineComponent({
        components: { Inner: component },
        setup(_, { attrs }) {
          // Forward props/attrs (e.g. the `flavor` prop on LoginItem) onto
          // the wrapped component so test setup stays declarative.
          return () =>
            h(Suspense, null, {
              default: () => h(component as Component, attrs),
            });
        },
      })
    : (component as Component);

  return mount(target, {
    ...options,
    global: {
      ...(options.global ?? {}),
      stubs,
      provide: {
        ...(options.global?.provide ?? {}),
        ...(options.provide ?? {}),
      },
    },
  });
}
