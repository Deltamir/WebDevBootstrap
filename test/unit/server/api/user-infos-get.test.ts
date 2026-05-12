/**
 * Unit tests for `server/api/user/infos.get.ts`.
 *
 * Endpoint: GET /api/user/infos
 *
 * Contract:
 *   - 401 when no session
 *   - 404 when the session row's user id no longer exists in the DB
 *     (race condition: row deleted between `getSession` and `findUnique`)
 *   - 200 with `{ name, email, image }` (only those three columns are selected)
 *
 * The auth module is mocked so we drive `getSession` per scenario; Prisma is
 * passed via the mock event's context.
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

  it("throws 401 when there is no session", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user/infos.get")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(createMockEvent())).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  });

  it("throws 404 when the DB row no longer exists for the session user", async () => {
    // Realistic race: the user deleted themselves in another tab, but the
    // cookie is still valid for a few seconds.
    getSessionSpy.mockResolvedValue({ user: { id: "ghost" } });
    const prisma = createMockPrisma();
    prisma.user.findUnique.mockResolvedValue(null);

    const handler = (await import("~~/server/api/user/infos.get")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await expect(handler(createMockEvent({ prisma }))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: "User not found",
    });
  });

  it("returns name / email / image for the authenticated user", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "user-1" } });
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

    const result = await handler(createMockEvent({ prisma }));
    expect(result).toEqual(row);
    // Whitelist of returned columns — we intentionally never expose the full
    // Better Auth user row (it contains emailVerified, createdAt, …).
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { name: true, email: true, image: true },
    });
  });

  it("forwards the request headers to getSession (cookie passthrough)", async () => {
    // The session cookie lives in the request Headers; getSession reads it
    // directly. If the handler ever forgot to forward headers, authenticated
    // requests would silently 401 — pin this.
    getSessionSpy.mockResolvedValue({ user: { id: "u" } });
    const prisma = createMockPrisma();
    prisma.user.findUnique.mockResolvedValue({
      name: "n",
      email: "e",
      image: null,
    });
    const event = createMockEvent({
      prisma,
      cookieHeader: "better-auth.session_token=abc",
    });

    const handler = (await import("~~/server/api/user/infos.get")).default as (
      event: unknown,
    ) => Promise<unknown>;

    await handler(event);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);
    expect(getSessionSpy.mock.calls[0][0]).toEqual({ headers: event.headers });
  });
});
