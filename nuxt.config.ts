// https://nuxt.com/docs/api/configuration/nuxt-config
//
// Note: there is no `@sidebase/nuxt-auth` module here anymore — Better Auth
// doesn't need a Nuxt module. The server side is wired via the Nitro catch-all
// at server/api/auth/[...all].ts and the client via lib/auth-client.ts. The
// `auth: { globalAppMiddleware: true, baseURL: … }` block that used to live
// here is replaced by middleware/auth.global.ts.
//
// Likewise, `runtimeConfig` no longer needs the GitHub/Twitch client IDs — the
// Better Auth handler reads them directly from process.env in lib/auth.ts.
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  modules: [
    "vuetify-nuxt-module",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@nuxt/eslint",
    "@vee-validate/nuxt",
  ],
  vite: {
    vue: {},
    server: {
      // Polling needed inside DevContainer (Docker volume on Linux doesn't
      // emit inotify events reliably from a host bind mount).
      watch: {
        usePolling: true,
      },
    },
  },
  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {},
  },
});
