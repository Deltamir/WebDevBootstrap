// Browser-side auth client. Imported by Vue components / pages to:
//   - read the current session (`authClient.useSession(useFetch)`)
//   - trigger OAuth flow (`authClient.signIn.social({ provider, callbackURL })`)
//   - sign out (`authClient.signOut()`)
//
// `better-auth/vue` is the Vue-flavoured entry point — `useSession` returns
// Vue refs that auto-update on sign-in/sign-out without a manual refetch.
import { createAuthClient } from "better-auth/vue";

// Client counterpart of the server-side `magicLink` plugin — adds
// `authClient.signIn.magicLink(...)`. Both lists must stay in sync.
import { magicLinkClient } from "better-auth/client/plugins";

// No `baseURL` option: when the client lives on the same origin as the server
// (our case — Nuxt app + Nitro API in one deployment), better-auth resolves
// relative URLs automatically. Set `baseURL` only for split client/server apps.
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

// Re-exported for convenience — equivalent to calling `authClient.signIn` etc.
// Kept in case some components import them as named functions.
export const { signIn, signUp, signOut, useSession } = authClient;
