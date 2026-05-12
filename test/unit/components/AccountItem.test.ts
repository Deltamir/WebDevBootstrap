/**
 * Unit tests for `components/AccountItem.vue`.
 *
 * AccountItem is the app-bar account dropdown. It does three things:
 *
 *   1. Fetches the current session via `authClient.useSession(useFetch)`.
 *      The `connected` computed flips on/off when `session.value` flips
 *      between `null` and `{ user, … }`.
 *
 *   2. Fetches `/api/user/infos` via `useFetch` for the avatar / name —
 *      decoupled from session so an in-flight rename in /settings is
 *      reflected immediately.
 *
 *   3. Wires `handleLogout()` to `authClient.signOut()`.
 *
 * We mock `~~/lib/auth-client` so `useSession`'s return value is scripted
 * per test, and override the global `useFetch` to drive `userInfos`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { flushPromises } from "@vue/test-utils";
import AccountItem from "~/components/AccountItem.vue";
import { mountWithStubs } from "../helpers/component";

const signOutSpy = vi.fn();
const useSessionSpy = vi.fn();

vi.mock("~~/lib/auth-client", () => ({
  authClient: {
    useSession: (...args: unknown[]) => useSessionSpy(...args),
    signOut: () => signOutSpy(),
  },
}));

describe("AccountItem", () => {
  beforeEach(() => {
    signOutSpy.mockReset();
    useSessionSpy.mockReset();
  });

  it("renders the anonymous placeholder when no session is present", async () => {
    useSessionSpy.mockResolvedValue({ data: ref(null) });
    vi.stubGlobal("useFetch", async () => ({ data: ref(null) }));

    const wrapper = mountWithStubs(AccountItem, { suspense: true });
    // AccountItem has top-level `await authClient.useSession(...)` — Vue
    // suspends the component until the promise resolves. flushPromises()
    // drains the microtask queue so the resolved branch is rendered.
    await flushPromises();

    // The connected=false branch renders a generic avatar AND embeds the
    // <user-item /> for the login flow.
    expect(wrapper.html()).toContain("mdi-account-circle-outline");
  });

  it("renders the logged-in dropdown when a session is present", async () => {
    useSessionSpy.mockResolvedValue({
      data: ref({ user: { id: "u-1" } }),
    });
    vi.stubGlobal("useFetch", async () => ({
      data: ref({
        name: "Alice",
        email: "alice@example.com",
        image: "https://cdn/avatar.png",
      }),
    }));

    const wrapper = mountWithStubs(AccountItem, { suspense: true });
    // AccountItem has top-level `await authClient.useSession(...)` — Vue
    // suspends the component until the promise resolves. flushPromises()
    // drains the microtask queue so the resolved branch is rendered.
    await flushPromises();

    // The signed-in branch renders the user's name and Edit/Logout buttons.
    expect(wrapper.text()).toContain("Alice");
    expect(wrapper.text()).toContain("Edit");
    expect(wrapper.text()).toContain("Logout");
  });

  it("calls authClient.signOut() when the Logout button is clicked", async () => {
    useSessionSpy.mockResolvedValue({
      data: ref({ user: { id: "u-1" } }),
    });
    vi.stubGlobal("useFetch", async () => ({
      data: ref({ name: "n", email: "e", image: "i" }),
    }));

    const wrapper = mountWithStubs(AccountItem, { suspense: true });
    // AccountItem has top-level `await authClient.useSession(...)` — Vue
    // suspends the component until the promise resolves. flushPromises()
    // drains the microtask queue so the resolved branch is rendered.
    await flushPromises();

    // Find the Logout button by its label and click it. The stubbed v-btn
    // forwards click events.
    const logoutBtn = wrapper
      .findAll("*")
      .find((el) => el.text() === "Logout");
    expect(logoutBtn).toBeDefined();
    await logoutBtn!.trigger("click");

    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });
});
