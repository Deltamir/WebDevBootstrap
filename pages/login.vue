<template>
  <div class="pt-10">
    <LoginItem />
  </div>
</template>

<script lang="ts" setup>
import LoginItem from "~/components/LoginItem.vue";

definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: "/",
  },
});
</script>
