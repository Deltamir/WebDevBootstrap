<template>
  <v-list-item>
    <v-btn v-if="item.items" variant="text" append-icon="mdi-chevron-right" @click.stop>
      <v-list-item-title>{{ item.title }}</v-list-item-title>
      <v-menu :open-on-focus="false" activator="parent" open-on-hover submenu>
        <v-list v-if="item.items">
          <menu-item
            v-for="subItem in item.items"
            :key="subItem.title"
            :item="subItem"
          />
        </v-list> </v-menu
    ></v-btn>
    <v-btn v-else variant="text">
      <v-list-item-title @click="navigateTo(item.to)">{{
        item.title
      }}</v-list-item-title>
    </v-btn>
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
