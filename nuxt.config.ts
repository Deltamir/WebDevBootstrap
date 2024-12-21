// https://nuxt.com/docs/api/configuration/nuxt-config
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
    "@sidebase/nuxt-auth",
    "@vee-validate/nuxt",
  ],
  vite: {
    vue: {},
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {},
  },
  auth: {
    isEnabled: true,
    globalAppMiddleware: true,
    baseURL: process.env.VERCEL_ENV
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : `http://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    // disableServerSideAuth: false,
    // originEnvKey: "AUTH_ORIGIN",
    // baseURL: "http://localhost:3000/api/auth",
    // provider: {
    // },
    // sessionRefresh: {
    //   enablePeriodically: true,
    //   enableOnWindowFocus: true,
    // },
  },
  runtimeConfig: {
    public: {
      GITHUB_CLIENT_ID: process.env.GHUB_CLIENT_ID,
      TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    },
    GITHUB_CLIENT_SECRET: process.env.GHUB_CLIENT_SECRET,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
  },
});
