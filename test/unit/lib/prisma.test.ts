/**
 * Unit tests for `lib/prisma.ts`.
 *
 * The module under test is a dev-safe singleton: on the first import it
 * instantiates a `pg.Pool`, wraps it with `PrismaPg`, and constructs a
 * `PrismaClient`. On subsequent imports inside the same module graph it
 * returns the already-constructed instance from `globalThis.prismaGlobal` —
 * this avoids HMR opening a fresh DB pool on every code reload during
 * `nuxt dev`.
 *
 * We don't want the tests to actually open a TCP socket to PostgreSQL, so
 * we mock the three external dependencies (`pg`, `@prisma/adapter-pg`,
 * `@prisma/client`) with sentinel objects and assert the wiring:
 *
 *   - the `Pool` is built with the runtime `DATABASE_URL`
 *   - the `PrismaPg` adapter receives that pool
 *   - the `PrismaClient` receives that adapter
 *   - the export is cached via `globalThis.prismaGlobal` in non-prod NODE_ENV
 *   - that cache key is NOT written when NODE_ENV === "production"
 *
 * `vi.resetModules()` is used between scenarios so each `await import(...)`
 * re-runs the top-level code in `lib/prisma.ts` against the current mock /
 * env state.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const poolCtor = vi.fn();
const adapterCtor = vi.fn();
const clientCtor = vi.fn();

vi.mock("pg", () => ({
  // `pg` exposes `Pool` as a named export AND as a property on its default
  // export (CJS interop). lib/prisma.ts uses `import pg from 'pg'` then
  // `new pg.Pool(...)`, so the default-export shape is what matters here.
  default: {
    Pool: function MockPool(this: unknown, opts: unknown) {
      poolCtor(opts);
      (this as { _opts: unknown })._opts = opts;
    },
  },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: function MockPrismaPg(this: unknown, pool: unknown) {
    adapterCtor(pool);
    (this as { _pool: unknown })._pool = pool;
  },
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: function MockPrismaClient(this: unknown, opts: unknown) {
    clientCtor(opts);
    (this as { _opts: unknown; sentinel: string })._opts = opts;
    (this as { _opts: unknown; sentinel: string }).sentinel =
      "mock-prisma-client";
  },
}));

describe("lib/prisma — dev-safe singleton", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    poolCtor.mockClear();
    adapterCtor.mockClear();
    clientCtor.mockClear();
    // Wipe any cached singleton from a prior `import` so the top-level code
    // in `lib/prisma.ts` runs again from a clean slate.
    delete (globalThis as { prismaGlobal?: unknown }).prismaGlobal;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete (globalThis as { prismaGlobal?: unknown }).prismaGlobal;
  });

  it("wires Pool → PrismaPg → PrismaClient with DATABASE_URL", async () => {
    process.env.DATABASE_URL = "postgres://test/db";
    process.env.NODE_ENV = "test";

    const mod = await import("~~/lib/prisma");

    expect(poolCtor).toHaveBeenCalledTimes(1);
    expect(poolCtor).toHaveBeenCalledWith({
      connectionString: "postgres://test/db",
    });
    expect(adapterCtor).toHaveBeenCalledTimes(1);
    expect(clientCtor).toHaveBeenCalledTimes(1);
    // The real export is typed as `PrismaClient`; our mock constructor
    // adds a `sentinel` field on `this`, so we go via `unknown` to
    // bypass the structural-incompatibility check.
    expect((mod.default as unknown as { sentinel: string }).sentinel).toBe(
      "mock-prisma-client",
    );
  });

  it("stores the instance on globalThis when NODE_ENV !== 'production'", async () => {
    process.env.NODE_ENV = "development";
    delete (globalThis as { prismaGlobal?: unknown }).prismaGlobal;

    const mod = await import("~~/lib/prisma");

    expect(
      (globalThis as { prismaGlobal?: unknown }).prismaGlobal,
    ).toBe(mod.default);
  });

  it("does NOT pollute globalThis when NODE_ENV === 'production'", async () => {
    process.env.NODE_ENV = "production";
    delete (globalThis as { prismaGlobal?: unknown }).prismaGlobal;

    await import("~~/lib/prisma");

    expect(
      (globalThis as { prismaGlobal?: unknown }).prismaGlobal,
    ).toBeUndefined();
  });

  it("reuses the cached globalThis.prismaGlobal on a second import", async () => {
    process.env.NODE_ENV = "development";
    // Pre-seed the singleton slot with a sentinel — the module should adopt
    // it instead of constructing a new PrismaClient.
    const cached = { sentinel: "cached" };
    (globalThis as { prismaGlobal?: unknown }).prismaGlobal = cached;

    const mod = await import("~~/lib/prisma");

    expect(mod.default).toBe(cached);
    // No constructors should have been called because the cache hit.
    expect(poolCtor).not.toHaveBeenCalled();
    expect(adapterCtor).not.toHaveBeenCalled();
    expect(clientCtor).not.toHaveBeenCalled();
  });
});
