<template>
  <v-menu :close-on-content-click="false" location="bottom end">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" icon>
        <!-- Profile still loading (initial fetch, or just after sign-in) -->
        <v-skeleton-loader v-if="loading" type="avatar" />
        <!-- Logged out: generic account icon -->
        <v-avatar v-else-if="!connected" size="32">
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

// We treat `/api/user/infos` as the single source of truth: returns the user
// when authenticated, 401 (→ `status === "error"`) when not. `useLazyFetch`
// keeps setup non-blocking so the activator (and its skeleton) renders even
// while the request is still in flight just after sign-in.
//
// We deliberately do NOT use `authClient.useSession` here — its return shape
// when given a lazy fetcher doesn't expose a usable loading flag, and a single
// fetch is simpler. Sign-in/out always navigate to a fresh page, so reactive
// in-place session updates aren't needed.
// eslint-disable-next-line no-undef
const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const { data: userInfos, status } = useLazyFetch<{
  name: string;
  email: string;
  image: string;
}>("/api/user/infos", { headers });

// `"idle"` and `"pending"` cover the window before the first response lands.
const loading = computed(
  () => status.value === "idle" || status.value === "pending",
);
const connected = computed(() => !!userInfos.value);

async function handleLogout() {
  await authClient.signOut();
  // Force a full page load so the cached `useFetch` results (session,
  // userInfos, …) are dropped — without this the avatar can stay on screen
  // after sign-out until the next manual reload.
  await navigateTo("/", { external: true });
}
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
