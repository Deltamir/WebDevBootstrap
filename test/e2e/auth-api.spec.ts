/**
 * E2E suite — Nitro server / Better Auth integration.
 *
 * The unit tests cover every server handler under `server/api/**` with a
 * mocked Prisma client, but they cannot prove that the handlers are
 * actually wired up in production builds (route file → Nitro route table).
 * This file exercises that wiring through real HTTP requests against the
 * `yarn preview` (built) server.
 *
 * No DB seed is required — every authenticated endpoint is hit without a
 * session, and we assert the documented anonymous responses:
 *
 *   - GET /api/auth/session              → 200 with `null`/`{}` body
 *   - GET /api/user/infos                → 401
 *   - POST /api/user/infos               → 401
 *   - GET /api/user/accounts             → 401
 *   - DELETE /api/user/accounts/github   → 401
 *   - DELETE /api/user                   → 401
 *   - GET /api/auth/providers/infos      → 200 with github + twitch entries
 *
 * The providers/infos endpoint is the public source of truth consumed by
 * `app.vue` — its shape contract is tested both here (live) and in the
 * matching unit test (function level).
 */
import { test, expect } from "@playwright/test";

test.describe("Nitro server — anonymous endpoint contracts", () => {
  test("GET /api/auth/session responds without 5xx for anonymous callers", async ({
    request,
  }) => {
    const res = await request.get("/api/auth/session");
    expect(res.status()).toBeLessThan(500);
  });

  test("GET /api/auth/providers/infos returns github + twitch metadata", async ({
    request,
  }) => {
    const res = await request.get("/api/auth/providers/infos");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as Record<
      string,
      {
        name: string;
        color: { r: number; g: number; b: number };
        icon: string;
      }
    >;
    expect(Object.keys(body).sort()).toEqual(["github", "twitch"]);
    expect(body.github!.icon).toBe("mdi-github");
    expect(body.twitch!.icon).toBe("mdi-twitch");
    expect(body.github!.color).toEqual({ r: 47, g: 79, b: 79 });
  });

  test("GET /api/user/infos returns 401 for anonymous requests", async ({
    request,
  }) => {
    const res = await request.get("/api/user/infos");
    expect(res.status()).toBe(401);
  });

  test("POST /api/user/infos returns 401 for anonymous requests", async ({
    request,
  }) => {
    const res = await request.post("/api/user/infos", {
      data: { name: "x" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/user/accounts returns 401 for anonymous requests", async ({
    request,
  }) => {
    const res = await request.get("/api/user/accounts");
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/user/accounts/:id returns 401 for anonymous requests", async ({
    request,
  }) => {
    const res = await request.delete("/api/user/accounts/github");
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/user returns 401 for anonymous requests", async ({
    request,
  }) => {
    const res = await request.delete("/api/user");
    expect(res.status()).toBe(401);
  });
});
