/**
 * Unit tests for `server/utils/providerAvatar.ts`.
 *
 * `fetchProviderAvatar(providerId, accessToken)` looks up the user's
 * avatar URL from an OAuth provider's API. The template ships fetchers
 * for GitHub and Twitch — a downstream project that adds Discord /
 * Google / etc. will add one more entry to the `fetchers` map.
 *
 * What we pin here is the small set of universal invariants the helper
 * guarantees to its caller (the avatars endpoint) — these MUST keep
 * working no matter which providers the downstream project supports:
 *
 *   1. Unknown provider → returns null (never throws).
 *   2. Missing token (credential accounts have none) → returns null.
 *   3. Network / parse error in the upstream fetch → returns null.
 *   4. Known provider with token → forwards the token to the right URL
 *      and returns the URL the API responded with.
 *
 * The global `fetch` is stubbed per-test so the suite never opens a
 * socket. Treat this file as the template for any new "ask third-party
 * API for X" helper a downstream project adds.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProviderAvatar } from "~~/server/utils/providerAvatar";

describe("fetchProviderAvatar", () => {
  beforeEach(() => {
    // Default stub: every test should override this explicitly if it
    // expects the upstream call to happen. A bare default catches the
    // "fetch shouldn't have been called" assertions.
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns null for an unknown providerId without calling the network", async () => {
    // The map is keyed on the registered provider — anything else MUST
    // short-circuit. Critically, the function does NOT throw: a missing
    // avatar must never block account creation in the auth flow.
    const result = await fetchProviderAvatar("unknown-provider", "token");
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns null when no access token is supplied", async () => {
    // Credential (email/password) accounts have no OAuth token. The
    // caller passes whatever is on `account.accessToken` directly —
    // a null/undefined value here must be tolerated.
    const result = await fetchProviderAvatar("github", null);
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns null when the upstream HTTP call fails (no exception bubbles up)", async () => {
    // Network errors are non-blocking — the avatar is best-effort. If
    // we let the rejection propagate, the calling endpoint would 500
    // out and the settings page would never render.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const result = await fetchProviderAvatar("github", "tkn");
    expect(result).toBeNull();
  });

  it("returns the avatar_url from GitHub when the API responds OK", async () => {
    // GitHub example wiring. We assert two things:
    //   - the request hits api.github.com/user with a bearer token
    //   - the response's `avatar_url` field is returned verbatim
    // Spy types its params explicitly so `fetchMock.mock.calls[0]` is a
    // 2-tuple (url, options) at type level — without it, vi.fn infers a
    // 0-arg signature from the body and the call assertions below fail
    // typecheck with "tuple of length 0 has no element at index 0/1".
    const fetchMock = vi.fn(
      async (_url: string, _init?: { headers?: Record<string, string> }) => ({
        ok: true,
        json: async () => ({ avatar_url: "https://avatars.gh/u/42" }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const url = await fetchProviderAvatar("github", "gh_token");
    expect(url).toBe("https://avatars.gh/u/42");

    const [calledUrl, options] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("https://api.github.com/user");
    expect(options!.headers!.Authorization).toBe("Bearer gh_token");
  });
});
