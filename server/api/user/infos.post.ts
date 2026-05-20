// POST /api/user/infos — updates the current user's name and/or avatar.
// Body shape: { name?: string; image?: string }. Any other key is ignored.
//
// Email changes go through Better Auth's `changeEmail` flow instead (see
// lib/auth.ts → user.changeEmail) — that path sends a verification link to
// the new address and only updates the column on click.
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  // Same getSession pattern as every other protected route — see infos.get.ts
  // for the rationale.
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readBody(event);
  // Only forward the fields we know about — avoids accidentally writing any
  // prisma column the client might try to inject. Email is intentionally NOT
  // in this whitelist: it's handled by Better Auth's changeEmail endpoint.
  const data: { name?: string; image?: string } = {};
  if (body.name) data.name = body.name;
  if (body.image) data.image = body.image;

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
