/**
 * Unit tests for `server/api/user/accounts/[id].delete.ts`.
 *
 * Endpoint: DELETE /api/user/accounts/:id
 * The `:id` URL param is semantically the providerId (e.g. "github"), not a
 * row primary key — see the in-file comment.
 *
 * Contract:
 *   - 401 when there is no session
 *   - 400 when the route param is missing (defensive — router would normally
 *     not match this case, but the handler still guards against it)
 *   - 404 when no matching (userId, providerId) account row exists
 *   - 200 + the deleted row when the link existed and was removed
 *
 * The handler does NOT trust the providerId as the row PK — it first does a
 * `findFirst` to locate the row's real id, then calls `delete({ where: { id }})`
 * with that id. The test below pins this two-step flow.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

const getSessionSpy = vi.fn();

vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

describe("DELETE /api/user/accounts/[id]", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
  });

  it("throws 401 when there is no session", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (
      await import("~~/server/api/user/accounts/[id].delete")
    ).default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ params: { id: "github" } })),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 400 when the providerId route param is missing", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u" } });
    const handler = (
      await import("~~/server/api/user/accounts/[id].delete")
    ).default as (event: unknown) => Promise<unknown>;

    await expect(handler(createMockEvent())).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Bad Request: Account ID is required",
    });
  });

  it("throws 404 when no matching account exists for that provider", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.account.findFirst.mockResolvedValue(null);
    const handler = (
      await import("~~/server/api/user/accounts/[id].delete")
    ).default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ prisma, params: { id: "github" } })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "Account not found",
    });

    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { providerId: "github", userId: "u-1" },
    });
    expect(prisma.account.delete).not.toHaveBeenCalled();
  });

  it("looks up the row by (userId, providerId) then deletes by row id", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    const row = { id: "acc-row-xyz", providerId: "github", userId: "u-1" };
    prisma.account.findFirst.mockResolvedValue(row);
    prisma.account.delete.mockResolvedValue(row);

    const handler = (
      await import("~~/server/api/user/accounts/[id].delete")
    ).default as (event: unknown) => Promise<unknown>;

    const result = await handler(
      createMockEvent({ prisma, params: { id: "github" } }),
    );

    // Two-step flow: findFirst on (userId, providerId), then delete by id.
    // We assert both call shapes — the second one MUST use the row's
    // actual primary key, not the providerId string.
    expect(prisma.account.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.account.delete).toHaveBeenCalledWith({
      where: { id: "acc-row-xyz" },
    });
    expect(result).toEqual(row);
  });
});
