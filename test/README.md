# Testing strategy — WebDevBootstrap

A KISS guide to every test in this repo. **WebDevBootstrap is a template**,
so the tests in this folder are deliberately written as **generic examples**
of the patterns a downstream project will need — never as exhaustive coverage
of any particular endpoint or store. Forks should keep these as scaffolding,
delete the ones that don't match their domain, and copy the example shape
when they add new code.

One job per file. One assertion idea per test. Header comments explain *why*
the test exists and which pattern it illustrates.

## The two layers (one tool each, one boundary each)

| Layer       | Tool        | Lives in       | Run with             | What it proves                                                                       |
| ----------- | ----------- | -------------- | -------------------- | ------------------------------------------------------------------------------------ |
| Unit        | Vitest      | `test/unit/**` | `yarn test`          | Server handlers, lib modules, composables, Pinia stores — pure logic, mockable boundaries. |
| Integration | Playwright  | `test/e2e/**`  | `yarn test:e2e`      | Full app on `yarn preview` — routes, redirects, auth API, chrome.                    |
| Smoke       | Playwright  | `test/smoke/**`| `yarn test:smoke`    | Minimal "is prod alive?" probes against a deployed URL.                              |

Two layers, not three. Vue components live across both: their setup scripts
sit on top of composables that need a Nuxt+Vuetify runtime, so unit-testing
their DOM is more cost than value. We test components by their
**user-visible behaviour** in Playwright instead.

## What the unit layer covers (and what it does NOT)

`vitest.config.ts → coverage.include` is intentionally narrow:

```
stores/**   lib/**   server/**
```

| Folder           | Why it's in the unit coverage scope                                                  |
| ---------------- | ------------------------------------------------------------------------------------ |
| `stores/**`      | Plain Pinia stores. No DOM, no network, no auto-imports beyond `defineStore`.        |
| `lib/**`         | Pure config / singleton modules. Their boundaries (`pg`, `better-auth`) mock cleanly. |
| `server/**`      | h3 event handlers + utilities (email, provider avatars). Event + Prisma + fetch all mockable. |

| Folder           | Why it is NOT in the unit coverage scope                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| `composables/**` | Touch Nuxt-runtime composables (`useLoadingIndicator`, `useState`, `$fetch`, …). Nuxt's auto-import transform rewrites these to explicit `#imports` imports that bind to a real Nuxt instance — stubbing them at the global / module level is fragile. Composables are exercised end-to-end through the Vue pages that use them, in Playwright. |
| `components/**`  | Need Vuetify plugin + Nuxt instance (`useTheme`, `useRoute`, `useFetch`). Mocking that surface is brittle; Playwright proves the same thing reliably. |
| `pages/**`       | Same reason as components. Each page is a Vue SFC over composables.              |
| `middleware/**`  | `auth.global.ts` calls `navigateTo` / `useFetch` (Nuxt auto-imports). Tested via Playwright `auth-redirect.spec.ts`. |
| `app.vue` / `layouts/**` | Layout templates. Tested via Playwright `layout.spec.ts`.                |

## Test directory map

```
test/
├── README.md                          ← this file
├── unit/
│   ├── helpers/                       ← plumbing (excluded from collection AND coverage)
│   │   ├── setup.ts                   ← installs h3 globals (defineEventHandler, createError, …)
│   │   └── event.ts                   ← createMockEvent + createMockPrisma factory
│   ├── preferences.test.ts            ← Pinia store example (default, assignment, isolation)
│   ├── lib/
│   │   ├── auth.test.ts               ← baseURL env-priority chain
│   │   ├── auth-client.test.ts        ← createAuthClient + re-exports
│   │   └── prisma.test.ts             ← dev-safe singleton cache pattern
│   └── server/
│       ├── middleware/
│       │   └── prisma.test.ts         ← one-pool-per-process invariant
│       ├── utils/
│       │   ├── email.test.ts          ← Resend wrapper + missing-key guard
│       │   └── providerAvatar.test.ts ← OAuth avatar fetch + graceful fallbacks
│       └── api/
│           ├── auth-catchall.test.ts             ← /api/auth/[...]
│           ├── auth-providers-infos.test.ts      ← static provider metadata
│           ├── user-delete.test.ts               ← DELETE /api/user
│           ├── user-infos-get.test.ts            ← GET  /api/user/infos
│           ├── user-infos-post.test.ts           ← POST /api/user/infos (name + image whitelist)
│           ├── user-accounts-get.test.ts         ← GET  /api/user/accounts
│           ├── user-accounts-id-delete.test.ts   ← DELETE /api/user/accounts/:id
│           └── user-avatars-get.test.ts          ← GET  /api/user/avatars (lazy backfill pattern)
├── e2e/
│   ├── navigation.spec.ts             ← (pre-existing) public/protected reachability
│   ├── layout.spec.ts                 ← header title link + footer year + legal links
│   ├── auth-redirect.spec.ts          ← middleware/auth.global redirect URL shapes
│   └── auth-api.spec.ts               ← every Nitro endpoint's anonymous response
└── smoke/
    └── smoke.spec.ts                  ← (pre-existing) prod deploy smoke
```

## Why each kind of file is its own example pattern

The unit folder is small on purpose — each test is the **canonical worked
example** of a pattern, not exhaustive coverage. The shape per category:

- **Pinia stores** — show `setActivePinia(createPinia())` + assertions on
  state. Generic enough for any future store.
- **Lib modules** — show `vi.mock` for upstream SDKs + `vi.resetModules()`
  for env-driven branches.
- **Server middleware** — show that an attaching middleware reuses
  state across requests (one pool, not one-per-request).
- **Server utilities** — show how to mock a third-party SDK (Resend,
  global `fetch`) and assert "graceful degradation" branches.
