# WebDevBootstrap

Boilerplate full-stack pour démarrer rapidement un projet web moderne. Il fournit un socle complet : authentification OAuth multi-provider (GitHub + Twitch), persistance PostgreSQL via Prisma, interface Vuetify, gestion d'état Pinia, validation de formulaires, et injection sécurisée des secrets via HCP Vault Secrets.

Objectif : offrir un point de départ solide et opiné pour ne pas reconfigurer l'authentification, la base de données et les conventions de projet à chaque nouveau projet.

---

[![PR Checks](https://github.com/deltamir/webdevbootstrap/actions/workflows/pr-checks.yml/badge.svg?branch=master)](https://github.com/deltamir/webdevbootstrap/actions/workflows/pr-checks.yml)
[![Main Maintenance](https://github.com/deltamir/webdevbootstrap/actions/workflows/main-maintenance.yml/badge.svg)](https://github.com/deltamir/webdevbootstrap/actions/workflows/main-maintenance.yml)
[![CodeQL](https://github.com/deltamir/webdevbootstrap/actions/workflows/codeql.yml/badge.svg)](https://github.com/deltamir/webdevbootstrap/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/deltamir/webdevbootstrap/branch/master/graph/badge.svg)](https://codecov.io/gh/deltamir/webdevbootstrap)
[![Node.js 22+](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org/)
[![Yarn 4.x](https://img.shields.io/badge/yarn-4.x-blue)](https://yarnpkg.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Stack technique

| Couche          | Technologie                                            |
| --------------- | ------------------------------------------------------ |
| Framework       | Nuxt 4 (Vue 3)                                         |
| UI              | Vuetify 3                                              |
| State           | Pinia 3 + pinia-plugin-persistedstate                  |
| Auth            | Better Auth 1.x                                        |
| ORM             | Prisma 7                                               |
| Base de données | PostgreSQL                                             |
| Validation      | VeeValidate + Yup                                      |
| Secrets         | HCP Vault Secrets                                      |
| Lint            | ESLint 10 + eslint-plugin-vue + eslint-plugin-security |
| Tests unitaires | Vitest 3 + @nuxt/test-utils + happy-dom                |
| Tests E2E       | Playwright 1.x                                         |
| Couverture      | Codecov (v8 coverage)                                  |
| CI/CD           | GitHub Actions                                         |
| Sécurité        | CodeQL · Gitleaks · Dependency Review · npm audit      |
| SBOM            | CycloneDX (généré à chaque release)                    |
| Deps auto       | Renovate                                               |

---

## Options de setup

Il y a deux façons de lancer l'environnement de développement :

- **Option A** — DevContainer (recommandé) : VS Code local ou GitHub Codespaces. Tout est automatisé.
- **Option B** — Installation manuelle sur machine locale.

---

## Option A — DevContainer (VS Code / GitHub Codespaces)

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- [VS Code](https://code.visualstudio.com/) avec l'extension [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- **OU** un compte GitHub pour utiliser [GitHub Codespaces](https://github.com/features/codespaces)

### Lancer via VS Code (local)

1. Cloner le dépôt :

   ```bash
   git clone <url-du-repo>
   cd WebDevBootstrap
   ```

2. Ouvrir dans VS Code, puis accepter la notification **"Reopen in Container"**
   (ou `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`)

3. Le container se build automatiquement. Au premier lancement, `postCreateCommand` exécute :

   ```bash
   yarn install
   yarn prisma generate
   ```

   > `corepack enable` et Yarn 4 sont pré-installés dans l'image Docker — pas besoin de les relancer.

4. Continuer à l'étape [Configuration des variables d'environnement](#configuration-des-variables-denvironnement).

### Lancer via GitHub Codespaces

1. Sur GitHub, cliquer **Code → Codespaces → Create codespace on master**
2. Attendre la création du container (environ 2-3 minutes)
3. `yarn install` et `yarn prisma generate` s'exécutent automatiquement (`corepack enable` est déjà dans l'image)
4. Continuer à l'étape [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)

> Le DevContainer inclut : Node.js 22, HCP CLI, PostgreSQL (service `db` sur le réseau Docker interne), et toutes les extensions VS Code listées dans `.devcontainer/devcontainer.json`.

---

## Option B — Installation manuelle

### Prérequis

| Outil      | Version minimale            | Lien                                         |
| ---------- | --------------------------- | -------------------------------------------- |
| Node.js    | 22.x                        | https://nodejs.org                           |
| yarn       | 4.x (via `corepack enable`) | https://yarnpkg.com                          |
| PostgreSQL | 15+                         | https://www.postgresql.org/download/         |
| HCP CLI    | latest (optionnel)          | https://developer.hashicorp.com/hcp/docs/cli |
| Git        | any                         | https://git-scm.com                          |

### Étapes

1. **Cloner le dépôt :**

   ```bash
   git clone <url-du-repo>
   cd WebDevBootstrap
   ```

2. **Activer corepack et installer les dépendances :**

   ```bash
   corepack enable
   yarn install
   ```

3. **Créer et configurer PostgreSQL :**

   ```bash
   # Se connecter à PostgreSQL
   psql -U postgres

   # Dans psql, créer la base
   CREATE DATABASE webdevbootstrap;
   \q
   ```

4. **Configurer les variables d'environnement** (voir section suivante)

5. **Appliquer le schéma Prisma :**

   ```bash
   yarn prisma generate
   yarn prisma db push
   ```

6. **Lancer le serveur de développement :**
   ```bash
   yarn dev
   ```

---

## Configuration des variables d'environnement

### Fichier `.env`

Créer un fichier `.env` à la racine du projet (ce fichier est gitignorée, ne jamais le commit) :

```dotenv
# Connexion PostgreSQL
# En DevContainer : le service s'appelle "db" sur le réseau Docker interne
# DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres"
# En local (hors Docker) :
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Secret Better Auth (≥ 32 chars — générer avec : openssl rand -base64 32)
BETTER_AUTH_SECRET="votre-secret-aleatoire-ici"

# URL publique de l'application — nécessaire uniquement en local.
# Sur Vercel, VERCEL_URL (injectée automatiquement) est utilisée à la place.
BETTER_AUTH_URL="http://localhost:3000"
```

> **Note DevContainer** : dans le DevContainer, l'hôte PostgreSQL est `db` (nom du service Docker Compose), pas `127.0.0.1`.

### Variables OAuth — en clair dans `.env` (par défaut)

Ajouter directement dans `.env` :

```dotenv
GHUB_CLIENT_ID="votre_github_client_id"
GHUB_CLIENT_SECRET="votre_github_client_secret"
TWITCH_CLIENT_ID="votre_twitch_client_id"
TWITCH_CLIENT_SECRET="votre_twitch_client_secret"
```

Puis lancer :

```bash
yarn dev
```

### Variables OAuth — via HCP Vault Secrets (optionnel)

Pour ne jamais écrire les secrets OAuth dans `.env`, vous pouvez utiliser `yarn dev:hcp` qui passe par `hcp vs run -- nuxt dev` pour injecter les secrets au démarrage.

Les variables suivantes doivent exister dans votre application HCP Vault Secrets :

| Variable HCP           | Description                             |
| ---------------------- | --------------------------------------- |
| `GHUB_CLIENT_ID`       | Client ID de votre GitHub OAuth App     |
| `GHUB_CLIENT_SECRET`   | Client Secret de votre GitHub OAuth App |
| `TWITCH_CLIENT_ID`     | Client ID de votre Twitch App           |
| `TWITCH_CLIENT_SECRET` | Client Secret de votre Twitch App       |

---

## Configuration HCP Vault Secrets (optionnel)

HCP Vault Secrets permet d'injecter les secrets OAuth au démarrage du dev sans les écrire dans `.env`. Cette section est **optionnelle** : si vous préférez mettre les secrets directement dans `.env`, passez à la section suivante.

### 1. Créer un compte HCP

Se rendre sur https://portal.cloud.hashicorp.com et créer un compte gratuit.

### 2. Créer une organisation et un projet HCP

Dans la console HCP :

- Créer une **organisation**
- Créer un **projet** dans cette organisation

### 3. Créer une application Vault Secrets

Dans le projet HCP :

1. Aller dans **Vault Secrets**
2. Créer une nouvelle **application** (ex: `webdevbootstrap`)
3. Ajouter les secrets : `GHUB_CLIENT_ID`, `GHUB_CLIENT_SECRET`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`

### 4. S'authentifier via le CLI

```bash
# Se connecter et initialiser le profil (à faire une fois, ou après expiration de session)
yarn vault:login
# équivalent à : hcp auth login && hcp profile init

# Sélectionner l'organisation, le projet et l'application Vault Secrets quand demandé
```

### 5. Lancer le dev avec injection des secrets

```bash
yarn dev:hcp
# équivalent à : hcp vs run -- nuxt dev
```

HCP injecte automatiquement les secrets en variables d'environnement au démarrage du processus.

---

## Création des OAuth Apps

### GitHub OAuth App

1. Aller sur https://github.com/settings/developers
2. **OAuth Apps → New OAuth App**
3. Remplir :
   - **Application name** : WebDevBootstrap (dev)
   - **Homepage URL** : `http://localhost:3000`
   - **Authorization callback URL** : `http://localhost:3000/api/auth/callback/github`
4. Copier le **Client ID** et générer un **Client Secret**
5. Stocker dans HCP Vault Secrets (ou `.env`) sous `GHUB_CLIENT_ID` et `GHUB_CLIENT_SECRET`

### Twitch App

1. Aller sur https://dev.twitch.tv/console
2. **Applications → Register Your Application**
3. Remplir :
   - **Name** : WebDevBootstrap (dev)
   - **OAuth Redirect URLs** : `http://localhost:3000/api/auth/callback/twitch`
   - **Category** : Website Integration
4. Copier le **Client ID** et générer un **Client Secret**
5. Stocker dans HCP Vault Secrets (ou `.env`) sous `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET`

---

## Base de données et Prisma

### Appliquer le schéma (premier setup)

Les migrations sont gitignorées. Pour initialiser la base de données :

```bash
# Génère le client Prisma (toujours faire après yarn install)
yarn prisma generate

# Pousse le schéma directement sur la DB (dev uniquement, sans créer de fichier de migration)
yarn prisma db push

# OU : crée une migration et l'applique (recommandé si vous gérez des migrations)
yarn prisma migrate dev --name init
```

### Prisma Studio (interface visuelle)

```bash
yarn studio
# équivalent à : prisma studio
# Accessible sur http://localhost:5555
```

### Modifier le schéma

1. Éditer [prisma/schema.prisma](prisma/schema.prisma)
2. Appliquer les changements :
   ```bash
   yarn prisma migrate dev --name description_du_changement
   ```

---

## Commandes de développement

```bash
# Installer les dépendances (configure aussi Husky automatiquement)
yarn install

# S'authentifier à HCP (optionnel — première fois ou après expiration)
yarn vault:login

# Lancer le serveur de dev (variables OAuth en .env)
yarn dev
# → http://localhost:3000

# Lancer avec injection HCP Vault Secrets (optionnel)
yarn dev:hcp

# Interface Prisma Studio
yarn studio
# → http://localhost:5555

# Build de production
yarn build

# Prévisualiser le build de production
yarn preview

# Générer un site statique
yarn generate
```

## Tests et qualité

```bash
# Tests unitaires (Vitest)
yarn test              # run once
yarn test:watch        # watch mode
yarn test:ui           # UI Vitest dans le navigateur
yarn test:coverage     # avec rapport de couverture

# Tests E2E (Playwright)
yarn test:e2e          # run once (nécessite yarn build au préalable)
yarn test:e2e:ui       # UI Playwright interactive

# Vérification TypeScript
yarn typecheck

# Lint (ESLint + plugin-security)
yarn lint
yarn lint:fix          # auto-fix

# Audit des dépendances
yarn audit

# Générer le SBOM CycloneDX
yarn sbom              # → sbom.cdx.json

# Scanner les secrets localement
yarn secrets:scan
```

## CI/CD

| Workflow            | Déclencheur                            | Jobs                                                                                       |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `pr-checks.yml`     | PR + push `master`                     | Lint · TypeCheck · Unit tests + coverage · E2E Playwright · Dependency Review · Gitleaks  |
| `main-maintenance.yml` | Push `master` + schedule lundi (0h) | Gitleaks · Yarn audit (crée issue si vulnérabilités détectées + liens Dependabot)       |
| `codeql.yml`        | PR + push `master` + schedule dimanche | Analyse SAST JavaScript/TypeScript                                                       |
| `prod-ops.yml`      | Push `master` + release                | Smoke tests · Génération + attestation SBOM CycloneDX                                    |
| `claude.yml`        | `@claude` en commentaire PR            | Review on-demand par Claude AI (OAuth token auth uniquement)                             |

**Artifacts disponibles dans l'UI GitHub Actions :**

- `playwright-report/` — rapport HTML interactif des tests E2E (30 jours)
- `coverage-html/` — rapport de couverture de code (14 jours)
- `sbom-cyclonedx/` — SBOM CycloneDX, attaché aussi aux GitHub Releases (90 jours)

---

## Structure du projet

```
WebDevBootstrap/
├── .devcontainer/          # Config DevContainer (Docker Compose + Dockerfile)
├── components/             # Composants Vue réutilisables
├── lib/
│   ├── auth.ts             # Instance Better Auth (socialProviders, Prisma adapter)
│   ├── auth-client.ts      # Client Vue Better Auth (authClient, useSession)
│   └── prisma.ts           # Instance singleton Prisma
├── pages/                  # Pages Nuxt (routing automatique)
│   ├── index.vue
│   ├── login.vue
│   ├── protected.vue       # Route protégée (auth requise)
│   ├── public.vue
│   └── settings.vue
├── prisma/
│   └── schema.prisma       # Schéma de la base de données
├── public/                 # Assets statiques
├── server/
│   ├── api/
│   │   ├── auth/           # Catch-all Better Auth ([...all].ts) + infos providers
│   │   └── user/           # Routes protégées (infos, accounts, suppression)
│   └── middleware/
│       └── prisma.ts       # Injection Prisma dans le contexte serveur
├── stores/                 # Stores Pinia
├── types/                  # Types TypeScript globaux
├── nuxt.config.ts          # Configuration Nuxt
├── vercel.json             # Configuration de déploiement Vercel
├── .env                    # Variables d'environnement (non commité)
└── package.json
```

---

## Résolution des problèmes courants

### `Error: DATABASE_URL is not set`

Vérifier que le fichier `.env` existe à la racine et contient `DATABASE_URL`.
En DevContainer, l'hôte doit être `db` (pas `localhost`) :

```dotenv
DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres"
```

### `hcp: command not found`

Le HCP CLI n'est nécessaire que si vous utilisez `yarn dev:hcp` pour injecter les secrets OAuth via HCP Vault Secrets. Pour un dev standard avec les secrets dans `.env`, `yarn dev` suffit et ne requiert pas HCP.

Pour installer le HCP CLI :

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

- Vérifier que PostgreSQL est bien démarré
- En DevContainer : s'assurer que le service `db` est en cours d'exécution (`docker compose ps`)
- Vérifier les credentials dans `DATABASE_URL`

### `BETTER_AUTH_SECRET` manquant / erreur de session

Ajouter `BETTER_AUTH_SECRET` et `BETTER_AUTH_URL` dans `.env` :

```bash
# Générer un secret fort
openssl rand -base64 32
```

```dotenv
BETTER_AUTH_SECRET="le-secret-genere-ci-dessus"
BETTER_AUTH_URL="http://localhost:3000"
```

### Port 3000 déjà utilisé

```bash
# Lancer sur un autre port
PORT=3001 yarn dev
```

### Erreur `prisma generate` après `yarn install`

Le `postinstall` exécute `nuxt prepare` mais pas `prisma generate`. Lancer manuellement :

```bash
yarn prisma generate
```

---

## Variables d'environnement — récapitulatif complet

| Variable               | Obligatoire       | Description                                                         | Exemple                                                  |
| ---------------------- | ----------------- | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`         | Oui               | URL de connexion PostgreSQL                                         | `postgresql://postgres:postgres@localhost:5432/postgres` |
| `BETTER_AUTH_SECRET`   | Oui               | Secret de chiffrement des sessions (≥ 32 chars)                     | `openssl rand -base64 32`                                |
| `BETTER_AUTH_URL`      | Local uniquement  | URL publique — calculée automatiquement sur Vercel via `VERCEL_URL` | `http://localhost:3000`                                  |
| `GHUB_CLIENT_ID`       | Oui (auth GitHub) | GitHub OAuth App Client ID                                          | `Ov23li...`                                              |
| `GHUB_CLIENT_SECRET`   | Oui (auth GitHub) | GitHub OAuth App Client Secret                                      | `abc123...`                                              |
| `TWITCH_CLIENT_ID`     | Oui (auth Twitch) | Twitch App Client ID                                                | `xyz789...`                                              |
| `TWITCH_CLIENT_SECRET` | Oui (auth Twitch) | Twitch App Client Secret                                            | `def456...`                                              |

> `GHUB_*` et `TWITCH_*` peuvent être injectés par HCP Vault Secrets via `yarn dev:hcp`. Sans HCP, les mettre directement dans `.env` et utiliser `yarn dev`.

---

## Flux d'authentification

L'authentification est gérée par [Better Auth](https://better-auth.com) avec le **Prisma adapter** (sessions stockées en base, pas de JWT stateless).

```
Utilisateur → /login → choisit un provider (GitHub ou Twitch)
  → Redirect OAuth vers le provider
  → Callback vers /api/auth/callback/[provider]
  → Better Auth crée/met à jour l'utilisateur en base via Prisma
  → Session créée (cookie httpOnly), redirect vers la page d'origine
```

- **Middleware global** : `middleware/auth.global.ts` — toutes les routes sont protégées par défaut.
- **Routes publiques** : à marquer explicitement avec `definePageMeta({ auth: false })`.
- **Page login** (redirige les users déjà connectés) : `definePageMeta({ auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/' } })`.
- **Accès session côté client** : `authClient.useSession(useFetch)` (depuis `lib/auth-client.ts`).
- **Accès session côté serveur** : `auth.api.getSession({ headers: event.headers })` (depuis `lib/auth.ts`).
- **Liaison de comptes** : `authClient.signIn.social({ provider, callbackURL })` sur un user déjà connecté.
- **Suppression de compte** : `DELETE /api/user` → `authClient.signOut()` côté client.

---

## API Routes

| Méthode  | Route                       | Auth requise | Description                                                 |
| -------- | --------------------------- | ------------ | ----------------------------------------------------------- |
| `ALL`    | `/api/auth/[...all]`        | —            | Catch-all Better Auth (signIn, signOut, callback, session…) |
| `GET`    | `/api/auth/providers/infos` | —            | Métadonnées UI des providers OAuth (icône, couleur, nom)    |
| `GET`    | `/api/user/infos`           | Oui          | Profil de l'utilisateur connecté (nom, email, avatar)       |
| `POST`   | `/api/user/infos`           | Oui          | Met à jour le nom et/ou l'email                             |
| `GET`    | `/api/user/accounts`        | Oui          | Liste les providers OAuth liés au compte                    |
| `DELETE` | `/api/user/accounts/[id]`   | Oui          | Délie un provider OAuth                                     |
| `DELETE` | `/api/user`                 | Oui          | Supprime le compte de l'utilisateur authentifié             |

---

## Conventions de développement

### Branches (GitHub Flow)

`master` est la seule branche stable, toujours déployable. Tout développement passe par une branche courte et une PR.

| Type           | Nomenclature                 | Exemple                       |
| -------------- | ---------------------------- | ----------------------------- |
| Fonctionnalité | `feat/<scope>/<description>` | `feat/auth/add-google-oauth`  |
| Correctif      | `fix/<scope>/<description>`  | `fix/api/handle-prisma-error` |
| Documentation  | `docs/<description>`         | `docs/update-contributing`    |
| CI/CD          | `ci/<description>`           | `ci/add-playwright`           |
| Maintenance    | `chore/<description>`        | `chore/update-deps`           |

Les commits doivent suivre la [convention Conventional Commits](https://www.conventionalcommits.org/) — le hook `commit-msg` (Husky + commitlint) le vérifie automatiquement.

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour le workflow complet de contribution.

### Composants Vue

- Un composant = un fichier dans `components/`
- Nommage PascalCase : `AppHeader.vue`, `LoginItem.vue`
- Nuxt auto-importe tous les composants de `components/` — pas besoin d'import explicite

### Pages et routing

- Nuxt génère le routing automatiquement depuis `pages/`
- Les pages protégées n'ont pas de `definePageMeta` (middleware global actif)
- Pour rendre une page publique :
  ```typescript
  definePageMeta({ auth: false });
  ```

### State management (Pinia)

- Stores dans `stores/`
- `usePreferencesStore` : thème clair/sombre, persisté en localStorage
- Utiliser `defineStore` avec Options API, pas Composition API (cohérence avec l'existant)

### Prisma

- Singleton Prisma dans `lib/prisma.ts` pour le client côté serveur
- Le middleware `server/middleware/prisma.ts` injecte Prisma dans `event.context.prisma` — l'utiliser dans les handlers plutôt que de créer une nouvelle instance
- Après tout changement de schéma : `yarn prisma migrate dev` puis `yarn prisma generate`

### TypeScript

- Types globaux dans `types/index.d.ts`
- Strict mode activé via `tsconfig.json` Nuxt
- Types globaux — `ProviderInfo` déclaré dans `types/index.d.ts` comme interface globale

### Linting

```bash
yarn eslint .
```

Config dans `eslint.config.mjs`. Règles Vue + TypeScript actives.

---

## Déploiement (Vercel)

### Setup

1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d'environnement dans le dashboard Vercel :

   | Variable               | Valeur                                                     |
   | ---------------------- | ---------------------------------------------------------- |
   | `DATABASE_URL`         | URL PostgreSQL de production (ex: Neon, Supabase, Railway) |
   | `BETTER_AUTH_SECRET`   | Secret aléatoire ≥ 32 chars                                |
   | `BETTER_AUTH_URL`      | Optionnel — Vercel injecte `VERCEL_URL` automatiquement    |
   | `GHUB_CLIENT_ID`       | Client ID GitHub OAuth App de production                   |
   | `GHUB_CLIENT_SECRET`   | Client Secret GitHub OAuth App de production               |
   | `TWITCH_CLIENT_ID`     | Client ID Twitch App de production                         |
   | `TWITCH_CLIENT_SECRET` | Client Secret Twitch App de production                     |

3. Créer des OAuth Apps séparées pour la production avec les callbacks pointant vers le domaine Vercel :
   - GitHub : `https://mon-app.vercel.app/api/auth/callback/github`
   - Twitch : `https://mon-app.vercel.app/api/auth/callback/twitch`

4. Appliquer les migrations Prisma sur la DB de production :
   ```bash
   DATABASE_URL="<prod-db-url>" yarn prisma migrate deploy
   ```

### Build local

```bash
yarn build
yarn preview
```

> Le fichier `vercel.json` à la racine configure Vercel pour utiliser yarn (`yarn install --immutable` + `yarn build`). Vercel active corepack automatiquement grâce au champ `packageManager` dans `package.json`.

---

## Travaux en cours (TODO)

- Correction bug SSR au rechargement de page
- Magic Link auth provider
- Page settings : choix d'avatar
- Gestion de l'erreur `AccountNotLinked`
- Tooltip "pourquoi lier un compte"
- Skeleton loaders (transitions de navigation et avatar navbar)
