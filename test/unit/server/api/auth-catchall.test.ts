/**
 * Unit tests for `server/api/auth/[...all].ts`.
 *
 * The catch-all is intentionally thin: it converts the H3 event to a standard
 * web `Request` via `toWebRequest(event)` and forwards it to
 * `auth.handler(...)`. There is no business logic to cover beyond:
 *
 *   1. `auth.handler` is invoked once per call;
 *   2. the argument it receives is the result of `toWebRequest(event)` —
 *      i.e. the conversion is wired the right way round;
 *   3. the handler's return value is propagated back to Nitro unchanged
 *      (Nitro relies on this for the streamed Response).
 *
 * We mock `~~/lib/auth` so the test doesn't pull in the real Better Auth
 * runtime, and override `toWebRequest` for this suite to return an identity
 * tag we can assert against.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Spy types its parameter explicitly so the `authHandlerSpy(req)` call
// inside the mock factory below type-checks (a bare `vi.fn(async () => …)`
// is inferred as 0-arg and would fail the strict signature check).
const authHandlerSpy = vi.fn(async (_req: Request) => new Response("ok"));

vi.mock("~~/lib/auth", () => ({
  auth: {
    handler: (req: Request) => authHandlerSpy(req),
    api: {},
  },
}));

describe("server/api/auth/[...all]", () => {
  beforeEach(() => {
    authHandlerSpy.mockClear();
  });

  it("forwards the converted web Request to auth.handler", async () => {
    const tag = new Request("http://localhost/api/auth/session");
    // Override the default `toWebRequest` stub for this scenario so we can
    // verify the catch-all calls it on the incoming event and passes the
    // result downstream.
    vi.stubGlobal("toWebRequest", () => tag);

    const handler = (await import("~~/server/api/auth/[...all]"))
      .default as (event: unknown) => unknown;

    const event = { headers: new Headers() };
    const result = await handler(event);

    expect(authHandlerSpy).toHaveBeenCalledTimes(1);
    expect(authHandlerSpy).toHaveBeenCalledWith(tag);
    expect(result).toBeInstanceOf(Response);
  });
});
