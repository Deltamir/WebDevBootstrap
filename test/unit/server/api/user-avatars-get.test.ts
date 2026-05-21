/**
 * Unit tests for `server/api/user/avatars.get.ts`.
 *
 * Endpoint: GET /api/user/avatars
 *
 * This handler illustrates a more involved pattern than the basic CRUD
 * endpoints: it fans out an async lookup (`fetchProviderAvatar`) for
 * each linked OAuth account and lazily persists the result on the
 * `account.image` column. For a downstream project, this is the
 * template for "lazy backfill" endpoints — pages call the endpoint,
 * the endpoint fills in missing data on first hit, subsequent calls
 * are O(1).
 *
 * What we pin here:
 *   1. The usual 401 gate for anonymous callers.
 *   2. Cached path: when `account.image` is already set, the upstream
 *      fetcher is NOT called and the cached URL is returned.
 *   3. Backfill path: when `account.image` is null, the fetcher is
 *      called, the result is persisted via `prisma.account.update`,
 *      and the new URL is returned.
 *
 * `~~/server/utils/providerAvatar` is mocked so the test never opens
 * a socket — that module has its own dedicated test for the network
 * branches.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockEvent, createMockPrisma } from "../../helpers/event";

const getSessionSpy = vi.fn();
const fetchProviderAvatarSpy = vi.fn();

vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));
vi.mock("~~/server/utils/providerAvatar", () => ({
  fetchProviderAvatar: (...args: unknown[]) => fetchProviderAvatarSpy(...args),
}));

describe("GET /api/user/avatars", () => {
  beforeEach(() => {
    getSessionSpy.mockReset();
    fetchProviderAvatarSpy.mockReset();
  });

  it("rejects anonymous requests with 401 Unauthorized", async () => {
    getSessionSpy.mockResolvedValue(null);
    const handler = (await import("~~/server/api/user/avatars.get"))
      .default as (event: unknown) => Promise<unknown>;

    await expect(handler(createMockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("returns the cached image without hitting the provider when account.image is set", async () => {
    // The cached path: a previous call already persisted the avatar URL
    // onto the account row. The upstream fetcher MUST NOT be called
    // again — otherwise we'd hammer the provider on every settings visit
    // and risk rate limits.
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.account.findMany.mockResolvedValue([
      {
        id: "a-1",
        providerId: "github",
        image: "https://cache.example/gh.png",
        accessToken: "tkn",
      },
    ]);

    const handler = (await import("~~/server/api/user/avatars.get"))
      .default as (event: unknown) => Promise<unknown>;

    const result = await handler(createMockEvent({ prisma }));
    expect(result).toEqual([
      { providerId: "github", image: "https://cache.example/gh.png" },
    ]);
    expect(fetchProviderAvatarSpy).not.toHaveBeenCalled();
    expect(prisma.account.update).not.toHaveBeenCalled();
  });

  it("fetches + persists the avatar when account.image is missing", async () => {
    // The backfill path. The handler should:
    //   1. call fetchProviderAvatar with the providerId + access token
    //   2. persist the returned URL onto the account row
    //   3. include the URL in the response
    getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
    const prisma = createMockPrisma();
    prisma.account.findMany.mockResolvedValue([
      {
        id: "a-2",
        providerId: "github",
        image: null,
        accessToken: "fresh_tkn",
      },
    ]);
    fetchProviderAvatarSpy.mockResolvedValue("https://avatars.gh/u/7");

    const handler = (await import("~~/server/api/user/avatars.get"))
      .default as (event: unknown) => Promise<unknown>;

    const result = await handler(createMockEvent({ prisma }));

    expect(fetchProviderAvatarSpy).toHaveBeenCalledWith("github", "fresh_tkn");
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: "a-2" },
      data: { image: "https://avatars.gh/u/7" },
    });
    expect(result).toEqual([
      { providerId: "github", image: "https://avatars.gh/u/7" },
    ]);
  });
});
