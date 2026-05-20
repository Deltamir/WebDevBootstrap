# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Activate corepack (once per machine) then install dependencies
# Note: also installs Husky git hooks automatically via the "prepare" script
corepack enable
yarn install

# Authenticate with HCP (optional — first time or after session expiry)
yarn vault:login       # hcp auth login && hcp profile init

# Dev server (OAuth vars in .env)
yarn dev               # nuxt dev  →  http://localhost:3000

# Dev server with HCP Vault Secrets injection (optional)
yarn dev:hcp           # hcp vs run -- nuxt dev

# After any schema change
yarn prisma generate
yarn prisma migrate dev --name <description>

# First-time DB init (no migration files in repo — they are gitignored)
yarn prisma db push

# Prisma Studio
yarn studio            # → http://localhost:5555

# Lint (ESLint + eslint-plugin-security)
yarn lint
yarn lint:fix

# TypeScript check
yarn typecheck

# Unit tests (Vitest)
yarn test              # run once
yarn test:watch        # watch mode
yarn test:coverage     # with v8 coverage → coverage/

# E2E tests (Playwright) — requires yarn build first
yarn test:e2e
yarn test:e2e:ui       # interactive Playwright UI

# Security
yarn audit             # npm audit
yarn secrets:scan      # gitleaks full scan (not just staged)

# SBOM generation → sbom.cdx.json
yarn sbom

