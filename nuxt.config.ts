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
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
        },
      ],
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
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit", "yup"],
    },
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
    vuetifyOptions: {
      theme: {
        defaultTheme: "dark",
        themes: {
          light: {
            dark: false,
            colors: {
              background: "#D8E2F2",
              surface: "#FFFFFF",
              "surface-bright": "#FFFFFF",
              "surface-light": "#EDF1FA",
              "surface-variant": "#C8D5EA",
              "on-surface-variant": "#3D4A63",
              primary: "#4F46E5",
              "primary-darken-1": "#4338CA",
              secondary: "#7C3AED",
              error: "#DC2626",
              info: "#2563EB",
              success: "#059669",
              warning: "#D97706",
            },
          },
          dark: {
            dark: true,
            colors: {
              background: "#07090F",
              surface: "#0F1222",
              "surface-bright": "#191D30",
              "surface-light": "#131728",
              "surface-variant": "#191D30",
              "on-surface-variant": "#94A3B8",
              primary: "#818CF8",
              "primary-darken-1": "#6D75E8",
              secondary: "#A78BFA",
              error: "#F87171",
              info: "#60A5FA",
              success: "#34D399",
              warning: "#FBBF24",
            },
          },
        },
      },
    },
  },
});
