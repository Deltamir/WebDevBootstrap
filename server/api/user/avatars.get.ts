// GET /api/user/avatars — returns the avatar URL for each of the current
// user's linked OAuth accounts, for the settings-page avatar chooser.
//
// Avatars are resolved lazily and cached on `account.image`: the first time an
// account is seen without an avatar, it is fetched from the provider's API
// (using the stored access token) and persisted. Subsequent calls reuse the
// stored value. This covers accounts linked after initial sign-up, which
// Better Auth's account-creation hook does not reliably catch.
import { auth } from "~~/lib/auth";
import { fetchProviderAvatar } from "~~/server/utils/providerAvatar";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const prisma = event.context.prisma;
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, providerId: true, image: true, accessToken: true },
  });

  const results: { providerId: string; image: string }[] = [];
  for (const account of accounts) {
    let image = account.image;
    if (!image) {
      // Backfill: token is freshest right after linking, so a settings visit
      // soon after the link succeeds in practice.
      image = await fetchProviderAvatar(account.providerId, account.accessToken);
      if (image) {
        await prisma.account.update({
          where: { id: account.id },
          data: { image },
        });
      }
    }
    if (image) results.push({ providerId: account.providerId, image });
  }

  return results;
});
