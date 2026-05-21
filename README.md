# WebDevBootstrap

Full-stack boilerplate to quickly bootstrap a modern web project. It ships a complete foundation: multi-provider OAuth authentication (GitHub + Twitch), PostgreSQL persistence via Prisma, a Vuetify UI, Pinia state management, form validation, and secure secret injection via HCP Vault Secrets.

The goal: provide a solid, opinionated starting point so you don't have to reconfigure authentication, the database, and project conventions on every new project.

---

[![PR Checks](https://github.com/deltamir/webdevbootstrap/actions/workflows/pr-checks.yml/badge.svg?branch=master)](https://github.com/deltamir/webdevbootstrap/actions/workflows/pr-checks.yml)
[![Main Maintenance](https://github.com/deltamir/webdevbootstrap/actions/workflows/main-maintenance.yml/badge.svg)](https://github.com/deltamir/webdevbootstrap/actions/workflows/main-maintenance.yml)
[![CodeQL](https://github.com/deltamir/webdevbootstrap/actions/workflows/codeql.yml/badge.svg)](https://github.com/deltamir/webdevbootstrap/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/deltamir/webdevbootstrap/branch/master/graph/badge.svg)](https://codecov.io/gh/deltamir/webdevbootstrap)
[![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org/)
[![Yarn 4.x](https://img.shields.io/badge/yarn-4.x-blue)](https://yarnpkg.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Tech stack

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| Framework    | Nuxt 4 (Vue 3)                                         |
| UI           | Vuetify 3                                              |
| State        | Pinia 3 + pinia-plugin-persistedstate                  |
| Auth         | Better Auth 1.x                                        |
| ORM          | Prisma 7                                               |
| Database     | PostgreSQL                                             |
| Validation   | VeeValidate + Yup                                      |
| Secrets      | HCP Vault Secrets                                      |
| Lint         | ESLint 10 + eslint-plugin-vue + eslint-plugin-security |
| Unit tests   | Vitest 3 + @nuxt/test-utils + happy-dom                |
| E2E tests    | Playwright 1.x                                         |
| Coverage     | Codecov (v8 coverage)                                  |
| CI/CD        | GitHub Actions                                         |
| Security     | CodeQL · Gitleaks · Dependency Review · npm audit      |
| SBOM         | CycloneDX (generated on every release)                 |
| Auto deps    | Renovate                                               |

---

## Setup options

There are two ways to launch the development environment:

- **Option A** — DevContainer (recommended): local VS Code or GitHub Codespaces. Everything is automated.
- **Option B** — Manual installation on a local machine.

---

## Option A — DevContainer (VS Code / GitHub Codespaces)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
- **OR** a GitHub account to use [GitHub Codespaces](https://github.com/features/codespaces)

### Launch via VS Code (local)

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd WebDevBootstrap
   ```

2. Open it in VS Code, then accept the **"Reopen in Container"** notification
   (or `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`)

3. The container builds automatically. On the first launch, `postCreateCommand` runs:

   ```bash
   yarn install
   yarn prisma generate
   ```

   > `corepack enable` and Yarn 4 are pre-installed in the Docker image — no need to run them again.

4. Continue at the [Environment variables configuration](#environment-variables-configuration) step.

### Launch via GitHub Codespaces

1. On GitHub, click **Code → Codespaces → Create codespace on master**
2. Wait for the container to be created (about 2-3 minutes)
3. `yarn install` and `yarn prisma generate` run automatically (`corepack enable` is already in the image)
4. Continue at the [Environment variables configuration](#environment-variables-configuration) step

> The DevContainer includes: Node.js 22, the HCP CLI, PostgreSQL (the `db` service on the internal Docker network), and all the VS Code extensions listed in `.devcontainer/devcontainer.json`.

---

## Option B — Manual installation

### Prerequisites

| Tool       | Minimum version             | Link                                         |
| ---------- | --------------------------- | -------------------------------------------- |
| Node.js    | 22.x                        | https://nodejs.org                           |
| yarn       | 4.x (via `corepack enable`) | https://yarnpkg.com                          |
| PostgreSQL | 15+                         | https://www.postgresql.org/download/         |
| HCP CLI    | latest (optional)           | https://developer.hashicorp.com/hcp/docs/cli |
| Git        | any                         | https://git-scm.com                          |

### Steps

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd WebDevBootstrap
   ```

2. **Enable corepack and install dependencies:**

   ```bash
   corepack enable
   yarn install
   ```

3. **Create and configure PostgreSQL:**

   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Inside psql, create the database
   CREATE DATABASE webdevbootstrap;
   \q
   ```

4. **Configure environment variables** (see next section)

5. **Apply the Prisma schema:**

   ```bash
   yarn prisma generate
   yarn prisma db push
   ```

6. **Start the development server:**
   ```bash
   yarn dev
   ```

---

## Environment variables configuration

### The `.env` file

Create a `.env` file at the project root (this file is gitignored, never commit it):

```dotenv
# PostgreSQL connection
# In DevContainer: the service is named "db" on the internal Docker network
# DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres"
# Locally (outside Docker):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Better Auth secret (≥ 32 chars — generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET="your-random-secret-here"

# Public app URL — only needed locally.
# On Vercel, VERCEL_URL (automatically injected) is used instead.
BETTER_AUTH_URL="http://localhost:3000"
```

> **DevContainer note**: inside the DevContainer, the PostgreSQL host is `db` (the Docker Compose service name), not `127.0.0.1`.

### OAuth variables — plain text in `.env` (default)

Add them directly to `.env`:

```dotenv
GHUB_CLIENT_ID="your_github_client_id"
GHUB_CLIENT_SECRET="your_github_client_secret"
TWITCH_CLIENT_ID="your_twitch_client_id"
TWITCH_CLIENT_SECRET="your_twitch_client_secret"
```

Then run:

```bash
yarn dev
```

### OAuth variables — via HCP Vault Secrets (optional)

To avoid ever writing OAuth secrets into `.env`, you can use `yarn dev:hcp`, which runs through `hcp vs run -- nuxt dev` to inject the secrets on startup.

The following variables must exist in your HCP Vault Secrets application:

| HCP variable           | Description                              |
| ---------------------- | ---------------------------------------- |
| `GHUB_CLIENT_ID`       | Client ID of your GitHub OAuth App       |
| `GHUB_CLIENT_SECRET`   | Client Secret of your GitHub OAuth App   |
| `TWITCH_CLIENT_ID`     | Client ID of your Twitch App             |
| `TWITCH_CLIENT_SECRET` | Client Secret of your Twitch App         |

---

## HCP Vault Secrets configuration (optional)

HCP Vault Secrets lets you inject OAuth secrets at dev-server startup without writing them into `.env`. This section is **optional**: if you'd rather put the secrets directly in `.env`, skip to the next section.

### 1. Create an HCP account

Go to https://portal.cloud.hashicorp.com and create a free account.

### 2. Create an HCP organization and project

In the HCP console:

- Create an **organization**
- Create a **project** inside that organization

### 3. Create a Vault Secrets application

In the HCP project:

1. Go to **Vault Secrets**
2. Create a new **application** (e.g. `webdevbootstrap`)
3. Add the secrets: `GHUB_CLIENT_ID`, `GHUB_CLIENT_SECRET`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`

### 4. Authenticate via the CLI

```bash
# Sign in and initialize the profile (one-time, or after session expiry)
yarn vault:login
# equivalent to: hcp auth login && hcp profile init

# Select the organization, project, and Vault Secrets application when prompted
```

### 5. Start dev with secret injection

```bash
yarn dev:hcp
# equivalent to: hcp vs run -- nuxt dev
```

HCP automatically injects the secrets as environment variables when the process starts.

---

## Creating the OAuth Apps

### GitHub OAuth App

1. Go to https://github.com/settings/developers
2. **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name**: WebDevBootstrap (dev)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client Secret**
5. Store them in HCP Vault Secrets (or `.env`) as `GHUB_CLIENT_ID` and `GHUB_CLIENT_SECRET`

### Twitch App

1. Go to https://dev.twitch.tv/console
2. **Applications → Register Your Application**
3. Fill in:
   - **Name**: WebDevBootstrap (dev)
   - **OAuth Redirect URLs**: `http://localhost:3000/api/auth/callback/twitch`
   - **Category**: Website Integration
4. Copy the **Client ID** and generate a **Client Secret**
5. Store them in HCP Vault Secrets (or `.env`) as `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`

---

## Database and Prisma

### Apply the schema (first-time setup)

Migrations are gitignored. To initialize the database:

```bash
# Generate the Prisma client (always run after yarn install)
yarn prisma generate

# Push the schema directly to the DB (dev only, no migration file created)
yarn prisma db push

# OR: create a migration and apply it (recommended if you manage migrations)
yarn prisma migrate dev --name init
```

### Prisma Studio (visual interface)

```bash
yarn studio
# equivalent to: prisma studio
# Available at http://localhost:5555
```

### Modify the schema

1. Edit [prisma/schema.prisma](prisma/schema.prisma)
2. Apply the changes:
   ```bash
   yarn prisma migrate dev --name description_of_the_change
   ```

---

## Development commands

```bash
# Install dependencies (also configures Husky automatically)
yarn install

# Authenticate to HCP (optional — first time or after expiry)
yarn vault:login

# Start the dev server (OAuth variables in .env)
yarn dev
# → http://localhost:3000

# Start with HCP Vault Secrets injection (optional)
yarn dev:hcp

# Prisma Studio UI
yarn studio
# → http://localhost:5555

# Production build
yarn build

# Preview the production build
yarn preview

# Generate a static site
yarn generate
```

## Tests and quality

```bash
# Unit tests (Vitest)
yarn test              # run once
yarn test:watch        # watch mode
yarn test:ui           # Vitest UI in the browser
yarn test:coverage     # with coverage report

# E2E tests (Playwright)
yarn test:e2e          # run once (requires yarn build beforehand)
yarn test:e2e:ui       # interactive Playwright UI

# TypeScript check
yarn typecheck

# Lint (ESLint + plugin-security)
yarn lint
yarn lint:fix          # auto-fix

# Dependency audit
yarn audit

# Generate the CycloneDX SBOM
yarn sbom              # → sbom.cdx.json

# Scan secrets locally
yarn secrets:scan
```

## CI/CD

| Workflow              | Trigger                                  | Jobs                                                                                       |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pr-checks.yml`       | PR + push `master`                       | Lint · TypeCheck · Unit tests + coverage · E2E Playwright · Dependency Review · Gitleaks |
| `main-maintenance.yml`| Push `master` + Monday schedule (0:00)   | Gitleaks · Yarn audit (opens an issue if vulnerabilities detected + Dependabot links)    |
| `codeql.yml`          | PR + push `master` + Sunday schedule     | SAST analysis for JavaScript/TypeScript                                                  |
| `prod-ops.yml`        | Push `master` + release                  | Smoke tests · CycloneDX SBOM generation + attestation                                    |
| `claude.yml`          | `@claude` in a PR comment                | On-demand review by Claude AI (OAuth token auth only)                                    |

**Artifacts available in the GitHub Actions UI:**

- `playwright-report/` — interactive HTML E2E test report (30 days)
- `coverage-html/` — code coverage report (14 days)
- `sbom-cyclonedx/` — CycloneDX SBOM, also attached to GitHub Releases (90 days)

---

## Project structure

```
WebDevBootstrap/
├── .devcontainer/          # DevContainer config (Docker Compose + Dockerfile)
├── components/             # Reusable Vue components
├── lib/
│   ├── auth.ts             # Better Auth instance (socialProviders, Prisma adapter)
│   ├── auth-client.ts      # Vue Better Auth client (authClient, useSession)
│   └── prisma.ts           # Prisma singleton instance
├── pages/                  # Nuxt pages (automatic routing)
│   ├── index.vue
│   ├── login.vue
│   ├── protected.vue       # Protected route (auth required)
│   ├── public.vue
│   └── settings.vue
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                 # Static assets
├── server/
│   ├── api/
│   │   ├── auth/           # Better Auth catch-all ([...all].ts) + provider infos
│   │   └── user/           # Protected routes (infos, accounts, deletion)
│   └── middleware/
│       └── prisma.ts       # Injects Prisma into the server context
├── stores/                 # Pinia stores
├── types/                  # Global TypeScript types
├── nuxt.config.ts          # Nuxt configuration
├── vercel.json             # Vercel deployment configuration
├── .env                    # Environment variables (not committed)
└── package.json
```

---

## Troubleshooting common issues

### `Error: DATABASE_URL is not set`

Check that the `.env` file exists at the root and contains `DATABASE_URL`.
In the DevContainer, the host must be `db` (not `localhost`):

```dotenv
DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres"
```

### `hcp: command not found`

The HCP CLI is only needed if you use `yarn dev:hcp` to inject OAuth secrets via HCP Vault Secrets. For standard dev with secrets in `.env`, `yarn dev` is sufficient and does not require HCP.

To install the HCP CLI:

```bash
# macOS
brew install hashicorp/tap/hcp

# Linux (Debian/Ubuntu)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install hcp

# Windows
winget install Hashicorp.HCP
```

### `PrismaClientInitializationError: Can't reach database server`

- Check that PostgreSQL is actually running
- In DevContainer: make sure the `db` service is running (`docker compose ps`)
- Verify the credentials in `DATABASE_URL`

### `BETTER_AUTH_SECRET` missing / session error

Add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` to `.env`:

```bash
# Generate a strong secret
openssl rand -base64 32
```

```dotenv
BETTER_AUTH_SECRET="the-secret-generated-above"
BETTER_AUTH_URL="http://localhost:3000"
```

### Port 3000 already in use

```bash
# Start on a different port
PORT=3001 yarn dev
```

### `prisma generate` error after `yarn install`

`postinstall` runs `nuxt prepare` but not `prisma generate`. Run it manually:

```bash
yarn prisma generate
```

---

## Environment variables — full summary

| Variable               | Required          | Description                                                          | Example                                                  |
| ---------------------- | ----------------- | -------------------------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`         | Yes               | PostgreSQL connection URL                                            | `postgresql://postgres:postgres@localhost:5432/postgres` |
| `BETTER_AUTH_SECRET`   | Yes               | Session encryption secret (≥ 32 chars)                               | `openssl rand -base64 32`                                |
| `BETTER_AUTH_URL`      | Local only        | Public URL — computed automatically on Vercel via `VERCEL_URL`       | `http://localhost:3000`                                  |
| `GHUB_CLIENT_ID`       | Yes (GitHub auth) | GitHub OAuth App Client ID                                           | `Ov23li...`                                              |
| `GHUB_CLIENT_SECRET`   | Yes (GitHub auth) | GitHub OAuth App Client Secret                                       | `abc123...`                                              |
| `TWITCH_CLIENT_ID`     | Yes (Twitch auth) | Twitch App Client ID                                                 | `xyz789...`                                              |
| `TWITCH_CLIENT_SECRET` | Yes (Twitch auth) | Twitch App Client Secret                                             | `def456...`                                              |

> `GHUB_*` and `TWITCH_*` can be injected by HCP Vault Secrets via `yarn dev:hcp`. Without HCP, put them directly in `.env` and use `yarn dev`.

---

## Authentication flow

Authentication is handled by [Better Auth](https://better-auth.com) with the **Prisma adapter** (sessions stored in the database, no stateless JWT).

```
User → /login → picks a provider (GitHub or Twitch)
  → OAuth redirect to the provider
  → Callback to /api/auth/callback/[provider]
  → Better Auth creates/updates the user in the database via Prisma
  → Session created (httpOnly cookie), redirect back to the original page
```

- **Global middleware**: `middleware/auth.global.ts` — every route is protected by default.
- **Public routes**: must be marked explicitly with `definePageMeta({ auth: false })`.
- **Login page** (redirects already-signed-in users): `definePageMeta({ auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' } })`.
- **Client-side session access**: `authClient.useSession(useFetch)` (from `lib/auth-client.ts`).
- **Server-side session access**: `auth.api.getSession({ headers: event.headers })` (from `lib/auth.ts`).
- **Account linking**: `authClient.signIn.social({ provider, callbackURL })` on an already-signed-in user.
- **Account deletion**: `DELETE /api/user` → `authClient.signOut()` on the client.

---

## API routes

| Method   | Route                       | Auth required | Description                                                  |
| -------- | --------------------------- | ------------- | ------------------------------------------------------------ |
| `ALL`    | `/api/auth/[...all]`        | —             | Better Auth catch-all (signIn, signOut, callback, session…)  |
| `GET`    | `/api/auth/providers/infos` | —             | UI metadata for the OAuth providers (icon, color, name)      |
| `GET`    | `/api/user/infos`           | Yes           | Profile of the signed-in user (name, email, avatar)          |
| `POST`   | `/api/user/infos`           | Yes           | Update the name and/or email                                 |
| `GET`    | `/api/user/accounts`        | Yes           | List the OAuth providers linked to the account               |
| `DELETE` | `/api/user/accounts/[id]`   | Yes           | Unlink an OAuth provider                                     |
| `DELETE` | `/api/user`                 | Yes           | Delete the authenticated user's account                      |

---

## Development conventions

### Branches (GitHub Flow)

`master` is the only stable branch, always deployable. All development goes through a short-lived branch and a PR.

| Type          | Naming                       | Example                       |
| ------------- | ---------------------------- | ----------------------------- |
| Feature       | `feat/<scope>/<description>` | `feat/auth/add-google-oauth`  |
| Bug fix       | `fix/<scope>/<description>`  | `fix/api/handle-prisma-error` |
| Documentation | `docs/<description>`         | `docs/update-contributing`    |
| CI/CD         | `ci/<description>`           | `ci/add-playwright`           |
| Chore         | `chore/<description>`        | `chore/update-deps`           |

Commits must follow the [Conventional Commits convention](https://www.conventionalcommits.org/) — the `commit-msg` hook (Husky + commitlint) checks it automatically.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution workflow.

### Vue components

- One component = one file in `components/`
- PascalCase naming: `AppHeader.vue`, `LoginItem.vue`
- Nuxt auto-imports every component in `components/` — no explicit import needed

### Pages and routing

- Nuxt generates routing automatically from `pages/`
- Protected pages have no `definePageMeta` (the global middleware is active)
- To make a page public:
  ```typescript
  definePageMeta({ auth: false });
  ```

### State management (Pinia)

- Stores live in `stores/`
- `usePreferencesStore`: light/dark theme, persisted to localStorage
- Use `defineStore` with the Options API, not the Composition API (consistency with the existing code)

### Prisma

- Prisma singleton in `lib/prisma.ts` for the server-side client
- The `server/middleware/prisma.ts` middleware injects Prisma into `event.context.prisma` — use it in handlers rather than creating a new instance
- After any schema change: `yarn prisma migrate dev` then `yarn prisma generate`

### TypeScript

- Global types in `types/index.d.ts`
- Strict mode enabled via Nuxt's `tsconfig.json`
- Global types — `ProviderInfo` declared in `types/index.d.ts` as a global interface

### Linting

```bash
yarn eslint .
```

Config in `eslint.config.mjs`. Vue + TypeScript rules active.

---

## Deployment (Vercel)

### Setup

1. Connect the GitHub repository to Vercel
2. Configure the environment variables in the Vercel dashboard:

   | Variable               | Value                                                       |
   | ---------------------- | ----------------------------------------------------------- |
   | `DATABASE_URL`         | Production PostgreSQL URL (e.g. Neon, Supabase, Railway)    |
   | `BETTER_AUTH_SECRET`   | Random secret ≥ 32 chars                                    |
   | `BETTER_AUTH_URL`      | Optional — Vercel injects `VERCEL_URL` automatically        |
   | `GHUB_CLIENT_ID`       | Production GitHub OAuth App Client ID                       |
   | `GHUB_CLIENT_SECRET`   | Production GitHub OAuth App Client Secret                   |
   | `TWITCH_CLIENT_ID`     | Production Twitch App Client ID                             |
   | `TWITCH_CLIENT_SECRET` | Production Twitch App Client Secret                         |

3. Create separate OAuth Apps for production with callbacks pointing at the Vercel domain:
   - GitHub: `https://my-app.vercel.app/api/auth/callback/github`
   - Twitch: `https://my-app.vercel.app/api/auth/callback/twitch`

4. Apply the Prisma migrations to the production database:
   ```bash
   DATABASE_URL="<prod-db-url>" yarn prisma migrate deploy
   ```

### Local build

```bash
yarn build
yarn preview
```

> The `vercel.json` file at the root configures Vercel to use yarn (`yarn install --immutable` + `yarn build`). Vercel enables corepack automatically thanks to the `packageManager` field in `package.json`.

---

## Work in progress (TODO)

- Fix the SSR bug on page reload
- Magic Link auth provider
- Settings page: avatar picker
- Handling of the `AccountNotLinked` error
- "Why link an account" tooltip
- Skeleton loaders (navigation transitions and navbar avatar)
