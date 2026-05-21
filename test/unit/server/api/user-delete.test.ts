/**
 * Unit tests for `server/api/user.delete.ts`.
 *
 * Endpoint: DELETE /api/user
 *
 * Canonical "authenticated DELETE the caller's own row" example. The
 * pattern is the simplest of the CRUD trio: get session → call
 * `prisma.<model>.delete({ where: { id: session.user.id } })`. Cascading
 * deletes of session / account rows are handled by Prisma's
 * `onDelete: Cascade` (see prisma/schema.prisma) — the handler itself
 * doesn't need to enumerate the dependent tables.
 *
 * Two tests, no overkill: the auth gate, and the call shape.
 * Reuse this file as the template for "user deletes own resource" endpoints.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

const getSessionSpy = vi.fn();
vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

describe("DELETE /api/user", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
  });

  it("rejects anonymous requests with 401 Unauthorized", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user.delete")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(createMockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("deletes the row matching the authenticated session user", async () => {
    // The handler MUST scope the delete to `session.user.id` — never read
    // the row id from a body field, query string, or URL param. Pin that.
    getSessionSpy.mockResolvedValue({ user: { id: "user-42" } });
    const prisma = createMockPrisma();
    prisma.user.delete.mockResolvedValue({ id: "user-42" });

    const handler = (await import("~~/server/api/user.delete")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await handler(createMockEvent({ prisma }));
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user-42" },
    });
  });
});
