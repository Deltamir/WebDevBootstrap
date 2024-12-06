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

  const user = await prisma.user.findUnique({
    where: {
      id: token.sub,
    },
    select: {
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  return user;
});