- **Server API handlers** — three checkpoints per handler: 401 gate,
  the happy-path call shape, and at most one error edge case.

When a downstream project adds a new file under one of those folders, the
quickest path is **copy the matching test, rename, swap the mocks**.

## Test plumbing (the only two helpers, and why)

### `helpers/setup.ts`

Registered in `vitest.config.ts → setupFiles`. Vitest runs it once per
worker **before** any test file is loaded. It does one thing: install
`vi.stubGlobal` shims for the h3 / Nitro auto-imports that server
handlers reference as bare identifiers (`defineEventHandler`,
`createError`, `readBody`, `getRouterParam`, `toWebRequest`).

Without this, importing `server/api/user.delete.ts` would throw
`ReferenceError: defineEventHandler is not defined` because vitest does
not run the Nitro build step that injects them.

Nothing else is global-stubbed here. Vue / Nuxt / Vuetify composables
are deliberately omitted — see the "What is NOT in scope" table above.

### `helpers/event.ts`

Exports two factories:

- `createMockPrisma()` — returns an object with the Prisma methods the
  template's endpoints touch (`user.findUnique/update/delete`,
  `account.findMany/findFirst/update/delete`) as `vi.fn()` spies.
- `createMockEvent({ body?, params?, cookieHeader?, prisma? })` — assembles
  the minimum h3-event-shaped object the handlers under test actually
  read: `headers`, `context.prisma`, plus the `_body` / `_params` private
  fields read by the stubs in `setup.ts`.

When adding a new endpoint that touches a different Prisma model, **extend
this helper** (don't roll a one-off).

## How a single server-handler unit test reads

This is the canonical 3-step shape every endpoint test follows. Pin it as
a template for any new endpoint.

```ts
// 1) Mock the auth boundary every protected handler shares.
const getSessionSpy = vi.fn();
vi.mock("~~/lib/auth", () => ({
  auth: { api: { getSession: getSessionSpy } },
}));

// 2) Script the boundary per-test (auth + Prisma).
getSessionSpy.mockResolvedValue({ user: { id: "u-1" } });
const prisma = createMockPrisma();
prisma.user.findUnique.mockResolvedValue({ name: "Alice", email: "a@b", image: null });

// 3) Dynamically import + invoke. (Dynamic import so the setup.ts
//    identity stub for defineEventHandler is already installed.)
const handler = (await import("~~/server/api/user/infos.get")).default as (
  e: unknown,
) => Promise<unknown>;
await expect(handler(createMockEvent({ prisma }))).resolves.toMatchObject({
  name: "Alice",
});
```

## E2E suite — what each file pins

| File                    | Boundary tested                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `navigation.spec.ts`    | (pre-existing) Public pages reachable; protected page redirects when anonymous.        |
| `layout.spec.ts`        | App bar title link + footer year + legal links — the chrome on every page.             |
| `auth-redirect.spec.ts` | Exact URL shape produced by `middleware/auth.global.ts`.                               |
| `auth-api.spec.ts`      | Every Nitro endpoint's anonymous contract (401s + the `/api/auth/providers/infos` shape). |

Playwright bootstraps a real `yarn preview` server in `playwright.config.ts`
with throwaway DB credentials, so the suite runs in CI without secrets.

## Running

```bash
yarn test                                      # unit single run
yarn test:watch                                # unit watch mode
yarn test:coverage                             # unit + HTML report (coverage/index.html)
yarn test:e2e                                  # boots `yarn preview` automatically
yarn test:e2e:ui                               # Playwright inspector
BASE_URL=https://<deploy> yarn test:smoke      # smoke against a deployed URL
```

## Adding a new test

1. **One test = one behaviour.** No `it("does many things")`. If the test
   description has the word "and", split it.
2. **Pick the layer.** Pure function / store / handler? Unit test. URL or
   user-visible behaviour? Playwright spec.
3. **Header comment first.** Every test FILE opens with a comment explaining
   WHAT the source file does and WHAT pattern this test illustrates.
4. **Re-use the helpers.** Don't roll your own h3 event mock; extend
   `helpers/event.ts` instead.
5. **KISS over coverage %.** This is a template — exhaustive coverage of
   throwaway demo handlers (settings page, OAuth-specific flows) is rarely
   useful for the project a downstream fork builds. Prefer ONE crisp
   example over five edge-case permutations.

## Why no Vue component / composable unit tests?

A previous version of this suite tried to mount every `.vue` component (and
unit-test `composables/useApiAction.ts`) with stubbed Vuetify + Nuxt
composables. Nuxt's auto-import transform rewrites bare identifiers
(`useRoute`, `navigateTo`, `useFetch`, `useTheme`, `useLoadingIndicator`, …)
into explicit `import { x } from "#imports"` statements that load the REAL
composables. The real composables call `useNuxtApp()`, which crashes
outside a live Nuxt instance with `[nuxt] instance unavailable` or, for
Vuetify, `Could not find Vuetify theme injection`.

Working around it requires `vi.mock("#app")`, `vi.mock("#imports")`,
`vi.mock("vuetify")`, `vi.mock("vue-router")`, Suspense wrappers, and a
~200-line Vuetify stub map — brittle, and none of it validates actual
user-visible behaviour. We removed all of it.

Components, pages, route middleware, AND composables that depend on Nuxt
runtime composables are therefore tested by Playwright (`test/e2e/**`)
where the runtime is real. They are excluded from `coverage.include` so
the report stays honest about what the unit tests actually exercise.

If a `composables/use<X>.ts` you add depends only on plain Vue (`ref`,
`computed`, `watch`, `inject`) and NOT on Nuxt-runtime composables, it IS
unit-testable here. Otherwise, exercise it through the page that uses it
in Playwright.
