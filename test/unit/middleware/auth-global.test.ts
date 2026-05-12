/**
 * Unit tests for `middleware/auth.global.ts`.
 *
 * The middleware runs on every Nuxt route navigation (SSR + client) and
 * implements three orthogonal paths driven by `to.meta.auth`:
 *
 *   1. `auth: false` → public page. Return undefined immediately, do NOT
 *      hit `useSession`. This is what allows `/`, `/public` and any future
 *      marketing pages to render without a DB round-trip.
 *
 *   2. `auth: { unauthenticatedOnly: true, navigateAuthenticatedTo? }` →
 *      "public-only" pages such as `/login`. If a session exists, redirect to
 *      `navigateAuthenticatedTo || "/"`. Otherwise let the navigation through.
 *
 *   3. Anything else (including `undefined`) → require a session. If absent,
 *      redirect to `/login?redirect=<original path>` so the post-login flow
 *      can return the user to their intended page.
 *
 * Mocks:
 *   - `~~/lib/auth-client` — `authClient.useSession` is the gateway to the
 *     session ref. Each test scripts a session value via `mockResolvedValue`.
 *   - `defineNuxtRouteMiddleware`, `navigateTo`, `useFetch` — Nuxt-runtime
 *     auto-imports that are stubbed as global identity helpers.
 *
 * The middleware's return value is the "navigation result" Nuxt awaits before
 * proceeding. `undefined` means "continue", a `navigateTo(...)` call result
 * means "redirect / replace".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const useSessionSpy = vi.fn();

vi.mock("~~/lib/auth-client", () => ({
  authClient: {
    useSession: (...args: unknown[]) => useSessionSpy(...args),
  },
}));

// Nuxt runtime stubs. The middleware uses `defineNuxtRouteMiddleware` to
// wrap its handler, `useFetch` as the SSR-friendly fetcher passed to
// useSession, and `navigateTo` to issue redirects.
const navigateToSpy = vi.fn((target: unknown) => ({
  __redirect: true,
  target,
}));

beforeEach(() => {
  vi.stubGlobal("defineNuxtRouteMiddleware", <T>(handler: T) => handler);
  vi.stubGlobal("navigateTo", (target: unknown) => navigateToSpy(target));
  // useFetch is just passed through to useSession — its identity is what matters.
  vi.stubGlobal("useFetch", () => Promise.resolve({ data: { value: null } }));
});

describe("middleware/auth.global", () => {
  beforeEach(() => {
    useSessionSpy.mockReset();
    navigateToSpy.mockClear();
  });

  it("lets through pages marked `auth: false` without checking the session", async () => {
    const middleware = (await import("~~/middleware/auth.global"))
      .default as (to: { meta: Record<string, unknown>; fullPath?: string }) =>
      | undefined
      | Promise<unknown>;

    const result = await middleware({
      meta: { auth: false },
      fullPath: "/public",
    });

    // No session lookup should have happened — the early return precedes it.
    expect(result).toBeUndefined();
    expect(useSessionSpy).not.toHaveBeenCalled();
    expect(navigateToSpy).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors to /login with the original path as ?redirect=", async () => {
    useSessionSpy.mockResolvedValue({ data: { value: null } });
    const middleware = (await import("~~/middleware/auth.global"))
      .default as (to: { meta: Record<string, unknown>; fullPath: string }) =>
      | undefined
      | Promise<unknown>;

    await middleware({ meta: {}, fullPath: "/protected" });

    expect(navigateToSpy).toHaveBeenCalledTimes(1);
    expect(navigateToSpy).toHaveBeenCalledWith({
      path: "/login",
      query: { redirect: "/protected" },
    });
  });

  it("lets authenticated visitors through on a default (protected) page", async () => {
    useSessionSpy.mockResolvedValue({
      data: { value: { user: { id: "u-1" } } },
    });
    const middleware = (await import("~~/middleware/auth.global"))
      .default as (to: { meta: Record<string, unknown>; fullPath: string }) =>
      | undefined
      | Promise<unknown>;

    const result = await middleware({ meta: {}, fullPath: "/protected" });

    expect(result).toBeUndefined();
    expect(navigateToSpy).not.toHaveBeenCalled();
  });

  it("redirects already-authenticated visitors away from `unauthenticatedOnly` pages", async () => {
    useSessionSpy.mockResolvedValue({
      data: { value: { user: { id: "u" } } },
    });
    const middleware = (await import("~~/middleware/auth.global"))
      .default as (to: { meta: Record<string, unknown>; fullPath: string }) =>
      | undefined
      | Promise<unknown>;

    await middleware({
      meta: {
        auth: {
          unauthenticatedOnly: true,
          navigateAuthenticatedTo: "/dashboard",
        },
      },
      fullPath: "/login",
    });

    expect(navigateToSpy).toHaveBeenCalledWith("/dashboard");
  });

  it("falls back to '/' when navigateAuthenticatedTo is omitted", async () => {
    useSessionSpy.mockResolvedValue({
      data: { value: { user: { id: "u" } } },
    });
    const middleware = (await import("~~/middleware/auth.global"))
      .default as (to: { meta: Record<string, unknown>; fullPath: string }) =>
      | undefined
      | Promise<unknown>;

    await middleware({
      meta: { auth: { unauthenticatedOnly: true } },
      fullPath: "/login",
    });

    expect(navigateToSpy).toHaveBeenCalledWith("/");
  });

  it("lets unauthenticated visitors REACH an `unauthenticatedOnly` page", async () => {
    useSessionSpy.mockResolvedValue({ data: { value: null } });
    const middleware = (await import("~~/middleware/auth.global"))
      .default as (to: { meta: Record<string, unknown>; fullPath: string }) =>
      | undefined
      | Promise<unknown>;

    const result = await middleware({
      meta: { auth: { unauthenticatedOnly: true } },
      fullPath: "/login",
    });

    expect(result).toBeUndefined();
    expect(navigateToSpy).not.toHaveBeenCalled();
  });
});
