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
import type ProviderInfo from "~/types";

const providersInfos: ProviderInfo[] = [];

const { data: providers } = useFetch<{ name: string; id: string }[]>(
  "/api/auth/providers"
);
const { data: providerColorIcon } = useFetch<
  Record<string, { color: { r: number; g: number; b: number }; icon: string }>
>("/api/auth/providers/infos");

if (providers.value) {
  Object.entries(providers.value).forEach(([id, { name }]) => {
    if (providerColorIcon.value && providerColorIcon.value[id]) {
      providersInfos.push({
        id,
        name,
        color: providerColorIcon.value[id].color,
        icon: providerColorIcon.value[id].icon,
      });
    }
  });
}

provide("providersInfos", providersInfos);
</script>