# Production build / preview
yarn build
yarn preview
```

## Architecture

### Auth

[Better Auth](https://better-auth.com) with the Prisma adapter, configured in `lib/auth.ts`. Catch-all handler at `server/api/auth/[...all].ts`. Vue client in `lib/auth-client.ts` (`better-auth/vue`). GitHub and Twitch are registered as social providers. The `magicLink` plugin adds passwordless email sign-in/sign-up — the link is delivered through `server/utils/email.ts` (Resend).

- **`middleware/auth.global.ts`** runs on every route and mirrors the previous sidebase behaviour — protected by default, opt out per page.
- To make a page public: `definePageMeta({ auth: false })`.
- For the login page (redirect authenticated users away): `definePageMeta({ auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' } })`.
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` must be set as env vars (HCP Vault Secrets or `.env`). The secret must be ≥ 32 chars — generate one with `openssl rand -base64 32`.

### Prisma / Database

Two separate Prisma patterns are used:

1. **`lib/prisma.ts`** — dev-safe singleton (stores on `globalThis` to survive HMR). Use this for any direct import outside of Nitro server handlers.
2. **`server/middleware/prisma.ts`** — runs on every request and attaches a shared `PrismaClient` to `event.context.prisma`. All server API handlers use `event.context.prisma` — never create a new `PrismaClient` inside a handler.

Migrations are gitignored. On a fresh clone, run `yarn prisma db push` (dev) or `yarn prisma migrate deploy` (production).

### Server API conventions

Every protected handler follows this pattern:

```ts
import { auth } from "~~/lib/auth";

const session = await auth.api.getSession({ headers: event.headers });
if (!session?.user)
  throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
const prisma = event.context.prisma;
```

`session.user.id` is the authenticated user's Prisma `User.id`.

### State (Pinia)

`usePreferencesStore` (`stores/preferences.ts`) persists the active theme (`light`/`dark`) to localStorage via `pinia-plugin-persistedstate`.

### Env variables

| Variable                                    | Source        | Notes                                                                                                     |
| ------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | `.env`        | Host is `db` inside DevContainer, `localhost` otherwise                                                   |
| `BETTER_AUTH_SECRET`                        | `.env` / HCP  | ≥ 32 chars — generate with `openssl rand -base64 32`                                                      |
| `BETTER_AUTH_URL`                           | `.env`        | Public base URL — only needed locally. On Vercel, `VERCEL_URL` is used automatically (see `lib/auth.ts`). |
| `GHUB_CLIENT_ID` / `GHUB_CLIENT_SECRET`     | `.env` or HCP | Use `yarn dev:hcp` to inject from HCP Vault Secrets                                                       |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | `.env` or HCP | Same as above                                                                                             |
| `RESEND_API_KEY`                            | `.env` or HCP | Resend API key — sends the magic-link sign-in email                                                       |
| `EMAIL_FROM`                                | `.env` or HCP | Magic-link sender address — must be a verified Resend sender/domain                                       |

### DevContainer

`.devcontainer/` runs Node 22 + HCP CLI (Dockerfile) with a sidecar PostgreSQL service named `db` (docker-compose). `corepack enable` and Yarn 4 are pre-installed in the image (`ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0` + `RUN corepack prepare yarn@4.14.1 --activate`). `postCreateCommand` runs `yarn install` and `yarn prisma generate` automatically.

### Provider metadata

`server/api/auth/providers/infos.get.ts` returns a static map of provider → display name + MDI icon + RGB color. This is the single source of truth for the OAuth button UI — both `app.vue` (which `provide`s the list) and the components that `inject` it use only this endpoint. When adding a new provider, update both `lib/auth.ts` (socialProviders) and this file.

## Testing

### Unit tests (Vitest)

Tests live in `test/unit/`. Configuration: `vitest.config.ts` with `@nuxt/test-utils` preset and `happy-dom` environment.

```ts
// Pattern: activate a fresh Pinia before each test
import { setActivePinia, createPinia } from "pinia";
beforeEach(() => {
  setActivePinia(createPinia());
});
```

Coverage is generated with `@vitest/coverage-v8` and uploaded to Codecov in CI. Local HTML report: `coverage/index.html`.

### E2E tests (Playwright)

Tests live in `test/e2e/`. Configuration: `playwright.config.ts`.

In CI, Playwright uses a PostgreSQL service container with no production secrets — any PR from a fork can run the full suite. Locally, a running `yarn build && yarn preview` is required (the `webServer` config starts it automatically).

```ts
// Pattern
import { test, expect } from "@playwright/test";
test("page is accessible", async ({ page }) => {
  await page.goto("/public");
  await expect(page.locator("body")).toBeVisible();
});
```

E2E reports (HTML) are uploaded as GitHub Actions artifacts and available in the Actions UI for 30 days.

## Git hooks (Husky)

Hooks are installed automatically by `yarn install` via the `prepare` script.

| Hook         | What it does                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| `pre-commit` | `lint-staged` (ESLint on staged files) + `gitleaks protect --staged` (secret scan) |
| `commit-msg` | `commitlint` — enforces Conventional Commits format                                |
| `pre-push`   | `yarn typecheck` + `yarn test` — fast sanity check before remote push              |

To skip a hook exceptionally: `git commit --no-verify` (use sparingly — CI will still catch issues).

Commit format: `<type>(<scope>): <description>` — e.g. `feat(auth): add Google OAuth provider`.
Valid types: `feat` `fix` `docs` `style` `refactor` `test` `chore` `ci` `perf` `revert`.

## CI/CD Workflows

| Workflow       | Triggers                    | Jobs                                                   |
| -------------- | --------------------------- | ------------------------------------------------------ |
| `ci.yml`       | PR + push master            | lint · typecheck · unit tests + coverage · build       |
| `e2e.yml`      | PR only                     | Playwright with ephemeral PostgreSQL (no prod secrets) |
| `security.yml` | PR + push master + weekly   | Gitleaks · Dependency Review · npm audit               |
| `codeql.yml`   | PR + push master + weekly   | SAST JavaScript/TypeScript analysis                    |
| `sbom.yml`     | push master + release       | CycloneDX SBOM generation + attestation                |
| `claude.yml`   | PR (auto) + @claude comment | Claude AI code review                                  |

All workflows use `concurrency` groups to cancel stale runs on the same ref.

## Security

- **`.gitleaks.toml`** — extends the default Gitleaks ruleset with a custom rule for `BETTER_AUTH_SECRET` and allowlists for known-safe placeholder values in docs/CI.
- **`eslint-plugin-security`** — integrated in `eslint.config.mjs`. Catches `eval`, `new Function`, non-literal `fs` paths, and similar patterns.
- To add a new secret pattern to Gitleaks: add a `[[rules]]` block in `.gitleaks.toml`.
- To add a CI secret: add it in **GitHub Settings → Secrets and variables → Actions**, then reference it as `${{ secrets.SECRET_NAME }}` in the workflow.
