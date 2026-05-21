/**
 * Factory helpers for fabricating H3-event-like objects used by the unit tests
 * of the Nitro server handlers in `server/api/**`.
 *
 * In production the real H3 `event` exposes `event.headers`, `event.context`,
 * `event.node.req`, etc. — far more than we ever read in the handlers under
 * test. The handlers we cover only touch four bits of state:
 *
 *   1. `event.headers`        — forwarded to `auth.api.getSession`
 *   2. `event.context.prisma` — attached by `server/middleware/prisma.ts`
 *   3. `event._body`          — read by our test stub for `readBody`
 *   4. `event._params`        — read by our test stub for `getRouterParam`
 *
 * These factories assemble a minimal object exposing those four fields and
 * leave the rest as plain `Record<string, unknown>` to keep TS happy without
 * dragging in the full `H3Event` typings (which would require `h3` at test
 * time and clash with the global stubs).
 */
import { vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

export type MockPrismaClient = {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  account: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

/**
 * Build a Prisma double pre-wired with the surface area touched by the
 * handlers (`user.findUnique`, `user.update`, `user.delete`, `account.*`).
 *
 * Tests `mockResolvedValueOnce` / `mockRejectedValueOnce` on the returned
 * mocks to script call-by-call DB behaviour.
 */
export function createMockPrisma(): MockPrismaClient {
  return {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

export type MockH3Event = {
  headers: Headers;
  context: { prisma: MockPrismaClient };
  _body?: unknown;
  _params?: Record<string, string>;
};

/**
 * Build a fake H3 event suitable for the Nitro handlers under test.
 *
 * Casting through `unknown` to `H3Event` happens at call-sites so the
 * handlers (which are typed against H3's real event) accept it without
 * us re-declaring 30+ unused fields here.
 */
export function createMockEvent(opts?: {
  body?: unknown;
  params?: Record<string, string>;
  cookieHeader?: string;
  prisma?: MockPrismaClient;
}): MockH3Event {
  const headers = new Headers();
  if (opts?.cookieHeader) headers.set("cookie", opts.cookieHeader);
  return {
    headers,
    context: { prisma: opts?.prisma ?? createMockPrisma() },
    _body: opts?.body,
    _params: opts?.params,
  };
}

// Re-export the type so server handler signatures (event: H3Event) accept our
// fakes via a single cast helper at call sites: `(event as unknown as H3Event)`.
export type { PrismaClient };
