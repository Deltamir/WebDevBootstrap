// GET /api/user/infos — returns the current user's name, email, and avatar.
// Used by AccountItem.vue and pages/settings.vue.
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  // The Better Auth equivalent of next-auth's `getToken({ event })`. Reads the
  // `better-auth.session_token` cookie from the incoming headers, looks up the
  // session in the DB, and returns `{ session, user }` (or null if anonymous).
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  // event.context.prisma is the shared PrismaClient attached by
  // server/middleware/prisma.ts on every request — never `new PrismaClient()`
  // inside a handler (each Lambda would open its own pool).
  const prisma = event.context.prisma;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  });

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return user;
});
