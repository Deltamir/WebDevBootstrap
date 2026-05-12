/**
 * Unit tests for `components/AppFooter.vue`.
 *
 * AppFooter is a static layout component: two `NuxtLink`s (Terms of Service,
 * Privacy Policy) and a copyright line whose year is computed at render
 * time via `new Date().getFullYear()`. There is no script logic; we test
 * only the rendered output.
 *
 * The pin here is the year computation — if a future author hard-codes the
 * year, every January the copyright will silently fall a year behind.
 */
import { describe, it, expect } from "vitest";
import AppFooter from "~/components/AppFooter.vue";
import { mountWithStubs } from "../helpers/component";

describe("AppFooter", () => {
  it("renders the Terms of Service and Privacy Policy NuxtLinks", () => {
    const wrapper = mountWithStubs(AppFooter);
    const html = wrapper.html();
    expect(html).toContain("Terms of Service");
    expect(html).toContain("Privacy Policy");
  });

  it("links Terms of Service to /terms-of-service", () => {
    const wrapper = mountWithStubs(AppFooter);
    expect(wrapper.find("a[href='/terms-of-service']").exists()).toBe(true);
  });

  it("links Privacy Policy to /privacy-policy", () => {
    const wrapper = mountWithStubs(AppFooter);
    expect(wrapper.find("a[href='/privacy-policy']").exists()).toBe(true);
  });

  it("renders the current year in the copyright line", () => {
    const wrapper = mountWithStubs(AppFooter);
    // We compare against the runtime year so the test never goes stale.
    const year = new Date().getFullYear();
    expect(wrapper.text()).toContain(String(year));
    expect(wrapper.text()).toContain("All rights reserved.");
  });
});
