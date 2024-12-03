<template>
  <div>
    <VContainer class="mt-5"><h1>Guest</h1></VContainer>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: "/",
  },
});
</script>
