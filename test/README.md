# Testing strategy — WebDevBootstrap

This document is the entry point for everything under `test/`. Read it before
adding a new test so you pick the right tool for the job and don't reinvent
helpers that already exist.

## TL;DR

| Layer       | Tool        | Where                | How to run                | Use it for                                                                          |
| ----------- | ----------- | -------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| Unit        | Vitest      | `test/unit/**`       | `yarn test`               | Pure functions, stores, server handlers, route middleware, isolated Vue components. |
| Integration | Playwright  | `test/e2e/**`        | `yarn test:e2e`           | End-to-end flows against a real `yarn preview` server. Verifies routing + Nitro.    |
| Smoke       | Playwright  | `test/smoke/**`      | `yarn test:smoke`         | Minimal "is prod alive?" checks against a deployed URL (Vercel).                    |
| Coverage    | Vitest + v8 | (same as unit)       | `yarn test:coverage`      | HTML / LCOV / JSON reports under `./coverage/`.                                     |

Coverage scope (vitest.config.ts → `coverage.include`):

```
components/**   stores/**   lib/**   server/**
```

`app.vue`, `pages/**`, `middleware/**` are **outside** the coverage scope by
design — they are exercised by the Playwright e2e suite instead, because
Nuxt-route-middleware and `<NuxtPage>` interactions are unstable to mock at
the unit level and produce more meaningful tests when they run against a
real Nitro server.

## Layout

```
test/
├── README.md                   ← this file
├── unit/
│   ├── helpers/                ← shared plumbing (excluded from coverage)
│   │   ├── setup.ts            ← global `vi.stubGlobal` for h3 / Nuxt auto-imports
│   │   ├── event.ts            ← mock H3 event + mock Prisma factory
│   │   └── component.ts        ← `mountWithStubs` for Vuetify-heavy components
│   ├── preferences.test.ts     ← (pre-existing) base store tests
│   ├── stores/
│   │   └── preferences.persist.test.ts
│   ├── lib/
│   │   ├── auth.test.ts
│   │   ├── auth-client.test.ts
│   │   └── prisma.test.ts
│   ├── server/
│   │   ├── middleware/
│   │   │   └── prisma.test.ts
│   │   └── api/
│   │       ├── auth-catchall.test.ts
│   │       ├── auth-providers-infos.test.ts
│   │       ├── user-delete.test.ts
│   │       ├── user-infos-get.test.ts
│   │       ├── user-infos-post.test.ts
│   │       ├── user-accounts-get.test.ts
│   │       └── user-accounts-id-delete.test.ts
│   ├── middleware/
│   │   └── auth-global.test.ts ← global route middleware (NOT in coverage scope)
│   └── components/
│       ├── AppFooter.test.ts
│       ├── AppHeader.test.ts
│       ├── MenuItem.test.ts
│       ├── NavItem.test.ts
│       ├── UserItem.test.ts
│       ├── LoginItem.test.ts
│       └── AccountItem.test.ts
├── e2e/
│   ├── navigation.spec.ts      ← (pre-existing) basic public/protected access
│   ├── layout.spec.ts          ← header + footer chrome
│   ├── auth-redirect.spec.ts   ← middleware/auth.global.ts redirects
│   ├── auth-api.spec.ts        ← Nitro endpoints respond + 401 anonymous
│   ├── theme.spec.ts           ← theme toggle + persistence
│   └── login.spec.ts           ← login card + flavor toggle
└── smoke/
    └── smoke.spec.ts           ← (pre-existing) prod smoke
```

## Unit testing infrastructure

### `helpers/setup.ts`

Registered as `setupFiles` in `vitest.config.ts`. Installs `vi.stubGlobal`
shims for two families of auto-imports that source files rely on but that
vitest's `happy-dom` env doesn't ship:

1. **Nitro / h3 globals** used by `server/api/**`:
   `defineEventHandler`, `eventHandler`, `createError`, `readBody`,
   `getRouterParam`, `toWebRequest`.
2. **Nuxt / Vuetify composables** used by components and route middleware:
   `defineNuxtRouteMiddleware`, `navigateTo`, `useFetch`,
   `useRequestHeaders`, `useRoute`, `useState`, `useTheme`.

