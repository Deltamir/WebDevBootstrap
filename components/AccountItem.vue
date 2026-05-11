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
import { authClient } from "~~/lib/auth-client";

const { data: session } = await authClient.useSession(useFetch);
const connected = computed(() => !!session.value);

function handleLogout() {
  authClient.signOut();
}

// eslint-disable-next-line no-undef
const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const { data: userInfos } = await useFetch<{
  name: string;
  email: string;
  image: string;
}>("/api/user/infos", { headers });
</script>
