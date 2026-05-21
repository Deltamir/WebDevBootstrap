/**
 * Unit tests for `lib/auth.ts`.
 *
 * `lib/auth.ts` builds the server-side Better Auth instance. Most of the
 * file is declarative configuration that a project bootstrapped from this
 * template will heavily customize (plugins, providers, hooks, change-email
 * flow, …) — those bits are best pinned by the application's own tests.
 *
 * What we keep here is the one piece of behaviour that ships as a
 * BOOTSTRAP CONTRACT and that every fork should keep working:
 * the public baseURL resolution, which reads env vars in priority order
 *
 *   1. BETTER_AUTH_URL              — explicit override (any env)
 *   2. VERCEL_PROJECT_PRODUCTION_URL — stable Vercel production URL,
 *                                     used because OAuth redirect URIs
 *                                     are registered against it
 *   3. http://localhost:3000        — local-dev fallback
 *
 * The upstream SDK boundaries (`better-auth`, `better-auth/adapters/prisma`,
 * Better Auth's magic-link plugin, the email transport) are mocked so the
 * test never touches a live runtime or DB.
 *
 * Treat this file as a template: copy/adapt the mock setup when adding tests
 * for any further auth-config branches a downstream project introduces.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const betterAuthSpy = vi.fn((config: unknown) => ({
  handler: vi.fn(),
  api: { getSession: vi.fn() },
  __config: config,
}));

vi.mock("better-auth", () => ({
  betterAuth: (config: unknown) => betterAuthSpy(config),
}));
vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: (_client: unknown, opts: unknown) => ({ __adapter: opts }),
}));
// Plugin + API surface used by lib/auth.ts — stub minimal shapes.
vi.mock("better-auth/plugins", () => ({
  magicLink: () => ({ id: "magic-link-stub" }),
}));
vi.mock("better-auth/api", () => ({
  createAuthMiddleware: (fn: unknown) => fn,
  APIError: class APIError extends Error {},
}));
// Email transport is exercised by its own test (`server/utils/email.test.ts`)
// — stub here so importing lib/auth.ts doesn't pull a Resend client.
vi.mock("~~/server/utils/email", () => ({
  sendMagicLinkEmail: vi.fn(),
  sendEmailVerification: vi.fn(),
}));
// Prisma singleton lives in lib/prisma.ts and has its own test.
vi.mock("~~/lib/prisma", () => ({ default: { __sentinel: "mock-prisma" } }));

describe("lib/auth", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    betterAuthSpy.mockClear();
    // Reset modules so each `import("~~/lib/auth")` re-runs the top-level
    // `const baseURL = ...` against the current env snapshot.
    vi.resetModules();
    delete process.env.BETTER_AUTH_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("resolves baseURL with the documented env priority chain", async () => {
    // 1. BETTER_AUTH_URL wins outright when set.
    process.env.BETTER_AUTH_URL = "https://example.com";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "ignored.vercel.app";
    await import("~~/lib/auth");
    expect(
      (betterAuthSpy.mock.calls[0]![0] as { baseURL: string }).baseURL,
    ).toBe("https://example.com");

    // 2. VERCEL_PROJECT_PRODUCTION_URL is used when BETTER_AUTH_URL is unset
    //    — and gets `https://` prepended (Vercel injects host only).
    betterAuthSpy.mockClear();
    vi.resetModules();
    delete process.env.BETTER_AUTH_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "preview.vercel.app";
    await import("~~/lib/auth");
    expect(
      (betterAuthSpy.mock.calls[0]![0] as { baseURL: string }).baseURL,
    ).toBe("https://preview.vercel.app");

    // 3. localhost fallback for local dev (no env vars at all).
    betterAuthSpy.mockClear();
    vi.resetModules();
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    await import("~~/lib/auth");
    expect(
      (betterAuthSpy.mock.calls[0]![0] as { baseURL: string }).baseURL,
    ).toBe("http://localhost:3000");
  });

  it("exports an `auth` object with the handler + api fields downstream code consumes", async () => {
    // Smoke test of the export shape. Every server handler protected by
    // Better Auth depends on `auth.api.getSession` existing, and the
    // catch-all route forwards to `auth.handler`.
    const mod = await import("~~/lib/auth");
    expect(mod.auth).toBeDefined();
    expect(mod.auth).toHaveProperty("handler");
    expect(mod.auth).toHaveProperty("api");
  });
});