Tests can re-stub any individual entry per scenario via `vi.stubGlobal(...)`
inside a `beforeEach` — the spy replaces the default for the duration of
the test file (no need to restore manually; vitest tears down stubs
between files).

### `helpers/event.ts`

Two factory functions for server-handler tests:

- `createMockPrisma()` — returns a Prisma double exposing
  `user.findUnique/update/delete` and `account.findMany/findFirst/delete` as
  `vi.fn()`s. Use `prisma.user.findUnique.mockResolvedValue(row)` etc. to
  script DB behaviour per scenario.
- `createMockEvent({ body, params, cookieHeader, prisma })` — builds an
  H3-event-shaped object exposing `headers`, `context.prisma`, plus the
  `_body` / `_params` private fields read by the stubs above. Pass it to a
  handler imported with the default `defineEventHandler` stub (which is
  identity).

### `helpers/component.ts`

`mountWithStubs(component, options)` is the canonical mount helper:

- Installs a fresh Pinia on every call.
- Stubs every Vuetify component (`v-app-bar`, `v-btn`, `v-list-item`, …)
  with a passthrough `<div>` that forwards slots and attributes — keeps the
  rendered DOM searchable for assertions without booting Vuetify itself.
- Stubs `NuxtLink` as a plain `<a href>`.

The `options.provide` argument seeds `provide/inject` for components that
consume `providersInfos`, etc.

## How each layer earns its keep

### Stores

Stores have no behaviour beyond `state` and `actions`; both are tested
directly with `setActivePinia(createPinia())` per test. See
`unit/preferences.test.ts` for the baseline pattern.

### `lib/`

Three modules:

- `prisma.ts` — dev-safe singleton. The test mocks `pg`, `@prisma/adapter-pg`
  and `@prisma/client` and asserts:
  - the singleton goes on `globalThis.prismaGlobal` only outside production;
  - a second import reuses the cached instance (no duplicate pools).
- `auth.ts` — config assembly. The test mocks `better-auth` and the Prisma
  adapter, then mutates `process.env` between scenarios to exercise the
  `baseURL` resolution priority (BETTER_AUTH_URL > VERCEL_URL > localhost)
  and pins the GitHub + Twitch provider keys.
- `auth-client.ts` — three named re-exports. The test mocks `better-auth/vue`
  and asserts each re-export is reference-equal to the client property.

### `server/api/**`

Every handler is imported via `await import(...)` inside the test (so the
identity `defineEventHandler` stub returns the bare function), then
invoked with a fake H3 event from `createMockEvent`. We cover:

- 401 branch (no session)
- 400 / 404 branches where they exist
- the happy path's Prisma call shape (WHERE + select / data clauses)

Tests for handlers that build queries by reading the session user's id
(every handler except the providers-infos one and the catch-all) pin both
the input contract and the resulting Prisma call signature — that is the
contract the frontend depends on.

### `server/middleware/prisma.ts`

Mocked the same way as `lib/prisma.ts`. Two scenarios:

- The middleware constructs a Pool + adapter + client on the first request;
- Subsequent requests reuse the same client (one pool across all events).

### `middleware/auth.global.ts`

This file is outside the coverage scope but tested as a unit because
mocking `useSession` is trivial and the branch matrix is small enough to
enumerate. Six tests cover:

- `auth: false` → bypass without calling `useSession`
- default meta + no session → redirect to `/login?redirect=...`
- default meta + session → no redirect
- `unauthenticatedOnly` + session → redirect to `navigateAuthenticatedTo`
- `unauthenticatedOnly` + no session → no redirect
- `unauthenticatedOnly` without `navigateAuthenticatedTo` → fallback to `/`

### Components

The seven Vue components are mounted via `mountWithStubs`. For each:

- **AppFooter** — pure render: legal links + dynamic year.
- **MenuItem / NavItem** — recursion + click handlers; the recursive branch
  is verified by checking that nested titles appear in the rendered tree.
- **UserItem** — `tab` ref flips on emitted `switch` events.
- **AccountItem** — connected vs anonymous branches, plus the logout button
  → `authClient.signOut()` wiring.
- **LoginItem** — flavor switching, provider buttons → `signIn.social({...})`
  with the route's `?redirect=` query, fallback to `/`.
