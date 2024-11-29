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
    moduleOptions: {
      /* module specific options */
    },
    vuetifyOptions: {
      /* vuetify options */
    },
  },
});
