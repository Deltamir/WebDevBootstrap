<template>
  <NuxtRouteAnnouncer />
  <v-layout class="rounded rounded-md">
    <AppHeader />
    <v-main class="h-screen">
      <NuxtPage class="bg-background pa-5" />
      <AppFooter />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
// `/api/auth/providers` was a next-auth/sidebase built-in endpoint that no
// longer exists with Better Auth. All provider metadata (id, name, color,
// icon) now comes from our single custom endpoint. The `provide` call below
// shares this list with LoginItem.vue, AccountItem.vue, and settings.vue via
// `inject("providersInfos", [])`.
const { data: providerInfosData } = await useFetch<
  Record<
    string,
    { name: string; color: { r: number; g: number; b: number }; icon: string }
  >
>("/api/auth/providers/infos");

const providersInfos = Object.entries(providerInfosData.value ?? {}).map(
  ([id, info]) => ({ id, ...info })
);

provide("providersInfos", providersInfos);
</script>
