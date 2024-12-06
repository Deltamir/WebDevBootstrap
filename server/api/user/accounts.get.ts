import { getToken } from "#auth";

export default eventHandler(async (event) => {
  const token = await getToken({ event });
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const prisma = event.context.prisma;
  const accounts = await prisma.account.findMany({
    where: {
      userId: token.sub,
    },
    select: {
      provider: true,
    },
  });

  if (!accounts.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Account not found",
    });
  }

  return accounts.map((account) => account.provider);
});
