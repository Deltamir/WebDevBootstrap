/**
 * Unit tests for `server/api/user/infos.post.ts`.
 *
 * Endpoint: POST /api/user/infos
 * Body shape: `{ name?: string; email?: string }`
 *
 * Contract:
 *   - 401 when there is no session
 *   - 400 when the body has neither `name` nor `email`
 *   - any field other than `name`/`email` is dropped silently (allowlist
 *     guard against arbitrary Prisma column injection)
 *   - 200 + the updated row when at least one of the two fields is provided
 *
 * Body is exposed to the handler via the `readBody` stub installed in
 * `helpers/setup.ts` — it pulls `event._body` straight from the fake event.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

const getSessionSpy = vi.fn();

vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

describe("POST /api/user/infos", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
  });

  it("throws 401 when there is no session", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ body: { name: "ignored" } })),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 400 when neither name nor email is provided", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u" } });
    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ body: {} })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: "Bad Request: No valid fields to update",
    });
  });

  it("throws 400 when the body contains only unrecognised fields", async () => {
    // Defensive: the allowlist only copies `name` and `email`. A body of
    // `{ admin: true }` MUST be rejected as "nothing to update" — never
    // forwarded to Prisma where it would attempt to write the column.
    getSessionSpy.mockResolvedValue({ user: { id: "u" } });
    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(
        createMockEvent({
          body: { admin: true, emailVerified: true, id: "spoof" },
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("updates only the `name` field when only `name` is in the body", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.user.update.mockResolvedValue({
      id: "u-1",
      name: "New Name",
      email: "old@example.com",
    });

    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    const result = await handler(
      createMockEvent({ prisma, body: { name: "New Name" } }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: { name: "New Name" },
    });
    expect(result).toMatchObject({ name: "New Name" });
  });

  it("updates only the `email` field when only `email` is in the body", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.user.update.mockResolvedValue({});

    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await handler(
      createMockEvent({ prisma, body: { email: "new@example.com" } }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: { email: "new@example.com" },
    });
  });

  it("strips unrelated keys but keeps the allowlist (name + email)", async () => {
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.user.update.mockResolvedValue({});

    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await handler(
      createMockEvent({
        prisma,
        body: {
          name: "n",
          email: "e@e.tld",
          // The two below MUST not reach Prisma — they're not on the allowlist.
          admin: true,
          emailVerified: true,
        },
      }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u-1" },
      data: { name: "n", email: "e@e.tld" },
    });
  });

  it("treats falsy values (empty string) as 'not provided'", async () => {
    // `if (body.name) data.name = body.name` — empty string short-circuits.
    // We pin this so future authors don't accidentally accept "" and wipe
    // the user's display name via the API.
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const handler = (await import("~~/server/api/user/infos.post"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(
      handler(createMockEvent({ body: { name: "", email: "" } })),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
