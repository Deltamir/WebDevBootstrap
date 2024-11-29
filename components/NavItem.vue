<template>
  <v-list-group v-if="item.items" :value="item.title">
    <template v-slot:activator="{ props }">
      <v-list-item v-bind="props" :title="item.title"></v-list-item>
    </template>
    <nav-item v-for="subItem in item.items" :item="subItem"></nav-item>
  </v-list-group>

  <v-list-item v-else @click="navigateTo(item.to)">
    <v-list-item-title>{{ item.title }} </v-list-item-title>
  </v-list-item>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>
