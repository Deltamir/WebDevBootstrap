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

// `magicLink` is a core Better Auth plugin — passwordless sign-in / sign-up via
// a one-time link emailed to the user. It exposes /api/auth/magic-link/* routes
// through the existing catch-all handler.
import { magicLink } from "better-auth/plugins";

// Used to gate the magic-link sign-in endpoint so the login form can never
// create new users (and the signup form can never collide with existing ones).
import { createAuthMiddleware, APIError } from "better-auth/api";

// Email transport (Resend) for the magic-link plugin and the email
// verification / change-email flows below. Change-email reuses
// `sendEmailVerification` — Better Auth runs the new address through the
// generic verification path (one email → one click → update).
import {
  sendMagicLinkEmail,
  sendEmailVerification,
} from "~~/server/utils/email";

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

// Vercel injects multiple URL env vars for preview/production deployments.
// baseURL uses VERCEL_URL (unique per deploy), but the browser's Origin header
// comes from VERCEL_BRANCH_URL (stable branch alias) or VERCEL_PROJECT_PRODUCTION_URL.
// Trust all three so login works on all Vercel URL variants.
const vercelTrustedOrigins = [
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null,
  process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
].filter(Boolean) as string[];

export const auth = betterAuth({
  baseURL,
  ...(vercelTrustedOrigins.length > 0 && {
    trustedOrigins: vercelTrustedOrigins,
  }),
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
  // Passwordless sign-in. `sendMagicLink` runs server-side whenever a user
  // requests a link; `url` already targets /api/auth/magic-link/verify with the
  // token + callbackURL embedded, so we just have to deliver it.
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
  // Provider avatars (account.image) are not captured here — Better Auth's
  // account-creation hook doesn't reliably fire when *linking* an extra
  // provider. They are resolved + persisted lazily instead, by the
  // /api/user/avatars handler.
  //
  // Strict account-linking policy: a provider can only be linked when its
  // profile email matches the signed-in user's `User.email`. Pairs with the
  // settings page using `authClient.linkSocial` (not `signIn.social`) so the
  // OAuth callback runs in "link to current user" mode and surfaces this
  // mismatch as a normal Better Auth error.
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: false,
    },
  },
  // Server-side intent guard for magic-link sign-in. The login form omits
  // `name`, the signup form sends one — we reject anything that contradicts
  // the actual user state so a typo on the login form can't create a ghost
  // account, and signup can't quietly hijack an existing email.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/magic-link") return;
      const body = ctx.body as { email?: string; name?: string } | undefined;
      if (!body?.email) return;

      const existing = await prisma.user.findUnique({
        where: { email: body.email },
      });
      const hasName =
        typeof body.name === "string" && body.name.trim().length > 0;

      if (existing && hasName) {
        throw new APIError("BAD_REQUEST", {
          message: "An account already exists for this email.",
        });
      }
      if (!existing && !hasName) {
        throw new APIError("NOT_FOUND", {
          message: "No account found with this email.",
        });
      }
    }),
  },
  //
  // Global email-verification subsystem. `changeEmail` falls back to this
  // sender when the user's current address still has `emailVerified = false`
  // (Better Auth asks them to confirm it before mailing the new one).
  emailVerification: {
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      await sendEmailVerification(user.email, url);
    },
  },
  // Built-in change-email flow. Single-step: Better Auth issues a
  // change-email-verification token, sends it through the
  // `emailVerification.sendVerificationEmail` callback above (to the new
  // address), and on click updates `User.email` directly.
  // `sendChangeEmailConfirmation` is intentionally left unset — providing it
  // forces a two-step flow (confirmation → triggers verification email →
  // click to finalize), which the previous version of this file had and
  // which silently swallowed the change on the first click.
  // OAuth account links are unaffected — they're keyed by providerId /
  // accountId, not by email.
  user: {
    changeEmail: { enabled: true },
  },
  //
  // BETTER_AUTH_SECRET is read implicitly from process.env by better-auth.
  // It must be set in Vercel / HCP env (≥ 32 chars).
});
