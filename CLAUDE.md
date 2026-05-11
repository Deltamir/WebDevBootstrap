# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Activate corepack (once per machine) then install dependencies
corepack enable
yarn install

# Authenticate with HCP (optional — first time or after session expiry)
yarn vault:login       # hcp auth login && hcp profile init

# Dev server — secrets injected from HCP Vault Secrets at runtime
yarn dev               # hcp vs run -- nuxt dev  →  http://localhost:3000

# Dev server without HCP (requires OAuth vars in .env)
yarn nuxt dev

# After any schema change
yarn prisma generate
yarn prisma migrate dev --name <description>

# First-time DB init (no migration files in repo — they are gitignored)
yarn prisma db push

# Prisma Studio
yarn studio            # → http://localhost:5555

# Lint
yarn eslint .

# Production build / preview
yarn build
yarn preview
```

## Architecture

### Auth

[Better Auth](https://better-auth.com) with the Prisma adapter, configured in `lib/auth.ts`. Catch-all handler at `server/api/auth/[...all].ts`. Vue client in `lib/auth-client.ts` (`better-auth/vue`). GitHub and Twitch are registered as social providers.

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
import { auth } from '~~/lib/auth'

const session = await auth.api.getSession({ headers: event.headers })
if (!session?.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
const prisma = event.context.prisma
```

`session.user.id` is the authenticated user's Prisma `User.id`.

### Provider metadata

`server/api/auth/providers/infos.get.ts` returns a static map of provider → MDI icon name + RGB color (used by the UI to style OAuth buttons). Account listing (`/api/user/accounts`) and user profile updates (`/api/user/infos`) are custom routes that query Prisma directly.

### State (Pinia)

`usePreferencesStore` (`stores/preferences.ts`) persists the active theme (`light`/`dark`) to localStorage via `pinia-plugin-persistedstate`.

### Env variables

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | `.env` | Host is `db` inside DevContainer, `localhost` otherwise |
| `BETTER_AUTH_SECRET` | `.env` / HCP | ≥ 32 chars — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `.env` / HCP | Public base URL of the app (e.g. `https://…vercel.app` in preview/prod, `http://localhost:3000` in dev) |
| `GHUB_CLIENT_ID` / `GHUB_CLIENT_SECRET` | HCP Vault Secrets | Injected by `hcp vs run` when using `yarn dev` |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | HCP Vault Secrets | Same as above |

### DevContainer

`.devcontainer/` runs Node 22 + HCP CLI (Dockerfile) with a sidecar PostgreSQL service named `db` (docker-compose). `postCreateCommand` runs `yarn install` and `yarn prisma generate` automatically.
