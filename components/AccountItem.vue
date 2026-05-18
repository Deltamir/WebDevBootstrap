<template>
  <v-menu :close-on-content-click="false" location="bottom end">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" icon>
        <!-- Logged out: generic account icon -->
        <v-avatar v-if="!connected" size="32">
          <v-icon icon="mdi-account-circle-outline" />
        </v-avatar>
        <!-- Logged in: user photo or initials fallback -->
        <v-avatar v-else :image="userInfos?.image || undefined" size="32" color="primary">
          <span v-if="!userInfos?.image" class="text-caption font-weight-bold text-white">
            {{ userInfos?.name?.charAt(0)?.toUpperCase() ?? "?" }}
          </span>
        </v-avatar>
      </v-btn>
    </template>

    <!-- Logged in: user info + actions -->
    <v-list v-if="connected" min-width="220" class="pa-1">
      <v-list-item class="mb-1">
        <template #prepend>
          <v-avatar :image="userInfos?.image || undefined" size="40" color="primary">
            <span v-if="!userInfos?.image" class="text-body-2 font-weight-bold text-white">
              {{ userInfos?.name?.charAt(0)?.toUpperCase() ?? "?" }}
            </span>
          </v-avatar>
        </template>
        <v-list-item-title class="font-weight-semibold text-body-2">
          {{ userInfos?.name }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption">
          {{ userInfos?.email }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-divider class="mb-1" />

      <v-list-item
        prepend-icon="mdi-cog-outline"
        title="Settings"
        rounded="lg"
        @click="navigateTo('/settings')"
      />
      <v-list-item
        prepend-icon="mdi-logout"
        title="Sign out"
        base-color="error"
        rounded="lg"
        @click="handleLogout"
      />
    </v-list>

    <!-- Logged out: login / signup form -->
    <div v-else>
      <user-item />
    </div>
  </v-menu>
</template>

<script setup lang="ts">
// Account dropdown in the app bar. Shows either a "log in" trigger
// (<user-item />) or the user's avatar + name + logout when authenticated.
import { authClient } from "~~/lib/auth-client";

// `useSession(useFetch)` fetches the session SSR-side with the incoming cookies
// and reuses the payload at hydration. The returned `data` is a reactive Vue
// ref — `.value` is `null` when anonymous, an object `{ user, session }` when
// signed in. Auto-updates after signIn/signOut without a manual refetch.
const { data: session } = await authClient.useSession(useFetch);
const connected = computed(() => !!session.value);

function handleLogout() {
  // Better Auth handles cookie clearing + DB session deletion. The
  // useSession ref above will flip to null on success.
  authClient.signOut();
}

// We fetch /api/user/infos rather than reading session.user.* directly so the
// avatar/name update immediately when the user edits them in /settings,
// without waiting for the session row to refresh.
// eslint-disable-next-line no-undef
const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const { data: userInfos } = await useFetch<{
  name: string;
  email: string;
  image: string;
}>("/api/user/infos", { headers });
</script>
