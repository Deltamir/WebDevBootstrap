// Fetches a user's avatar URL from an OAuth provider's API.
//
// Better Auth stores OAuth tokens on the `account` row but not the provider
// avatar, so we look it up once (at link time — see lib/auth.ts databaseHooks)
// and persist the result on `account.image`.
//
// To support a new provider: register it in lib/auth.ts → socialProviders,
// add its display metadata in server/api/auth/providers/infos.get.ts, then add
// one entry to the `fetchers` map below — nothing else branches on provider.

type AvatarFetcher = (accessToken: string) => Promise<string | null>;

// A Map (not a plain object) so the `providerId` lookup can't be an
// object-injection sink — providerId originates from the database, but a Map
// keeps the access provably safe.
const fetchers = new Map<string, AvatarFetcher>([
  // GitHub: the REST user endpoint returns `avatar_url`. A User-Agent header is
  // mandatory or GitHub rejects the request.
  [
    "github",
    async (accessToken) => {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "WebDevBootstrap",
        },
      });
      if (!res.ok) return null;
      const profile = (await res.json()) as { avatar_url?: string };
      return profile.avatar_url ?? null;
    },
  ],
  // Twitch: the Helix users endpoint returns an array; the caller's own user is
  // the only entry. Helix requires the app's Client-Id alongside the token.
  [
    "twitch",
    async (accessToken) => {
      const res = await fetch("https://api.twitch.tv/helix/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID ?? "",
        },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        data?: { profile_image_url?: string }[];
      };
      return body.data?.[0]?.profile_image_url ?? null;
    },
  ],
]);

/**
 * Resolves the avatar URL for a linked account, or `null` when the provider is
 * unknown, has no token (credential accounts), or the API call fails. Never
 * throws — a missing avatar must not block account creation.
 */
export async function fetchProviderAvatar(
  providerId: string,
  accessToken?: string | null,
): Promise<string | null> {
  const fetcher = fetchers.get(providerId);
  if (!fetcher || !accessToken) return null;
  try {
    return await fetcher(accessToken);
  } catch {
    return null;
  }
}
