// Server-side Better Auth instance.
// Imported by:
//   - server/api/auth/[...all].ts (the catch-all that exposes /api/auth/* routes)
//   - every protected route handler that calls `auth.api.getSession(...)`
//
// `betterAuth()` returns an object with:
//   - `handler`: a (Request) => Response function we forward Nitro requests to
//   - `api`: server-side helpers (getSession, signOut, etc) callable from any handler
import { betterAuth } from "better-auth";

// The Prisma adapter lets Better Auth read/write its core tables (user, session,
// account, verification) through our existing Prisma client. The `provider`
// option only tells Better Auth which dialect-specific quirks to apply — the
// actual DB URL still comes from Prisma's config / DATABASE_URL.
import { prismaAdapter } from "better-auth/adapters/prisma";

// Shared singleton from lib/prisma.ts (survives HMR via globalThis). Reused here
// so the auth flow doesn't open its own Prisma connection pool.
import prisma from "./prisma";

// Resolve the public base URL in priority order:
//   1. BETTER_AUTH_URL — explicit override (local .env or Vercel production env var)
//   2. VERCEL_URL      — injected automatically by Vercel for every deployment
//                        (unique per preview build, e.g. "my-app-abc123.vercel.app").
//                        Vercel sets this without a protocol, so we prepend https://.
//   3. localhost:3000  — fallback for local dev without a .env
// This means BETTER_AUTH_URL only needs to be set once in Vercel (for production).
// Preview deployments pick up their own URL automatically via VERCEL_URL.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, {
    // Must match `datasource db { provider = "postgresql" }` in schema.prisma.
    provider: "postgresql",
  }),
  // OAuth providers. Client credentials are read directly from the runtime env
  // (HCP Vault Secrets injects them via `hcp vs run` in dev, Vercel env vars in
  // preview/prod). The env var names are kept as `GHUB_*` to match what's
  // already configured in HCP / Vercel — don't rename without updating both.
  socialProviders: {
    github: {
      clientId: process.env.GHUB_CLIENT_ID as string,
      clientSecret: process.env.GHUB_CLIENT_SECRET as string,
    },
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
    },
  },
  // BETTER_AUTH_SECRET is read implicitly from process.env by better-auth.
  // It must be set in Vercel / HCP env (≥ 32 chars).
});
