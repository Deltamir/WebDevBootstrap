<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <!-- Thin top progress bar shown during page-to-page navigation. -->
    <NuxtLoadingIndicator />
    <NuxtPage />
  </NuxtLayout>
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
