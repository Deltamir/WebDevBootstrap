import GithubProvider from "next-auth/providers/github";
import TwitchProvider from "next-auth/providers/twitch";
import { NuxtAuthHandler } from "#auth";

const runtimeConfig = useRuntimeConfig();

export default NuxtAuthHandler({
  // A secret string you define, to ensure correct encryption
  secret: "your-secret-here",
  pages: {
    signIn: "/login",
  },
  providers: [
    // @ts-expect-error Use .default here for it to work during SSR.
    GithubProvider.default({
      clientId: runtimeConfig.public.GITHUB_CLIENT_ID,
      clientSecret: runtimeConfig.GITHUB_CLIENT_SECRET,
    }),
    // @ts-expect-error Use .default here for it to work during SSR.
    TwitchProvider.default({
      clientId: runtimeConfig.public.TWITCH_CLIENT_ID,
      clientSecret: runtimeConfig.TWITCH_CLIENT_SECRET,
    }),
  ],
});
