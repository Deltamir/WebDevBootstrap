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
  const accountId = getRouterParam(event, "id")?.toString();

  if (!accountId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: Account ID is required",
    });
  }

  const account = await prisma.account.findFirst({
    where: {
      provider: accountId,
      userId: token.sub,
    },
  });

  if (!account) {
    throw createError({
      statusCode: 404,
      statusMessage: "Account not found",
    });
  }
  const deletedAccount = await prisma.account.delete({
    where: {
      id: account.id,
    },
  });

  return deletedAccount;
});
