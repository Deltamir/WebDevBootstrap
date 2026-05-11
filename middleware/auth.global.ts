// Global Nuxt route middleware. Replaces @sidebase/nuxt-auth's
// `globalAppMiddleware: true` (which used to live in nuxt.config.ts). Suffix
// `.global.ts` makes Nuxt run this on every navigation — both server-side (SSR)
// and client-side (hydration + SPA navigations).
import { authClient } from "~~/lib/auth-client";

// Shape of `definePageMeta({ auth: ... })` we support — kept identical to the
// sidebase API so existing pages don't need to change their meta. Three modes:
//   `auth: false`                              → public page, skip the check
//   `auth: { unauthenticatedOnly: true, ... }` → public-only (login page)
//   (omitted / anything else)                  → requires session
type AuthMeta =
  | false
  | { unauthenticatedOnly?: boolean; navigateAuthenticatedTo?: string };

export default defineNuxtRouteMiddleware(async (to) => {
  const meta = to.meta.auth as AuthMeta | undefined;
  if (meta === false) return; // Public page — let the navigation through.

  // `useSession(useFetch)` runs once on the server with the incoming cookies
  // and reuses the payload during client hydration — avoids a double fetch.
  const { data: session } = await authClient.useSession(useFetch);

  // Login-like pages: kick already-authenticated users elsewhere.
  if (meta && typeof meta === "object" && meta.unauthenticatedOnly) {
    if (session.value) {
      return navigateTo(meta.navigateAuthenticatedTo || "/");
    }
    return;
  }

  // Default: require an active session, otherwise bounce to /login with a
  // `redirect` query so the page we wanted is reachable after sign-in.
  if (!session.value) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
