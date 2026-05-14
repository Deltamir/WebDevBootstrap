/**
 * Unit tests for `lib/auth-client.ts`.
 *
 * `lib/auth-client.ts` is a six-line shim:
 *   1. Imports `createAuthClient` from `better-auth/vue`.
 *   2. Invokes it with no `baseURL` (same-origin assumption).
 *   3. Re-exports `signIn`, `signUp`, `signOut`, `useSession` as named functions.
 *
 * We mock `better-auth/vue` to return a sentinel client object, then assert:
 *   - `createAuthClient` is called exactly once with no arguments;
 *   - the named re-exports are reference-equal to the sentinel's properties.
 *
 * This pins the module's behaviour without exercising the upstream SDK
 * (which would try to read the current URL, install event listeners, etc.).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const createAuthClientSpy = vi.fn();

vi.mock("better-auth/vue", () => ({
  createAuthClient: (...args: unknown[]) => {
    createAuthClientSpy(...args);
    return {
      signIn: { social: vi.fn() },
      signUp: vi.fn(),
      signOut: vi.fn(),
      useSession: vi.fn(),
    };
  },
}));

describe("lib/auth-client", () => {
  beforeEach(() => {
    createAuthClientSpy.mockClear();
    vi.resetModules();
  });

  it("calls createAuthClient() with no baseURL (same-origin client)", async () => {
    await import("~~/lib/auth-client");
    expect(createAuthClientSpy).toHaveBeenCalledTimes(1);
    // No args means better-auth resolves URLs relatively to the current origin.
    expect(createAuthClientSpy).toHaveBeenCalledWith();
  });

  it("re-exports signIn / signUp / signOut / useSession from the client", async () => {
    const mod = await import("~~/lib/auth-client");

    expect(mod.authClient).toBeDefined();
    // Each named export must be the same reference held on the client object —
    // components that destructure them should observe identical behaviour.
    expect(mod.signIn).toBe(mod.authClient.signIn);
    expect(mod.signUp).toBe(mod.authClient.signUp);
    expect(mod.signOut).toBe(mod.authClient.signOut);
    expect(mod.useSession).toBe(mod.authClient.useSession);
  });
});
