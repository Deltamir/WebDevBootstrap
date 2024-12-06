<template>
  <v-list-group v-if="item.items" :value="item.title">
    <template #activator="{ props }">
      <v-list-item v-bind="props" :title="item.title" :active="isActive" color="primary"/>
    </template>
    <nav-item
      v-for="subItem in item.items"
      :key="subItem.title"
      :item="subItem"
    />
  </v-list-group>

  <v-list-item v-else @click="navigateTo(item.to)" :active="isActive" color="primary">
    <v-list-item-title>{{ item.title }} </v-list-item-title>
  </v-list-item>
</template>

<script setup lang="ts">
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});


const route = useRoute();

const isActive = computed(() => {
  return route.path === props.item.to;
})



</script>
