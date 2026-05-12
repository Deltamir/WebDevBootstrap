/**
 * Unit tests for `server/api/user.delete.ts`.
 *
 * Endpoint: DELETE /api/user
 *
 * Contract:
 *   - 401 when there is no session (anonymous / expired cookie)
 *   - on success, calls `prisma.user.delete({ where: { id: session.user.id } })`
 *     and propagates the returned row. Cascading deletes of session/account
 *     rows are handled by Prisma's `onDelete: Cascade` (see schema.prisma).
 *
 * We mock `~~/lib/auth` to control `auth.api.getSession` for the auth-fork
 * and feed a `MockPrismaClient` via `event.context.prisma` so we can assert
 * the correct WHERE clause is built.
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

  it("throws 401 when there is no session", async () => {
    // Anonymous request — Better Auth's getSession returns null in that case.
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user.delete")).default as (
      event: unknown,
    ) => Promise<unknown>;

    const event = createMockEvent();
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  });

  it("throws 401 when getSession returns an empty user object", async () => {
    // Defensive: a session row with `user === undefined` should be treated
    // the same as no session at all. The handler uses `if (!session?.user)`.
    getSessionSpy.mockResolvedValue({ user: undefined });
    const handler = (await import("~~/server/api/user.delete")).default as (
      event: unknown,
    ) => Promise<unknown>;

    const event = createMockEvent();
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("deletes the authenticated user and returns the deleted row", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "user-42" } });
    const prisma = createMockPrisma();
    const deletedRow = {
      id: "user-42",
      name: "Old",
      email: "old@example.com",
    };
    prisma.user.delete.mockResolvedValue(deletedRow);
    const event = createMockEvent({ prisma });

    const handler = (await import("~~/server/api/user.delete")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(event)).resolves.toEqual(deletedRow);
    expect(prisma.user.delete).toHaveBeenCalledTimes(1);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user-42" },
    });
  });
});
