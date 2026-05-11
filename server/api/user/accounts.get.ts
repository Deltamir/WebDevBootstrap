// GET /api/user/accounts — returns the list of OAuth provider IDs the current
// user has linked (e.g. `["github", "twitch"]`). Used by pages/settings.vue to
// disable the "link" button for providers that are already linked.
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const prisma = event.context.prisma;
  // `providerId` is Better Auth's field name (next-auth called it `provider`).
  // It holds the literal string the social provider is registered under in
  // lib/auth.ts — "github", "twitch", etc.
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { providerId: true },
  });

  if (!accounts.length) {
    throw createError({ statusCode: 404, statusMessage: "Account not found" });
  }

  return accounts.map((account) => account.providerId);
});
