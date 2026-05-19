<template>
  <v-layout>
    <AppHeader />
    <v-main class="bg-background">
      <div class="pa-5">
        <slot />
      </div>
      <AppFooter />
    </v-main>
  </v-layout>
</template>
