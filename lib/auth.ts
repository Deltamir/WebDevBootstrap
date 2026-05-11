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

export const auth = betterAuth({
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
  // BETTER_AUTH_SECRET and BETTER_AUTH_URL are read implicitly from process.env
  // by better-auth — no need to pass them here. Both MUST be set in Vercel /
  // HCP env, otherwise the handler throws at first request.
});
