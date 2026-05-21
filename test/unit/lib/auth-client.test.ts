/**
 * Unit tests for `lib/auth-client.ts`.
 *
 * `lib/auth-client.ts` is a tiny shim that:
 *   1. Imports `createAuthClient` from `better-auth/vue`.
 *   2. Invokes it with no `baseURL` (same-origin assumption — Nuxt app
 *      and Nitro API live on the same domain in a default deployment).
 *   3. Re-exports `signIn`, `signUp`, `signOut`, `useSession` as named
 *      functions so components can `import { useSession }` directly.
 *
 * For a downstream project, the only contract that REALLY ships here is
 * "the named re-exports are reference-equal to the methods on the client
 * object". The exact `createAuthClient(...)` argument shape is a moving
 * target (this template currently passes `{ plugins: [magicLinkClient()] }`,
 * a fork may add more plugins or change the call entirely) — we don't
 * pin it.
 *
 * `better-auth/vue` and `better-auth/client/plugins` are mocked so the
 * real SDK never runs (it would try to read window.location and install
 * event listeners that fail in happy-dom).
 *
 * Use this file as the template for testing any thin "instantiate-and-
 * re-export" shim in a downstream project — replace the better-auth
 * mocks with whichever SDK the new shim wraps.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const createAuthClientSpy = vi.fn();

vi.mock("better-auth/vue", () => ({
  createAuthClient: (...args: unknown[]) => {
    createAuthClientSpy(...args);
    return {
      signIn: { social: vi.fn(), magicLink: vi.fn() },
      signUp: vi.fn(),
      signOut: vi.fn(),
      useSession: vi.fn(),
    };
  },
}));

// The magic-link plugin (and any other plugin a fork adds) is imported by
// `lib/auth-client.ts` at module load. We stub it to a no-op so the test
// does not depend on the plugin's real implementation.
vi.mock("better-auth/client/plugins", () => ({
  magicLinkClient: () => ({ id: "magic-link-client-stub" }),
}));

describe("lib/auth-client", () => {
  beforeEach(() => {
    createAuthClientSpy.mockClear();
    // Reset modules so each test re-runs the shim's top-level
    // `export const authClient = createAuthClient(...)`.
    vi.resetModules();
  });

  it("invokes createAuthClient exactly once at module load", async () => {
    // We don't pin the argument shape — a downstream project will add
    // plugins / change config and we don't want this test to break on
    // every such tweak. The "called once" guarantee IS template-stable
    // (the shim should never instantiate multiple clients).
    await import("~~/lib/auth-client");
    expect(createAuthClientSpy).toHaveBeenCalledTimes(1);
  });

  it("re-exports signIn / signUp / signOut / useSession from the client", async () => {
    // The named exports MUST point at the same functions hanging off the
    // `authClient` object. Components destructure them; if they ever
    // drifted apart, half the codebase would silently call a stale
    // method that misses the current session state.
    const mod = await import("~~/lib/auth-client");

    expect(mod.authClient).toBeDefined();
    expect(mod.signIn).toBe(mod.authClient.signIn);
    expect(mod.signUp).toBe(mod.authClient.signUp);
    expect(mod.signOut).toBe(mod.authClient.signOut);
    expect(mod.useSession).toBe(mod.authClient.useSession);
  });
});
