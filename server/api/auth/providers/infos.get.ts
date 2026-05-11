// Static metadata for each configured OAuth provider.
// Must stay in sync with the `socialProviders` block in lib/auth.ts.
// `name` is the display label used in buttons; `color` is the brand RGB used
// for button tinting; `icon` is the MDI icon name.
export default defineEventHandler(() => {
  return {
    github: {
      name: "GitHub",
      color: { r: 47, g: 79, b: 79 },
      icon: "mdi-github",
    },
    twitch: {
      name: "Twitch",
      color: { r: 100, g: 65, b: 165 },
      icon: "mdi-twitch",
    },
  };
});
