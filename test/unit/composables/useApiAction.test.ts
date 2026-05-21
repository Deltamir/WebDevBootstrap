/**
 * Unit tests for `composables/useApiAction.ts`.
 *
 * `useApiAction` is the template's generic "click → call API → reflect
 * the result in the UI" composable. Every form submit, delete-with-
 * confirm, or refresh button in a downstream project ends up using it.
 *
 * Three observable behaviours we pin here:
 *
 *   1. Happy path — `execute` returns the response from `$fetch`,
 *      `loading` is true during the call and false after, `error`
 *      stays null.
 *   2. Error path — `$fetch` throws; the composable swallows the
 *      exception, stores a user-friendly message in `error`, and
 *      returns `null` so the caller can branch on it.
 *   3. Loading lifecycle — `loading` and the global
 *      `<NuxtLoadingIndicator>` go up before the call and back down
 *      after, even on error (otherwise the spinner would be stuck
 *      forever after a single failed click).
 *
 * Mocking notes
 * -------------
 * The source file caches `$fetch` at MODULE LOAD time:
 *     const rawFetch = $fetch as unknown as (...) => Promise<unknown>;
 * Once that snapshot is taken, subsequent `vi.stubGlobal("$fetch", ...)`
 * calls do NOT affect the cached reference. Each test therefore:
 *   - stubs `$fetch` (and `useLoadingIndicator`) FIRST,
 *   - then calls `vi.resetModules()` + dynamic `import()` so the source
 *     re-evaluates against the freshly-installed stubs.
 *
 * Treat this file as the template for any composable that wraps an
 * async side effect (file upload, third-party SDK call, …) — duplicate
 * the dynamic-import dance whenever the source captures a global at
 * module load.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("useApiAction", () => {
  // Indicator spies — re-created per test so call assertions are
  // independent. `start` is invoked before the API call, `finish`
  // after (whether it resolved or threw).
  const start = vi.fn();
  const finish = vi.fn();

  beforeEach(() => {
    start.mockReset();
    finish.mockReset();
    // The default `useLoadingIndicator` shape: returns the two spies
    // the composable destructures. Tests don't override this — they
    // only override `$fetch`.
    vi.stubGlobal("useLoadingIndicator", () => ({ start, finish }));
    // Default $fetch — overridden per test before `resetModules`. A
    // benign default keeps unrelated suites that may transitively
    // load this composable from crashing.
    vi.stubGlobal("$fetch", async () => undefined);
  });

  // Helper: refresh the module graph so the source captures the
  // currently-stubbed `$fetch` instead of whichever one was global
  // at the previous import.
  async function freshUseApiAction() {
    vi.resetModules();
    return (await import("~~/composables/useApiAction")).useApiAction;
  }

  it("returns the response on success and resets loading after the call", async () => {
    // Arrange: script $fetch to resolve with a known payload.
    vi.stubGlobal("$fetch", vi.fn(async () => ({ ok: true })));

    const useApiAction = await freshUseApiAction();
    const action = useApiAction();

    // Pre-call: loading is false (the composable does not flip it
    // optimistically — only `execute` toggles it).
    expect(action.loading.value).toBe(false);

    // Act
    const result = await action.execute("/api/example");

    // Assert: payload comes back unchanged, error stays null,
    // loading flips back, indicator went up + down once.
    expect(result).toEqual({ ok: true });
    expect(action.error.value).toBeNull();
    expect(action.loading.value).toBe(false);
    expect(start).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("returns null and stores a human-readable error on failure", async () => {
    // Mimic a Nitro 4xx: an Error carrying `statusMessage` (Nitro's
    // human-readable error string set by `createError`). The
    // composable prefers `statusMessage` over `message`.
    const nitroError = Object.assign(new Error("Request failed"), {
      statusMessage: "Resource not found",
    });
    vi.stubGlobal(
      "$fetch",
      vi.fn(async () => {
        throw nitroError;
      }),
    );

    const useApiAction = await freshUseApiAction();
    const action = useApiAction();

    const result = await action.execute("/api/missing");

    expect(result).toBeNull();
    expect(action.error.value).toBe("Resource not found");
  });

  it("resets loading + indicator even when the call throws", async () => {
    // The lifecycle invariant: regardless of branch, `loading.value`
    // ends at false and `indicator.finish()` is called once. Without
    // this, a single failed click would leave the page behind a
    // permanent spinner.
    vi.stubGlobal(
      "$fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );

    const useApiAction = await freshUseApiAction();
    const action = useApiAction();

    await action.execute("/api/whatever");

    expect(action.loading.value).toBe(false);
    expect(finish).toHaveBeenCalledTimes(1);
  });
});
