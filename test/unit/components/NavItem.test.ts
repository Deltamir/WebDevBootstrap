/**
 * Unit tests for `components/NavItem.vue`.
 *
 * NavItem is the recursive drawer-sidebar counterpart of MenuItem. Two
 * branches:
 *
 *   - `item.items` is set    → renders a `<v-list-group>` with `<NavItem>`
 *                              for each sub-item (recursion).
 *   - `item.items` is unset  → renders a `<v-list-item>` whose `:active`
 *                              prop is bound to the computed `isActive`
 *                              (`route.path === item.to`).
 *
 * The `isActive` computation is the only piece of logic worth pinning —
 * it controls the highlight on the current page. We assert it by overriding
 * the global `useRoute` stub per scenario.
 */
import { describe, it, expect, vi } from "vitest";
import { defineComponent, h } from "vue";
import NavItem from "~/components/NavItem.vue";
import { mountWithStubs } from "../helpers/component";

// Same trick as MenuItem.test.ts: a one-level stub that surfaces the child's
// title so a single mount can prove recursion happened.
const recursingNavItemStub = defineComponent({
  name: "NavItem",
  props: { item: { type: Object, required: true } },
  setup(props) {
    return () =>
      h("div", (props.item as { title: string }).title);
  },
});

describe("NavItem", () => {
  it("renders a leaf list-item when the item has no subitems", () => {
    vi.stubGlobal("useRoute", () => ({ path: "/other" }));
    const wrapper = mountWithStubs(NavItem, {
      props: { item: { title: "Page", to: "/page" } },
    });
    expect(wrapper.text()).toContain("Page");
  });

  it("renders nested NavItems recursively for grouped items", () => {
    vi.stubGlobal("useRoute", () => ({ path: "/x" }));
    const wrapper = mountWithStubs(NavItem, {
      props: {
        item: {
          title: "Group",
          items: [
            { title: "Inner-A", to: "/a" },
            { title: "Inner-B", to: "/b" },
          ],
        },
      },
      global: {
        stubs: {
          NavItem: recursingNavItemStub,
          "nav-item": recursingNavItemStub,
        },
      },
    });
    expect(wrapper.text()).toContain("Inner-A");
    expect(wrapper.text()).toContain("Inner-B");
  });

  it("marks the item active when the current route matches item.to", () => {
    vi.stubGlobal("useRoute", () => ({ path: "/here" }));
    const wrapper = mountWithStubs(NavItem, {
      props: { item: { title: "Here", to: "/here" } },
    });
    // The stub <div> rendered for v-list-item receives the `:active` prop
    // verbatim — assert it's truthy (the value gets forwarded as a string
    // attribute "true" by the stub).
    const html = wrapper.html();
    expect(html).toMatch(/active="?true"?/);
  });

  it("calls navigateTo on click for leaf items", async () => {
    const navigateToSpy = vi.fn();
    vi.stubGlobal("navigateTo", navigateToSpy);
    vi.stubGlobal("useRoute", () => ({ path: "/" }));

    const wrapper = mountWithStubs(NavItem, {
      props: { item: { title: "Go", to: "/destination" } },
    });
    await wrapper.trigger("click");
    // The stub forwards the click handler — confirm the navigation target.
    expect(navigateToSpy).toHaveBeenCalledWith("/destination");
  });
});
