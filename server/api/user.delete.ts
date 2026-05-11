// DELETE /api/user — deletes the current user. Triggered from pages/settings.vue
// after the user types the confirmation phrase. Prisma's onDelete: Cascade in
// schema.prisma takes care of removing related session/account rows.
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const prisma = event.context.prisma;
  return prisma.user.delete({ where: { id: session.user.id } });
});
