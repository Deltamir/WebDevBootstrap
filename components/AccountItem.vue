<template>
  <v-menu :close-on-content-click="false" location="bottom end">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" icon>
        <!-- Logged out: generic account icon -->
        <v-avatar v-if="!connected" size="32">
          <v-icon icon="mdi-account-circle-outline" />
        </v-avatar>
        <!-- Logged in: user photo -->
        <v-avatar v-else-if="userInfos?.image" :image="userInfos.image" size="32" />
        <!-- Logged in: initials fallback -->
        <v-avatar v-else size="32" color="primary">
          <span class="text-caption font-weight-bold text-white">
            {{ userInfos?.name?.charAt(0)?.toUpperCase() ?? "?" }}
          </span>
        </v-avatar>
      </v-btn>
    </template>

    <!-- Logged in: user info + actions -->
    <v-list v-if="connected" min-width="240" class="pa-0 overflow-hidden">
      <!-- User header -->
      <div class="account-header px-4 py-3">
        <div class="d-flex align-center ga-3">
          <v-avatar
            v-if="userInfos?.image"
            :image="userInfos.image"
            size="46"
            class="account-avatar"
          />
          <v-avatar v-else size="46" color="primary" class="account-avatar">
            <span class="text-body-1 font-weight-bold text-white">
              {{ userInfos?.name?.charAt(0)?.toUpperCase() ?? "?" }}
            </span>
          </v-avatar>
          <div class="overflow-hidden">
            <div class="text-subtitle-2 font-weight-semibold text-truncate">
              {{ userInfos?.name }}
            </div>
            <div class="text-caption text-medium-emphasis text-truncate">
              {{ userInfos?.email }}
            </div>
          </div>
        </div>
      </div>

      <v-divider />

      <div class="px-1 py-1">
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
      </div>
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

async function handleLogout() {
  await authClient.signOut();
  await navigateTo("/login");
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

<style scoped>
.account-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.1) 0%,
    rgba(var(--v-theme-surface), 0) 100%
  );
}

.account-avatar {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.35),
    0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}
</style>
