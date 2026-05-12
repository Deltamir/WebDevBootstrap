/**
 * Unit tests for `components/MenuItem.vue`.
 *
 * MenuItem is a recursive list item used in the AppHeader app-bar dropdown.
 * Two branches:
 *
 *   - `item.items` is set    → renders a `<v-btn>` with chevron + nested
 *                              `<v-menu>` that recursively renders MenuItem
 *                              for each sub-item.
 *   - `item.items` is unset  → renders a single button whose title triggers
 *                              `navigateTo(item.to)` when clicked.
 *
 * The stubs (see helpers/component.ts) collapse every `v-*` to a passthrough
 * `<div>`; we still see `item.title` in the text content, which is enough
 * to verify branch selection.
 */
import { describe, it, expect, vi } from "vitest";
import { defineComponent, h } from "vue";
import MenuItem from "~/components/MenuItem.vue";
import { mountWithStubs } from "../helpers/component";

// Custom stub for the recursive child: prints its `item.title` so we can
// assert that sub-items reach the recursion site. The default project-wide
// stub renders an empty <div> (no default slot is passed by the parent
// template — only the `item` prop), which would hide the recursion result.
const recursingMenuItemStub = defineComponent({
  name: "MenuItem",
  props: { item: { type: Object, required: true } },
  setup(props) {
    return () =>
      h("div", { class: "menu-item-recursive" }, (props.item as { title: string }).title);
  },
});

describe("MenuItem", () => {
  it("renders the title for a leaf item (no submenu)", () => {
    const wrapper = mountWithStubs(MenuItem, {
      props: { item: { title: "Solo", to: "/solo" } },
    });
    expect(wrapper.text()).toContain("Solo");
  });

  it("recursively renders subitems when item.items is present", () => {
    const wrapper = mountWithStubs(MenuItem, {
      props: {
        item: {
          title: "Parent",
          items: [
            { title: "Child A", to: "/a" },
            { title: "Child B", to: "/b" },
          ],
        },
      },
      // Override the project-wide MenuItem stub so the recursion site
      // surfaces the child titles via a real (one-level) render.
      global: {
        stubs: {
          MenuItem: recursingMenuItemStub,
          "menu-item": recursingMenuItemStub,
        },
      },
    });
    expect(wrapper.text()).toContain("Parent");
    expect(wrapper.text()).toContain("Child A");
    expect(wrapper.text()).toContain("Child B");
  });

  it("calls navigateTo when a leaf title is clicked", async () => {
    // Override the global stub for this test so we can assert the navigation
    // target. The component reads `navigateTo` from global lookup at click
    // time, so re-stubbing works without re-importing the component.
    const navigateToSpy = vi.fn();
    vi.stubGlobal("navigateTo", navigateToSpy);

    const wrapper = mountWithStubs(MenuItem, {
      props: { item: { title: "Solo", to: "/solo" } },
    });

    // The element carrying the click is the `<v-list-item-title>` inside the
    // leaf-branch v-btn. Our stub renders it as a <div> — we trigger directly.
    const titleEls = wrapper.findAll("*").filter((w) => w.text() === "Solo");
    expect(titleEls.length).toBeGreaterThan(0);
    await titleEls[0].trigger("click");

    expect(navigateToSpy).toHaveBeenCalledWith("/solo");
  });
});
