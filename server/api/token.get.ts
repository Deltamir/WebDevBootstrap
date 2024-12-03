import { getToken } from "#auth";

export default eventHandler(async (event) => {
  const token = await getToken({ event });

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  return token || {};
});
