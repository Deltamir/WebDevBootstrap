import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
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
