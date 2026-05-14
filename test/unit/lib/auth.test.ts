/**
 * Unit tests for `lib/auth.ts`.
 *
 * `lib/auth.ts` is purely declarative: it imports `betterAuth` and the
 * Prisma adapter, then builds a config object whose `baseURL` is computed
 * from runtime env vars with three priority levels:
 *
 *   1. BETTER_AUTH_URL — explicit override (preferred)
 *   2. VERCEL_URL      — preview / production builds (auto-injected by Vercel)
 *   3. fallback to http://localhost:3000
 *
 * We mock both `better-auth` and `better-auth/adapters/prisma` so the real
 * SDK is not loaded (it would try to read more env / connect to the DB).
 * Each test mutates `process.env`, resets the module graph, and re-imports
 * `lib/auth.ts` so the top-level `baseURL` resolution runs against the
 * current env snapshot.
 *
 * We also assert that the OAuth provider mapping ships the expected keys
 * (`github`, `twitch`) so changes to lib/auth.ts and infos.get.ts stay
 * in sync — they MUST agree per the contract documented in CLAUDE.md.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const betterAuthSpy = vi.fn((config: unknown) => ({
  handler: vi.fn(),
  api: { getSession: vi.fn() },
  __config: config,
}));

const prismaAdapterSpy = vi.fn(
  (_client: unknown, opts: unknown) => ({ __isPrismaAdapter: true, opts }),
);

vi.mock("better-auth", () => ({
  betterAuth: (config: unknown) => betterAuthSpy(config),
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: (client: unknown, opts: unknown) => prismaAdapterSpy(client, opts),
}));

// `lib/auth.ts` imports the singleton from `./prisma` — mock it so we don't
// drag the real Prisma client (and its network calls) into the test.
vi.mock("~~/lib/prisma", () => ({
  default: { __sentinel: "mock-prisma" },
}));

describe("lib/auth — configuration assembly", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    betterAuthSpy.mockClear();
    prismaAdapterSpy.mockClear();
    vi.resetModules();
    delete process.env.BETTER_AUTH_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses BETTER_AUTH_URL when explicitly set (highest priority)", async () => {
    process.env.BETTER_AUTH_URL = "https://example.com";
    process.env.VERCEL_URL = "vercel.example.com"; // should be ignored

    await import("~~/lib/auth");

    expect(betterAuthSpy).toHaveBeenCalledTimes(1);
    const config = betterAuthSpy.mock.calls[0]![0] as { baseURL: string };
    expect(config.baseURL).toBe("https://example.com");
  });

  it("falls back to https://${VERCEL_URL} when BETTER_AUTH_URL is unset", async () => {
    process.env.VERCEL_URL = "preview-abc.vercel.app";

    await import("~~/lib/auth");

    const config = betterAuthSpy.mock.calls[0]![0] as { baseURL: string };
    expect(config.baseURL).toBe("https://preview-abc.vercel.app");
  });

  it("falls back to localhost:3000 when neither env is set (local dev)", async () => {
    await import("~~/lib/auth");

    const config = betterAuthSpy.mock.calls[0]![0] as { baseURL: string };
    expect(config.baseURL).toBe("http://localhost:3000");
  });

  it("plugs the mocked Prisma client into the Better Auth adapter", async () => {
    await import("~~/lib/auth");

    expect(prismaAdapterSpy).toHaveBeenCalledTimes(1);
    const [client, opts] = prismaAdapterSpy.mock.calls[0]!;
    expect(client).toEqual({ __sentinel: "mock-prisma" });
    // Must match the `datasource db { provider = "postgresql" }` in schema.prisma.
    expect(opts).toEqual({ provider: "postgresql" });
  });

  it("registers exactly the GitHub and Twitch social providers", async () => {
    process.env.GHUB_CLIENT_ID = "gh-id";
    process.env.GHUB_CLIENT_SECRET = "gh-secret";
    process.env.TWITCH_CLIENT_ID = "tw-id";
    process.env.TWITCH_CLIENT_SECRET = "tw-secret";

    await import("~~/lib/auth");

    const config = betterAuthSpy.mock.calls[0]![0] as {
      socialProviders: Record<string, { clientId: string; clientSecret: string }>;
    };
    // If a third provider is added, both this assertion AND
    // server/api/auth/providers/infos.get.ts must be updated.
    expect(Object.keys(config.socialProviders).sort()).toEqual([
      "github",
      "twitch",
    ]);
    expect(config.socialProviders.github).toEqual({
      clientId: "gh-id",
      clientSecret: "gh-secret",
    });
    expect(config.socialProviders.twitch).toEqual({
      clientId: "tw-id",
      clientSecret: "tw-secret",
    });
  });

  it("exports an `auth` object with `handler` and `api` returned by betterAuth()", async () => {
    const mod = await import("~~/lib/auth");

    expect(mod.auth).toBeDefined();
    expect(mod.auth).toHaveProperty("handler");
    expect(mod.auth).toHaveProperty("api");
  });
});
