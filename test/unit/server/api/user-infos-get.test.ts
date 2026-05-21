/**
 * Unit tests for `server/api/user/infos.get.ts`.
 *
 * Endpoint: GET /api/user/infos
 *
 * Canonical "authenticated SELECT" example for the template. Every read
 * endpoint behind auth follows the same three steps:
 *
 *   1. `auth.api.getSession({ headers })` → 401 if missing
 *   2. `prisma.<model>.findUnique(...)`  → 404 if the row no longer exists
 *      (cookie can outlive the row — e.g. user deleted account elsewhere)
 *   3. return the selected columns (NEVER the full row — avoid leaking
 *      `emailVerified`, `createdAt`, etc. unless the client needs them).
 *
 * Three tests, one per checkpoint. Use this file as the template when
 * adding a new authenticated GET endpoint.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

const getSessionSpy = vi.fn();
vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

describe("GET /api/user/infos", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
  });

  it("rejects anonymous requests with 401 Unauthorized", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user/infos.get")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(createMockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns 404 when the session cookie outlives its DB row", async () => {
    // Realistic race: the user deleted their account in another tab, the
    // cookie is still valid for a few seconds, but the row is gone.
    getSessionSpy.mockResolvedValue({ user: { id: "ghost" } });
    const prisma = createMockPrisma();
    prisma.user.findUnique.mockResolvedValue(null);

    const handler = (await import("~~/server/api/user/infos.get")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(createMockEvent({ prisma }))).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("returns only the whitelisted columns for the authenticated user", async () => {
    // Happy path: the handler must build a `select` clause restricting the
    // shape of the returned row — never `prisma.user.findUnique({ where })`
    // without it, since the User table contains internal Better Auth flags
    // the API should not leak.
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    const row = {
      name: "Alice",
      email: "alice@example.com",
      image: "https://cdn/alice.png",
    };
    prisma.user.findUnique.mockResolvedValue(row);

    const handler = (await import("~~/server/api/user/infos.get")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(createMockEvent({ prisma }))).resolves.toEqual(row);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u-1" },
      select: { name: true, email: true, image: true },
    });
  });
});
