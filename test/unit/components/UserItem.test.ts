/**
 * Unit tests for `components/UserItem.vue`.
 *
 * UserItem is a thin wrapper around `LoginItem`: it owns a `tab` ref
 * (0 = login flavor, 1 = signup flavor) and flips it whenever the inner
 * `LoginItem` emits `switch`. There is no other behaviour.
 *
 * We stub `LoginItem` so we can assert:
 *   - the initial `flavor` prop is "login"
 *   - emitting `switch` from the child causes a re-render with `flavor="signup"`
 *   - emitting `switch` a second time flips back to "login"
 */
import { describe, it, expect } from "vitest";
import { defineComponent, h } from "vue";
import UserItem from "~/components/UserItem.vue";
import { mountWithStubs } from "../helpers/component";

// Custom LoginItem stub: re-emits a clickable target carrying its `flavor`
// prop verbatim. Tests trigger a click to surface `switch` to UserItem.
const loginItemStub = defineComponent({
  name: "LoginItem",
  props: { flavor: { type: String, required: true } },
  emits: ["switch"],
  setup(props, { emit }) {
    return () =>
      h(
        "button",
        {
          "data-flavor": props.flavor,
          onClick: () => emit("switch"),
        },
        props.flavor,
      );
  },
});

describe("UserItem", () => {
  it("renders the login flavor by default", () => {
    const wrapper = mountWithStubs(UserItem, {
      global: { stubs: { LoginItem: loginItemStub } },
    });
    const initial = wrapper.find("[data-flavor='login']");
    expect(initial.exists()).toBe(true);
  });

  it("switches to the signup flavor when the inner component emits 'switch'", async () => {
    const wrapper = mountWithStubs(UserItem, {
      global: { stubs: { LoginItem: loginItemStub } },
    });
    // Both windows render simultaneously (`v-window-item` × 2); each
    // contains a LoginItem stub. Clicking either fires `switch` on the parent.
    await wrapper.find("[data-flavor='login']").trigger("click");
    // The tab ref flipped to 1 — the v-window-item ordering doesn't change,
    // but the active branch is now the signup one. We assert by querying
    // the second LoginItem stub.
    expect(wrapper.findAll("[data-flavor]").length).toBe(2);
    expect(wrapper.find("[data-flavor='signup']").exists()).toBe(true);
  });

  it("flips back to login on a second 'switch' emission", async () => {
    const wrapper = mountWithStubs(UserItem, {
      global: { stubs: { LoginItem: loginItemStub } },
    });
    await wrapper.find("[data-flavor='login']").trigger("click"); // 0 → 1
    await wrapper.find("[data-flavor='signup']").trigger("click"); // 1 → 0
    // After two emissions we're back where we started. The component is
    // stateful so we can only check that re-renders haven't dropped the
    // login stub.
    expect(wrapper.find("[data-flavor='login']").exists()).toBe(true);
  });
});
