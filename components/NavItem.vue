<template>
  <v-list-group v-if="item.items" :value="item.title">
    <template #activator="{ props: activatorProps }">
      <v-list-item
        v-bind="activatorProps"
        :prepend-icon="item.icon"
        :title="item.title"
        :active="isActive"
        color="primary"
      />
    </template>
    <nav-item
      v-for="subItem in item.items"
      :key="subItem.title"
      :item="subItem"
    />
  </v-list-group>

  <v-list-item
    v-else
    :prepend-icon="item.icon"
    :title="item.title"
    :active="isActive"
    color="primary"
    @click="navigateTo(item.to)"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const route = useRoute();

const isActive = computed(() => route.path === props.item.to);
</script>
