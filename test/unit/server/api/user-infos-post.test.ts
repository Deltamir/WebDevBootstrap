/**
 * Unit tests for `server/api/user/infos.post.ts`.
 *
 * Endpoint: POST /api/user/infos
 * Body shape: `{ name?: string; image?: string }` — anything else is dropped.
 *
 * This is the canonical example of an authenticated mutation endpoint in
 * the template. The pattern shared by every such handler is:
 *
 *   1. `auth.api.getSession({ headers })` → 401 if missing
 *   2. read + whitelist body fields (avoid arbitrary Prisma column writes)
 *   3. `prisma.<model>.update(...)` and return the updated row
 *
 * The three tests below pin exactly those three checkpoints. Copy this
 * file as the starting point for any new POST/PUT/PATCH endpoint in a
 * downstream project.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

// Spy on the auth boundary so each test can script the session shape.
const getSessionSpy = vi.fn();
vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

describe("POST /api/user/infos", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
  });

  it("rejects anonymous requests with 401 Unauthorized", async () => {
    // Better Auth returns null when no session cookie is present.
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ body: { name: "ignored" } })),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects bodies that contain no whitelisted fields with 400 Bad Request", async () => {
    // The endpoint reads only `name` and `image`. A body that contains
    // unrelated keys (or no keys at all) MUST 400 rather than silently
    // accepting the request — otherwise it could be used to bypass auth
    // intent checks while still producing a 2xx.
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ body: { admin: true, role: "owner" } })),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("forwards only the whitelisted fields (name, image) to Prisma", async () => {
    // The happy path: authenticated, body carries both allowed fields
    // PLUS a stray "admin" key the client should not be able to set.
    // We assert that ONLY name + image reach the Prisma.update call.
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.user.update.mockResolvedValue({ id: "u-1" });

    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await handler(
      createMockEvent({
        prisma,
        body: { name: "Alice", image: "https://cdn/a.png", admin: true },
      }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: { name: "Alice", image: "https://cdn/a.png" },
    });
  });
});
