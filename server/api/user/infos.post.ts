// POST /api/user/infos — updates the current user's name and/or email.
// Body shape: { name?: string; email?: string }. Any other key is ignored.
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  // Same getSession pattern as every other protected route — see infos.get.ts
  // for the rationale.
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  // Only forward the two fields we know about — avoids accidentally writing
  // any prisma column the client might try to inject.
  const data: { name?: string; email?: string } = {};
  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;

  if (Object.keys(data).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: No valid fields to update",
    });
  }

  const prisma = event.context.prisma;
  return prisma.user.update({
    where: { id: session.user.id },
    data,
  });
});
