/**
 * Global Vitest setup file.
 *
 * Registered as `setupFiles` in `vitest.config.ts` — vitest evaluates this
 * once per test worker BEFORE any test file is loaded. Its job is to make
 * the Nitro / h3 auto-imports referenced by `server/api/**` and
 * `server/middleware/**` work in a plain happy-dom environment, by
 * exposing them as globals.
 *
 * Why only h3 here? Production Nitro injects `defineEventHandler`,
 * `createError`, `readBody`, `getRouterParam` and `toWebRequest` into
 * server-handler files at build time. In vitest we don't run that build
 * step, so the bare identifiers would be ReferenceErrors. Stubbing them
 * as identity / minimal helpers lets a test file do
 *
 *   import handler from "~~/server/api/whatever.get";
 *   await handler(mockEvent);
 *
 * and exercise the real source code without booting Nitro.
 *
 * What is intentionally NOT stubbed here?
 *   - Vue / Nuxt component composables (`useFetch`, `useRoute`,
 *     `navigateTo`, `useTheme`, …). Stubbing them across the board is
 *     brittle because @nuxt/test-utils may rewrite the source's bare
 *     identifiers into explicit `import { useFetch } from "#imports"`
 *     statements, which bypass globals. We test component DOM behaviour
 *     end-to-end with Playwright instead — see test/e2e/*.
 *   - Pinia's `defineStore`. It is auto-imported by `@nuxt/test-utils`
 *     in the test config and the existing preferences store test proves
 *     it works without additional plumbing.
 */
import { vi } from "vitest";

type H3ErrorOptions = { statusCode: number; statusMessage: string };

type StubEvent = {
  _body?: unknown;
  _params?: Record<string, string>;
  _webRequest?: Request;
  [key: string]: unknown;
};

// Identity wrappers + tiny accessors. Each one mirrors the production
// auto-import's signature just enough for our server handlers to run.
const h3Stubs = {
  // `defineEventHandler(fn)` returns `fn` itself in tests — so a handler
  // module's `export default defineEventHandler(async (event) => ...)`
  // exports the bare async function and we can invoke it directly.
  defineEventHandler: <T>(handler: T) => handler,
  // Alias kept for files that use `eventHandler` instead of
  // `defineEventHandler` (h3 exports both names).
  eventHandler: <T>(handler: T) => handler,
  // Turn h3's `createError({ statusCode, statusMessage })` into a real
  // Error that carries both fields so tests can write
  // `expect(promise).rejects.toMatchObject({ statusCode: 401 })`.
  createError: (opts: H3ErrorOptions) => {
    const error = new Error(opts.statusMessage) as Error & H3ErrorOptions;
    error.statusCode = opts.statusCode;
    error.statusMessage = opts.statusMessage;
    return error;
  },
  // Read the body straight off the fake event — tests assemble events
  // via `createMockEvent({ body: { ... } })` which stashes the payload
  // under `_body`. The real h3 version awaits the request stream.
  readBody: async (event: StubEvent) => event._body ?? {},
  // Same trick for `:id`-style URL params: tests put them in `_params`.
  // (`key` comes from the handler under test, not user input — the runtime
  // h3 source we mirror uses the non-literal key the same way.)
  // eslint-disable-next-line security/detect-object-injection
  getRouterParam: (event: StubEvent, key: string) => event._params?.[key],
  // Auth catch-all forwards via `toWebRequest(event)` — give it a real
  // `Request` so `auth.handler(...)` (mocked in the relevant test)
  // receives something inspectable.
  toWebRequest: (event: StubEvent) =>
    event._webRequest ?? new Request("http://localhost/"),
};

for (const [key, value] of Object.entries(h3Stubs)) {
  vi.stubGlobal(key, value);
}
