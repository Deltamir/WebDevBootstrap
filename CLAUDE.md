# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (also runs nuxt prepare via postinstall)
npm install

# Authenticate with HCP (first time or after session expiry)
npm run login          # hcp auth login && hcp profile init

# Dev server — secrets injected from HCP Vault Secrets at runtime
npm run dev            # hcp vs run -- nuxt dev  →  http://localhost:3000

# Dev server without HCP (requires OAuth vars in .env)
npx nuxt dev

# After any schema change
npx prisma generate
npx prisma migrate dev --name <description>

# First-time DB init (no migration files in repo — they are gitignored)
npx prisma db push

# Prisma Studio
npm run studio         # → http://localhost:5555

# Lint
npx eslint .

# Production build / preview
npm run build
npm run preview
```

## Architecture

### Auth

`@sidebase/nuxt-auth` wraps NextAuth v4. The handler lives at `server/api/auth/[...].ts` and registers GitHub and Twitch OAuth providers via `PrismaAdapter`.

- **`globalAppMiddleware: true`** in `nuxt.config.ts` — every route requires auth by default.
- To make a page public: `definePageMeta({ auth: false })`.
- For the login page (redirect authenticated users away): `definePageMeta({ auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' } })`.
- The `AUTH_SECRET` is currently hardcoded as `"your-secret-here"` in the auth handler — it should be moved to an env variable.

### Prisma / Database

Two separate Prisma patterns are used:

1. **`lib/prisma.ts`** — dev-safe singleton (stores on `globalThis` to survive HMR). Use this for any direct import outside of Nitro server handlers.
2. **`server/middleware/prisma.ts`** — runs on every request and attaches a shared `PrismaClient` to `event.context.prisma`. All server API handlers use `event.context.prisma` — never create a new `PrismaClient` inside a handler.

Migrations are gitignored. On a fresh clone, run `npx prisma db push` (dev) or `npx prisma migrate deploy` (production).

### Server API conventions

Every protected handler follows this pattern:

```ts
const token = await getToken({ event })
if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
const prisma = event.context.prisma
```

`token.sub` is the authenticated user's Prisma `User.id`.

### Provider metadata

`server/api/auth/providers/` extends the built-in NextAuth endpoints:

- `infos.get.ts` — static map of provider → MDI icon name + RGB color (used by the UI to style OAuth buttons)
- `accounts.get.ts` — returns the list of OAuth providers linked to the current user
- `infos.post.ts` — updates the current user's `name` or `email`

### State (Pinia)

`usePreferencesStore` (`stores/preferences.ts`) persists the active theme (`light`/`dark`) to localStorage via `pinia-plugin-persistedstate`.

### Env variables

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | `.env` | Host is `db` inside DevContainer, `localhost` otherwise |
| `VERCEL_PROJECT_PRODUCTION_URL` | `.env` | No protocol prefix — used to build the auth `baseURL` |
| `AUTH_SECRET` | `.env` | Currently hardcoded in auth handler; should be externalised |
| `GHUB_CLIENT_ID` / `GHUB_CLIENT_SECRET` | HCP Vault Secrets | Injected by `hcp vs run` when using `npm run dev` |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | HCP Vault Secrets | Same as above |

### DevContainer

`.devcontainer/` runs Node 22 + HCP CLI (Dockerfile) with a sidecar PostgreSQL service named `db` (docker-compose). `postCreateCommand` runs `npm install` and `npx prisma generate` automatically.
