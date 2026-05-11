// Better Auth catch-all handler. Every request to /api/auth/* lands here:
//   - /api/auth/sign-in/social, /api/auth/sign-out, /api/auth/callback/[provider],
//     /api/auth/get-session, /api/auth/link-social, /api/auth/unlink-account, ...
//
// The filename pattern `[...all].ts` is Nitro's catch-all syntax (similar to
// Next.js's `[...nextauth]`). The `all` part is just a route-param name — any
// identifier works, but Better Auth's Nuxt guide uses `all` so we match it.
//
// `toWebRequest(event)` converts the H3 event into a standard `Request`, which
// is what `auth.handler` expects (it speaks the Fetch API).
import { auth } from "~~/lib/auth";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
