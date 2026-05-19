<template>
  <user-item />
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "auth",
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: "/",
  },
});
</script>
