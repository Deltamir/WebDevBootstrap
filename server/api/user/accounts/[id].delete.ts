import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const prisma = event.context.prisma;
  const providerId = getRouterParam(event, "id")?.toString();

  if (!providerId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Account ID is required",
    });
  }

  const account = await prisma.account.findFirst({
    where: { providerId, userId: session.user.id },
  });

  if (!account) {
    throw createError({ statusCode: 404, statusMessage: "Account not found" });
  }

  return prisma.account.delete({ where: { id: account.id } });
});
