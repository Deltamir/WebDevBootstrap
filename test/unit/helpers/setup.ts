/**
 * Global Vitest setup file.
 *
 * Runs once before each test file is evaluated (declared in `setupFiles` in
 * vitest.config.ts). Its job is to make the Nitro / h3 / Nuxt auto-imports
 * used by the source files available as real globals — because vitest does
 * not boot a Nuxt server, the auto-import macros that normally inject
 * `defineEventHandler`, `createError`, `readBody`, `useRoute`, `useFetch`, …
 * into server handlers and Vue components are absent.
 *
 * We replace them with deterministic stubs that:
 *   - identity-return event handlers (so `export default defineEventHandler(fn)`
 *     yields the bare `fn` and we can invoke it directly with a mock event);
 *   - turn `createError({ statusCode, statusMessage })` into a thrown `Error`
 *     carrying both fields (so tests can `expect(...).rejects.toMatchObject({...})`);
 *   - read body / router param straight from a `_body` / `_params` field of
 *     the test event — keeps test fixtures terse;
 *   - return inert refs / empty maps for client-side composables so the Vue
 *     component setup() functions don't crash on the first access.
 *
 * The stubs are intentionally permissive (no schema validation, no async
 * scheduling) — production behaviour is exercised by the Playwright E2E
 * suite which boots the real Nitro server.
 *
 * Tests may override individual stubs via `vi.stubGlobal(...)` inside a
 * `beforeEach` to assert a particular call pattern (e.g. that
 * `navigateTo("/login")` was invoked).
 */
import { vi } from "vitest";
import { ref, computed } from "vue";

type H3ErrorOptions = { statusCode: number; statusMessage: string };

type StubEvent = {
  _body?: unknown;
  _params?: Record<string, string>;
  _webRequest?: Request;
  [key: string]: unknown;
};

const h3Stubs = {
  defineEventHandler: <T>(handler: T) => handler,
  eventHandler: <T>(handler: T) => handler,
  createError: (opts: H3ErrorOptions) => {
    const error = new Error(opts.statusMessage) as Error & H3ErrorOptions;
    error.statusCode = opts.statusCode;
    error.statusMessage = opts.statusMessage;
    return error;
  },
  readBody: async (event: StubEvent) => event._body ?? {},
  getRouterParam: (event: StubEvent, key: string) => event._params?.[key],
  toWebRequest: (event: StubEvent) =>
    event._webRequest ?? new Request("http://localhost/"),
};

/**
 * Stubs for Nuxt / Vue auto-imports consumed by components and route
 * middleware. They return whatever ‘shape’ the source files destructure
 * (data ref, status ref, refresh fn, …) without making real network calls
 * or touching the router.
 */
const nuxtStubs = {
  // No-op identity wrapper — the middleware function is the test target.
  defineNuxtRouteMiddleware: <T>(handler: T) => handler,
  // Returns a tagged object so tests can assert "the component tried to
  // navigate to X" without installing a real router.
  navigateTo: (target: unknown) => ({ __navigateTo: true, target }),
  // Generic Nuxt fetcher — returns a steady-state empty payload. Per-test
  // overrides via `vi.stubGlobal("useFetch", ...)` simulate non-trivial
  // server responses.
  useFetch: async () => ({
    data: ref(null),
    status: ref("success"),
    refresh: vi.fn(),
    pending: ref(false),
    error: ref(null),
  }),
  // SSR header passthrough — empty in unit tests (no real cookies).
  useRequestHeaders: () => ({}),
  // Minimal route stub — empty path + query so `route.query.redirect?.toString()`
  // is callable but yields no redirect target.
  useRoute: () => ({ path: "/", query: {}, fullPath: "/" }),
  // useState mimics Nuxt's SSR-safe ref factory — for unit tests a regular
  // ref is sufficient because every test mounts a fresh component tree.
  useState: <T>(_key: string, init?: () => T) =>
    ref(typeof init === "function" ? (init as () => T)() : (undefined as unknown as T)),
  // Vuetify's `useTheme()` returns a deeply reactive object — the components
  // here only read `global.current.value.dark` and write `global.name.value`,
  // so we stub exactly that surface.
  useTheme: () => {
    const name = ref<"light" | "dark">("dark");
    return {
      global: {
        name,
        current: computed(() => ({ dark: name.value === "dark" })),
      },
    };
  },
};

for (const [key, value] of Object.entries({ ...h3Stubs, ...nuxtStubs })) {
  vi.stubGlobal(key, value);
}
