/**
 * Unit tests for `server/api/user/accounts.get.ts`.
 *
 * Endpoint: GET /api/user/accounts
 *
 * Contract:
 *   - 401 when no session
 *   - 404 when the user has zero linked OAuth accounts
 *     (used to short-circuit the "linked providers" UI in settings.vue)
 *   - 200 + an array of provider id strings on success — NOT the full row.
 *     The handler maps `[{ providerId: "github" }]` → `["github"]` so the
 *     frontend can do `registeredProviders.includes("github")`.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

const getSessionSpy = vi.fn();

vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

describe("GET /api/user/accounts", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
  });

  it("throws 401 when there is no session", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user/accounts.get"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(handler(createMockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("throws 404 when the user has no linked accounts", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u" } });
    const prisma = createMockPrisma();
    prisma.account.findMany.mockResolvedValue([]);

    const handler = (await import("~~/server/api/user/accounts.get"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ prisma })),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "Account not found",
    });
  });

  it("returns a flat array of provider IDs when accounts exist", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.account.findMany.mockResolvedValue([
      { providerId: "github" },
      { providerId: "twitch" },
    ]);

    const handler = (await import("~~/server/api/user/accounts.get"))
      .default as (event: unknown) => Promise<unknown>;

    const result = await handler(createMockEvent({ prisma }));
    expect(result).toEqual(["github", "twitch"]);
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      where: { userId: "u-1" },
      select: { providerId: true },
    });
  });
});
