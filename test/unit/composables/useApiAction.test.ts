/**
 * Unit tests for `composables/useApiAction.ts`.
 *
 * `useApiAction` is the template's generic "click → call API → reflect
 * the result in the UI" composable. Every form submit, delete-with-confirm,
 * or refresh button in a downstream project ends up using it. It has
 * three observable behaviours:
 *
 *   1. Happy path — calls `$fetch` and returns its result. `loading` is
 *      true during the call, false afterwards. `error` stays null.
 *   2. Error path — `$fetch` throws; the composable swallows it,
 *      stores a user-friendly message in `error`, and returns `null`
 *      so the caller can branch on it.
 *   3. Loading state — `loading` and the global `<NuxtLoadingIndicator>`
 *      go up before the call and back down after, even on error.
 *
 * Three short tests below pin each branch. Boundaries mocked:
 *   - `$fetch` (the global) — scripted per-test
 *   - `useLoadingIndicator` (a Nuxt composable) — stubbed with spy methods
 *
 * Copy this file as the template for any new composable that wraps an
 * async side effect (file upload, third-party SDK call, …).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useApiAction } from "~~/composables/useApiAction";

describe("useApiAction", () => {
  // Spy on the Nuxt loading-indicator API surface the composable uses.
  // It is auto-imported via #imports in the source; stubbing it as a
  // global is enough because Nuxt's auto-import resolves to globalThis
  // when no real Nuxt runtime is booted.
  const start = vi.fn();
  const finish = vi.fn();
  beforeEach(() => {
    start.mockReset();
    finish.mockReset();
    vi.stubGlobal("useLoadingIndicator", () => ({ start, finish }));
  });

  it("returns the response on success and toggles loading around the call", async () => {
    // Script $fetch to resolve with a known payload. The composable
    // should hand that payload back unchanged AND leave `error` null.
    vi.stubGlobal("$fetch", vi.fn(async () => ({ ok: true })));
    const action = useApiAction();

    expect(action.loading.value).toBe(false); // initial state
    const result = await action.execute("/api/example");

    expect(result).toEqual({ ok: true });
    expect(action.error.value).toBeNull();
    expect(action.loading.value).toBe(false); // reset after the await
    expect(start).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("returns null and stores a human-readable error message on failure", async () => {
    // Mimic a Nitro 404: an Error with a `statusMessage` field. The
    // composable prefers that string over `message` because Nitro uses
    // it to carry the human-readable error text from `createError`.
    const nitroError = Object.assign(new Error("Request failed"), {
      statusMessage: "Resource not found",
    });
    vi.stubGlobal(
      "$fetch",
      vi.fn(async () => {
        throw nitroError;
      }),
    );
    const action = useApiAction();

    const result = await action.execute("/api/missing");
    expect(result).toBeNull();
    expect(action.error.value).toBe("Resource not found");
  });

  it("ensures `loading` and the global indicator are reset even on error", async () => {
    // Same scenario as above but we focus on the lifecycle invariant:
    // loading.value MUST be false and indicator.finish() MUST have been
    // called once the promise settles, regardless of branch. Without
    // this the page would be stuck behind a spinner forever after a
    // single failed click.
    vi.stubGlobal(
      "$fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );
    const action = useApiAction();

    await action.execute("/api/whatever");
    expect(action.loading.value).toBe(false);
    expect(finish).toHaveBeenCalledTimes(1);
  });
});
