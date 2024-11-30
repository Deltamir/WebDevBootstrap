<template>
  <v-list-group v-if="item.items" :value="item.title">
    <template #activator="{ props }">
      <v-list-item v-bind="props" :title="item.title" />
    </template>
    <nav-item
      v-for="subItem in item.items"
      :key="subItem.title"
      :item="subItem"
    />
  </v-list-group>

  <v-list-item v-else @click="navigateTo(item.to)">
    <v-list-item-title>{{ item.title }} </v-list-item-title>
  </v-list-item>
</template>

<script setup lang="ts">
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>
