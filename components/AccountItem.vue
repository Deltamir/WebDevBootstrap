<template>
  <v-menu :close-on-content-click="false" location="bottom">
    <template #activator="{ props }">
      <v-btn v-bind="props" icon>
        <v-avatar
          v-if="!connected"
          icon="mdi-account-circle-outline"
          size="28"
        />
        <v-avatar v-else :image="userInfos?.image" size="28" />
      </v-btn>
    </template>
    <v-list v-if="connected">
      <v-list-item :title="userInfos?.name" />
      <v-list-item>
        <v-btn
          prepend-icon="mdi-account-edit-outline"
          @click="navigateTo('/settings')"
          >Edit</v-btn
        >
        <v-btn prepend-icon="mdi-logout" @click="handleLogout">Logout</v-btn>
      </v-list-item>
    </v-list>

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
