// DELETE /api/user/accounts/:id — unlinks an OAuth provider from the current
// user. `:id` is the provider key ("github", "twitch", …) — see how it's used
// in pages/settings.vue's `unlink()` handler.
//
// Note: Better Auth also ships `authClient.unlinkAccount({ providerId })` on
// the client. We keep this custom endpoint to preserve the existing API
// surface, but feel free to switch the front-end over later.
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const prisma = event.context.prisma;
  // The URL param is called `id` because the file is `[id].delete.ts`, but
  // semantically it's the providerId, not the row PK.
  const providerId = getRouterParam(event, "id")?.toString();

  if (!providerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Account ID is required",
    });
  }

  // findFirst because (userId, providerId) is not declared unique in our
  // schema — Better Auth's core schema allows multiple accounts per provider
  // for the same user, though in practice it should be 0 or 1.
  const account = await prisma.account.findFirst({
    where: { providerId, userId: session.user.id },
  });

  if (!account) {
    throw createError({ statusCode: 404, statusMessage: "Account not found" });
  }

  return prisma.account.delete({ where: { id: account.id } });
});
