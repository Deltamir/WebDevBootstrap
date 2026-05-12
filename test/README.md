# Testing strategy — WebDevBootstrap

A KISS guide to every test in this repo. One job per file, one assertion idea
per test, comment headers explain *why* the test exists.

## The two layers (one tool each, one boundary each)

| Layer       | Tool        | Lives in       | Run with             | What it proves                                                                       |
| ----------- | ----------- | -------------- | -------------------- | ------------------------------------------------------------------------------------ |
| Unit        | Vitest      | `test/unit/**` | `yarn test`          | Server handlers, lib modules, Pinia stores — pure logic, fully mockable boundaries.  |
| Integration | Playwright  | `test/e2e/**`  | `yarn test:e2e`      | Full app on `yarn preview` — routes, redirects, auth API, chrome.                    |
| Smoke       | Playwright  | `test/smoke/**`| `yarn test:smoke`    | Minimal "is prod alive?" probes against a deployed URL.                              |

Two layers, not three. Vue components live across both: their setup script is
trivially indirected through composables that need a Nuxt+Vuetify runtime, so
unit-testing their DOM is more cost than value. We test components by their
**user-visible behaviour** in Playwright instead.

## What the unit layer covers (and what it does NOT)

`vitest.config.ts → coverage.include` is intentionally narrow:

```
stores/**   lib/**   server/**
```

| Folder         | Why it's in the unit coverage scope                                                |
| -------------- | ---------------------------------------------------------------------------------- |
| `stores/**`    | Plain Pinia stores. No DOM, no network, no auto-imports beyond `defineStore`.      |
| `lib/**`       | Pure config / singleton modules. Their boundaries (`pg`, `better-auth`) mock cleanly. |
| `server/**`    | h3 event handlers. The event + Prisma client are the only inputs — both mockable.  |

| Folder           | Why it is NOT in the unit coverage scope                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| `components/**`  | Need Vuetify plugin + Nuxt instance (`useTheme`, `useRoute`, `useFetch`). Mocking that surface is brittle; Playwright proves the same thing reliably. |
| `pages/**`       | Same reason as components. Each page is a Vue SFC over composables.              |
| `middleware/**`  | `auth.global.ts` calls `navigateTo` / `useFetch` (Nuxt auto-imports). Tested via Playwright `auth-redirect.spec.ts`. |
| `app.vue`        | Layout root. Tested via Playwright `layout.spec.ts`.                             |

## Test directory map

```
test/
├── README.md                          ← this file
├── unit/
│   ├── helpers/                       ← test plumbing (excluded from collection AND coverage)
│   │   ├── setup.ts                   ← installs h3 globals (defineEventHandler, createError, …)
│   │   └── event.ts                   ← createMockEvent + createMockPrisma factory
│   ├── preferences.test.ts            ← (pre-existing) base store behaviour
│   ├── stores/
│   │   └── preferences.persist.test.ts ← persistence config pin
│   ├── lib/
│   │   ├── auth.test.ts               ← baseURL resolution + provider keys
│   │   ├── auth-client.test.ts        ← createAuthClient + re-exports
│   │   └── prisma.test.ts             ← singleton cache + env wiring
│   └── server/
│       ├── middleware/
│       │   └── prisma.test.ts         ← one-pool-per-process invariant
│       └── api/
│           ├── auth-catchall.test.ts             ← /api/auth/[...]
│           ├── auth-providers-infos.test.ts      ← static provider metadata
│           ├── user-delete.test.ts               ← DELETE /api/user
│           ├── user-infos-get.test.ts            ← GET  /api/user/infos
│           ├── user-infos-post.test.ts           ← POST /api/user/infos
│           ├── user-accounts-get.test.ts         ← GET  /api/user/accounts
│           └── user-accounts-id-delete.test.ts   ← DELETE /api/user/accounts/:id
├── e2e/
│   ├── navigation.spec.ts             ← (pre-existing) public/protected reachability
│   ├── layout.spec.ts                 ← header title link + footer year + legal links
│   ├── auth-redirect.spec.ts          ← middleware/auth.global redirect URL shapes
│   └── auth-api.spec.ts               ← every Nitro endpoint's anonymous response
└── smoke/
    └── smoke.spec.ts                  ← (pre-existing) prod deploy smoke
```

## Test plumbing (the only two helpers, and why)

### `helpers/setup.ts`

Registered in `vitest.config.ts → setupFiles`. Vitest runs it once per worker
**before** any test file is loaded. It only does one thing: install
`vi.stubGlobal` shims for the h3 / Nitro auto-imports that server handlers
reference as bare identifiers (`defineEventHandler`, `createError`,
`readBody`, `getRouterParam`, `toWebRequest`).

Without this, importing `server/api/user.delete.ts` would throw
`ReferenceError: defineEventHandler is not defined` because vitest does
not run the Nitro build step that injects them.

Nothing else is global-stubbed here. Vue / Nuxt / Vuetify composables are
deliberately omitted — see the "What is NOT covered" table above.

### `helpers/event.ts`

Exports two factories:

