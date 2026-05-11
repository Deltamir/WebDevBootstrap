# WebDevBootstrap

Boilerplate full-stack pour démarrer rapidement un projet web moderne. Il fournit un socle complet : authentification OAuth multi-provider (GitHub + Twitch), persistance PostgreSQL via Prisma, interface Vuetify, gestion d'état Pinia, validation de formulaires, et injection sécurisée des secrets via HCP Vault Secrets.

Objectif : offrir un point de départ solide et opiné pour ne pas reconfigurer l'authentification, la base de données et les conventions de projet à chaque nouveau projet.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Nuxt 4 (Vue 3) |
| UI | Vuetify 3 |
| State | Pinia 3 + pinia-plugin-persistedstate |
| Auth | @sidebase/nuxt-auth 1.x (NextAuth v4) |
| ORM | Prisma 7 |
| Base de données | PostgreSQL |
| Validation | VeeValidate + Yup |
| Secrets | HCP Vault Secrets |
| Lint | ESLint 10 + eslint-plugin-vue |

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
   corepack enable
   yarn install
   yarn prisma generate
   ```

4. Continuer à l'étape [Configuration des variables d'environnement](#configuration-des-variables-denvironnement).

### Lancer via GitHub Codespaces

1. Sur GitHub, cliquer **Code → Codespaces → Create codespace on master**
2. Attendre la création du container (environ 2-3 minutes)
3. `corepack enable`, `yarn install` et `yarn prisma generate` s'exécutent automatiquement
4. Continuer à l'étape [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)

> Le DevContainer inclut : Node.js 22, HCP CLI, PostgreSQL (service `db` sur le réseau Docker interne), et toutes les extensions VS Code listées dans `.devcontainer/devcontainer.json`.

---

## Option B — Installation manuelle

### Prérequis

| Outil | Version minimale | Lien |
|---|---|---|
| Node.js | 22.x | https://nodejs.org |
| yarn | 4.x (via `corepack enable`) | https://yarnpkg.com |
| PostgreSQL | 15+ | https://www.postgresql.org/download/ |
| HCP CLI | latest (optionnel) | https://developer.hashicorp.com/hcp/docs/cli |
| Git | any | https://git-scm.com |

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
# URL de base de l'application (sans protocole)
# En local : localhost:3000
# En production Vercel : votre-domaine.vercel.app
VERCEL_PROJECT_PRODUCTION_URL="localhost:3000"

# Connexion PostgreSQL
# En DevContainer : le service s'appelle "db" sur le réseau Docker interne
# DATABASE_URL="postgresql://postgres:postgres@db:5432/postgres"
# En local (hors Docker) :
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Secret de chiffrement des sessions NextAuth (générer avec : openssl rand -base64 32)
AUTH_SECRET="votre-secret-aleatoire-ici"
```

> **Note DevContainer** : dans le DevContainer, l'hôte PostgreSQL est `db` (nom du service Docker Compose), pas `127.0.0.1`.

### Variables OAuth — via HCP Vault Secrets (recommandé)

Le script `yarn dev` utilise `hcp vs run -- nuxt dev`, qui injecte automatiquement les secrets depuis HCP Vault Secrets. C'est la méthode recommandée pour ne jamais écrire de secrets dans `.env`.

Les variables suivantes doivent exister dans votre application HCP Vault Secrets :

| Variable HCP | Description |
|---|---|
| `GHUB_CLIENT_ID` | Client ID de votre GitHub OAuth App |
| `GHUB_CLIENT_SECRET` | Client Secret de votre GitHub OAuth App |
| `TWITCH_CLIENT_ID` | Client ID de votre Twitch App |
| `TWITCH_CLIENT_SECRET` | Client Secret de votre Twitch App |

### Variables OAuth — en clair dans `.env` (alternative sans HCP)

Si vous ne souhaitez pas utiliser HCP, ajoutez directement dans `.env` :

```dotenv
GHUB_CLIENT_ID="votre_github_client_id"
GHUB_CLIENT_SECRET="votre_github_client_secret"
TWITCH_CLIENT_ID="votre_twitch_client_id"
TWITCH_CLIENT_SECRET="votre_twitch_client_secret"
```

Et lancer le dev sans HCP :
```bash
yarn nuxt dev
```

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
yarn dev
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
# Installer les dépendances
yarn install

# S'authentifier à HCP (optionnel — première fois ou après expiration)
yarn vault:login

# Lancer le serveur de dev (avec injection HCP Vault Secrets)
yarn dev
# → http://localhost:3000
# → Nuxt DevTools activés

# Lancer sans HCP (variables en .env)
yarn nuxt dev

# Interface Prisma Studio
yarn studio
# → http://localhost:5555

# Build de production
yarn build

# Prévisualiser le build de production
yarn preview

# Générer un site statique
yarn generate

# Linter
yarn eslint .
```

---

## Structure du projet

```
WebDevBootstrap/
├── .devcontainer/          # Config DevContainer (Docker Compose + Dockerfile)
├── components/             # Composants Vue réutilisables
├── lib/
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
│   │   ├── auth/           # Handler NextAuth ([...].ts)
│   │   ├── token.get.ts
│   │   └── user.delete.ts
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

