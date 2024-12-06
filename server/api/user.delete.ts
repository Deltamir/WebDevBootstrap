import { getToken } from "#auth";

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const prisma = event.context.prisma;

  const deletedUser = await prisma.user.delete({
    where: {
      id: token.sub,
    },
  });

  return deletedUser;
});
