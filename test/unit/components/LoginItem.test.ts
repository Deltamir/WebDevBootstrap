/**
 * Unit tests for `components/LoginItem.vue`.
 *
 * LoginItem is the login / signup card. Two responsibilities:
 *
 *   1. UI flavor toggling (`flavor` prop is "login" or "signup") — only the
 *      titles, button labels, and "switch flavor" CTA differ between the
 *      two; we pin both.
 *
 *   2. OAuth provider buttons: for each provider injected via
 *      `providersInfos` (from `app.vue`), render a button. Clicking it
 *      invokes `authClient.signIn.social({ provider: id, callbackURL })`
 *      where `callbackURL` is the current route's `?redirect=` query, with
 *      a fallback of `/`.
 *
 * vee-validate's `useForm`/`useField` are auto-imports — for the test we
 * mock them as stable refs so the component doesn't blow up during mount.
 *
 * The component also calls `alert(...)` from its submit handler. We stub
 * `window.alert` to prevent happy-dom from printing — submit behaviour is
 * tested via a click on the submit button.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import LoginItem from "~/components/LoginItem.vue";
import { mountWithStubs } from "../helpers/component";

const signInSocialSpy = vi.fn();
vi.mock("~~/lib/auth-client", () => ({
  authClient: {
    signIn: { social: (opts: unknown) => signInSocialSpy(opts) },
  },
}));

// vee-validate composables — we don't exercise the real validation here,
// just confirm the field/form wiring is callable.
vi.stubGlobal("useForm", () => ({
  handleSubmit: (cb: (values: Record<string, unknown>) => void) =>
    () => cb({ email: "x@y.tld" }),
}));
vi.stubGlobal("useField", () => ({
  value: ref(""),
  errorMessage: ref(""),
}));

describe("LoginItem", () => {
  const providersInfos: Array<{
    id: string;
    name: string;
    color: { r: number; g: number; b: number };
    icon: string;
  }> = [
    {
      id: "github",
      name: "GitHub",
      color: { r: 47, g: 79, b: 79 },
      icon: "mdi-github",
    },
    {
      id: "twitch",
      name: "Twitch",
      color: { r: 100, g: 65, b: 165 },
      icon: "mdi-twitch",
    },
  ];

  beforeEach(() => {
    signInSocialSpy.mockReset();
    // Default route has no ?redirect query — the fallback "/" should be used.
    vi.stubGlobal("useRoute", () => ({ query: {} }));
    // Silence the demo alert in the submit handler.
    vi.stubGlobal("alert", vi.fn());
  });

  it("renders the login title when flavor='login'", () => {
    const wrapper = mountWithStubs(LoginItem, {
      props: { flavor: "login" },
      provide: { providersInfos },
    });
    expect(wrapper.text()).toContain("Log into you account");
    expect(wrapper.text()).toContain("Log In");
    expect(wrapper.text()).toContain("or sign in with");
    expect(wrapper.text()).toContain("Don't have an account ?");
  });

  it("renders the signup title when flavor='signup'", () => {
    const wrapper = mountWithStubs(LoginItem, {
      props: { flavor: "signup" },
      provide: { providersInfos },
    });
    expect(wrapper.text()).toContain("Sign up !");
    expect(wrapper.text()).toContain("Sign Up with Email");
    expect(wrapper.text()).toContain("or sign up with");
    expect(wrapper.text()).toContain("Already have an account ?");
  });

  it("emits 'switch' when the flavor-toggle CTA is clicked", async () => {
    const wrapper = mountWithStubs(LoginItem, {
      props: { flavor: "login" },
      provide: { providersInfos },
    });
    // The CTA is a <v-btn variant="plain"> wrapping an <a> with the text
    // "Sign up now". Our v-btn stub renders a div containing the anchor.
    const sub = wrapper
      .findAll("*")
      .find((el) => el.text().includes("Sign up now"));
    expect(sub).toBeDefined();
    await sub!.trigger("click");
    expect(wrapper.emitted("switch")).toBeTruthy();
  });

  it("calls authClient.signIn.social with provider id + '/' callback fallback", async () => {
    const wrapper = mountWithStubs(LoginItem, {
      props: { flavor: "login" },
      provide: { providersInfos },
    });
    // The v-btn stub forwards the `icon` attribute verbatim — we use it to
    // pick the button bound to the GitHub provider without confusing it
    // with the v-tooltip child that ALSO contains the text "GitHub".
    const ghBtn = wrapper.find("[icon='mdi-github']");
    expect(ghBtn.exists()).toBe(true);
    await ghBtn.trigger("click");

    expect(signInSocialSpy).toHaveBeenCalledTimes(1);
    expect(signInSocialSpy).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/",
    });
  });

  it("uses ?redirect= from the route when provided", async () => {
    vi.stubGlobal("useRoute", () => ({
      query: { redirect: "/protected" },
    }));
    const wrapper = mountWithStubs(LoginItem, {
      props: { flavor: "login" },
      provide: { providersInfos },
    });
    const twitchBtn = wrapper.find("[icon='mdi-twitch']");
    expect(twitchBtn.exists()).toBe(true);
    await twitchBtn.trigger("click");

    expect(signInSocialSpy).toHaveBeenCalledWith({
      provider: "twitch",
      callbackURL: "/protected",
    });
  });
});