Le HCP CLI n'est nécessaire que si vous utilisez HCP Vault Secrets pour injecter les secrets OAuth. Si vous préférez les mettre dans `.env`, vous pouvez ignorer cette erreur et utiliser `yarn nuxt dev` à la place de `yarn dev`.

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

### `NEXTAUTH_SECRET` manquant / erreur de session

Ajouter `AUTH_SECRET` dans `.env` :
```bash
# Générer un secret fort
openssl rand -base64 32
```

### Port 3000 déjà utilisé

```bash
# Lancer sur un autre port
PORT=3001 yarn nuxt dev
```

### Erreur `prisma generate` après `yarn install`

Le `postinstall` exécute `nuxt prepare` mais pas `prisma generate`. Lancer manuellement :
```bash
yarn prisma generate
```

---

## Variables d'environnement — récapitulatif complet

| Variable | Obligatoire | Description | Exemple |
|---|---|---|---|
| `DATABASE_URL` | Oui | URL de connexion PostgreSQL | `postgresql://postgres:postgres@localhost:5432/postgres` |
| `VERCEL_PROJECT_PRODUCTION_URL` | Oui | Domaine de l'app (sans protocole) | `localhost:3000` |
| `AUTH_SECRET` | Oui | Secret NextAuth (32+ chars random) | `openssl rand -base64 32` |
| `GHUB_CLIENT_ID` | Oui (auth GitHub) | GitHub OAuth App Client ID | `Ov23li...` |
| `GHUB_CLIENT_SECRET` | Oui (auth GitHub) | GitHub OAuth App Client Secret | `abc123...` |
| `TWITCH_CLIENT_ID` | Oui (auth Twitch) | Twitch App Client ID | `xyz789...` |
| `TWITCH_CLIENT_SECRET` | Oui (auth Twitch) | Twitch App Client Secret | `def456...` |

> `GHUB_*` et `TWITCH_*` sont normalement injectés par HCP Vault Secrets via `yarn dev`. Si vous développez sans HCP, les mettre directement dans `.env` et utiliser `yarn nuxt dev`.

---

## Flux d'authentification

L'authentification est gérée par `@sidebase/nuxt-auth` (wrapper NextAuth v4) avec stratégie **JWT**.

```
Utilisateur → /login → choisit un provider (GitHub ou Twitch)
  → Redirect OAuth vers le provider
  → Callback vers /api/auth/callback/[provider]
  → NextAuth crée/met à jour l'utilisateur via PrismaAdapter
  → Session JWT créée, redirect vers la page d'origine
```

- **Middleware global** : `globalAppMiddleware: true` dans `nuxt.config.ts` — toutes les routes sont protégées par défaut.
- **Routes publiques** : à marquer explicitement avec `definePageMeta({ auth: false })`.
- **Accès session côté client** : `useAuth()` (composable fourni par `@sidebase/nuxt-auth`).
- **Accès token côté serveur** : `getToken({ event })` dans les handlers Nitro.
- **Suppression de compte** : `DELETE /api/user` — supprime l'utilisateur authentifié (cascade sur sessions et comptes liés).

---

## API Routes

| Méthode | Route | Auth requise | Description |
|---|---|---|---|
| `GET` | `/api/auth/[...]` | — | Handler NextAuth (signin, signout, callback, session, providers) |
| `GET` | `/api/token` | Oui | Retourne le JWT de la session courante |
| `DELETE` | `/api/user` | Oui | Supprime le compte de l'utilisateur authentifié |

---

## Conventions de développement

### Branches

| Branche | Usage |
|---|---|
| `master` | Code stable / production |
| `develop` | Intégration des features en cours |

Workflow recommandé : créer des branches de feature depuis `develop`, merger dans `develop`, puis dans `master` pour un release.

### Composants Vue

- Un composant = un fichier dans `components/`
- Nommage PascalCase : `AppHeader.vue`, `LoginItem.vue`
- Nuxt auto-importe tous les composants de `components/` — pas besoin d'import explicite

### Pages et routing

- Nuxt génère le routing automatiquement depuis `pages/`
- Les pages protégées n'ont pas de `definePageMeta` (middleware global actif)
- Pour rendre une page publique :
  ```typescript
  definePageMeta({ auth: false })
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
- Les `@ts-expect-error` existants dans le handler auth sont intentionnels (contrainte du SSR NextAuth)

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

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | URL PostgreSQL de production (ex: Neon, Supabase, Railway) |
   | `VERCEL_PROJECT_PRODUCTION_URL` | Domaine Vercel (ex: `mon-app.vercel.app`) |
   | `AUTH_SECRET` | Secret aléatoire 32+ chars |
   | `GHUB_CLIENT_ID` | Client ID GitHub OAuth App de production |
   | `GHUB_CLIENT_SECRET` | Client Secret GitHub OAuth App de production |
   | `TWITCH_CLIENT_ID` | Client ID Twitch App de production |
   | `TWITCH_CLIENT_SECRET` | Client Secret Twitch App de production |

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
