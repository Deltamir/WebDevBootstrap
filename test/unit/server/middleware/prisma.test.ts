/**
 * Unit tests for `server/middleware/prisma.ts`.
 *
 * The middleware runs on every Nitro request and:
 *   1. lazily constructs a single `pg.Pool` + `PrismaPg` adapter + `PrismaClient`
 *      the first time it's hit (module-scoped `let prisma`);
 *   2. attaches that shared client to `event.context.prisma` so every API
 *      handler can read it without instantiating its own Prisma client (and
 *      its own DB pool).
 *
 * We mock the three external constructors so the test doesn't touch a real
 * database. The key behaviours covered are:
 *
 *   - the pool is created exactly once across multiple requests;
 *   - every event gets `context.prisma` set;
 *   - the connection string comes from `DATABASE_URL`.
 *
 * The mock setup is identical in spirit to `lib/prisma.test.ts`, but here we
 * test the per-request side (event.context attachment) instead of the
 * module-singleton side.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const poolCtor = vi.fn();
const adapterCtor = vi.fn();
const clientCtor = vi.fn();

vi.mock("pg", () => ({
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
    (this as { _opts: unknown; tag: string })._opts = opts;
    (this as { _opts: unknown; tag: string }).tag = "mock-client";
  },
}));

describe("server/middleware/prisma", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    poolCtor.mockClear();
    adapterCtor.mockClear();
    clientCtor.mockClear();
    // Reset modules so the `let prisma` cache inside the middleware module
    // is rebuilt fresh for every scenario.
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("attaches a Prisma client to event.context on the first request", async () => {
    process.env.DATABASE_URL = "postgres://test/db";
    const middleware = (await import("~~/server/middleware/prisma"))
      .default as (event: { context: Record<string, unknown> }) => Promise<void>;

    const event = { context: {} as Record<string, unknown> };
    await middleware(event);

    expect(event.context.prisma).toBeDefined();
    expect((event.context.prisma as { tag: string }).tag).toBe("mock-client");
    expect(poolCtor).toHaveBeenCalledTimes(1);
    expect(poolCtor).toHaveBeenCalledWith({
      connectionString: "postgres://test/db",
    });
  });

  it("reuses the same Prisma client across multiple requests (one pool)", async () => {
    process.env.DATABASE_URL = "postgres://test/db";
    const middleware = (await import("~~/server/middleware/prisma"))
      .default as (event: { context: Record<string, unknown> }) => Promise<void>;

    const eventA = { context: {} as Record<string, unknown> };
    const eventB = { context: {} as Record<string, unknown> };
    await middleware(eventA);
    await middleware(eventB);

    // Critical contract: a single pool / client is shared by every request —
    // otherwise we'd exhaust DB connections in production within minutes.
    expect(poolCtor).toHaveBeenCalledTimes(1);
    expect(adapterCtor).toHaveBeenCalledTimes(1);
    expect(clientCtor).toHaveBeenCalledTimes(1);
    expect(eventA.context.prisma).toBe(eventB.context.prisma);
  });
});
