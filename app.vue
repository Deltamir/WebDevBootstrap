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
