import { authClient } from "~~/lib/auth-client";

type AuthMeta =
  | false
  | { unauthenticatedOnly?: boolean; navigateAuthenticatedTo?: string };

export default defineNuxtRouteMiddleware(async (to) => {
  const meta = to.meta.auth as AuthMeta | undefined;
  if (meta === false) return;

  const { data: session } = await authClient.useSession(useFetch);

  if (meta && typeof meta === "object" && meta.unauthenticatedOnly) {
    if (session.value) {
      return navigateTo(meta.navigateAuthenticatedTo || "/");
    }
    return;
  }

  if (!session.value) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
