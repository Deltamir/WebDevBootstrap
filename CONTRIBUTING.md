# Contributing to WebDevBootstrap

Thanks for your interest in contributing! This document explains the workflow.

## Before you start

- Check [open issues](../../issues) and [pull requests](../../pulls) to avoid duplicates.
- For large changes, open an issue first to discuss the approach.

## Development setup

1. **Fork** the repository on GitHub and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/WebDevBootstrap.git
   cd WebDevBootstrap
   ```

2. **Install dependencies** (also sets up git hooks via Husky):

   ```bash
   corepack enable
   yarn install
   ```

   > DevContainer users: open in VS Code and "Reopen in Container" — everything is pre-configured.

3. **Configure environment variables** (copy from `.env.example` if present, or see README):

   ```bash
   cp .env.example .env   # then fill in the values
   yarn prisma db push
   ```

4. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feat/auth/your-feature-name
   ```

## Making changes

- Follow the existing code style — ESLint and TypeScript will tell you if something is off.
- Add or update tests for any behaviour change (`test/unit/` for unit, `test/e2e/` for flows).
- Run `yarn test` and `yarn typecheck` before pushing — the `pre-push` hook does this automatically.

## Commit messages

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

Valid types: `feat` `fix` `docs` `style` `refactor` `test` `chore` `ci` `perf` `revert`

Examples:

```
feat(auth): add Google OAuth provider
fix(api): handle Prisma connection timeout
docs: update devcontainer setup instructions
ci: add Playwright E2E workflow
```

The `commit-msg` hook rejects commits that don't follow this format.

## Opening a pull request

1. Push your branch and open a PR against `master`.
2. Fill in the PR template.
3. CI will run automatically: lint, typecheck, unit tests, E2E, security scan, and CodeQL.
4. Claude AI will post an automated review — feel free to discuss its comments.
5. A maintainer will review and merge once CI is green.

## Security issues

**Do not open a public issue for security vulnerabilities.**
Please report them privately via [GitHub Security Advisories](../../security/advisories/new).

## Local tools reference

| Command              | What it does                                 |
| -------------------- | -------------------------------------------- |
| `yarn lint`          | ESLint (includes security rules)             |
| `yarn typecheck`     | TypeScript check without emitting            |
| `yarn test`          | Vitest unit tests                            |
| `yarn test:coverage` | Unit tests + coverage report                 |
| `yarn test:e2e`      | Playwright E2E (requires `yarn build` first) |
| `yarn secrets:scan`  | Gitleaks full-repo scan                      |
| `yarn audit`         | npm audit for known CVEs                     |
| `yarn sbom`          | Generate CycloneDX SBOM                      |
