import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const prisma = event.context.prisma;
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { providerId: true },
  });

  if (!accounts.length) {
    throw createError({ statusCode: 404, statusMessage: "Account not found" });
  }

  return accounts.map((account) => account.providerId);
});