- **AppHeader** — theme initialisation on mount, theme toggle wiring, item
  tree rendering.

Where the component depends on the auth client (`AccountItem`,
`LoginItem`), `~~/lib/auth-client` is mocked at the top of the file with
`vi.mock(...)`; the rest are pure Vue + Pinia + stubs.

## Integration (Playwright) testing

The `playwright.config.ts` boots `yarn preview` on port 3000 with throwaway
ephemeral credentials (DATABASE_URL pointing at a Postgres service in CI,
plus a 32-char BETTER_AUTH_SECRET). Each spec hits the running server:

- `navigation.spec.ts` (pre-existing) — page accessibility & redirects.
- `layout.spec.ts` — header title link + footer year + legal links.
- `auth-redirect.spec.ts` — full URL shape of `auth.global.ts` redirects.
- `auth-api.spec.ts` — every documented HTTP contract for the anonymous
  case (401s + the public providers/infos shape).
- `theme.spec.ts` — toggle flips the Vuetify icon AND survives a reload
  (covers `pinia-plugin-persistedstate` integration end-to-end).
- `login.spec.ts` — login card renders both provider buttons and the
  signup-flavor toggle round-trips.

The Vercel-prod-only `test/smoke/smoke.spec.ts` (pre-existing) is run by
`.github/workflows/smoke.yml` against the live deployment after every
successful Vercel deploy. Keep it minimal — failures there block a release.

## What is intentionally NOT tested at the unit level

- **`app.vue` / `pages/**`** — These are thin Vue templates whose meaning is
  "did the page render and call its `useFetch` correctly?". That's better
  expressed as a Playwright assertion (see `layout.spec.ts`, `login.spec.ts`)
  than as a happy-dom mount that would need to fake every Nuxt runtime.
- **Real OAuth callback flow** — Would require live GitHub / Twitch
  credentials. Out of scope for CI.
- **Real DB writes** — Both unit (mocked Prisma) and E2E (anonymous-only)
  tests avoid mutating the DB. Authenticated-user mutations are covered by
  the unit tests with mock Prisma; full integration would require a seeded
  test user, which is left for a future fixture-based suite.

## Running the suites

```bash
# Unit tests, single run
yarn test

# Unit tests, watch mode
yarn test:watch

# Unit + coverage (HTML report in coverage/index.html)
yarn test:coverage

# Playwright E2E — boots `yarn preview` automatically
yarn test:e2e

# Playwright E2E with the inspector UI
yarn test:e2e:ui

# Smoke tests against a deployed URL
BASE_URL=https://your-app.vercel.app yarn test:smoke
```

## Adding a new test

1. **Pick the layer**. New function in `lib/` or new Pinia store? Vitest.
   New `<v-card>` chrome? Vitest with `mountWithStubs`. New URL route?
   Vitest for the handler + Playwright for the wiring.
2. **Add it under the matching folder**. Follow the naming convention
   `<subject>.test.ts` for vitest and `<subject>.spec.ts` for Playwright —
   the configs filter on those suffixes.
3. **Re-use the helpers**. Don't roll your own H3 event mock or component
   stub set — extend `helpers/event.ts` or `helpers/component.ts` if you
   need something new.
4. **Document the contract**. Every test file in this suite opens with a
   header comment that explains what the file does AND what behaviour the
   tests pin. Match that style — it's the single biggest readability win
   for a future maintainer skimming the suite.

## Known limitations

- `lib/auth.ts` is partly evaluated at module-load time. The current tests
  mock the better-auth SDK; we cannot verify the real handler integrates
  end-to-end without a running Nitro server. The Playwright suite
  (`auth-api.spec.ts`) plugs that gap.
- The component tests stub Vuetify wholesale. This is deliberate but means
  a regression in *how Vuetify renders* a card (e.g. a slot getting
  silently dropped) would only surface in Playwright. If you need fine
  Vuetify behaviour, write the test in `test/e2e/`.
- Coverage % may show <100% on `components/AppHeader.vue` and
  `components/LoginItem.vue` because of branches deep inside vee-validate
  composables that the stubs bypass. The branches not covered by the
  vitest stubs are exercised by the Playwright `login.spec.ts` suite.