- `createMockPrisma()` — returns an object with `user.findUnique/update/delete`
  and `account.findMany/findFirst/delete` as `vi.fn()` spies. Tests script
  per-call behaviour with `mockResolvedValue(...)` / `mockRejectedValue(...)`.
- `createMockEvent({ body?, params?, cookieHeader?, prisma? })` — assembles
  the minimum h3-event-shaped object the handlers under test actually read:
  `headers`, `context.prisma`, plus the `_body` / `_params` private fields
  read by the stubs in `setup.ts`.

Both helpers are used by every `server/api/*.test.ts` file.

## How a single server-handler unit test reads

Every server handler test follows the same three-step shape — pin it as a
template if you add a new endpoint.

```ts
// 1) HOIST: mock the auth module's getSession. This is the only Nitro-side
//    dependency every handler shares.
const getSessionSpy = vi.fn();
vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

// 2) SCRIPT the boundary per-test (auth + Prisma).
getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
const prisma = createMockPrisma();
prisma.user.findUnique.mockResolvedValue({ name: "Alice", email: "a@b", image: null });

// 3) IMPORT the handler dynamically (so the setup.ts identity stub for
//    defineEventHandler already exists) and invoke it like a normal async fn.
const handler = (await import("~~/server/api/user/infos.get")).default as (
  e: unknown,
) => Promise<unknown>;
await expect(handler(createMockEvent({ prisma }))).resolves.toMatchObject({
  name: "Alice",
});
```

The handler module is loaded *inside* the test rather than at the top so the
`vi.mock` registration and any per-test `vi.stubGlobal` overrides have
already been applied when the source file evaluates.

## How a lib singleton test reads

`lib/prisma.test.ts` and `lib/auth.test.ts` follow the same pattern:

1. `vi.mock` the upstream SDKs (`pg`, `@prisma/adapter-pg`, `@prisma/client`,
   `better-auth`, …) with sentinel constructors.
2. In each `it`, mutate `process.env`, then `vi.resetModules()`, then
   `await import("~~/lib/<name>")`. Resetting modules re-runs the file's
   top-level code with the current env snapshot — that's how we exercise
   the `BETTER_AUTH_URL → VERCEL_URL → localhost` priority chain and the
   `globalThis.prismaGlobal` cache behaviour.

## E2E suite — what each file pins

| File                       | Boundary tested                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `navigation.spec.ts`       | (pre-existing) Public pages reachable; protected page redirects when anonymous.        |
| `layout.spec.ts`           | App bar title link + footer year + legal links — the chrome on every page.             |
| `auth-redirect.spec.ts`    | Exact URL shape produced by `middleware/auth.global.ts` (`/login?redirect=%2Fprotected`). |
| `auth-api.spec.ts`         | Every Nitro endpoint's anonymous contract (401s + the `/api/auth/providers/infos` shape). |

Playwright bootstraps a real `yarn preview` server in `playwright.config.ts`
with throwaway DB credentials, so the suite runs in CI without secrets.

## Running

```bash
# Unit tests (single run)
yarn test

# Unit tests with watch mode
yarn test:watch

# Unit tests + coverage (HTML report at coverage/index.html)
yarn test:coverage

# Playwright e2e — boots `yarn preview` automatically
yarn test:e2e

# Playwright with the inspector UI
yarn test:e2e:ui

# Smoke tests against a deployed URL
BASE_URL=https://<deployed-url> yarn test:smoke
```

## Adding a new test

1. **One test = one behaviour.** No `it("does many things")`. If the test
   description has the word "and", split it.
2. **Pick the layer.** Pure function / store / handler? Unit test. URL or
   user-visible behaviour? Playwright spec.
3. **Header comment first.** Every test FILE opens with a comment explaining
   WHAT the source file does and WHAT behaviours the tests pin. Match the
   style of the existing files — it's the single biggest readability win.
4. **Re-use the helpers.** Don't roll your own h3 event mock; extend
   `helpers/event.ts` if you need a new Prisma method.

## Why no Vue component unit tests?

A previous version of this suite attempted to mount each `.vue` component
with stubbed Vuetify + Nuxt composables. The result was 22+ test failures
because Nuxt's auto-import transform rewrites bare identifiers (`useRoute`,
`navigateTo`, `useFetch`, `useTheme`, …) into explicit `import` statements
that load the real composables, which then fail without a running Nuxt
runtime ("Nuxt instance unavailable", "Could not find Vuetify theme
injection"). Working around it required `vi.mock("#app")`,
`vi.mock("#imports")`, `vi.mock("vuetify")`, `vi.mock("vue-router")`,
Suspense wrappers, and a 200-line stub map for Vuetify components — all
brittle, none of it actually validating the user-visible behaviour.

We deleted that and now test the same surface in Playwright where the
runtime is real and the assertions are about what the user sees, not what
the stubs render. `components/**` is excluded from `coverage.include`
accordingly so the report doesn't lie about coverage.

If a component grows non-trivial logic (a `computed` worth pinning, a
function pure enough to extract), extract it to a `composables/use<X>.ts`
file under the `composables/` directory and unit-test it there.
