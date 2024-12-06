import { getToken } from "#auth";

export default defineEventHandler(async (event) => {
  const token = await getToken({ event });
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  interface UserData {
    name?: string;
    email?: string;
  }

  const data: UserData = {};

  if (body.name) {
    data.name = body.name;
  }

  if (body.email) {
    data.email = body.email;
  }

  if (Object.keys(data).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: No valid fields to update",
    });
  }

  const prisma = event.context.prisma;

  const user = await prisma.user.update({
    where: {
      id: token.sub,
    },
    data,
  });

  return user;
});
